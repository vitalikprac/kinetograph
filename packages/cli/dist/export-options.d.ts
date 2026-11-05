import type { ExportOptions } from '@kinetographdev/native';
import type { OptionSpec } from './args.js';
export declare const EXPORT_FLAGS: OptionSpec[];
/** `8M` as 8,000,000 bit/s, `2500k` as 2,500,000, `128000` as itself. */
export declare function parseBitrate(flag: string, text: string): number;
export interface ExportFlags {
    /** 1 unless `--scale` (or `--draft`, 0.5). */
    scale: number;
    export: ExportOptions;
    everyNthFrame?: number;
}
type Options = Record<string, string | number | boolean | string[] | undefined>;
/** The export flags of a parsed command line, refused with `INVALID_ARG` when they contradict one another or are out of range. */
export declare function parseExportFlags(options: Options): ExportFlags;
export {};
//# sourceMappingURL=export-options.d.ts.map