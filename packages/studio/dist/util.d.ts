import type { LayerName, StudioError } from './protocol.js';
/** A failure with a studio error code (`INVALID_ARG`, `NOT_FOUND`, `BUILD`, …). */
export declare class StudioFailure extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/**
 * The `StudioError` of any thrown value; the CLI's and the addon's errors keep their codes. (As the CLI's
 * `toErrorObject`, which is not imported so that a worker that does not need the CLI does not load it.)
 */
export declare function toStudioError(error: unknown): StudioError;
/** The HTTP status for an error, with the code the client sees (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5). */
export declare function httpError(error: unknown): {
    status: number;
    error: StudioError;
};
/**
 * The name of layer `id`. The addon adds layers of its own under an element's path (`$0.1.border.top`, `$0.1.shadow2`,
 * `$0.1.svg.3`): they are named after the element, with what the id adds.
 */
export declare function lookupName(names: Record<string, LayerName> | undefined, id: string): LayerName | undefined;
/** `JSON.stringify` with object keys sorted, so equal props are equal keys. */
export declare function stableStringify(value: unknown): string;
/**
 * The path of a built file of this package: beside this one when it is the built copy, else in `dist/` (the sources
 * run directly under vitest, and a worker cannot load TypeScript).
 */
export declare function builtFile(name: string): string;
/** `peaks` taken down (the loudest of the ones each new bucket covers) or stretched to `buckets`. */
export declare function resamplePeaks(peaks: number[], buckets: number): number[];
/**
 * What a sound is, apart from the path id of the `<Audio>` that plays it: ids are paths in the tree, so when a sibling
 * before it unmounts the same sound gets a new one. The timeline and the waveforms name a sound by this.
 */
export declare function soundKey(clip: {
    src: string;
    from: number;
    trimBefore: number;
    trimAfter: number | null;
    playbackRate: number;
    loop: boolean;
    video?: boolean;
}): string;
//# sourceMappingURL=util.d.ts.map