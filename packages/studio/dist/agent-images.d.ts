import type { PanelRoute } from './panels/routes.js';
/** The largest picture taken, bytes. */
export declare const MAX_IMAGE_BYTES: number;
/** The most pictures one message carries. */
export declare const MAX_IMAGES = 6;
/** Where they are kept, relative to the project. */
export declare const IMAGE_DIR = "public/refs";
/** A file name that is safe to store, or null when nothing is left or it is not a picture type the studio takes. */
export declare const safeImageName: (raw: string) => string | null;
/** True when the name is one `safeImageName` could have made (so it is a file directly in public/refs, not a path). */
export declare const isStoredName: (name: string) => boolean;
/** Whether the first bytes are a PNG, JPEG, GIF, WebP or AVIF picture. */
export declare function sniffImage(bytes: Buffer): boolean;
/** The names among `names` that are not pictures stored in the project's public/refs (a missing file, a link, a path). Sync: used where a message arrives. */
export declare function missingImages(projectDir: string, names: string[]): string[];
export declare const agentImageRoute: PanelRoute;
//# sourceMappingURL=agent-images.d.ts.map