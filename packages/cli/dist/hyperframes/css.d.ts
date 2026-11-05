/** `[data-composition-id="id"]`. */
export declare const compositionSelector: (id: string) => string;
/**
 * The rules of a mounted composition scoped to it. A selector that already names the composition's root stays; `html`,
 * `body` and `:root` alone are the composition's own box; any other gets the composition's selector in front. Rules
 * written for the root's id (`#root { … }`) apply to the host, which takes the root's place.
 */
export declare function scopeToComposition(css: string, compositionId: string, rootId?: string | null): string;
export interface GoogleFontRequest {
    family: string;
    variants: string[];
}
/**
 * The families a Google Fonts CSS URL asks for, with their weights (`400`) and italic weights (`400i`):
 * `css2?family=Name:ital,wght@0,400;1,700&family=Other:wght@300..500`, or the older `css?family=Name:400,700italic`.
 */
export declare function parseGoogleFontsUrl(url: string): GoogleFontRequest[];
/** `@import url(https://fonts.googleapis.com/…)` rules removed from the CSS, with the fonts they asked for. */
export declare function extractGoogleFontImports(css: string): {
    css: string;
    fonts: GoogleFontRequest[];
};
//# sourceMappingURL=css.d.ts.map