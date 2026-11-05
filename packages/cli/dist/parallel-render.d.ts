import type { VideoWriter } from '@kinetographdev/native';
import type { ArtifactRecord } from '@kinetographdev/core';
import type { AudioClipJson, Unsupported } from '@kinetographdev/scene';
import type { WorkerSpec } from './source.js';
/**
 * Frames in a chunk: the unit a worker takes. A worker keeps the composition's state, its video decoders and its layer
 * cache from one frame to the next, and a chunk is a run of frames it plays forward; a chunk start costs a worker the
 * frames of CSS-transition history and a seek of each video it shows, so small chunks cost CPU. Frames are not equally
 * dear (a motion-blur stretch costs several times a plain one), so a chunk that turns out heavy is split while it runs
 * (below) and the size is only where a chunk starts.
 */
export declare const CHUNK_FRAMES: number;
export interface ParallelOptions {
    spec: WorkerSpec;
    /** `render --scale`: the factor the scenes are drawn at (1 for full size). */
    scale: number;
    /** The pixel format the workers convert to, which the writer's encoder takes (`resolveExport`'s `convertFormat`). */
    convertFormat: string;
    /** Run React's development build in the workers. */
    devReact: boolean;
    preferredEffectBackend?: string;
    workers: number;
    /** The frames drawn are numbered `0..count-1` here; index `i` is frame `origin + i * step` of the composition. */
    origin: number;
    step: number;
    count: number;
    writer: VideoWriter;
    /**
     * Called for each frame (by its index) in order, before it is pushed to the encoder; throwing stops the render.
     * `repeated`: the frame was not drawn, being the same as the one before it.
     */
    onFrame(index: number, audio: AudioClipJson[], unsupported: Unsupported[], repeated: boolean): void;
    /** Called for each frame (by its index) after it is pushed. */
    onPushed?(index: number): void;
    shouldCancel?(): boolean;
}
/**
 * Draws frames `first..=last` with `workers` workers and pushes them to `writer` in order. Returns the `<Artifact>`
 * files the frames asked for (the one a later frame recorded wins, as it does in one run).
 *
 * Chunks are handed out in frame order, none starting further than a window of frames past the next frame the encoder
 * needs. A worker with nothing it may take splits the chunk of a busy one: the tail of that chunk, not yet started,
 * goes to the idle worker. So the heavy stretches of a film are shared and the render does not wait on one chunk.
 */
export declare function renderInParallel(options: ParallelOptions): Promise<ArtifactRecord[]>;
//# sourceMappingURL=parallel-render.d.ts.map