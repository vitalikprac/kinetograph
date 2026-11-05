import type { AudioClipJson, SceneJson, Unsupported } from '@kinetographdev/scene';
import type { InspectResult } from './native.js';
export interface Finding {
    rule: string;
    severity: 'error' | 'warning';
    /** The layer's id, or null for a finding about the scene or an audio clip. */
    layer: string | null;
    message: string;
}
export interface LintIssue extends Finding {
    /** Every checked frame the finding holds at. */
    frames: number[];
}
/** The findings that one frame's `InspectResult` shows: text that overflows, layers off the canvas, overlapping text. */
export declare function lintInspect(result: InspectResult): Finding[];
/** The ids of the text layers drawn in this frame that are entirely inside the canvas. */
export declare function textInsideCanvas(result: InspectResult): string[];
/** Missing fonts and assets in a frame's scene: what the scene names that is not there. */
export declare function lintScene(scene: SceneJson, baseDir: string, exists?: (path: string) => boolean): Finding[];
/**
 * `<Audio>` clips whose file is missing. A `<Video>`'s sound is left out: its layer reports the missing file. The URL of
 * an `@remotion/sfx` sound is not a file yet: it is downloaded when the audio is mixed.
 */
export declare function lintAudio(clips: AudioClipJson[], baseDir: string, exists?: (path: string) => boolean): Finding[];
/** Sorts in place: errors first, then by the first frame each was seen at. */
export declare function sortIssues(issues: LintIssue[]): LintIssue[];
/**
 * One issue per distinct finding, with every frame it was seen at; errors first. How far text runs past the canvas
 * changes from frame to frame as it moves, so those are one issue per layer. `inside` lists the text layers a frame
 * draws entirely inside the canvas: a layer that overflows in some frames and is inside in others is moving in or out
 * (a slide, a pan), which is a warning and not an error.
 */
export declare function mergeFindings(perFrame: {
    frame: number;
    findings: Finding[];
    inside?: readonly string[];
}[]): LintIssue[];
/**
 * What the engine cannot draw in the checked frames (kinetograph site, /docs/compat/): one warning per issue group of
 * `kinetograph doctor`, since the frame still renders, without it or approximated. The ranges are of the checked
 * frames only.
 */
export declare function lintCompat(perFrame: {
    frame: number;
    unsupported: readonly Unsupported[];
}[]): LintIssue[];
/**
 * What the project says went wrong outside any frame: a stylesheet that could not be built, a font that did not
 * download. They are what `doctor` prints under "stylesheets"; a warning here, since the text that needed a missing
 * font is already an error (`missing-font`).
 */
export declare function lintNotes(notes: readonly string[]): LintIssue[];
//# sourceMappingURL=lint.d.ts.map