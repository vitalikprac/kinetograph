import type { FetchOptions } from './hyperframes/deps.js';
export interface PrefetchEntryOptions {
    offline?: boolean;
    progress?: (message: string) => void;
    /** Replaces the network (tests). */
    fetchImpl?: FetchOptions['fetchImpl'];
}
/** Whether downloads are off for this process. */
export declare const isOffline: (offline?: boolean) => boolean;
/** Sets the process to offline (and its workers, which copy the environment). */
export declare function setOffline(offline: boolean): void;
/** How long to wait, after a change, for the rest of a save that touches several files (tests set it to 0). */
export declare function setPrefetchDebounce(ms: number): void;
/** What a HyperFrames entry needs before it is read; a no-op for any other entry or when offline. */
export declare function prefetchBeforePlan(entry: string, options?: PrefetchEntryOptions): Promise<void>;
/**
 * The https URLs in a bundle's code that name a picture, video or audio file: string literals and CSS `url()`s. A URL built
 * at run time (a template with a hole, a URL with no extension) is not found here; it is downloaded when a frame first
 * asks for it, and said so.
 */
export declare function scanRemoteUrls(code: string): string[];
/**
 * Before frame 0 of a Remotion project: its bundle is scanned for remote files, they are downloaded into the asset cache
 * and pinned in the lock file beside the entry. Sets the environment the render-time resolver reads (the lock file), so a
 * file that first appears mid-render is added to the same lock.
 */
export declare function prefetchBundleAssets(entry: string, bundleFile: string, options?: PrefetchEntryOptions): Promise<void>;
//# sourceMappingURL=prefetch.d.ts.map