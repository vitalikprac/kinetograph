import { type RegistryItem } from './item.js';
export interface BuildResult {
    items: RegistryItem[];
    /** Files written, relative to the output folder. */
    written: string[];
}
/** Builds every item folder in `srcDir` into `outDir`. */
export declare function buildRegistry(srcDir: string, outDir: string): BuildResult;
//# sourceMappingURL=build.d.ts.map