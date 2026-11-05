import type { Engine } from './engine.js';
import type { AudioClipJson } from '@kinetographdev/scene';
import type { TimelineData } from './protocol.js';
/**
 * The timeline of a composition: its JS stage run for every frame (no addon), with the Sequences and the layers the
 * frames show folded into one list each (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5).
 */
export declare function sweepTimeline(engine: Engine, request: {
    comp: string;
    props: Record<string, unknown>;
}, 
/** Called every few frames with the frames read so far and the total. */
onProgress?: (done: number, total: number) => void, 
/** Receives the sounds of each frame that has any, for the mix: the sweep is the only pass over the frames. */
collect?: (frame: number, audio: AudioClipJson[], baseDir: string) => void): Promise<TimelineData>;
//# sourceMappingURL=timeline.d.ts.map