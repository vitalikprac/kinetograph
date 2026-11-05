import { EventEmitter } from 'node:events';
import { mkdirSync, rmSync, unwatchFile, watchFile, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { cacheDir, isSceneFile, watchProject } from 'kinetograph';
import { WorkerClient } from './worker-client.js';
import { StudioFailure, stableStringify, toStudioError } from './util.js';
/** How many past bundle files are kept: a render worker may still be about to import the one it was given. */
const KEPT_BUNDLES = 3;
/**
 * The project the studio serves: watches the entry, builds it, and keeps the worker that runs the current good
 * build. A new build gets a new worker; the old one finishes the calls it has and stops.
 */
export class Project extends EventEmitter {
    options;
    buildId = 0;
    buildError = null;
    current = null;
    stopWatching = null;
    /** Builds are applied one at a time, in order. */
    applying = Promise.resolve();
    timelines = new Map();
    timelineProgress = new Map();
    /** The mix of the sound a sweep collected, made right after the sweep by the worker that did it. */
    audios = new Map();
    /** Sweeps still reading frames: a newer request for the same composition stops them. */
    sweeping = new Map();
    closed = false;
    /** The code of the build being served, so that a rebuild of identical code is not a reload. */
    servedCode = null;
    written = [];
    constructor(options) {
        super();
        this.options = options;
    }
    /** Builds the project once, then keeps watching it. Resolves when the first build has been applied (or failed). */
    async start() {
        const { entry } = this.options;
        if (isSceneFile(entry)) {
            this.apply({ code: '', warnings: [] }, true);
            watchFile(entry, { interval: 100 }, (now, before) => {
                if (now.mtimeMs !== before.mtimeMs || now.size !== before.size)
                    this.apply({ code: '', warnings: [] }, true);
            });
            this.stopWatching = () => unwatchFile(entry);
        }
        else {
            // esbuild reports the first build after `watch()` has returned.
            let firstBuild;
            const reported = new Promise((resolve) => (firstBuild = resolve));
            const watching = await watchProject(entry, (build) => {
                this.apply(build, false);
                firstBuild();
            });
            this.stopWatching = () => watching.dispose();
            await reported;
        }
        await this.applying;
    }
    get compositions() {
        return this.current?.compositions ?? [];
    }
    get bundleFile() {
        return this.current?.bundleFile ?? null;
    }
    /** The build being served; throws `BUILD` (409) before the first good one. */
    serving() {
        if (!this.current) {
            throw new StudioFailure('BUILD', this.buildError ? `no good build yet: ${this.buildError.message}` : 'no good build yet');
        }
        return this.current;
    }
    /** Runs `call` in the worker of the current build; resolves with its result and that build's id. */
    async call(call) {
        const current = this.serving();
        return { result: await current.worker.call(call), buildId: current.buildId };
    }
    /** The timeline of a composition, computed once per (build, composition, props) in a worker of its own. */
    timeline(comp, props) {
        const current = this.serving();
        const key = this.timelineKey(current, comp, props);
        let timeline = this.timelines.get(key);
        if (!timeline) {
            // Props edited while an older sweep of this composition is still reading frames: its answer is not wanted.
            for (const [other, sweep] of this.sweeping) {
                if (sweep.comp === comp && other !== key)
                    void sweep.worker.terminate({ code: 'SUPERSEDED', message: 'a newer timeline was asked for' });
            }
            timeline = this.sweep(current, key, comp, props);
            this.timelines.set(key, timeline);
            timeline.catch(() => {
                this.timelines.delete(key);
                this.timelineProgress.delete(key);
                this.audios.delete(key);
            });
        }
        return timeline;
    }
    /** The mix of a composition's sound, from the same sweep as its timeline; null when it has none. */
    async audio(comp, props) {
        const current = this.serving();
        const key = this.timelineKey(current, comp, props);
        await this.timeline(comp, props);
        const audio = this.audios.get(key);
        if (!audio)
            return null;
        try {
            return await audio;
        }
        catch (error) {
            this.audios.delete(key);
            throw error;
        }
    }
    /** How far the timeline of this composition has got: `total` is 0 when no sweep has started for it. */
    timelineProgressOf(comp, props) {
        return this.timelineProgress.get(this.timelineKey(this.serving(), comp, props)) ?? { done: 0, total: 0 };
    }
    timelineKey(current, comp, props) {
        return `${current.buildId}\n${comp}\n${stableStringify(props)}`;
    }
    async sweep(current, key, comp, props) {
        const worker = this.spawn('timeline', current.bundleFile);
        this.timelineProgress.set(key, { done: 0, total: 0 });
        worker.onProgress = (done, total) => this.timelineProgress.set(key, { done, total });
        this.sweeping.set(key, { comp, worker });
        let timeline;
        try {
            timeline = await worker.call({ op: 'timeline', comp, props });
        }
        catch (error) {
            void worker.terminate();
            throw error;
        }
        finally {
            this.sweeping.delete(key);
        }
        // The sound is mixed from what the sweep collected; the timeline does not wait for it.
        const audio = worker.call({ op: 'audio' }).finally(() => void worker.terminate());
        audio.catch(() => undefined);
        this.audios.set(key, audio);
        return timeline;
    }
    /** A worker for `role` over the bundle `bundleFile`. */
    spawn(role, bundleFile, cancel) {
        return new WorkerClient({ role, engine: this.options.engine, options: { entry: this.options.entry, bundleFile, ...(this.options.publicDir === undefined ? {} : { publicDir: this.options.publicDir }) }, cancel });
    }
    apply(build, scene) {
        this.applying = this.applying.then(() => (this.closed ? undefined : this.applyOne(build, scene)));
    }
    async applyOne(build, scene) {
        if ('error' in build) {
            const error = toStudioError(build.error);
            // esbuild may report a build again when a file is touched without changing it.
            if (this.buildError?.message === error.message)
                return;
            return this.failed(error);
        }
        if (!scene && build.code === this.servedCode)
            return;
        const buildId = this.buildId + 1;
        let bundleFile = null;
        if (!scene) {
            bundleFile = this.writeBundle(build.code, buildId);
            for (const warning of build.warnings)
                this.options.log?.(`warning: ${warning}`);
        }
        const worker = this.spawn('project', bundleFile);
        let compositions;
        try {
            compositions = await worker.call({ op: 'compositions' });
        }
        catch (error) {
            void worker.terminate();
            return this.failed(toStudioError(error));
        }
        this.servedCode = build.code;
        const old = this.current;
        this.current = { worker, buildId, bundleFile, compositions };
        this.buildId = buildId;
        this.buildError = null;
        for (const key of this.timelines.keys())
            if (!key.startsWith(`${buildId}\n`))
                this.timelines.delete(key);
        for (const key of this.timelineProgress.keys())
            if (!key.startsWith(`${buildId}\n`))
                this.timelineProgress.delete(key);
        for (const key of this.audios.keys())
            if (!key.startsWith(`${buildId}\n`))
                this.audios.delete(key);
        this.options.log?.(`build ${buildId} ready`);
        this.emit('reload', buildId);
        void old?.worker.close();
        this.prune();
    }
    failed(error) {
        this.buildError = error;
        this.options.log?.(`build failed: ${error.message}`);
        this.emit('buildError', error);
    }
    bundlePrefix() {
        return `${basename(this.options.entry, extname(this.options.entry))}-studio-${process.pid}-`;
    }
    writeBundle(code, buildId) {
        const dir = cacheDir(this.options.entry);
        mkdirSync(dir, { recursive: true });
        const file = join(dir, `${this.bundlePrefix()}${buildId}.mjs`);
        writeFileSync(file, code);
        this.written.push(file);
        return file;
    }
    prune() {
        while (this.written.length > KEPT_BUNDLES)
            rmSync(this.written.shift(), { force: true });
    }
    async close() {
        this.closed = true;
        await this.stopWatching?.();
        await this.applying;
        await this.current?.worker.terminate();
        this.current = null;
        for (const file of this.written.splice(0))
            rmSync(file, { force: true });
    }
}
//# sourceMappingURL=project.js.map