import type { ArtifactRecord } from '@kinetographdev/core';
import type { Unsupported, AudioClipJson } from '@kinetographdev/scene';
import { type WorkerSpec } from './source.js';
export interface WorkerInit {
    spec: WorkerSpec;
    scale: number;
    /** The pixel format to convert drawn frames to (`resolveExport`'s `convertFormat`). */
    convertFormat: string;
    devReact: boolean;
    preferredEffectBackend?: string;
    /** Index `i` of a chunk is frame `origin + i * step` of the composition (`step` is above 1 for a GIF's `--every-nth-frame`). */
    origin: number;
    step: number;
}
/** Main to worker. */
export type ToWorker = {
    type: 'chunk';
    first: number;
    last: number;
}
/** Stop the running chunk before frame `at` if it has not got that far; answered with a `split`. */
 | {
    type: 'split';
    at: number;
} | {
    type: 'finish';
};
/** Worker to main. */
export type FromWorker = {
    type: 'ready';
}
/** `repeated`: the frame was not drawn, being the same as the one before it in its chunk (packages/cli/skills/kinetograph/references/AUTHORING.md §9). */
 | {
    type: 'frame';
    frame: number;
    yuv: ArrayBuffer;
    audio: AudioClipJson[];
    unsupported: Unsupported[];
    repeated: boolean;
} | {
    type: 'chunk';
    first: number;
    last: number;
}
/** The frames of the chunk it gave up, `first..=last` (empty when `first > last`). */
 | {
    type: 'split';
    first: number;
    last: number;
} | {
    type: 'done';
    artifacts: ArtifactRecord[];
} | {
    type: 'error';
    code: string | undefined;
    message: string;
};
//# sourceMappingURL=render-worker.d.ts.map