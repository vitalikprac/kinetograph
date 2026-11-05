import type { Engine, EngineOptions } from './engine.js';
import type { InspectLayer, LayerName, SourceLocation } from './protocol.js';
/**
 * `file` as esbuild reported it (relative to the entry's directory, or absolute), relative to `cwd`; absolute when it
 * is outside `cwd`.
 */
export declare function relativeSource(source: SourceLocation, entryDir: string, cwd: string): SourceLocation;
/** `layers` and their children with the names of `names` laid over. */
export declare function nameLayers(layers: InspectLayer[], names: Record<string, LayerName>): InspectLayer[];
export declare function createEngine({ entry, bundleFile, publicDir }: EngineOptions): Engine;
//# sourceMappingURL=real-engine.d.ts.map