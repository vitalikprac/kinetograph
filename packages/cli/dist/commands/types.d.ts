import type { Renderer } from '@kinetographdev/native';
import type { OptionSpec, ParsedArgs, PositionalSpec } from '../args.js';
import { PREFERRED_EFFECT_BACKEND_OPTION } from '../effects.js';
import { type OpenOptions, type Source } from '../source.js';
export interface Context {
    /** Progress for people (stderr). Silent for `--json`. */
    progress(message: string): void;
    /** For commands that serve until stopped: prints `data` (with `--json`) or `text` now, not when the command returns. */
    announce(data: object, text: string): void;
}
export interface CommandResult {
    /** What `--json` prints. */
    data: object;
    /** What people see. */
    text: string;
    /** 1 for a result that is a failed check (`lint` errors, `snapshot` mismatches). Default 0. */
    exitCode?: number;
}
export interface Command {
    /** `still`, `audio analyze`, … */
    name: string;
    summary: string;
    positionals: PositionalSpec[];
    /** The command's own options; `--json` and, if `project`, `--comp` and `--props` are added. */
    options: OptionSpec[];
    /** Takes a project or scene as its first positional, `entry`. */
    project: boolean;
    run(args: ParsedArgs, context: Context): Promise<CommandResult>;
}
export declare const ENTRY: PositionalSpec;
export declare const OUTPUT_OPTION: OptionSpec;
/** `--strict`, on the commands that draw frames (kinetograph site, /docs/compat/). */
export declare const STRICT_OPTION: OptionSpec;
export { PREFERRED_EFFECT_BACKEND_OPTION };
/** `--dev-react`, on the commands that run a project to render it (packages/cli/skills/kinetograph/references/AUTHORING.md §9). */
export declare const DEV_REACT_OPTION: OptionSpec;
/**
 * Selects the React build the project's bundle loads: React reads `process.env.NODE_ENV` when it is first imported,
 * which is when the bundle is, so this is set before the project is opened. Returns a function that puts the old value
 * back (the render worker threads copy the environment when they start, so they see this one).
 */
export declare function setReactMode(dev: boolean): () => void;
export declare function allOptions(command: Command): OptionSpec[];
export declare function openFromArgs(args: ParsedArgs, extra?: Pick<OpenOptions, 'unsupportedImports'>): Promise<Source>;
/**
 * `-o` when given; else `out/<folder>/<file>` under the project folder (the nearest package.json at or above the entry,
 * else the entry's folder), where `file` is built from the composition id by `name`.
 */
export declare function outputPath(args: ParsedArgs, folder: 'stills' | 'sheets' | 'renders', compId: string, name: (stem: string) => string): string;
export declare function ensureParentDir(file: string): void;
export declare function newRenderer(): Renderer;
//# sourceMappingURL=types.d.ts.map