import type * as NativeApi from '@kinetographdev/native';
import type { SourceLocation } from '@kinetographdev/scene';
export type Native = typeof NativeApi;
/**
 * The GPL `ffmpeg` program the platform package ships (`bin/ffmpeg`, `bin/ffmpeg.exe`), if this install has one. The
 * addon runs it for the encoders its own LGPL ffmpeg lacks (libx264, libx265); it is never linked.
 */
export declare function bundledFfmpeg(): string | undefined;
/**
 * The addon, loaded on first use so that commands that never render (`effects`, `doctor`, argument errors) work where
 * the addon's binary is missing. A CommonJS package, so it is loaded with `require`.
 */
export declare function native(): Native;
/** Tests put a stand-in addon here. */
export declare function setNativeForTests(stub: Native | undefined): void;
export interface InspectLayer {
    id: string;
    type: string;
    opacity: number;
    blendMode: string;
    transform: {
        x: number;
        y: number;
        scale: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        anchorX: number;
        anchorY: number;
        rotateX: number;
        rotateY: number;
        z: number;
    };
    matrix: [number, number, number, number, number, number];
    box: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    bounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    effects: string[];
    clip: string | null;
    clipBounds: {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    mask: boolean;
    matte: {
        layer: string;
        mode: string;
    } | null;
    matteSource: boolean;
    motionBlur: {
        samples: number;
        shutter: number;
    } | null;
    text?: {
        text: string;
        font: string;
        size: number;
        width: number;
        height: number;
        maxWidth: number | null;
        lines: {
            text: string;
            top: number;
            bottom: number;
            baseline: number;
        }[];
    };
    src?: string;
    /** video, gif: the source time in seconds at the inspected frame (AUTHORING.md §11.1). */
    media?: {
        time: number;
    };
    children?: InspectLayer[];
    /** The studio adds these (never the addon): what a person calls the layer, the component that drew it, the JSX that made it. */
    label?: string;
    component?: string;
    source?: SourceLocation;
}
export interface InspectResult {
    width: number;
    height: number;
    fps: number;
    durationInFrames: number;
    frame: number;
    margin: number;
    camera: {
        perspective: number;
        x: number;
        y: number;
    } | null;
    layers: InspectLayer[];
}
//# sourceMappingURL=native.d.ts.map