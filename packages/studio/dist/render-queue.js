import { EventEmitter } from 'node:events';
import { toStudioError } from './util.js';
/**
 * Render jobs, one at a time, each in a worker of its own so that the preview stays live (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5).
 * Clock reads here are the server's bookkeeping (job timestamps, ms per frame), never part of a render.
 */
export class RenderQueue extends EventEmitter {
    deps;
    entries = [];
    running = null;
    closed = false;
    nextId = 1;
    constructor(deps) {
        super();
        this.deps = deps;
    }
    list() {
        return this.entries.map((e) => ({ ...e.job }));
    }
    /** Queues a job: `fields` is everything but what the queue decides. */
    add(spec, fields) {
        const total = spec.range[1] - spec.range[0] + 1;
        const job = {
            id: String(this.nextId++),
            comp: spec.comp,
            output: spec.output,
            range: spec.range,
            props: fields.props,
            status: 'queued',
            framesDone: 0,
            framesTotal: total,
            msPerFrame: null,
            summary: null,
            error: null,
            queuedAt: Date.now(),
            finishedAt: null,
        };
        this.entries.push({ job, spec, worker: null, cancel: null, cancelling: false, startedAt: 0 });
        this.changed(job);
        void this.pump();
        return { ...job };
    }
    /** Cancels a queued or running job; a finished one is left as it is. Undefined for an unknown id. */
    cancel(id) {
        const entry = this.entries.find((e) => e.job.id === id);
        if (!entry)
            return undefined;
        const { job } = entry;
        if (job.status === 'queued') {
            this.finish(entry, 'cancelled');
        }
        else if (job.status === 'running' && !entry.cancelling) {
            entry.cancelling = true;
            if (entry.cancel)
                Atomics.store(entry.cancel, 0, 1);
            // A job that never gets to look at the flag (a scene file is rendered in one call) is stopped from outside.
            const timer = setTimeout(() => {
                void entry.worker?.terminate({ code: 'CANCELLED', message: 'the render was cancelled' });
            }, this.deps.cancelGraceMs ?? 3000);
            timer.unref();
        }
        return { ...job };
    }
    finish(entry, status, extra = {}) {
        Object.assign(entry.job, extra, { status, finishedAt: Date.now() });
        this.changed(entry.job);
    }
    changed(job) {
        this.emit('update', { ...job });
    }
    async pump() {
        if (this.running || this.closed)
            return;
        const entry = this.entries.find((e) => e.job.status === 'queued');
        if (!entry)
            return;
        this.running = entry;
        await this.run(entry);
        this.running = null;
        void this.pump();
    }
    async run(entry) {
        const { job } = entry;
        job.status = 'running';
        entry.startedAt = Date.now();
        const flag = new SharedArrayBuffer(4);
        entry.cancel = new Int32Array(flag);
        this.changed(job);
        try {
            const worker = this.deps.spawn(flag);
            entry.worker = worker;
            worker.onProgress = (done, total) => {
                job.framesDone = done;
                job.framesTotal = total;
                job.msPerFrame = (Date.now() - entry.startedAt) / done;
                this.changed(job);
            };
            const summary = await worker.call({ op: 'render', spec: entry.spec });
            this.finish(entry, entry.cancelling ? 'cancelled' : 'done', { summary, framesDone: job.framesTotal });
        }
        catch (error) {
            const failure = toStudioError(error);
            if (entry.cancelling || failure.code === 'CANCELLED')
                this.finish(entry, 'cancelled');
            else
                this.finish(entry, 'failed', { error: failure });
        }
        finally {
            void entry.worker?.terminate();
            entry.worker = null;
        }
    }
    /** Cancels what is queued and running, and stops the worker. */
    async close() {
        this.closed = true;
        for (const entry of this.entries)
            if (entry.job.status === 'queued')
                this.finish(entry, 'cancelled');
        const entry = this.running;
        if (entry?.worker) {
            entry.cancelling = true;
            await entry.worker.terminate({ code: 'CANCELLED', message: 'the studio was stopped' });
        }
    }
}
//# sourceMappingURL=render-queue.js.map