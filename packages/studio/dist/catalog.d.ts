import type { CatalogPlugin } from './protocol.js';
export declare const DEFAULT_CATALOG_URL = "https://kinetograph.dev/api/catalog";
/** Next to the font cache (`~/.cache/kinetograph/fonts`). */
export declare const defaultCatalogCacheFile: () => string;
export interface CatalogOptions {
    url?: string;
    cacheFile?: string;
    offline?: boolean;
    fetch?: typeof fetch;
    timeoutMs?: number;
    bundledFile?: string;
    log?: (message: string) => void;
}
export interface CatalogSource {
    /** The best list known now. */
    get(): CatalogPlugin[];
    /** Where `get()` comes from: `site` once a fetch succeeded, else `cache` or `bundled`. */
    origin(): 'site' | 'cache' | 'bundled';
    /** Settles (never rejects) when the fetch at start is over. */
    refreshed: Promise<void>;
    /** Stops a fetch in flight. */
    close(): void;
}
/**
 * The plugins of a feed (`{ version: 1, plugins }`), or null when it is not one. An entry that is not valid is left
 * out, but a feed that lists plugins and has no valid one is rejected, so garbage never replaces a good copy.
 */
export declare function parseCatalog(value: unknown): CatalogPlugin[] | null;
export declare function createCatalog(options?: CatalogOptions): CatalogSource;
//# sourceMappingURL=catalog.d.ts.map