export interface OptionSpec {
    name: string;
    short?: string;
    type: 'string' | 'number' | 'boolean';
    description: string;
    /** A string option given any number of times (`--point 10,20 --point 30,40`): its value is the list. */
    multiple?: boolean;
}
export interface PositionalSpec {
    name: string;
    description: string;
    type?: 'string' | 'number';
    optional?: boolean;
    /** The last positional only: takes every remaining argument (`add a b c`). `ParsedArgs.lists` holds them all. */
    variadic?: boolean;
}
export interface ParsedArgs {
    positionals: Record<string, string | number | undefined>;
    /** Every value of a variadic positional, by name (the first is also in `positionals`). */
    lists: Record<string, string[]>;
    options: Record<string, string | number | boolean | string[] | undefined>;
    json: boolean;
}
/** Options every command that opens a project takes (packages/cli/skills/kinetograph/references/AUTHORING.md §9). */
export declare const PROJECT_OPTIONS: OptionSpec[];
export declare const JSON_OPTION: OptionSpec;
interface ParseSpec {
    name: string;
    positionals: PositionalSpec[];
    options: OptionSpec[];
}
/**
 * Parses the arguments after the command name. Unknown options and missing or extra positionals are `INVALID_ARG`
 * errors that say what the command takes.
 */
export declare function parseCommandArgs(spec: ParseSpec, argv: string[]): ParsedArgs;
export declare function usage(spec: ParseSpec): string;
/** A whole number option or positional, at least `min`. */
export declare function whole(what: string, value: number | undefined, min: number, fallback?: number): number;
/** `"0,30,60"` as frame numbers. */
export declare function parseFrameList(what: string, text: string): number[];
export {};
//# sourceMappingURL=args.d.ts.map