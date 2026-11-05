import type { SceneJson } from '@kinetographdev/scene';
/** The largest even number not above `n * scale`, at least 2: YUV 4:2:0 video needs even sizes. */
export declare const scaledSize: (n: number, scale: number) => number;
/** `scaledSize` at half: H.264 in 4:2:0 needs even sizes. */
export declare const halfSize: (n: number) => number;
/**
 * The scene at `scale` times the size, for `render --scale` (and `--draft`, which is 0.5): the layers wrapped in a group
 * at that scale on a canvas of the scaled size (each side rounded down to an even number), so the compositor draws
 * everything at the output size and nothing is resampled afterwards. An explicit camera centre is in canvas pixels, so
 * it is scaled too; the perspective distance is not, because `z` is not scaled by the group's matrix. (3D scenes may
 * therefore differ a little from the full-size render.)
 */
export declare function scaleScene(scene: SceneJson, scale: number): SceneJson;
/** The scene at half size for `render --draft`. */
export declare const draftScene: (scene: SceneJson) => SceneJson;
export declare const LABEL_FONT_KEY = "DM Sans";
export declare const LABEL_FONT_PATH: string;
export interface SheetFrame {
    /** PNG file name, relative to the scene's base directory. */
    file: string;
    frame: number;
}
export interface StripLayout {
    cols: number;
    rows: number;
    thumbWidth: number;
    thumbHeight: number;
    width: number;
    height: number;
}
/** The grid of a contact sheet of `count` thumbnails of a `width` x `height` composition. */
export declare function stripLayout(count: number, width: number, height: number, cols?: number): StripLayout;
/**
 * A scene that lays the frames out as image layers in a grid, each labelled with its frame number and time, for the
 * engine to render as the contact sheet.
 */
export declare function buildStripScene(frames: SheetFrame[], source: {
    width: number;
    height: number;
    fps: number;
}, cols?: number): SceneJson;
/**
 * The frames blended over one another as a running average: layer k at opacity 1/(k+1), so every frame counts the same
 * and whatever moves shows once per frame, each at 1/n.
 */
export declare function buildOnionScene(frames: SheetFrame[], source: {
    width: number;
    height: number;
    fps: number;
}): SceneJson;
//# sourceMappingURL=scenes.d.ts.map