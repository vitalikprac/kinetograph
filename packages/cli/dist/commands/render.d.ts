import { type Command } from './types.js';
export declare const still: Command;
/** Half the cores, at most 4: past that the GPU, the encoder and memory (0.5 to 1 GB a worker) are the limit, not the JS. */
export declare function defaultConcurrency(): number;
export declare const render: Command;
//# sourceMappingURL=render.d.ts.map