import type { IncomingMessage, ServerResponse } from 'node:http';
import type { PanelRoute } from './routes.js';
/** The largest file the panel takes. */
export declare const MAX_REF_BYTES: number;
/**
 * A file name that is safe to store: the last segment only, letters, digits, dot, dash and underscore, no leading dot,
 * at most 100 characters before the extension. Null when nothing is left or the type is not a video or an image.
 */
export declare function safeRefName(raw: string): string | null;
/** `safeRefName` for any set of extensions (lower case, with the dot): the same cleaning, a different list of types. */
export declare function safeName(raw: string, allowed: (ext: string) => boolean): string | null;
export declare function reply(res: ServerResponse, status: number, body: unknown): true;
export declare const fail: (res: ServerResponse, status: number, code: string, message: string) => true;
/** What a file really is, from its first bytes; the extension is only the name the person gave it. */
export type Sniffed = {
    kind: 'video';
    demuxer: 'mov' | 'matroska' | 'avi';
    allow: string;
} | {
    kind: 'image';
};
/**
 * Accepts only real containers: MP4/MOV ("ftyp"), Matroska/WebM, AVI, PNG, JPEG, GIF and WebP. A text playlist
 * (#EXTM3U, ffconcat) or anything else is null, so ffmpeg never has a file that names other files to read.
 */
export declare function sniff(head: Buffer): Sniffed | null;
/** True when `path` is a regular file and not a symbolic link. */
export declare function isPlainFile(path: string): Promise<boolean>;
/** True when something (a file, a link, even a dangling one) is at `path`. */
export declare function taken(path: string): Promise<boolean>;
/** True when `path` really lies inside `root` once links are resolved. */
export declare function inside(root: string, path: string): Promise<boolean>;
export declare function head(file: string): Promise<Buffer>;
/** The ffmpeg program to run: `KINETOGRAPH_FFMPEG`, the platform package's `bin/ffmpeg`, then the `PATH`'s (the order the addon uses). */
export declare function findFfmpeg(): string;
/** Writes `sheet`: 8 frames spread evenly over the video, 4 by 2. Resolves false when there is no ffmpeg or it fails. */
export declare function makeContactSheet(video: string, sheet: string, kind: Extract<Sniffed, {
    kind: 'video';
}>): Promise<boolean>;
/** A name that is not taken in `dir`: `a.mp4`, then `a-2.mp4`, `a-3.mp4`. */
export declare function freeName(dir: string, name: string, siblings?: string[]): Promise<string>;
/** Streams the request body into a new file at `to` (flag wx), failing with a RangeError past `max` bytes. */
export declare function receive(req: IncomingMessage, to: string, max?: number): Promise<void>;
export declare const briefRoute: PanelRoute;
//# sourceMappingURL=brief-routes.d.ts.map