import type { ExportOptions, Renderer, RenderSummary } from '@kinetographdev/native';
import { type CompatReport } from './compat-report.js';
import { type Source } from './source.js';
export interface RenderJobOptions {
    output: string;
    /** `10..40` (10 to 39) or `10..=40`; default all frames. */
    range?: string;
    encoder?: string;
    /** Output size multiplier (default 1): the compositor draws at the scaled size, sides rounded down to even. */
    scale?: number;
    /** Half size: `scale: 0.5`. */
    draft?: boolean;
    /** Codec, quality, pixel format and audio (packages/cli/skills/kinetograph/references/AUTHORING.md §9). */
    export?: ExportOptions;
    /** GIF: draw every nth frame of the range (a project only). */
    everyNthFrame?: number;
    /** Run React's development build in the worker threads (the main thread is set by the caller). */
    devReact?: boolean;
    /** `--preferred-effect-backend`, told to the worker threads (the main thread is set by the caller). */
    preferredEffectBackend?: string;
    /**
     * Fail with `UNSUPPORTED_CONTENT` on the first frame that holds something the engine cannot draw (kinetograph site, /docs/compat/), instead of drawing it without. Default off: the report says what was left out.
     */
    strict?: boolean;
    /**
     * Frames drawn at once (packages/cli/skills/kinetograph/references/AUTHORING.md §9): the composition's JS runs in this many worker threads, each with a
     * renderer of its own, and the frames are encoded in order. Default 1, which draws every frame in this thread. Only a
     * project (not a `.json` scene, which the addon draws whole) uses more.
     */
    concurrency?: number;
    /** Called after each frame of a project is pushed to the encoder. */
    onFrame?(done: number, total: number): void;
    /** Progress for people, e.g. "mixing audio". */
    progress?(message: string): void;
    /** Checked before each frame of a project; true aborts the render with a `CANCELLED` error and no output file. */
    shouldCancel?(): boolean;
}
/** What a render did, beside the encoder's `RenderSummary`. */
export type RenderResult = RenderSummary & {
    compat: CompatReport;
    /** The `<Artifact>` files written beside the video, as the names they have in its folder. */
    artifacts: string[];
};
/**
 * Renders `source` to `options.output` with `renderer` (the `render` command, packages/cli/skills/kinetograph/references/AUTHORING.md §9): a `.json` scene
 * goes to the addon whole, a project is pushed frame by frame and its audio mixed at the end.
 *
 * Every frame goes to the addon. One that holds something the engine cannot draw is drawn without it, and the summary
 * lists what was left out; with `strict` it fails the render instead.
 */
export declare function renderSource(source: Source, renderer: Renderer, options: RenderJobOptions): Promise<RenderResult>;
//# sourceMappingURL=render-job.d.ts.map