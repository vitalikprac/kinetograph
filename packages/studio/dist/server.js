// The studio server (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5): HTTP routes, the WebSocket, and the pieces they sit on. The project and
// the renderer live in worker threads (`project.ts`, `render-queue.ts`); this thread only routes.
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { homedir } from 'node:os';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { bundlePanel, cliVersion, CliError, findPlugins, pluginToolNames, projectRootOf } from 'kinetograph';
import { WebSocketServer } from 'ws';
import { REAL_ENGINE_FILE } from './worker-client.js';
import { createCatalog } from './catalog.js';
import { AgentBridge } from './agent-bridge.js';
import { IMAGE_DIR, MAX_IMAGES, isStoredName, missingImages } from './agent-images.js';
import { ChatLog } from './chat-log.js';
import { isInside } from './agent-fs.js';
import { availableAgents } from './agent-presets.js';
import { openBrowser } from './open-browser.js';
import { isPlanFile, readPlan, restorePanels, writePlan } from './panels/plan.js';
import { planFileOf } from './panels/placement.js';
import { PANEL_KINDS, checkAnswer, checkDraft, checkPlacement } from './panels/validate.js';
import { panelRoutes } from './panels/routes.js';
import { PanelStore } from './panels/store.js';
import { closingMessage } from './panels/summary.js';
import { listPresets, savePreset } from './presets.js';
import { Project } from './project.js';
import { encodeFrameMessage, } from './protocol.js';
import { RenderQueue } from './render-queue.js';
import { serveStatic } from './static.js';
import { StudioFailure, httpError, resamplePeaks } from './util.js';
/** The least time between two progress messages for a job (at most 10 a second). */
const PROGRESS_INTERVAL_MS = 100;
const MAX_BODY_BYTES = 1 << 20;
/** How long a conversation waits for the window that began it to come back (a reload). */
const MAX_QUEUED = 20;
/** The most base64 a message may carry as pictures for the agent (the window sends them already scaled down). */
const MAX_IMAGE_DATA = 12 * 1024 * 1024;
const SENDABLE_IMAGES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);
const RECLAIM_MS = 30_000;
/** A thumbnail is drawn only once no preview frame was asked for in this long (ms): playback is never kept waiting. */
const THUMB_IDLE_MS = 250;
/** Thumbnails kept, the least recently used dropped first. */
const THUMB_CACHE = 400;
/** The tallest thumbnail, px. */
const THUMB_MAX_HEIGHT = 120;
function invalid(message) {
    return new StudioFailure('INVALID_ARG', message);
}
function isObject(value) {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}
/** Frame parameters from values of any origin (query strings are parsed by the caller). */
function frameParams(input) {
    const { comp, frame, scale = 1, format = 'jpeg', props = {} } = input;
    if (typeof comp !== 'string' || comp === '')
        throw invalid('comp is required');
    if (typeof frame !== 'number' || !Number.isInteger(frame) || frame < 0) {
        throw invalid(`frame must be a whole number from 0, got ${JSON.stringify(frame)}`);
    }
    if (typeof scale !== 'number' || !(scale > 0 && scale <= 1)) {
        throw invalid(`scale must be a number above 0 and at most 1, got ${JSON.stringify(scale)}`);
    }
    if (format !== 'jpeg' && format !== 'png')
        throw invalid(`format must be "jpeg" or "png", got ${JSON.stringify(format)}`);
    if (!isObject(props))
        throw invalid('props must be a JSON object');
    return { comp, frame, scale, format, props };
}
function number(text) {
    if (text === null)
        return undefined;
    return text.trim() === '' ? NaN : Number(text);
}
function queryProps(text) {
    if (text === null || text === '')
        return undefined;
    let value;
    try {
        value = JSON.parse(text);
    }
    catch (error) {
        throw invalid(`props is not valid JSON: ${error.message}`);
    }
    if (!isObject(value))
        throw invalid('props must be a JSON object');
    return value;
}
/** `cli.js` of the `kinetograph` package this studio runs with (next to its `index.js`). */
function kinetographCli() {
    return join(dirname(createRequire(import.meta.url).resolve('kinetograph')), 'cli.js');
}
function displayHost(host) {
    const shown = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
    return shown.includes(':') ? `[${shown}]` : shown;
}
export async function startStudio(options) {
    const entry = resolve(options.entry);
    if (!existsSync(entry))
        throw new CliError('ENTRY_NOT_FOUND', `no such file: ${options.entry}`);
    const host = options.host ?? '127.0.0.1';
    const baseProps = options.props ?? {};
    const log = options.log ?? (() => undefined);
    const loopback = host === '127.0.0.1' || host === 'localhost' || host === '::1';
    const project = new Project({ entry, engine: options.engine ?? REAL_ENGINE_FILE, log, ...(options.publicDir === undefined ? {} : { publicDir: options.publicDir }) });
    const queue = new RenderQueue({ spawn: (cancel) => project.spawn('render', project.bundleFile, cancel) });
    const sockets = new Set();
    const frameState = new WeakMap();
    // ---- what the routes share ----
    const send = (ws, message) => {
        if (ws.readyState === ws.OPEN)
            ws.send(JSON.stringify(message));
    };
    const broadcast = (message) => {
        for (const ws of sockets)
            send(ws, message);
    };
    // The coding agent works in the directory the studio was started in, or the entry's own when that is somewhere else.
    const agentCwd = options.agentCwd ?? (isInside(process.cwd(), entry) ? process.cwd() : dirname(entry));
    const agents = availableAgents(options.agent);
    let catalog = null;
    // Whoever reaches the agent can have it edit files and run tools, so: a secret in the URL the studio opens, the same
    // origin, one window that owns the conversation, and no agent at all on an address other computers can reach.
    const token = randomBytes(32).toString('hex');
    // The agent's MCP server gets its own secret, good for the live-props routes only: not the window's channel (/ws, the agent routes).
    const agentToken = randomBytes(32).toString('hex');
    const agentOff = !loopback && options.allowRemoteAgent !== true
        ? 'The coding agent is off because the studio can be reached from other computers. Start it with --allow-remote-agent if you really want it on.'
        : null;
    let owner = null;
    const reclaimMs = options.agentReclaimMs ?? RECLAIM_MS;
    // The conversation, kept here so that a window that reloads gets it back. When the window that began it closes, the
    // agent waits RECLAIM_MS for it to come back (a reload) before it stops and the conversation is dropped.
    const chat = new ChatLog();
    let orphaned = null;
    const keep = (record) => chat.push(record);
    const endConversation = () => {
        if (orphaned)
            clearTimeout(orphaned);
        orphaned = null;
        chat.clear();
        promptQueue.length = 0;
        queueShown = false;
    };
    // The panels the agent opens (docs/proposals/studio-panels.md). They are kept like the chat, and a panel that closes
    // while the agent is mid-turn, or not running, waits here until it can be told.
    const panels = new PanelStore();
    restorePanels(panels, dirname(entry));
    /** What the person said while the agent was working, and the panel answers it has not heard yet; both wait for the end of the turn. */
    const unheard = [];
    const promptQueue = [];
    let arrivals = 0;
    let nextQueued = 1;
    /** The queue as the window shows it; sent whenever it changes (and after a replay), never kept in the chat log. */
    let queueShown = false;
    const queuedView = (q) => ({ id: q.id, text: q.text, chips: q.chips, ...(q.attached.length > 0 ? { images: q.attached.map((a) => a.name) } : {}) });
    const showQueue = () => {
        // A queue that is empty and was never shown needs no word.
        const waiting = promptQueue.length + unheard.length;
        if (waiting === 0 && !queueShown)
            return;
        queueShown = waiting > 0;
        // The panel answers come first or among the messages by arrival; the window shows them in that order.
        const items = [
            ...unheard.map((u) => ({ id: `panel:${u.id}`, text: u.text, chips: [], panel: u.kind, seq: u.seq })),
            ...promptQueue.map((q) => ({ ...queuedView(q), seq: q.seq })),
        ].sort((a, b) => a.seq - b.seq);
        if (owner)
            send(owner, { type: 'agent', event: { kind: 'queue', items: items.map(({ seq: _seq, ...item }) => item) } });
    };
    /**
     * Sends the agent everything waiting for it, as one prompt: the person's queued messages and the panel answers, in the
     * order they arrived, separated by blank lines (the chat still shows each as its own message). The selection and the
     * picture are those of the newest queued message. It runs when a message arrives, a panel closes and a turn ends, and
     * does nothing while the agent is working. A panel answer alone does not start an agent that is not running.
     */
    function tellAgent() {
        if (agentOff || bridge.working)
            return;
        if (promptQueue.length === 0 && (unheard.length === 0 || !bridge.ready))
            return;
        // "Send now" sends that message alone; the others (and the panel answers) wait for the turn after.
        const solo = promptQueue.find((q) => q.now);
        const sending = solo ? [solo] : promptQueue;
        const waiting = [
            ...(solo ? [] : unheard.splice(0)).map((u) => ({ text: u.text, say: u.text, chips: [], images: [], seq: u.seq })),
            ...sending.map((q) => ({ text: q.text, say: withAttached(q.text, q.attached.map((a) => a.name)), chips: q.chips, images: q.attached.map((a) => a.name), seq: q.seq })),
        ].sort((x, y) => x.seq - y.seq);
        const last = sending.at(-1);
        const selection = sending.findLast((q) => q.image)?.image;
        const pictures = [...sending.flatMap((q) => q.attached.flatMap((a) => (a.image ? [a.image] : []))), ...(selection ? [selection] : [])];
        if (solo)
            promptQueue.splice(promptQueue.indexOf(solo), 1);
        else
            promptQueue.length = 0;
        for (const w of waiting) {
            const images = w.images.length > 0 ? { images: w.images } : {};
            keep({ kind: 'user', text: w.text, chips: w.chips, ...images });
            if (owner)
                send(owner, { type: 'agent', event: { kind: 'user', text: w.text, chips: w.chips, ...images } });
        }
        showQueue();
        void bridge.prompt(waiting.map((w) => w.say).join('\n\n'), last?.context ?? '', pictures);
    }
    /**
     * What the agent reads of the pictures a message carries, always: where they are in the project and how to use one in
     * the video, so an agent that cannot look at pictures can still open or place them. Paths are relative to the agent's
     * working directory, which is the project's own unless the studio was started higher up.
     */
    function withAttached(text, names) {
        if (names.length === 0)
            return text;
        const dir = relative(agentCwd, join(dirname(entry), ...IMAGE_DIR.split('/'))).split(sep).join('/');
        const list = names.map((n) => `${dir}/${n}`).join(', ');
        return `${text}${text === '' ? '' : '\n\n'}Attached: ${list} \u2014 use staticFile('refs/${names[0]}') to put one in the video`;
    }
    // Where the studio can be reached by the agent's MCP server; known once it listens.
    let selfUrl = '';
    const bridge = new AgentBridge({
        cwd: agentCwd,
        allowed: agents.map((a) => a.command),
        command: options.agent ?? agents[0]?.command ?? null,
        // The state of the agent goes to every window; what it says and asks goes to the window that owns the conversation.
        emit: (event) => {
            if (event.kind === 'status')
                return broadcast({ type: 'agent', event });
            if (event.kind !== 'thought')
                keep({ kind: 'event', event });
            if (owner)
                send(owner, { type: 'agent', event });
        },
        // A permission asked while the window reloads waits for it to come back.
        hasViewer: () => (owner !== null && owner.readyState === owner.OPEN) || orphaned !== null,
        version: cliVersion(),
        idle: tellAgent,
        // The agent gets the Kinetograph tools: the plugins' tools and, for this studio, studio_get_props and studio_set_props.
        mcpServers: () => [
            {
                name: 'kinetograph',
                command: process.execPath,
                args: [kinetographCli(), 'mcp', '--studio', selfUrl],
                env: [{ name: 'KINETOGRAPH_STUDIO_TOKEN', value: agentToken }],
            },
        ],
    });
    // What the window previews (its last `props` message), for the agent to read, and what the agent pushes to it.
    let live = { comp: null, props: {} };
    const matches = (given, secret) => {
        if (!given)
            return false;
        const a = Buffer.from(given);
        const b = Buffer.from(secret);
        return a.length === b.length && timingSafeEqual(a, b);
    };
    const tokenOk = (given) => matches(given, token);
    // ---- panels ----
    /** Shows `panel` to every window. */
    const showPanel = (panel) => broadcast({ type: 'panel', panel });
    const closePanel = (panel) => broadcast({ type: 'panel.closed', id: panel.id, status: panel.status, panel });
    function openPanel(body) {
        if (!isObject(body))
            throw invalid('the body must be { panel, data, message?, placement? }');
        const kind = body.panel;
        if (!PANEL_KINDS.includes(kind))
            throw invalid(`panel must be one of ${PANEL_KINDS.join(', ')}`);
        if (body.message !== undefined && typeof body.message !== 'string')
            throw invalid('message must be text');
        const badPlacement = checkPlacement(body.placement);
        if (badPlacement)
            throw invalid(badPlacement);
        const bad = checkDraft(kind, body.data);
        if (bad)
            throw invalid(`the data for a ${kind} panel is not valid: ${bad}`);
        const data = body.data;
        // A script or a board is totalled against the brief's length: from the saved brief when the agent left it out.
        if ((kind === 'script' || kind === 'storyboard') && data.targetSeconds === undefined) {
            let saved = null;
            try {
                saved = readPlan(dirname(entry), 'brief');
            }
            catch {
                // a plan/ that leads outside the project is not read
            }
            const seconds = saved?.seconds;
            if (typeof seconds === 'number' && Number.isFinite(seconds))
                data.targetSeconds = seconds;
        }
        const { panel, replaced } = panels.open(kind, data, body.message ?? null, Date.now(), body.placement);
        if (replaced)
            closePanel(replaced);
        showPanel(panel);
        return panel;
    }
    /** The person's answer to a panel, from a window: checked, written to plan/<kind>.json (plan/custom-<name>.json), then the agent is told. */
    function submitPanel(id, answer) {
        const panel = panels.get(id);
        if (!panel)
            throw invalid(`no panel "${id}"`);
        if (panel.status !== 'open')
            throw invalid(`the panel "${id}" is already ${panel.status}`);
        const bad = checkAnswer(panel.panel, answer, panel.data);
        if (bad)
            throw invalid(`the answer to the ${panel.panel} panel is not valid: ${bad}`);
        const file = planFileOf(panel);
        try {
            // A custom answer is values by block id: the file keeps the draft with it, so the panel can come back after a restart.
            writePlan(dirname(entry), file, panel.panel === 'custom' ? { draft: panel.data, answer } : answer);
        }
        catch (error) {
            throw new StudioFailure('IO', `could not write plan/${file}.json: ${error.message}`);
        }
        const closed = panels.close(id, 'submitted', answer);
        closePanel(closed);
        unheard.push({ id, text: closingMessage(closed), seq: arrivals++, kind: closed.panel });
        showQueue();
        tellAgent();
    }
    function dismissPanel(id) {
        const closed = panels.close(id, 'dismissed');
        if (!closed)
            return;
        closePanel(closed);
        unheard.push({ id, text: closingMessage(closed), seq: arrivals++, kind: closed.panel });
        showQueue();
        tellAgent();
    }
    /** A panel message from a window; a refused answer is reported on the same socket and the panel stays open. */
    function panelMessage(ws, message) {
        if (typeof message.id !== 'string')
            throw invalid('a panel message needs the panel id');
        try {
            if (message.type === 'panel.submit')
                submitPanel(message.id, message.answer);
            else if (message.type === 'panel.dismiss')
                dismissPanel(message.id);
            else
                throw invalid('unknown panel message');
        }
        catch (error) {
            send(ws, { type: 'panel.error', id: message.id, message: httpError(error).error.message });
        }
    }
    /** The composition `comp`, or `BUILD` before any good build and `NOT_FOUND` for an unknown id. */
    function known(comp) {
        if (project.buildId === 0) {
            throw new StudioFailure('BUILD', project.buildError ? `no good build yet: ${project.buildError.message}` : 'no good build yet');
        }
        const found = project.compositions.find((c) => c.id === comp);
        if (!found) {
            throw new StudioFailure('NOT_FOUND', `no composition "${comp}"; the project has: ${project.compositions.map((c) => c.id).join(', ') || '(none)'}`);
        }
        return found;
    }
    // ---- thumbnails ----
    // Small frames for the timeline's clips, drawn at low priority: one at a time, and only while no preview frame has
    // been asked for in THUMB_IDLE_MS, so they never wait in front of playback or scrubbing. Kept by build, composition,
    // frame, props and size.
    let previewsBusy = 0;
    let lastPreviewAt = 0;
    /** By `build` + `what`: the build the picture was drawn from, never the one asked for. */
    const thumbs = new Map();
    const thumbQueue = [];
    let thumbRunning = false;
    let thumbTimer = null;
    /** For tests and the measurement: thumbnails drawn so far. */
    let thumbsDrawn = 0;
    const notePreview = (busy) => {
        previewsBusy += busy;
        lastPreviewAt = Date.now();
    };
    function pumpThumbs() {
        if (thumbRunning || thumbTimer)
            return;
        while (thumbQueue.length > 0 && thumbQueue[0].gone)
            thumbQueue.shift();
        const job = thumbQueue[0];
        if (!job)
            return;
        const wait = previewsBusy > 0 ? THUMB_IDLE_MS : lastPreviewAt + THUMB_IDLE_MS - Date.now();
        if (wait > 0) {
            thumbTimer = setTimeout(() => {
                thumbTimer = null;
                pumpThumbs();
            }, wait);
            thumbTimer.unref();
            return;
        }
        thumbQueue.shift();
        thumbRunning = true;
        void renderFrame(job.params, false).then(({ header, image }) => {
            thumbsDrawn += 1;
            // Kept under the build it was drawn from: a rebuild during the idle wait does not put the new picture under
            // the old build's address.
            const thumb = { image, build: header.buildId };
            const key = `${header.buildId}${job.what}`;
            thumbs.delete(key);
            thumbs.set(key, thumb);
            while (thumbs.size > THUMB_CACHE)
                thumbs.delete(thumbs.keys().next().value);
            // Every request for the same thumbnail that waited gets it.
            for (const other of thumbQueue)
                if (other.what === job.what && !other.gone)
                    other.done(thumb);
            job.done(thumb);
        }, (error) => job.done(null, error)).finally(() => {
            thumbRunning = false;
            pumpThumbs();
        });
    }
    function thumbnail(params, onGone) {
        const what = `|${params.comp}|${params.frame}|${params.scale}|${JSON.stringify(params.props)}`;
        const key = `${project.buildId}${what}`;
        const kept = thumbs.get(key);
        if (kept) {
            thumbs.delete(key);
            thumbs.set(key, kept);
            return Promise.resolve(kept);
        }
        return new Promise((resolve, reject) => {
            const job = {
                what,
                params,
                gone: false,
                done: (thumb, error) => {
                    job.gone = true;
                    if (thumb)
                        resolve(thumb);
                    else
                        reject(error);
                },
            };
            // A thumbnail scrolled out of sight before it was drawn is not drawn.
            onGone(() => {
                if (!job.gone)
                    job.gone = true;
            });
            thumbQueue.push(job);
            pumpThumbs();
        });
    }
    async function renderFrame(params, preview = true) {
        known(params.comp);
        if (preview)
            notePreview(1);
        try {
            return await renderFrameNow(params);
        }
        finally {
            if (preview)
                notePreview(-1);
        }
    }
    async function renderFrameNow(params) {
        const { result, buildId } = await project.call({
            op: 'preview',
            comp: params.comp,
            props: { ...baseProps, ...params.props },
            frame: params.frame,
            scale: params.scale,
            format: params.format,
        });
        return {
            header: {
                type: 'frame',
                comp: params.comp,
                frame: params.frame,
                buildId,
                width: result.width,
                height: result.height,
                mime: result.mime,
                ms: result.ms,
            },
            image: result.data,
        };
    }
    // ---- HTTP ----
    const json = (res, status, body) => {
        const text = JSON.stringify(body);
        res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(text),
            'Cache-Control': 'no-store',
        });
        res.end(text);
    };
    const fail = (res, error) => {
        const { status, error: body } = httpError(error);
        json(res, status, { error: body });
    };
    async function readBody(req) {
        if (!(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
            throw invalid('the body must be JSON with Content-Type: application/json');
        }
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
            size += chunk.length;
            if (size > MAX_BODY_BYTES)
                throw invalid('the body is too large');
            chunks.push(chunk);
        }
        try {
            return JSON.parse(Buffer.concat(chunks).toString('utf8'));
        }
        catch (error) {
            throw invalid(`the body is not valid JSON: ${error.message}`);
        }
    }
    async function createRender(body) {
        if (!isObject(body))
            throw invalid('the body must be a RenderRequest object');
        const request = body;
        if (typeof request.comp !== 'string' || request.comp === '')
            throw invalid('comp is required');
        if (request.output !== undefined && (typeof request.output !== 'string' || request.output === ''))
            throw invalid('output must be a path');
        if (request.range !== undefined && typeof request.range !== 'string')
            throw invalid('range must be a string such as "10..40"');
        if (request.encoder !== undefined && typeof request.encoder !== 'string')
            throw invalid('encoder must be a string');
        if (request.draft !== undefined && typeof request.draft !== 'boolean')
            throw invalid('draft must be true or false');
        if (request.props !== undefined && !isObject(request.props))
            throw invalid('props must be a JSON object');
        known(request.comp);
        const output = request.output !== undefined
            ? resolve(dirname(entry), request.output)
            : join(projectRootOf(entry), 'out', 'renders', `${request.comp.replace(/[^A-Za-z0-9._-]/g, '_')}.mp4`);
        const extension = extname(output).toLowerCase();
        if (extension !== '.mp4' && extension !== '.mov')
            throw invalid(`output must be a .mp4 or .mov file, got "${output}"`);
        const props = { ...baseProps, ...request.props };
        const { result: plan } = await project.call({ op: 'plan', comp: request.comp, props, range: request.range });
        return queue.add({ comp: request.comp, props, output, range: plan.range, encoder: request.encoder, draft: request.draft }, { props });
    }
    async function route(req, res, url) {
        const method = req.method ?? 'GET';
        const path = url.pathname;
        const q = url.searchParams;
        if (method === 'GET' && path === '/api/project') {
            const info = { entry, cwd: process.cwd(), version: cliVersion(), buildId: project.buildId, buildError: project.buildError };
            return json(res, 200, info);
        }
        if (method === 'GET' && path === '/api/agent') {
            if (!tokenOk(req.headers['x-studio-token'])) {
                throw new StudioFailure('FORBIDDEN', 'the agent needs the studio token from the address the studio opened');
            }
            const info = agentOff
                ? { presets: [], command: null, cwd: agentCwd, home: homedir(), disabled: agentOff }
                : { presets: agents, command: bridge.currentCommand, cwd: agentCwd, home: homedir() };
            return json(res, 200, info);
        }
        if (path === '/api/live-props' && (method === 'GET' || method === 'PUT')) {
            const given = req.headers['x-studio-token'];
            if (!tokenOk(given) && !matches(given, agentToken)) {
                throw new StudioFailure('FORBIDDEN', 'live props need the studio token from the address the studio opened');
            }
            if (method === 'GET')
                return json(res, 200, live);
            const body = await readBody(req);
            if (!isObject(body))
                throw invalid('the body must be { comp, props }');
            if (typeof body.comp !== 'string' || body.comp === '')
                throw invalid('comp is required');
            if (!isObject(body.props))
                throw invalid('props must be a JSON object');
            if (project.buildId === 0)
                known(body.comp); // no good build yet
            if (!project.compositions.some((c) => c.id === body.comp)) {
                throw invalid(`no composition "${body.comp}"; the project has: ${project.compositions.map((c) => c.id).join(', ') || '(none)'}`);
            }
            live = { comp: body.comp, props: body.props };
            broadcast({ type: 'props', comp: body.comp, props: body.props });
            return json(res, 200, live);
        }
        if (path === '/api/panels' && (method === 'GET' || method === 'POST')) {
            const given = req.headers['x-studio-token'];
            if (method === 'GET') {
                if (!tokenOk(given))
                    throw new StudioFailure('FORBIDDEN', 'the list of panels needs the studio token from the address the studio opened');
                return json(res, 200, { panels: panels.shown() });
            }
            if (!tokenOk(given) && !matches(given, agentToken)) {
                throw new StudioFailure('FORBIDDEN', 'panels need the studio token from the address the studio opened');
            }
            const { id, status } = openPanel(await readBody(req));
            return json(res, 201, { id, status });
        }
        const plan = /^\/api\/plan\/([^/]+)$/.exec(path);
        if (method === 'GET' && plan) {
            if (!tokenOk(req.headers['x-studio-token'])) {
                throw new StudioFailure('FORBIDDEN', 'the plan files need the studio token from the address the studio opened');
            }
            const kind = decodeURIComponent(plan[1]);
            const saved = isPlanFile(kind) ? readPlan(dirname(entry), kind) : null;
            if (saved === null)
                throw new StudioFailure('NOT_FOUND', `no plan/${plan[1]}.json yet`);
            return json(res, 200, saved);
        }
        const onePanel = /^\/api\/panels\/([^/]+)$/.exec(path);
        if (method === 'GET' && onePanel) {
            const given = req.headers['x-studio-token'];
            const fromAgent = matches(given, agentToken);
            if (!tokenOk(given) && !fromAgent)
                throw new StudioFailure('FORBIDDEN', 'panels need the studio token from the address the studio opened');
            const panel = panels.get(decodeURIComponent(onePanel[1]));
            if (!panel)
                throw new StudioFailure('NOT_FOUND', `no panel "${onePanel[1]}"`);
            // An agent that reads the answer itself (outside Studio, or in a turn) need not be sent it as well.
            if (fromAgent && panel.status !== 'open') {
                const at = unheard.findIndex((u) => u.id === panel.id);
                if (at >= 0)
                    unheard.splice(at, 1);
            }
            return json(res, 200, { id: panel.id, panel: panel.panel, status: panel.status, answer: panel.answer });
        }
        if (method === 'GET' && path === '/api/compositions') {
            if (project.buildId === 0)
                known('');
            return json(res, 200, project.compositions);
        }
        if (method === 'GET' && path === '/api/plugins') {
            const plugins = [];
            for (const p of findPlugins(entry)) {
                plugins.push({
                    name: p.name,
                    version: p.version,
                    title: p.title,
                    description: p.description,
                    icon: p.iconFile ? `/api/plugins/${encodeURIComponent(p.name)}/icon.svg` : null,
                    components: p.components,
                    skill: p.skill,
                    panel: p.panelFile ? `/api/plugins/${encodeURIComponent(p.name)}/panel.js` : null,
                    tools: await pluginToolNames(p, log),
                });
            }
            return json(res, 200, { plugins });
        }
        if (method === 'GET' && path === '/api/plugins/catalog') {
            if (!tokenOk(req.headers['x-studio-token'])) {
                throw new StudioFailure('FORBIDDEN', 'the plugin catalog needs the studio token from the address the studio opened');
            }
            return json(res, 200, { version: 1, plugins: catalog?.get() ?? [] });
        }
        const icon = /^\/api\/plugins\/([^/]+)\/icon\.svg$/.exec(path);
        if (method === 'GET' && icon) {
            const name = decodeURIComponent(icon[1]);
            const file = findPlugins(entry).find((p) => p.name === name)?.iconFile;
            if (!file)
                throw new StudioFailure('NOT_FOUND', `no icon for the plugin "${name}"`);
            const svg = readFileSync(file);
            res.writeHead(200, { 'Content-Type': 'image/svg+xml', 'Content-Length': svg.length, 'Cache-Control': 'no-store' });
            return void res.end(svg);
        }
        const panel = /^\/api\/plugins\/([^/]+)\/panel\.js$/.exec(path);
        if (method === 'GET' && panel) {
            const name = decodeURIComponent(panel[1]);
            const file = findPlugins(entry).find((p) => p.name === name)?.panelFile;
            if (!file)
                throw new StudioFailure('NOT_FOUND', `no panel for the plugin "${name}"`);
            let code;
            try {
                code = await bundlePanel(file);
            }
            catch (error) {
                throw new StudioFailure('BUILD', `the panel of "${name}" did not build: ${error.message}`);
            }
            res.writeHead(200, {
                'Content-Type': 'text/javascript; charset=utf-8',
                'Content-Length': Buffer.byteLength(code),
                'Cache-Control': 'no-store',
            });
            return void res.end(code);
        }
        if (method === 'GET' && path === '/api/presets') {
            const comp = q.get('comp');
            if (!comp)
                throw invalid('comp is required');
            return json(res, 200, { presets: listPresets(entry, comp) });
        }
        const preset = /^\/api\/presets\/([^/]+)\/([^/]+)$/.exec(path);
        if (method === 'PUT' && preset) {
            const name = decodeURIComponent(preset[2]);
            savePreset(entry, decodeURIComponent(preset[1]), name, await readBody(req));
            return json(res, 200, { name });
        }
        if (method === 'GET' && path === '/api/frame') {
            const params = frameParams({
                comp: q.get('comp') ?? undefined,
                frame: number(q.get('frame')),
                scale: number(q.get('scale')),
                format: q.get('format') ?? undefined,
                props: queryProps(q.get('props')),
            });
            const { header, image } = await renderFrame(params);
            res.writeHead(200, {
                'Content-Type': header.mime,
                'Content-Length': image.length,
                'Cache-Control': 'no-store',
                'X-Build': String(header.buildId),
                'X-Frame': String(header.frame),
            });
            return void res.end(Buffer.from(image.buffer, image.byteOffset, image.byteLength));
        }
        if (method === 'GET' && path === '/api/thumbnail') {
            const comp = known(q.get('comp') ?? '');
            const height = Math.min(THUMB_MAX_HEIGHT, Math.max(8, Math.round(number(q.get('height')) ?? 48)));
            const params = frameParams({
                comp: comp.id,
                frame: number(q.get('frame')),
                scale: Math.min(1, height / comp.height),
                format: 'jpeg',
                props: queryProps(q.get('props')),
            });
            const asked = number(q.get('build'));
            const { image, build } = await thumbnail(params, (listen) => res.once('close', listen));
            if (res.destroyed)
                return;
            res.writeHead(200, {
                'Content-Type': 'image/jpeg',
                'Content-Length': image.length,
                'X-Build': String(build),
                // The address names the build (`build`): when the picture is of that build it never changes; one of another
                // build (the project was rebuilt meanwhile, or no build was named) is not kept by the browser.
                'Cache-Control': asked === build ? 'private, max-age=31536000, immutable' : 'no-store',
            });
            return void res.end(Buffer.from(image.buffer, image.byteOffset, image.byteLength));
        }
        if (method === 'GET' && path === '/api/thumbnail/stats') {
            return json(res, 200, { drawn: thumbsDrawn, queued: thumbQueue.filter((j) => !j.gone).length, kept: thumbs.size });
        }
        if (method === 'GET' && path === '/api/inspect') {
            const comp = q.get('comp') ?? '';
            const frame = number(q.get('frame')) ?? 0;
            if (comp === '')
                throw invalid('comp is required');
            if (!Number.isInteger(frame) || frame < 0)
                throw invalid(`frame must be a whole number from 0, got "${q.get('frame')}"`);
            known(comp);
            const { result } = await project.call({ op: 'inspect', comp, props: { ...baseProps, ...queryProps(q.get('props')) }, frame });
            return json(res, 200, result);
        }
        if (method === 'GET' && path === '/api/timeline') {
            const comp = q.get('comp') ?? '';
            if (comp === '')
                throw invalid('comp is required');
            known(comp);
            return json(res, 200, await project.timeline(comp, { ...baseProps, ...queryProps(q.get('props')) }));
        }
        if (method === 'GET' && path === '/api/timeline/progress') {
            const comp = q.get('comp') ?? '';
            if (comp === '')
                throw invalid('comp is required');
            known(comp);
            return json(res, 200, project.timelineProgressOf(comp, { ...baseProps, ...queryProps(q.get('props')) }));
        }
        if (method === 'GET' && (path === '/api/audio' || path === '/api/waveform')) {
            const comp = q.get('comp') ?? '';
            if (comp === '')
                throw invalid('comp is required');
            known(comp);
            const mix = await project.audio(comp, { ...baseProps, ...queryProps(q.get('props')) });
            if (!mix)
                throw new StudioFailure('NOT_FOUND', `the composition "${comp}" has no audio`);
            if (path === '/api/audio') {
                res.writeHead(200, {
                    'Content-Type': 'audio/wav',
                    'Content-Length': mix.wav.length,
                    'Cache-Control': 'no-store',
                    'X-Build': String(project.buildId),
                });
                return void res.end(Buffer.from(mix.wav.buffer, mix.wav.byteOffset, mix.wav.byteLength));
            }
            const buckets = number(q.get('buckets')) ?? 256;
            if (!Number.isInteger(buckets) || buckets < 1 || buckets > 16384)
                throw invalid(`buckets must be a whole number from 1 to 16384, got "${q.get('buckets')}"`);
            const clip = q.get('clip');
            if (clip === null)
                return json(res, 200, { peaks: resamplePeaks(mix.peaks, buckets) });
            const found = mix.clips.find((c) => c.id === clip);
            if (!found)
                throw new StudioFailure('NOT_FOUND', `no audio clip "${clip}" in "${comp}"`);
            return json(res, 200, { peaks: resamplePeaks(found.peaks, buckets), startFrame: found.startFrame, endFrame: found.endFrame });
        }
        if (method === 'GET' && path === '/api/renders')
            return json(res, 200, queue.list());
        if (method === 'POST' && path === '/api/renders')
            return json(res, 201, await createRender(await readBody(req)));
        const cancel = /^\/api\/renders\/([^/]+)$/.exec(path);
        if (method === 'DELETE' && cancel) {
            const job = queue.cancel(decodeURIComponent(cancel[1]));
            if (!job)
                throw new StudioFailure('NOT_FOUND', `no render job "${cancel[1]}"`);
            return json(res, 200, job);
        }
        // The panels' own routes (a file drop, a contact sheet), in the order they were added. The window's token comes in
        // the header, or in the address for a picture (an <img> cannot set a header); the agent's token is not the window's.
        const ctx = {
            projectDir: dirname(entry),
            fromWindow: tokenOk(req.headers['x-studio-token']) || tokenOk(q.get('token')),
        };
        for (const handle of panelRoutes)
            if (await handle(req, res, url, ctx))
                return;
        throw new StudioFailure('NOT_FOUND', `no route ${method} ${path}`);
    }
    /** Requests from other sites (a page that points at localhost) and DNS-rebinding are refused. */
    function allowed(req) {
        const hostHeader = req.headers.host ?? '';
        if (loopback) {
            const name = hostHeader.replace(/:\d+$/, '');
            if (!['localhost', '127.0.0.1', '[::1]'].includes(name))
                return false;
        }
        const origin = req.headers.origin;
        if (origin !== undefined) {
            try {
                if (new URL(origin).host !== hostHeader)
                    return false;
            }
            catch {
                return false;
            }
        }
        return true;
    }
    const http = createServer((req, res) => {
        void (async () => {
            const url = new URL(req.url ?? '/', 'http://studio.invalid');
            try {
                if (url.pathname.startsWith('/api/')) {
                    if (!allowed(req)) {
                        return json(res, 403, { error: { code: 'FORBIDDEN', message: 'this request does not come from the studio page' } });
                    }
                    return await route(req, res, url);
                }
                if (req.method === 'GET' || req.method === 'HEAD')
                    return await serveStatic(url.pathname, res, req.method === 'HEAD');
                throw new StudioFailure('NOT_FOUND', `no route ${req.method} ${url.pathname}`);
            }
            catch (error) {
                if (!res.headersSent)
                    fail(res, error);
                else
                    res.destroy();
            }
        })();
    });
    // ---- WebSocket ----
    const wss = new WebSocketServer({ noServer: true });
    http.on('upgrade', (req, socket, head) => {
        const url = new URL(req.url ?? '/', 'http://studio.invalid');
        if (url.pathname !== '/ws' || !allowed(req) || !tokenOk(url.searchParams.get('token'))) {
            socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
            socket.destroy();
            return;
        }
        wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
    });
    /** Renders `request` and answers on `ws`; then starts the request that arrived meanwhile, if any. */
    async function serveFrame(ws, request) {
        const state = frameState.get(ws);
        state.busy = true;
        try {
            const params = frameParams(request);
            const { header, image } = await renderFrame(params);
            if (ws.readyState === ws.OPEN)
                ws.send(encodeFrameMessage({ ...header, requestId: request.requestId }, image), { binary: true });
        }
        catch (error) {
            send(ws, { type: 'error', requestId: request.requestId, error: httpError(error).error });
        }
        finally {
            state.busy = false;
            const next = state.queued;
            state.queued = undefined;
            if (next && ws.readyState === ws.OPEN)
                void serveFrame(ws, next);
        }
    }
    /** A message for the coding agent; a malformed one is answered with an error the panel shows. */
    function agentMessage(ws, message) {
        const bad = (text) => send(ws, { type: 'agent', event: { kind: 'error', message: text } });
        if (agentOff)
            return bad(agentOff);
        const mine = owner === ws;
        if (owner && owner.readyState === owner.OPEN && !mine) {
            return bad('Another studio window is using the agent. Close it first, or use that window.');
        }
        // The first prompt or choice claims the conversation; answers and cancels need an owner, and it must be this window.
        if (message.type === 'agent.prompt' || message.type === 'agent.select')
            owner = ws;
        else if (!mine)
            return;
        switch (message.type) {
            case 'agent.prompt':
                if (typeof message.text !== 'string')
                    return bad('Write a message for the agent first.');
                const attachments = Array.isArray(message.attachments) ? message.attachments : [];
                if (message.text.trim() === '' && attachments.length === 0)
                    return bad('Write a message for the agent first.');
                if (attachments.length > MAX_IMAGES)
                    return bad(`At most ${MAX_IMAGES} pictures go with one message.`);
                if (attachments.some((a) => typeof a !== 'object' || a === null || typeof a.name !== 'string' || !isStoredName(a.name)))
                    return bad('A picture is not valid.');
                if (attachments.some((a) => (a.data !== undefined && typeof a.data !== 'string') || (a.mimeType !== undefined && typeof a.mimeType !== 'string')))
                    return bad('A picture is not valid.');
                if (attachments.reduce((n, a) => n + (a.data?.length ?? 0), 0) > MAX_IMAGE_DATA)
                    return bad('The pictures are too big to send together. Try fewer or smaller ones.');
                const gone = missingImages(dirname(entry), attachments.map((a) => a.name));
                if (gone.length > 0)
                    return bad(`${gone.join(', ')} is not stored in the project. Attach it again.`);
                if (message.image !== undefined && (typeof message.image.data !== 'string' || typeof message.image.mimeType !== 'string')) {
                    return bad('The picture is not valid.');
                }
                if (promptQueue.length >= MAX_QUEUED)
                    return bad(`Too many messages are waiting for the agent (${MAX_QUEUED}). Remove one, or wait.`);
                promptQueue.push({
                    id: `q${nextQueued++}`,
                    text: message.text,
                    context: typeof message.context === 'string' ? message.context : '',
                    image: message.image,
                    chips: Array.isArray(message.chips) ? message.chips.filter((c) => typeof c === 'string') : [],
                    attached: attachments.map((a) => ({
                        name: a.name,
                        ...(a.data && a.mimeType && SENDABLE_IMAGES.has(a.mimeType) ? { image: { data: a.data, mimeType: a.mimeType } } : {}),
                    })),
                    seq: arrivals++,
                });
                // Sent at once when the agent is free; otherwise it waits in the queue the window shows, until the turn ends.
                if (bridge.working)
                    showQueue();
                tellAgent();
                return;
            case 'agent.unqueue': {
                const at = promptQueue.findIndex((q) => q.id === message.id);
                const [taken] = at >= 0 ? promptQueue.splice(at, 1) : [];
                if (taken && message.take === true)
                    send(ws, { type: 'agent', event: { kind: 'unqueued', item: queuedView(taken) } });
                showQueue();
                return;
            }
            case 'agent.requeue': {
                if (!Array.isArray(message.order))
                    return bad('requeue needs the new order of the queued messages');
                const rank = (id) => {
                    const at = message.order.indexOf(id);
                    return at < 0 ? Number.MAX_SAFE_INTEGER : at;
                };
                // The arrival numbers stay what they are, handed out again in the new order, so panel answers keep their places.
                const seqs = promptQueue.map((q) => q.seq).sort((a, b) => a - b);
                promptQueue.sort((a, b) => rank(a.id) - rank(b.id));
                promptQueue.forEach((q, i) => (q.seq = seqs[i]));
                showQueue();
                return;
            }
            case 'agent.sendnow': {
                const found = promptQueue.find((q) => q.id === message.id);
                if (!found)
                    return;
                for (const q of promptQueue)
                    delete q.now;
                found.now = true;
                // Free already (the turn ended meanwhile): it goes now. Otherwise the turn is stopped and its end sends it.
                if (bridge.working)
                    void bridge.cancel();
                else
                    tellAgent();
                return;
            }
            case 'agent.cancel':
                void bridge.cancel();
                return;
            case 'agent.permission': {
                const optionId = typeof message.optionId === 'string' ? message.optionId : null;
                keep({ kind: 'answer', id: String(message.id), optionId });
                bridge.answerPermission(String(message.id), optionId);
                return;
            }
            case 'agent.select':
                // Cleared once the old conversation has stopped, so what stopping it said is not kept either.
                void bridge.select(typeof message.command === 'string' ? message.command : null).finally(endConversation);
                return;
            case 'agent.reset':
                void bridge.reset().finally(endConversation);
                return;
            default:
                return bad('unknown agent message');
        }
    }
    wss.on('connection', (ws) => {
        sockets.add(ws);
        frameState.set(ws, { busy: false });
        ws.on('close', () => {
            sockets.delete(ws);
            // The conversation belongs to the window that began it: when that goes and does not come back (a reload does),
            // the agent stops.
            if (owner === ws) {
                owner = null;
                if (orphaned)
                    clearTimeout(orphaned);
                orphaned = setTimeout(() => {
                    orphaned = null;
                    if (owner !== null)
                        return;
                    void bridge.reset().finally(endConversation);
                }, reclaimMs);
                orphaned.unref();
            }
        });
        ws.on('error', () => ws.terminate());
        ws.on('message', (data, isBinary) => {
            let message;
            try {
                if (isBinary)
                    throw invalid('messages are JSON text');
                let parsed;
                try {
                    parsed = JSON.parse(data.toString());
                }
                catch {
                    throw invalid('the message is not valid JSON');
                }
                if (isObject(parsed) && typeof parsed.type === 'string' && parsed.type.startsWith('agent.')) {
                    return agentMessage(ws, parsed);
                }
                if (isObject(parsed) && typeof parsed.type === 'string' && parsed.type.startsWith('panel.')) {
                    return panelMessage(ws, parsed);
                }
                if (isObject(parsed) && parsed.type === 'props') {
                    if (typeof parsed.comp !== 'string' || !isObject(parsed.props))
                        throw invalid('a props message is { "type": "props", "comp": string, "props": object }');
                    live = { comp: parsed.comp, props: parsed.props };
                    return;
                }
                if (!isObject(parsed) || parsed.type !== 'frame')
                    throw invalid('unknown message: only { "type": "frame", … }, { "type": "props", … } and "agent.…" messages are understood');
                if (typeof parsed.requestId !== 'number')
                    throw invalid('requestId must be a number');
                message = parsed;
            }
            catch (error) {
                return send(ws, { type: 'error', requestId: null, error: httpError(error).error });
            }
            const state = frameState.get(ws);
            // Latest wins: a request that has not started is dropped, without a reply, when a newer one arrives.
            if (state.busy)
                state.queued = message;
            else
                void serveFrame(ws, message);
        });
        send(ws, { type: 'hello', version: cliVersion(), buildId: project.buildId, buildError: project.buildError });
        for (const panel of panels.shown())
            send(ws, { type: 'panel', panel });
        bridge.announce();
        // A window that comes while the conversation's window is gone (it reloaded) takes the conversation over.
        if (orphaned !== null && !agentOff) {
            clearTimeout(orphaned);
            orphaned = null;
            owner = ws;
            send(ws, { type: 'agent.history', items: chat.records });
            showQueue();
        }
    });
    project.on('reload', (buildId) => broadcast({ type: 'reload', buildId }));
    project.on('buildError', (error) => broadcast({ type: 'buildError', error }));
    // Progress goes out at most every PROGRESS_INTERVAL_MS per job, always the newest state of the job.
    const throttle = new Map();
    queue.on('update', (job) => {
        let state = throttle.get(job.id);
        if (!state)
            throttle.set(job.id, (state = { last: 0, timer: null, latest: job }));
        state.latest = job;
        if (state.timer)
            return;
        const wait = state.last + PROGRESS_INTERVAL_MS - Date.now();
        const flush = () => {
            state.timer = null;
            state.last = Date.now();
            broadcast({ type: 'render', job: state.latest });
        };
        if (wait <= 0)
            flush();
        else {
            state.timer = setTimeout(flush, wait);
            state.timer.unref();
        }
    });
    // ---- start ----
    await new Promise((resolveListening, reject) => {
        http.once('error', (error) => {
            reject(error.code === 'EADDRINUSE'
                ? new CliError('INVALID_ARG', `port ${options.port ?? 3000} is already in use on ${host}; pick another with --port`)
                : new CliError('INVALID_ARG', `cannot listen on ${host}:${options.port ?? 3000}: ${error.message}`));
        });
        http.listen(options.port ?? 3000, host, resolveListening);
    });
    selfUrl = `http://${displayHost(host)}:${http.address().port}`;
    const url = `${selfUrl}/?token=${token}`;
    try {
        await project.start();
    }
    catch (error) {
        http.close();
        await project.close();
        throw error;
    }
    // The catalog is fetched in the background; the window gets the cached or bundled copy until then.
    catalog = createCatalog({ ...options.catalog, log });
    if (project.buildError)
        log(`build failed: ${project.buildError.message}`);
    if (options.open !== false)
        openBrowser(url);
    let closing;
    return {
        url,
        close() {
            closing ??= (async () => {
                for (const state of throttle.values())
                    if (state.timer)
                        clearTimeout(state.timer);
                await queue.close();
                await bridge.close();
                for (const ws of sockets)
                    ws.terminate();
                wss.close();
                await new Promise((done) => {
                    http.close(() => done());
                    http.closeAllConnections();
                });
                catalog?.close();
                await project.close();
            })();
            return closing;
        },
    };
}
//# sourceMappingURL=server.js.map