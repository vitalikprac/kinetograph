import { type FetchedDep, type FetchOptions } from './deps.js';
/** A `<script type="importmap">`: bare names and prefixes to URLs, and per-referrer overrides. Every value is an absolute URL. */
export interface ImportMap {
    imports: Record<string, string>;
    scopes: Record<string, Record<string, string>>;
}
/** A `<script type="module">` of the page. */
export interface ModuleScript {
    /** The source of an inline script, or null for a `src`. */
    code: string | null;
    /** What it is, for messages: the script's URL (https) or absolute file path, or the HTML file for an inline script. */
    file: string;
    /** Where its own imports resolve from, as a URL: the script's URL, or the HTML file's `file:` URL for an inline script. */
    base: string;
    /** The composition it belongs to (see `HfScript`), and that composition's file. */
    scope: string | null;
    sourceFile: string | null;
    /** The project's directory: a local module must be inside it. */
    root: string;
    /** The script tag's `integrity`, checked against the bytes of a `src` module. */
    integrity?: string;
}
export declare const emptyImportMap: () => ImportMap;
/**
 * Reads the text of a `<script type="importmap">` whose file is at `base` (a URL; relative values resolve from it).
 * `problems` hears about the parts that were ignored.
 */
export declare function parseImportMap(text: string, base: string, problems?: string[]): ImportMap;
/** Merges `extra` into `map`: a name already mapped keeps its first mapping (as in a browser, where a later map cannot override an earlier). */
export declare function mergeImportMaps(map: ImportMap, extra: ImportMap): void;
/**
 * The URL `specifier` names when imported by the module at `referrer` (a URL): the matching scope first (the longest scope
 * prefix that holds the referrer, then shorter ones), then the top-level `imports`, then the specifier as a URL. A bare name
 * with no mapping is an error, as in a browser.
 */
export declare function resolveImport(specifier: string, referrer: string, map: ImportMap): string;
export declare const DYNAMIC_IMPORT: unique symbol;
export interface BundledModule {
    code: string;
    fetched: FetchedDep[];
    /** A module of the graph has an `import()` of a specifier built at run time (see `dynamic.ts`). */
    computed: boolean;
    /** The local files the bundle read. */
    inputs: string[];
}
/**
 * The module `specifier` names, imported at run time by the module at `referrer` (a URL), as a script that leaves its
 * namespace in `globalThis[slot]` when it has run (an async function: top-level `await` works). Reads the cache only, unless `fetch` is given, which downloads what is not there.
 */
export declare function bundleDynamicImport(specifier: string, 
/** The global symbol the bundle leaves the module's namespace in when it runs. */
slot: symbol, referrer: string, root: string, map: ImportMap, fetch: FetchOptions | null): Promise<{
    code: string;
    fetched: FetchedDep[];
    missing: string[];
}>;
/**
 * `script` and everything it imports as one classic script. Top-level `await` makes the script an async function that the
 * runtime does not wait for (it runs to its first `await` at once). The build reads the cache only, unless `fetch` is given
 * (the pre-download step), which downloads what is not there.
 */
export declare function bundleModuleScript(script: ModuleScript, map: ImportMap, fetch?: FetchOptions | null): Promise<BundledModule>;
/**
 * The pre-download step for module scripts: each one's import graph is walked (by bundling it) and every remote module is
 * downloaded and locked. A script that cannot be bundled is a failed entry (its imports of the graph that were reached are
 * kept); the render reports it.
 */
export declare function fetchModuleGraph(modules: ModuleScript[], map: ImportMap, options: FetchOptions, 
/** Told what the graphs hold: the local files they read, and whether any has an `import()` of a computed specifier. */
info?: {
    inputs: Set<string>;
    computed: boolean;
}): Promise<FetchedDep[]>;
//# sourceMappingURL=modules.d.ts.map