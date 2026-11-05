/** A failure the CLI reports as `{ "error": { "code", "message" } }` and exit code 1. */
export class CliError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.code = code;
        this.name = 'CliError';
    }
}
/** The error object of any thrown value. The addon's errors carry their own `code`. */
export function toErrorObject(error) {
    if (error instanceof CliError)
        return { code: error.code, message: error.message };
    if (error instanceof Error) {
        const code = error.code;
        return { code: typeof code === 'string' && /^[A-Z_]+$/.test(code) ? code : 'INTERNAL', message: error.message };
    }
    return { code: 'INTERNAL', message: String(error) };
}
//# sourceMappingURL=errors.js.map