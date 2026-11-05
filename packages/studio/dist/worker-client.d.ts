import type { StudioError } from './protocol.js';
import type { WorkerInit, WorkerRequest } from './engine.js';
/** The worker script and the default engine, built next to this file (or in `dist/` under vitest). */
export declare const WORKER_FILE: string;
export declare const REAL_ENGINE_FILE: string;
type Distribute<T> = T extends {
    id: number;
} ? Omit<T, 'id'> : never;
export type Call = Distribute<WorkerRequest>;
/** The server's side of one worker thread: calls out, replies and progress back. */
export declare class WorkerClient {
    private readonly worker;
    private readonly pending;
    private nextId;
    private closing;
    private exited;
    private failure;
    /** Progress of a render call, by call id. */
    onProgress: ((done: number, total: number) => void) | undefined;
    constructor(init: WorkerInit);
    /** Runs `call` in the worker. Rejects with an error that has the worker's `code`. */
    call<T>(call: Call): Promise<T>;
    get busy(): boolean;
    /** Lets the calls in flight finish, then stops the thread. */
    close(): Promise<void>;
    private drained;
    /** Stops the thread now; calls in flight fail with `reason`. */
    terminate(reason?: StudioError): Promise<void>;
    private receive;
    private fail;
}
export {};
//# sourceMappingURL=worker-client.d.ts.map