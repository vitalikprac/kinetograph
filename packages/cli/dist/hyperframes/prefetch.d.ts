import { type FetchedDep, type FetchOptions } from './deps.js';
export interface PrefetchOptions {
    /** Hosts besides the default CDNs (`--allow-host`). */
    allowHosts?: string[];
    /** Further URLs to download (`--url`). */
    extraUrls?: string[];
    /** The most megabytes of one remote video or audio file (default 500). */
    maxMediaMb?: number;
    /** Download again what is cached, and replace the lock (`fetch-deps --update`). */
    update?: boolean;
    /** Replaces the network (tests). */
    fetchImpl?: FetchOptions['fetchImpl'];
}
export interface PrefetchResult {
    cache: string;
    lockFile: string;
    files: FetchedDep[];
    fonts: {
        family: string;
        status: 'ready' | 'failed';
        error?: string;
    }[];
    /** The files the project is made of (HTML, local modules): a change to one can mean a new download. */
    inputs: string[];
    /** How many files were downloaded just now. */
    fetched: number;
    /** One line: what the project loads from the web. */
    summary: string;
}
/** Everything the HyperFrames project at `entry` (an absolute path to its HTML) loads from the web, downloaded and locked. */
export declare function prefetchHyperframes(entry: string, options?: PrefetchOptions): Promise<PrefetchResult>;
/**
 * The step `render`, `still`, `studio` and `doctor` run: `prefetchHyperframes`, with a failed download only said (the
 * render then reports the file that is missing as it always has), except a lock mismatch, which stops it. Resolves to the
 * files the project is made of.
 */
export declare function autoPrefetchHyperframes(entry: string, progress: (message: string) => void, options?: PrefetchOptions): Promise<string[]>;
//# sourceMappingURL=prefetch.d.ts.map