import type { Plugin } from 'esbuild';
/** A directory's `index.html`; any other path as it is. */
export declare function resolveEntry(entry: string): string;
/** Whether the entry is an HTML file (a HyperFrames project). */
export declare function isHyperframesEntry(entry: string): boolean;
/** Called with the entry before the plan is read for a bundle (the studio: download what a rebuild newly needs). */
export declare function setBeforePlan(hook: ((entry: string) => Promise<void>) | null): ((entry: string) => Promise<void>) | null;
export declare const HYPERFRAMES_PREFIX = "kinetograph-hf:";
/**
 * Resolves `kinetograph-hf:<index.html>` to a module that hands the project's plan to the runtime. The files the plan
 * was read from are watched, so the studio rebuilds when one changes.
 */
export declare function hyperframesPlugin(): Plugin;
//# sourceMappingURL=entry.d.ts.map