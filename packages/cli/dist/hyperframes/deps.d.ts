export interface CdnRef {
    pkg: string;
    version: string;
    /** The file in the package, `dist/gsap.min.js`; empty for the package's default file. */
    path: string;
}
/** `https://cdn.jsdelivr.net/npm/<pkg>@<version>/<path>`, `https://unpkg.com/<pkg>@<version>/<path>`; null for any other URL. */
export declare function parseCdnUrl(url: string): CdnRef | null;
/** `~/.cache/kinetograph/cdn`, or `$KINETOGRAPH_CDN_CACHE`. */
export declare function cdnCacheDir(): string;
/** Where a URL's file is cached. */
export declare function cdnCachePath(url: string): string;
export type ScriptResolution = {
    file: string;
    via: 'node_modules' | 'cache';
} | {
    error: string;
};
/** The hosts `fetch-deps` downloads from without being told to. */
export declare const DEFAULT_ALLOWED_HOSTS: string[];
/** The most bytes of one script. */
export declare const MAX_SCRIPT_BYTES: number;
/** The lock file the next resolves check the cache against, and the downloads are recorded in; null for none. */
export declare function useLockFile(path: string | null, fresh?: boolean): void;
/** The lock file in use. */
export declare const activeLockFile: () => string | null;
/**
 * The URL a downloaded data file or module really came from: where its request ended after redirects, as the downloader
 * recorded beside the cached file, or `url` itself. A browser resolves a module's relative imports and `import.meta.url`
 * against this. The lock's `final` never steers resolution (it is project data anyone can edit): it is only compared with
 * the cache's record, and a difference is an error. A record that is not https, or leaves the default hosts and the
 * requested URL's host without the lock pinning it, is ignored.
 */
export declare function finalUrlOf(url: string): string;
/** Where the script at `url` is on this machine, or why it is not. `projectDir` is where the search for `node_modules` starts. */
export declare function resolveCdnScript(url: string, projectDir: string): ScriptResolution;
export interface FetchedDep {
    url: string;
    file: string;
    status: 'installed' | 'cached' | 'fetched' | 'failed';
    error?: string;
    /** The error's code (`LOCK_MISMATCH`, `FETCH_REFUSED`, ...). */
    code?: string;
}
export interface FetchResponse {
    ok: boolean;
    status: number;
    headers: {
        get(name: string): string | null;
    };
    arrayBuffer(): Promise<ArrayBuffer>;
}
export interface FetchOptions {
    fetchImpl?: (url: string, init: {
        redirect: 'manual';
    }) => Promise<FetchResponse>;
    /** Hosts besides the defaults (`--allow-host`). */
    allowHosts?: string[];
    /** `integrity` attributes of the script tags, by URL (`sha384-<base64>`, several separated by spaces). */
    integrity?: Record<string, string>;
    maxBytes?: number;
    /** `fetch-deps --update`: download again what is cached, and replace what the lock says. */
    update?: boolean;
}
/** `//host/x` is `https://host/x`; anything else as it is. */
export declare const normalizeScriptUrl: (url: string) => string;
/** Checks `bytes` against an `integrity` attribute: any one of its hashes matching is enough (SRI). */
export declare function verifyIntegrity(bytes: Uint8Array, integrity: string, url: string): void;
/** Downloads the URLs that are neither installed nor cached into the cache (the only code that fetches a script). */
export declare function fetchCdnScripts(urls: string[], projectDir: string, options?: FetchOptions): Promise<FetchedDep[]>;
/** The most bytes of one data file a page fetches (`d3.json(url)`), and of one remote video or audio. */
export declare const MAX_DATA_BYTES: number;
export declare const MAX_MEDIA_BYTES: number;
/** Where a fetched data file or remote media file is cached: the URL's hash, with the URL's own extension. */
export declare function dataCachePath(url: string): string;
/** The cached file of `url` when it is there and its bytes are what was downloaded, else null (and why, in `reason`). */
export declare function resolveCdnData(url: string): {
    file: string;
} | {
    error: string;
};
/**
 * Downloads what a page fetches or plays from the web into the cache (`fetch-deps`): https only, hosts allowed one by
 * one, no redirect to another host, a size limit, and the hash recorded for the render to check. Same rules as a script.
 */
export declare function fetchCdnData(urls: string[], options?: FetchOptions): Promise<FetchedDep[]>;
//# sourceMappingURL=deps.d.ts.map