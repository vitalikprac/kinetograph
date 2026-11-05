export interface Rgba {
    width: number;
    height: number;
    /** `width * height * 4` bytes, straight alpha. */
    data: Uint8Array;
}
/**
 * Decodes the PNGs the engine writes: 8 bits per channel, grey, grey with alpha, RGB or RGBA, not interlaced. That is
 * all `snapshot` needs to compare two of them.
 */
export declare function decodePng(bytes: Uint8Array): Rgba;
export interface PngDiff {
    /** False if the sizes differ, in which case nothing else is meaningful. */
    sameSize: boolean;
    /** The largest difference in any one channel of any pixel, 0..255. */
    maxDiff: number;
    /** Pixels with any channel differing by more than `tolerance`. */
    differingPixels: number;
}
export declare function diffPng(a: Rgba, b: Rgba, tolerance: number): PngDiff;
/**
 * An 8-bit RGBA PNG of straight-alpha pixels, `width * height * 4` bytes. Rows are unfiltered and deflated quickly:
 * the pictures are looked at or decoded again at once, so speed counts more than size.
 */
export declare function encodePng(width: number, height: number, rgba: Uint8Array): Buffer;
//# sourceMappingURL=png.d.ts.map