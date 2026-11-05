export declare const DEFAULT_REGISTRY = "https://kinetograph.dev/r";
export declare const MAX_JSON_BYTES: number;
export declare const MAX_FILE_BYTES: number;
export interface Registry {
    /** Where it reads from, for messages. */
    readonly location: string;
    /** `<name>.json` (or `index` for the index). */
    readJson(name: string): Promise<unknown>;
    /** A binary file named by an item's `url`, relative to that item's JSON file. */
    readFile(itemName: string, url: string): Promise<Uint8Array>;
}
/**
 * Headers for registry requests. The seam for a licence key: a paid item will be fetched with
 * `Authorization: Bearer <KINETOGRAPH_LICENSE_KEY>`. No keys are read yet, so nothing is sent.
 */
export declare function requestHeaders(): Record<string, string>;
export interface OpenOptions {
    /** `KINETOGRAPH_REGISTRY` or the default. */
    spec?: string;
    /** For tests. */
    fetch?: typeof fetch;
}
export declare function openRegistry(options?: OpenOptions): Registry;
export declare const sha256: (bytes: Uint8Array) => string;
//# sourceMappingURL=source.d.ts.map