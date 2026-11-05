// The worker thread of the studio (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5). It loads the engine module it is told to, and answers the
// server's calls one at a time (the project's clock is global to the thread, so frames cannot interleave).
//
// Once a project's bundle is loaded the determinism shim has replaced this thread's `Date`, `performance.now` and
// timers, so nothing here uses them: time is `process.hrtime`, and the queue is promises.
import { dirname } from 'node:path';
import { parentPort, workerData } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import { sweepTimeline } from './timeline.js';
import { toStudioError } from './util.js';
const init = workerData;
const port = parentPort;
const hrMs = () => Number(process.hrtime.bigint()) / 1e6;
let engine;
function loadEngine() {
    engine ??= import(pathToFileURL(init.engine).href).then((mod) => {
        if (typeof mod.createEngine !== 'function')
            throw new Error(`${init.engine} does not export createEngine`);
        return mod.createEngine(init.options);
    });
    return engine;
}
async function handle(request) {
    const e = await loadEngine();
    switch (request.op) {
        case 'compositions':
            return e.compositions();
        case 'plan':
            return e.plan({ comp: request.comp, props: request.props, range: request.range });
        case 'preview': {
            const started = hrMs();
            const scene = await e.frame({ comp: request.comp, props: request.props, frame: request.frame });
            const image = await e.preview(scene, { scale: request.scale, format: request.format });
            const reply = { ...image, ms: hrMs() - started };
            return reply;
        }
        case 'inspect': {
            const scene = await e.frame({ comp: request.comp, props: request.props, frame: request.frame });
            return e.inspect(scene);
        }
        case 'timeline': {
            const frames = [];
            let baseDir = dirname(init.options.entry);
            const timeline = await sweepTimeline(e, { comp: request.comp, props: request.props }, (done, total) => port.postMessage({ event: 'progress', id: request.id, done, total }), (frame, audio, dir) => {
                baseDir = dir;
                frames.push({ frame, audio });
            });
            swept = { frames, fps: timeline.fps, durationInFrames: timeline.durationInFrames, baseDir };
            return timeline;
        }
        case 'audio':
            return swept ? e.mixAudio(swept.frames, swept) : null;
        case 'render': {
            const cancel = init.cancel ? new Int32Array(init.cancel) : null;
            return e.render(request.spec, {
                onFrame: (done, total) => port.postMessage({ event: 'progress', id: request.id, done, total }),
                shouldCancel: () => cancel !== null && Atomics.load(cancel, 0) === 1,
            });
        }
    }
}
/** What the last `timeline` call collected, for the `audio` call that follows it. */
let swept = null;
let queue = Promise.resolve();
port.on('message', (request) => {
    queue = queue.then(async () => {
        let reply;
        try {
            reply = { id: request.id, ok: true, result: await handle(request) };
        }
        catch (error) {
            reply = { id: request.id, ok: false, error: toStudioError(error) };
        }
        port.postMessage(reply);
    });
});
//# sourceMappingURL=worker.js.map