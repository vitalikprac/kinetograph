/**
 * HyperFrames' bundled families: the Google Fonts family name and the weights it has. HyperFrames embeds 400, 700 (and 900
 * for some) and adds the other weights of the family from Google Fonts, so a page's `font-weight: 600` is the family's 600;
 * these are all the weights Google serves of each (normal style), asked for in one request that `fetch-deps` caches.
 */
export declare const BUNDLED: Record<string, {
    family: string;
    weights: string[];
}>;
/** Lower-cased family name to a key of `BUNDLED`: the families themselves, then the names HyperFrames maps to one. */
export declare const FONT_ALIASES: Record<string, string>;
/** The names in a `font-family` value (quotes and `!important` removed), in order. */
export declare function parseFamilyList(value: string): string[];
export interface FontUse {
    /** Every family name the page's CSS, inline styles and `data-font-family` attributes name. */
    families: Set<string>;
    /** The families the page declares itself (`@font-face`), which it supplies. */
    declared: Set<string>;
    /** `--custom: a, b` declarations, for `font-family: var(--custom)`. */
    custom: Map<string, string>;
    /** `font-family` values read and not yet settled (a `var()` may name a property declared later). */
    pending: string[];
}
export declare const emptyUse: () => FontUse;
/** Reads the font-family declarations of CSS text (`@font-face` rules count as declaring their family). */
export declare function noteCss(use: FontUse, css: string): void;
/** An inline `style` attribute or a `data-font-family` value. */
export declare function noteInline(use: FontUse, style: string): void;
export declare function noteFamilyValue(use: FontUse, value: string): void;
/** Settles the `var()` references and gathers the names. */
export declare function finishUse(use: FontUse): void;
export interface BundledUse {
    /** Google Fonts family name. */
    family: string;
    weights: string[];
    /** Names the page uses for it, other than its own. */
    as: string[];
}
/**
 * The bundled families the page's CSS asks for: a name in the table, not declared by the page and not loaded from
 * Google Fonts by a link (those load as the page says), with the other names that map to the same family.
 */
export declare function bundledUses(use: FontUse, linked: ReadonlySet<string>): BundledUse[];
//# sourceMappingURL=fonts.d.ts.map