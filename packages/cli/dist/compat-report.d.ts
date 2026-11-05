import type { Unsupported } from '@kinetographdev/scene';
import { CliError } from './errors.js';
/** One kind of thing the engine left out, over the frames it was left out of. */
export interface LeftOut {
    element: string;
    property: string | null;
    reason: string;
    /** Distinct values seen, at most 3. */
    values: string[];
    /** Frames it was left out of. */
    frames: number;
    firstFrame: number;
    lastFrame: number;
}
export interface CompatReport {
    /** Frames drawn that held something unsupported. */
    unsupportedFrames: number;
    /** What those frames left out, one entry per kind. */
    leftOut: LeftOut[];
}
/** Collects what was left out, frame by frame, into one entry per kind. */
export declare class LeftOutCollector {
    private readonly kinds;
    private frames;
    add(frame: number, unsupported: readonly Unsupported[]): void;
    /** Most frames first. */
    result(): LeftOut[];
    report(): CompatReport;
}
/** The warning `still`, `strip` and `render` print on stderr for what they left out. */
export declare function describeLeftOut(report: CompatReport, limit?: number): string[];
/** `--strict`: the error for the first frame that holds something the engine cannot draw. */
export declare function strictError(frame: number, unsupported: readonly Unsupported[], limit?: number): CliError;
//# sourceMappingURL=compat-report.d.ts.map