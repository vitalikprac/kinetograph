import { type FetchedDep, type FetchOptions } from './deps.js';
import { type ImportMap } from './modules.js';
/** What the project's bundle leaves for the host: the page's import map and where the project is. */
export declare const DYNAMIC_CONFIG: unique symbol;
export interface DynamicConfig {
    importMap: ImportMap;
    root: string;
    entry: string;
}
export declare const discovered: {
    fetched: FetchedDep[];
    failed: {
        specifier: string;
        referrer: string;
        error: string;
        code?: string;
    }[];
    pictures: Set<string>;
};
export declare function setDiscovery(options: FetchOptions | null): void;
/** Makes `import()` of a computed specifier in the page's module scripts answer from here. */
export declare function installDynamicImport(): void;
/**
 * Where a remote picture a page's script set at run time (`img.src = url`, `el.style.backgroundImage`) is read from: the
 * pre-download cache, as a picture in the markup is (`plan.ts`, `localImage`). The page's runtime asks through
 * `REMOTE_PICTURE` (`@kinetographdev/core/hyperframes`); a render never downloads. While the pre-download step runs the
 * page, a picture that is not cached is kept, to be downloaded after the run.
 */
export declare function installRemotePictures(): void;
/** Forgets the modules already answered (tests; a studio rebuild). */
export declare function resetDynamicImports(): void;
//# sourceMappingURL=dynamic.d.ts.map