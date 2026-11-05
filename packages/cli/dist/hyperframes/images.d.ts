/** How the page's runtime asks the host for the cached file of a remote picture a script set (`dynamic.ts`). */
export declare const REMOTE_PICTURE: unique symbol;
/**
 * Why a remote picture is drawn without, and the command that fixes it: `fetch-deps`, with `--allow-host` when its host is
 * not one of the defaults. `http:` is refused outright.
 */
export declare function notCachedPicture(url: string, entry?: string, what?: string): string;
/** The most bytes of one remote picture. */
export declare const MAX_IMAGE_BYTES: number;
export type RemoteImage = {
    url: string;
} | {
    refused: string;
} | null;
/**
 * What a picture reference is: an `https` URL (a `//host/x` one is `https`), a `http` URL that is refused, or null for
 * anything else (a relative path is a file of the project, `data:` is the picture itself).
 */
export declare function remoteImage(value: string): RemoteImage;
/**
 * The candidate of a `srcset` that is drawn, parsed as HTML parses it and chosen as Chrome chooses at device pixel ratio
 * 1 (`srcsetCandidate`): a `w` descriptor is measured against `sizes`, `100vw` by default, of a 1920x1080 viewport.
 */
export declare function pickSrcset(srcset: string, src?: string, sizes?: string): string | null;
/** Every URL a `srcset` names, in the order written. */
export declare function srcsetUrls(srcset: string): string[];
/**
 * `css` (a stylesheet, or the declarations of a `style` attribute) with each remote `url()` of a picture property passed
 * through `local`: its result replaces the URL when it is a file, else the URL stays as written.
 */
export declare function rewriteCssImages(css: string, local: (image: NonNullable<RemoteImage>) => string | null): string;
//# sourceMappingURL=images.d.ts.map