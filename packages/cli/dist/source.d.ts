import type { ArtifactRecord, CompositionInfo } from '@kinetographdev/core';
import type { AudioClipJson, LayerName, SequenceJson, Unsupported } from '@kinetographdev/scene';
import { type UnsupportedImport } from './bundle.js';
export interface FrameOutput {
    /** The frame's scene as the addon takes it. */
    sceneJson: string;
    audio: AudioClipJson[];
    /** Every `<Sequence>` in the frame's tree (packages/cli/skills/kinetograph/references/AUTHORING.md §11.4); none for a scene file. */
    sequences?: SequenceJson[];
    /** Layer id to name and source; only in the studio's builds. */
    names?: Record<string, LayerName>;
    /** What the engine cannot draw on this frame (kinetograph site, /docs/compat/); for a scene file, its unknown keys. */
    unsupported?: Unsupported[];
    /** ms spent in `renderFrame` and in `JSON.stringify` (0 for a scene file), for `bench`. */
    jsMs: number;
    stringifyMs: number;
}
/** Something to render frames from: a `.json` scene, or a composition of a bundled project. */
export interface Source {
    kind: 'scene' | 'project';
    entry: string;
    /** Asset paths in the scenes resolve against this. */
    baseDir: string;
    composition: CompositionInfo;
    /** Frames can be asked for in any order, but a project's clock only runs forward, so ascending is cheapest. */
    frame(frame: number): Promise<FrameOutput>;
    /** Problems with the project's stylesheets, for `doctor`. */
    notes?(): string[];
    /** The `<Artifact>` files rendered frames asked for, and forgetting the ones asked for before (a render starts clean). */
    artifacts?(): ArtifactRecord[];
    clearArtifacts?(): void;
    /** A project: what a render worker needs to open the same composition again (`render --concurrency`). */
    worker?: WorkerSpec;
    dispose(): void;
}
/** `openSource`'s arguments for a project, with the bundle it built, so a worker thread loads it without bundling. */
export interface WorkerSpec {
    entry: string;
    comp: string;
    props?: string;
    bundleFile: string;
    publicDir?: string;
}
export interface OpenOptions {
    comp?: string;
    props?: string;
    /** An already built bundle of the entry (the studio's): used instead of bundling again. */
    bundleFile?: string;
    /** When given, an import of an unsupported package is listed here and stubbed, instead of failing the bundle. */
    unsupportedImports?: UnsupportedImport[];
    /** Never download (`--offline`); also `KINETOGRAPH_OFFLINE=1`. */
    offline?: boolean;
    /** Where the pre-download step says what it fetched. */
    progress?: (message: string) => void;
    /** False in a render worker: the main thread did the pre-download step. */
    prefetch?: boolean;
    /** Directory `staticFile()` reads from (default: `public/` beside the entry, else beside the nearest package.json). */
    publicDir?: string;
}
export declare function isSceneFile(entry: string): boolean;
/** `--props`: a JSON object, or the path of a file holding one (a value that does not start with `{` and names a file). */
export declare function parseProps(text: string | undefined): Record<string, unknown>;
/**
 * Where `staticFile` reads from: `public/` beside the entry, or else `public/` beside the nearest package.json (where
 * Remotion keeps it, with the entry in `src/`). Beside the entry when neither exists.
 */
export declare function publicDirOf(entry: string, override?: string): string;
/**
 * The project's folder: the one holding the nearest package.json at or above the entry (a directory entry counts as
 * itself), else the entry's own folder. Generated files go under its `out/` (`still`, `strip`, `onion`, `render`).
 */
export declare function projectRootOf(entry: string): string;
/** The compositions a project (or a scene file, which is one) offers. */
export declare function listCompositions(entry: string, options?: {
    bundleFile?: string;
    offline?: boolean;
    progress?: (message: string) => void;
    publicDir?: string;
}): Promise<CompositionInfo[]>;
/** The keys of a scene file the format does not read, as unsupported content named by its JSON path. */
export declare function sceneUnknownKeys(text: string): Unsupported[];
export declare function openSource(entry: string, options?: OpenOptions): Promise<Source>;
/** A frame number checked against the composition. */
export declare function checkFrame(frame: number, durationInFrames: number): number;
/** `--range a..b` as inclusive first and last frame; the whole composition if left out. */
export declare function frameRange(range: string | undefined, durationInFrames: number): [number, number];
/** `count` frames spread evenly over `first..=last`, ends included, without repeats. */
export declare function evenFrames(first: number, last: number, count: number): number[];
//# sourceMappingURL=source.d.ts.map