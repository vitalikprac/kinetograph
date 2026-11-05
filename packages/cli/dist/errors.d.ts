/** A failure the CLI reports as `{ "error": { "code", "message" } }` and exit code 1. */
export declare class CliError extends Error {
    readonly code: string;
    constructor(code: string, message: string);
}
/** The error object of any thrown value. The addon's errors carry their own `code`. */
export declare function toErrorObject(error: unknown): {
    code: string;
    message: string;
};
//# sourceMappingURL=errors.d.ts.map