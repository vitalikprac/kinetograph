import { Worker } from 'node:worker_threads';
import { builtFile, StudioFailure } from './util.js';
/** The worker script and the default engine, built next to this file (or in `dist/` under vitest). */
export const WORKER_FILE = builtFile('worker.js');
export const REAL_ENGINE_FILE = builtFile('real-engine.js');
/** The server's side of one worker thread: calls out, replies and progress back. */
export class WorkerClient {
    worker;
    pending = new Map();
    nextId = 1;
    closing = false;
    exited;
    failure = null;
    /** Progress of a render call, by call id. */
    onProgress;
    constructor(init) {
        this.worker = new Worker(WORKER_FILE, { workerData: init, name: `kinetograph-studio-${init.role}` });
        this.exited = new Promise((resolve) => this.worker.once('exit', () => resolve()));
        this.worker.on('message', (reply) => this.receive(reply));
        this.worker.on('error', (error) => this.fail({ code: 'INTERNAL', message: `the ${init.role} worker crashed: ${error.stack ?? error.message}` }));
        this.worker.on('exit', (code) => this.fail({ code: 'INTERNAL', message: `the ${init.role} worker stopped (exit code ${code})` }));
    }
    /** Runs `call` in the worker. Rejects with an error that has the worker's `code`. */
    call(call) {
        if (this.failure)
            return Promise.reject(new StudioFailure(this.failure.code, this.failure.message));
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve: resolve, reject });
            this.worker.postMessage({ ...call, id });
        });
    }
    get busy() {
        return this.pending.size > 0;
    }
    /** Lets the calls in flight finish, then stops the thread. */
    close() {
        if (this.closing)
            return this.exited;
        this.closing = true;
        if (this.pending.size === 0)
            return this.terminate();
        this.drained = () => void this.terminate();
        return this.exited;
    }
    drained = null;
    /** Stops the thread now; calls in flight fail with `reason`. */
    async terminate(reason = { code: 'INTERNAL', message: 'the worker was stopped' }) {
        this.closing = true;
        this.fail(reason);
        await this.worker.terminate();
        await this.exited;
    }
    receive(reply) {
        if ('event' in reply) {
            this.onProgress?.(reply.done, reply.total);
            return;
        }
        const pending = this.pending.get(reply.id);
        if (!pending)
            return;
        this.pending.delete(reply.id);
        if (reply.ok)
            pending.resolve(reply.result);
        else
            pending.reject(new StudioFailure(reply.error.code, reply.error.message));
        if (this.closing && this.pending.size === 0)
            this.drained?.();
    }
    fail(error) {
        this.failure ??= error;
        for (const [, pending] of this.pending)
            pending.reject(new StudioFailure(error.code, error.message));
        this.pending.clear();
    }
}
//# sourceMappingURL=worker-client.js.map