import type { PresetInfo } from './protocol.js';
export declare function checkPresetName(name: string): void;
/** The presets of `comp`, by name; a file that is not a JSON object is skipped. */
export declare function listPresets(entry: string, comp: string): PresetInfo[];
export declare function savePreset(entry: string, comp: string, name: string, props: unknown): void;
//# sourceMappingURL=presets.d.ts.map