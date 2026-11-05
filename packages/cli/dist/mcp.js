import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { CliError } from './errors.js';
import { allOptions } from './commands/types.js';
import { commands } from './commands/index.js';
import { findPlugins, loadPluginTools, mcpToolName } from './plugins.js';
import { beginNotices } from './update-notice.js';
import { cliVersion } from './version.js';
// Next to this file once built; when the sources run directly (vitest), the built copy.
const BESIDE = fileURLToPath(new URL('./cli.js', import.meta.url));
const CLI_JS = existsSync(BESIDE) ? BESIDE : fileURLToPath(new URL('../dist/cli.js', import.meta.url));
export const runCli = (argv) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [CLI_JS, ...argv], { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, KINETOGRAPH_NO_UPDATE_CHECK: '1' } });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk.toString('utf8')));
    child.stderr.on('data', (chunk) => (stderr += chunk.toString('utf8')));
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, stderr, code }));
});
/** The commands that are tools: all but `mcp` itself, `studio`, which serves until it is stopped, and `fetch-deps`, which downloads (a person runs it). */
export function toolCommands() {
    return commands.filter((c) => c.name !== 'mcp' && c.name !== 'studio' && c.name !== 'fetch-deps');
}
/** `audio analyze` → `audio_analyze`. */
export function toolName(command) {
    return command.name.replace(' ', '_');
}
/** Commands whose result is a PNG that the tool returns as image content. */
const IMAGE_TOOLS = new Set(['still', 'strip', 'onion']);
export function inputShape(command) {
    const shape = {};
    for (const p of command.positionals) {
        const base = p.variadic ? z.array(z.string()) : p.type === 'number' ? z.number() : z.string();
        shape[p.name] = (p.optional ? base.optional() : base).describe(p.description);
    }
    for (const o of allOptions(command)) {
        // Image tools write to a temp file when no output is given (and return the image itself), a render to out/renders.
        const base = o.multiple ? z.array(z.string()) : o.type === 'number' ? z.number() : o.type === 'boolean' ? z.boolean() : z.string();
        shape[o.name] = base.optional().describe(o.description);
    }
    return shape;
}
/** The CLI arguments for a tool call: positionals in order, then `--name value` for each option given. */
export function toArgv(command, input) {
    const argv = command.name.split(' ');
    for (const p of command.positionals) {
        const value = input[p.name];
        if (value === undefined)
            continue;
        if (Array.isArray(value))
            argv.push(...value.map(String));
        else
            argv.push(String(value));
    }
    for (const o of allOptions(command)) {
        const value = input[o.name];
        if (value === undefined || value === null)
            continue;
        if (o.type === 'boolean') {
            if (value === true)
                argv.push(`--${o.name}`);
        }
        else if (o.multiple && Array.isArray(value)) {
            for (const v of value)
                argv.push(`--${o.name}`, String(v));
        }
        else {
            argv.push(`--${o.name}`, String(value));
        }
    }
    argv.push('--json');
    return argv;
}
export async function callTool(command, input, runner) {
    const args = { ...input };
    if (IMAGE_TOOLS.has(command.name) && args.output === undefined) {
        args.output = join(mkdtempSync(join(tmpdir(), 'kinetograph-mcp-')), `${command.name}.png`);
    }
    let result;
    try {
        result = await runner(toArgv(command, args));
    }
    catch (error) {
        return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: { code: 'SPAWN', message: String(error) } }) }] };
    }
    let parsed;
    try {
        parsed = JSON.parse(result.stdout);
    }
    catch {
        const text = result.stderr.trim() || result.stdout.trim() || `kinetograph exited with code ${result.code}`;
        return { isError: true, content: [{ type: 'text', text: JSON.stringify({ error: { code: 'INTERNAL', message: text } }) }] };
    }
    // A failed check (lint errors, snapshot mismatches) exits 1 but is a result; only `error` objects are failures.
    const failed = typeof parsed === 'object' && parsed !== null && 'error' in parsed;
    const content = [{ type: 'text', text: JSON.stringify(parsed, null, 2) }];
    if (!failed && IMAGE_TOOLS.has(command.name) && typeof args.output === 'string') {
        content.push({ type: 'image', data: readFileSync(args.output).toString('base64'), mimeType: 'image/png' });
    }
    return failed ? { isError: true, content } : { content };
}
/** The tools of the plugins the project at `dir` depends on. A plugin whose tools fail to load is skipped; `onError` hears why. */
export async function loadProjectTools(dir, onError = () => undefined) {
    const out = [];
    for (const plugin of findPlugins(dir)) {
        try {
            for (const tool of await loadPluginTools(plugin))
                out.push({ name: mcpToolName(plugin, tool), tool });
        }
        catch (error) {
            onError(`kinetograph: the tools of ${plugin.name} did not load, skipped: ${error.message}`);
        }
    }
    return out;
}
async function studioRequest(target, path, init = {}) {
    const url = new URL(path, target.url);
    const headers = new Headers(init.headers);
    headers.set('x-studio-token', target.token);
    if (init.body !== undefined)
        headers.set('content-type', 'application/json');
    const response = await fetch(url, { ...init, headers });
    const body = (await response.json().catch(() => ({})));
    if (!response.ok)
        throw new Error(body.error?.message ?? `the studio answered ${response.status}`);
    return body;
}
const studioFetch = (target, init = {}) => studioRequest(target, '/api/live-props', init);
const text = (value) => ({ content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] });
const failure = (error) => ({
    isError: true,
    content: [{ type: 'text', text: JSON.stringify({ error: { code: 'STUDIO', message: error.message } }) }],
});
function addStudioTools(server, target) {
    server.registerTool('studio_get_props', {
        description: 'The composition the open Studio window previews and the props it shows now: { comp, props }. comp is null when no window is open.',
        inputSchema: {},
    }, async () => {
        try {
            return text(await studioFetch(target));
        }
        catch (error) {
            return failure(error);
        }
    });
    server.registerTool('studio_set_props', {
        description: 'Sets the props the open Studio window previews; the preview re-renders at once. Use it to try values; write the chosen ones into the code or a preset at the end. Returns { comp, props }.',
        inputSchema: {
            comp: z.string().optional().describe('The composition id; default: the one the window shows'),
            props: z.record(z.string(), z.unknown()).describe('The props to set'),
            merge: z.boolean().optional().describe('Shallow-merge over the props shown now (default true); false replaces them'),
        },
    }, async ({ comp, props, merge }) => {
        try {
            const now = await studioFetch(target);
            const id = comp ?? now.comp;
            if (id === null)
                throw new Error('no Studio window is open on a composition; pass comp');
            // The props shown now are of the composition on screen; another composition starts from nothing.
            const base = merge === false || id !== now.comp ? {} : now.props;
            return text(await studioFetch(target, { method: 'PUT', body: JSON.stringify({ comp: id, props: { ...base, ...props } }) }));
        }
        catch (error) {
            return failure(error);
        }
    });
    server.registerTool('studio_open_panel', {
        description: 'Opens a panel in the Studio window to ask the person for a decision: a brief, a script, a storyboard, styleframes, a review of a composition, or a custom panel you lay out from blocks for a question the others do not fit. It returns { id, status: "open" } at once and never waits. After you open a panel, end your turn with one line saying what you are waiting for; do not start the next stage and do not poll. The answer arrives as your next message, starting "[panel <kind> <id> submitted]" (or "dismissed" if the person closed it), and is saved in plan/<kind>.json beside the entry (a custom panel: "[panel custom:<name> <id> submitted]" and plan/custom-<name>.json). If the person answers in a terminal instead and tells you, read it with studio_panel_result. One panel per kind is open at a time: opening another of the same kind replaces the first; custom panels are told apart by their name, so several can be open at once. placement says where any panel is shown: "sheet" (over the preview and timeline; the default), "beside-preview" (a column that leaves the preview in view; the default for a review), "left" (a tab beside the agent chat) or "right" (a tab beside the inspector). The person can put it away and bring it back from the stage strip.',
        inputSchema: {
            panel: z.enum(['brief', 'script', 'storyboard', 'styleframes', 'review', 'custom']).describe('The kind of panel'),
            data: z
                .record(z.string(), z.unknown())
                .describe('What the panel starts from. brief: the fields you know ({ purpose, audience, platform, size, seconds, takeaway, references, notes }). script: { lines: [{ id, text, seconds? }], rate?, track? }. storyboard: { comp, shots: [{ id, frame, what, moves, line?, seconds, transition, transitionNote? }] }. styleframes: { frames: [{ id, label, comp, frame, note? }] }. review: { comp, range?: [first, last], ask? }. custom: { name (slug of a-z 0-9 -, up to 40; names the plan file), title, blocks (1 to 40), submitLabel? }; every block has id (a letter first; unique) and may have label, help and required. Blocks: heading {text}; text {text; paragraphs and **bold** only}; still {comp, frame, caption?}; clip {comp, from, to, caption?} (plays in place); choice {options: [{id, label?, still?: {comp, frame}, text?}] (24 at most), multiple?, value?}; slider {min, max, step?, value?, unit?}; input {multiline?, placeholder?, value?}; list {items: string[], editable?} (add, remove, reorder); table {columns: string[], rows: string[][], editable?}; notes {still: {comp, frame}} (text notes and boxes drawn on a picture); compare {a: {comp, frame, label?}, b: {...}} (side by side, the person picks one). The answer is { values } keyed by block id, for the blocks that take one: choice a string (null for none; a string[] with multiple), slider a number, input a string, list string[], table string[][], notes [{ text, box?: {x, y, w, h} }], compare "a" or "b" (null for neither). Heading, text, still and clip have no value.'),
            message: z.string().optional().describe('One line shown at the top of the panel'),
            placement: z.enum(['sheet', 'left', 'right', 'beside-preview']).optional().describe('Where the panel is shown (default: beside-preview for a review, sheet for the rest)'),
        },
    }, async ({ panel, data, message, placement }) => {
        try {
            return text(await studioRequest(target, '/api/panels', { method: 'POST', body: JSON.stringify({ panel, data, message, placement }) }));
        }
        catch (error) {
            return failure(error);
        }
    });
    server.registerTool('studio_panel_result', {
        description: 'The state of a panel opened with studio_open_panel: { status: "open" | "submitted" | "dismissed", answer? }. Use it only when the person says in a terminal that they have answered; inside Studio the answer arrives as a "[panel <kind> <id> submitted]" message, so end your turn after opening a panel and wait for it rather than calling this to check. The answer is also in plan/<kind>.json.',
        inputSchema: { id: z.string().describe('The id studio_open_panel returned') },
    }, async ({ id }) => {
        try {
            const { status, answer } = await studioRequest(target, `/api/panels/${encodeURIComponent(id)}`);
            return text(answer === null || answer === undefined ? { status } : { status, answer });
        }
        catch (error) {
            return failure(error);
        }
    });
}
/**
 * `notices` are the update notices (update-notice.ts). A server's stderr is not shown to the model, so the first
 * command or plugin tool result of the process gets them as a short text part at the end.
 */
export function createMcpServer(runner = runCli, plugins = [], studio, notices) {
    const version = cliVersion();
    const server = new McpServer({ name: 'kinetograph', version });
    let noticesSent = notices === undefined;
    const withNotices = async (result) => {
        if (noticesSent)
            return result;
        noticesSent = true;
        const lines = (await notices?.collect().catch(() => undefined)) ?? [];
        return lines.length === 0 ? result : { ...result, content: [...result.content, { type: 'text', text: lines.join('\n') }] };
    };
    for (const command of toolCommands()) {
        server.registerTool(toolName(command), { description: command.summary, inputSchema: inputShape(command) }, async (input) => withNotices(await callTool(command, input, runner)));
    }
    if (studio)
        addStudioTools(server, studio);
    const taken = new Set(toolCommands().map(toolName));
    for (const { name, tool } of plugins) {
        if (taken.has(name)) {
            process.stderr.write(`kinetograph: the plugin tool ${name} is skipped: the name is taken\n`);
            continue;
        }
        taken.add(name);
        server.registerTool(name, { description: tool.description, inputSchema: tool.input }, (async (input) => {
            try {
                const result = await tool.run(input);
                return await withNotices({ content: [{ type: 'text', text: JSON.stringify(result ?? null, null, 2) }] });
            }
            catch (error) {
                return await withNotices({ isError: true, content: [{ type: 'text', text: JSON.stringify({ error: { code: 'TOOL', message: error.message } }) }] });
            }
        }));
    }
    return server;
}
/** Serves on stdio until the client closes it. */
export async function startMcpServer(studioUrl) {
    const plugins = await loadProjectTools(process.cwd(), (message) => process.stderr.write(`${message}\n`));
    const token = process.env.KINETOGRAPH_STUDIO_TOKEN;
    if (studioUrl !== undefined && !token)
        throw new CliError('INVALID_ARG', '--studio needs the studio token in the environment variable KINETOGRAPH_STUDIO_TOKEN');
    const server = createMcpServer(runCli, plugins, studioUrl === undefined ? undefined : { url: studioUrl, token: token }, beginNotices(cliVersion()));
    const transport = new StdioServerTransport();
    const closed = new Promise((resolve) => {
        transport.onclose = resolve;
        process.stdin.on('end', resolve);
    });
    await server.connect(transport);
    await closed;
}
//# sourceMappingURL=mcp.js.map