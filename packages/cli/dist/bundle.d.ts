import { familyFromModuleName } from '@kinetographdev/core/google-fonts';
import { CliError } from './errors.js';
export type Resolution = {
    kind: 'path';
    target: string;
} | {
    kind: 'font';
    family: string;
} | {
    kind: 'unsupported';
    message: string;
};
/**
 * `DMSans` → `DM Sans`, `NotoSansJP` → `Noto Sans JP`, `JetBrainsMono` → `JetBrains Mono`: the family name of a Google
 * Fonts module. The core's function, so its list of names the splitting rule gets wrong is shared.
 */
export declare const familyFromModule: typeof familyFromModuleName;
/**
 * Where an import of a project goes, or null if the bundle resolves it as usual. `remotion` and `@remotion/*` become
 * the matching `@kinetographdev/core` subpath; `@remotion/google-fonts/<Family>` becomes a generated module; the
 * `@kinetographdev` packages are re-resolved from the CLI so that a project and the CLI share one copy of each.
 */
export declare function resolveSpecifier(specifier: string): Resolution | null;
/** An import of a package Kinetograph does not support, and the file that imports it. */
export interface UnsupportedImport {
    specifier: string;
    file: string | null;
}
/** The synthetic entry (packages/cli/skills/kinetograph/references/AUTHORING.md §9): the shim's side-effect module is evaluated before the project. */
export declare function syntheticEntry(entry: string, dev?: boolean): string;
/** `node_modules/.cache/kinetograph` of the project the entry belongs to: the nearest directory with a package.json. */
export declare function cacheDir(entry: string): string;
export interface BundleResult {
    /** The written `.mjs` file. */
    file: string;
    warnings: string[];
}
/**
 * Bundles the project at `entry` with esbuild into `node_modules/.cache/kinetograph/`. The file name carries a hash of
 * the entry's path and one of the output, so it only changes when the code does and a changed project is re-imported
 * even by a process that has already imported the old one. With `options.unsupported`, an import of an unsupported
 * package does not fail the bundle: it is listed there (package and importing file) and bundled as a stub.
 */
export declare function bundleProject(entry: string, options?: {
    unsupported?: UnsupportedImport[];
}): Promise<BundleResult>;
/** One build of a watched project: the bundle's code, or why it failed. */
export type ProjectBuild = {
    code: string;
    warnings: string[];
} | {
    error: CliError;
};
/**
 * Bundles the project at `entry` as `bundleProject` does, writes nothing, and keeps watching the files the bundle
 * reads: `onBuild` is called after the first build and after every rebuild with the code or the error. A failed
 * rebuild does not stop the watching. Resolves once watching has started (the first `onBuild` has been called by then).
 */
export declare function watchProject(entry: string, onBuild: (build: ProjectBuild) => void): Promise<{
    dispose(): Promise<void>;
}>;
//# sourceMappingURL=bundle.d.ts.map