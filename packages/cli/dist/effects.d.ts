import type { OptionSpec } from './args.js';
/** `--preferred-effect-backend`, as Remotion's CLI names it. */
export declare const PREFERRED_EFFECT_BACKEND_OPTION: OptionSpec;
/** The flag's value, refused with `INVALID_ARG` when it is not a backend. */
export declare function parsePreferredEffectBackend(value: unknown): string | undefined;
/**
 * Sets what Remotion's CLI sets in the page: `window.remotion_preferredEffectBackend` (the window is the global object
 * here). Without the flag it is cleared, so a command that follows one with the flag (an MCP server) does not inherit it.
 */
export declare function setPreferredEffectBackend(value: string | undefined): void;
export interface EffectsReport {
    /** The version of the project's `@remotion/effects`. */
    installed: string;
    /** The version the parity harness was last run against (scripts/remotion-effects). */
    tested: string;
    /** Effects the project imports whose status is not "supported". */
    gaps: {
        name: string;
        status: string;
    }[];
    /** Lines for people. */
    lines: string[];
}
type Parity = {
    version: string;
    effects: Record<string, {
        sub: string;
        status: string;
    }>;
};
/** The harness's last run (`packages/cli/assets/remotion-effects.json`, written by scripts/remotion-effects/table.mjs). */
export declare function parityStatus(): Parity;
/**
 * What `doctor` says about `@remotion/effects`, or null when the project does not use it. `bundle` is the project's
 * bundle: esbuild names each file it includes in a comment, which is how the effects it imports are known.
 */
export declare function effectsReport(entryDir: string, bundle: string, parity?: Parity): EffectsReport | null;
export {};
//# sourceMappingURL=effects.d.ts.map