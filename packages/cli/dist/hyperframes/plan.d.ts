import type { HfPlan } from '@kinetographdev/core/hyperframes';
import { resolveCdnScript } from './deps.js';
import { type ImportMap, type ModuleScript } from './modules.js';
export declare const DEFAULT_FPS = 30;
export interface PlanOptions {
    /** Natural duration of a media file in seconds, or null. */
    probeDuration?: (file: string) => number | null;
    /** Reads a script a URL names (default: the installed package or the cache; see `deps.ts`). */
    resolveScriptUrl?: typeof resolveCdnScript;
    /** Lists what the project loads (`fetch-deps`): a script that is not available is left out instead of failing the read. */
    discoverOnly?: boolean;
    /** Hosts besides the CDNs whose URLs in a script count as files it fetches (`--allow-host`). */
    allowHosts?: string[];
}
export interface BuiltPlan {
    plan: HfPlan;
    /** Every file read, for the bundler to watch. */
    files: string[];
    /** The URLs of the CDN scripts the project loads (`fetch-deps` downloads these). */
    scriptUrls: string[];
    /** The `integrity` attribute of each script URL's tag. */
    scriptIntegrity: Record<string, string>;
    /** URLs of data files the page's scripts name (`d3.json("https://cdn.jsdelivr.net/...")`), on the allowed hosts: `fetch-deps` downloads these. */
    dataUrls: string[];
    /** URLs of remote `<video>`, `<audio>`, `<img>` and `<source>` files, which `fetch-deps` downloads too. */
    mediaUrls: string[];
    /** URLs of remote pictures (`<img>`, CSS `url()`, SVG `<image>`, `<video poster>`), which `fetch-deps` downloads too. */
    imageUrls: string[];
    /** The `<script type="module">`s of the page, in document order. */
    modules: ModuleScript[];
    /** The page's import maps, merged. */
    importMap: ImportMap;
    /** A module script has an `import()` of a specifier built at run time (resolved while the page runs, `dynamic.ts`). */
    computedImports: boolean;
    /** A page script sets a picture from a URL built at run time (`scanScriptPictures`). */
    runtimePictures: boolean;
}
/** Reads the project whose entry file is `indexFile`. */
export declare function buildPlan(indexFile: string, options?: PlanOptions): Promise<BuiltPlan>;
//# sourceMappingURL=plan.d.ts.map