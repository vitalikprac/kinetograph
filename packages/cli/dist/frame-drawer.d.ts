import type { Renderer } from '@kinetographdev/native';
import { type CompatReport } from './compat-report.js';
import type { Source } from './source.js';
export interface FrameDrawerOptions {
    /** The addon's renderer, made when the first frame needs it. */
    renderer(): Renderer;
    progress?(message: string): void;
    /** Throw on a frame holding something unsupported instead of drawing it without. */
    strict?: boolean;
}
export declare class FrameDrawer {
    private readonly source;
    private readonly options;
    private renderer;
    private readonly leftOut;
    constructor(source: Source, options: FrameDrawerOptions);
    /** Frame `frame` of the source as a PNG. */
    png(frame: number): Promise<Buffer>;
    /** What the frames drawn so far left out. */
    report(): CompatReport;
    /** What the frames left out, as a warning on the progress channel (stderr). */
    reportLeftOut(): void;
}
//# sourceMappingURL=frame-drawer.d.ts.map