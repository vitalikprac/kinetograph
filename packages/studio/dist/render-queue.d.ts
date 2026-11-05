import { EventEmitter } from 'node:events';
import type { RenderJob } from './protocol.js';
import type { RenderSpec } from './engine.js';
import type { WorkerClient } from './worker-client.js';
export interface RenderQueueDeps {
    /** A render worker over the current build; `cancel` is the flag the worker polls between frames. */
    spawn(cancel: SharedArrayBuffer): WorkerClient;
    /** ms a cancelled job's worker gets to stop by itself before the thread is terminated. */
    cancelGraceMs?: number;
}
/**
 * Render jobs, one at a time, each in a worker of its own so that the preview stays live (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5).
 * Clock reads here are the server's bookkeeping (job timestamps, ms per frame), never part of a render.
 */
export declare class RenderQueue extends EventEmitter<{
    update: [job: RenderJob];
}> {
    private readonly deps;
    private readonly entries;
    private running;
    private closed;
    private nextId;
    constructor(deps: RenderQueueDeps);
    list(): RenderJob[];
    /** Queues a job: `fields` is everything but what the queue decides. */
    add(spec: RenderSpec, fields: {
        props: Record<string, unknown>;
    }): RenderJob;
    /** Cancels a queued or running job; a finished one is left as it is. Undefined for an unknown id. */
    cancel(id: string): RenderJob | undefined;
    private finish;
    private changed;
    private pump;
    private run;
    /** Cancels what is queued and running, and stops the worker. */
    close(): Promise<void>;
}
//# sourceMappingURL=render-queue.d.ts.map