import type { Plugin } from 'esbuild';
/** Whether the file asks for Tailwind to build it. */
export declare function usesTailwind(css: string): boolean;
/** The nearest directory with a package.json at or above `from`. */
export declare function projectRoot(from: string): string;
/** The class-name candidates in the project's source files: every run of characters Tailwind could take a class from. */
export declare function scanCandidates(root: string): string[];
/**
 * Builds `file` with the project's Tailwind: its CLI (`tailwindcss` v3, or `@tailwindcss/cli` v4) if installed, else
 * Tailwind 4's `compile()`, else PostCSS with the Tailwind plugin.
 */
export declare function buildTailwind(file: string): Promise<{
    css: string;
} | {
    error: string;
}>;
/** Rewrites `url(relative)` to `url("<absolute>")` when the file exists next to `base`. */
export declare function absolutizeUrls(css: string, base: string): string;
export interface ReadCss {
    css: string;
    /** Every file read, for the bundler to watch. */
    files: string[];
    warnings: string[];
}
/** The stylesheet at `file` with its local `@import`s inlined (media queries on an import wrap the inlined text). */
export declare function readStylesheet(file: string, seen?: Set<string>): ReadCss;
/** Scopes the class names of `css` (`.title` → `.title_3f9a1c`) and returns the mapping. `:global(.x)` is left alone. */
export declare function scopeModule(css: string, file: string): {
    css: string;
    exports: Record<string, string>;
};
/** Turns each imported `.css` into a module that registers its text. */
export declare function cssPlugin(): Plugin;
//# sourceMappingURL=css.d.ts.map