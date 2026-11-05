import { parseArgs } from 'node:util';
import { CliError } from './errors.js';
/** Options every command that opens a project takes (packages/cli/skills/kinetograph/references/AUTHORING.md §9). */
export const PROJECT_OPTIONS = [
    { name: 'comp', type: 'string', description: 'Composition id (default: the first composition)' },
    { name: 'props', type: 'string', description: 'Input props: a JSON object, or the path of a JSON file' },
    { name: 'offline', type: 'boolean', description: 'Never download: remote scripts, modules, pictures and media must already be cached (a missing one is an error, as before the pre-download step)' },
    { name: 'public-dir', type: 'string', description: 'Directory staticFile() reads from (default: public/ beside the entry, else beside the nearest package.json)' },
];
export const JSON_OPTION = {
    name: 'json',
    type: 'boolean',
    description: 'Print one JSON object; errors are { "error": { "code", "message" } } with exit code 1',
};
/**
 * Parses the arguments after the command name. Unknown options and missing or extra positionals are `INVALID_ARG`
 * errors that say what the command takes.
 */
export function parseCommandArgs(spec, argv) {
    // `-1` would be read as an option. Negative numbers go after `--`, where they are positionals, so the command can
    // refuse them with a message about frames instead of the parser's about unknown options.
    const options = [...spec.options, JSON_OPTION];
    const flags = [];
    const negatives = [];
    for (const arg of withBooleanValues(argv, new Set(options.filter((o) => o.type === 'boolean').map((o) => `--${o.name}`)))) {
        (/^-\d/.test(arg) ? negatives : flags).push(arg);
    }
    let values;
    let positionals;
    try {
        const parsed = parseArgs({
            args: negatives.length ? [...flags, '--', ...negatives] : flags,
            allowPositionals: true,
            strict: true,
            options: Object.fromEntries(options.map((o) => [
                o.name,
                {
                    type: o.type === 'boolean' ? 'boolean' : 'string',
                    ...(o.short ? { short: o.short } : {}),
                    ...(o.multiple ? { multiple: true } : {}),
                },
            ])),
        });
        values = parsed.values;
        positionals = parsed.positionals;
    }
    catch (error) {
        throw new CliError('INVALID_ARG', `${error instanceof Error ? error.message : String(error)}\n${usage(spec)}`);
    }
    const required = spec.positionals.filter((p) => !p.optional);
    if (positionals.length < required.length) {
        throw new CliError('INVALID_ARG', `missing <${required[positionals.length].name}>\n${usage(spec)}`);
    }
    const variadic = spec.positionals.at(-1)?.variadic === true;
    if (!variadic && positionals.length > spec.positionals.length) {
        throw new CliError('INVALID_ARG', `unexpected argument "${positionals[spec.positionals.length]}"\n${usage(spec)}`);
    }
    const out = { positionals: {}, lists: {}, options: {}, json: values.json === true };
    spec.positionals.forEach((p, i) => {
        const raw = positionals[i];
        out.positionals[p.name] = raw === undefined ? undefined : p.type === 'number' ? toNumber(p.name, raw) : raw;
        if (p.variadic)
            out.lists[p.name] = positionals.slice(i);
    });
    for (const o of spec.options) {
        const raw = values[o.name];
        if (raw === undefined)
            continue;
        out.options[o.name] = o.type === 'number' && !o.multiple ? toNumber(`--${o.name}`, raw) : raw;
    }
    return out;
}
/**
 * A boolean option may be followed by `true` or `false` (`--offline false`, or `--offline=false`), as in Remotion 4.0.540.
 * `true` is the flag alone; `false` leaves it out, as every boolean option is off unless given.
 */
function withBooleanValues(argv, booleans) {
    const out = [];
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const [name, value] = arg.includes('=') ? [arg.slice(0, arg.indexOf('=')), arg.slice(arg.indexOf('=') + 1)] : [arg, argv[i + 1]];
        if (!booleans.has(name) || (value !== 'true' && value !== 'false')) {
            out.push(arg);
            continue;
        }
        if (!arg.includes('='))
            i++;
        if (value === 'true')
            out.push(name);
    }
    return out;
}
function toNumber(what, raw) {
    const n = Number(raw);
    if (raw.trim() === '' || !Number.isFinite(n))
        throw new CliError('INVALID_ARG', `${what} must be a number, got "${raw}"`);
    return n;
}
export function usage(spec) {
    const positionals = spec.positionals.map((p) => (p.optional ? `[${p.name}${p.variadic ? '...' : ''}]` : `<${p.name}${p.variadic ? '...' : ''}>`)).join(' ');
    const lines = [`usage: kinetograph ${spec.name}${positionals ? ' ' + positionals : ''} [options]`];
    for (const o of [...spec.options, JSON_OPTION]) {
        const flag = `${o.short ? `-${o.short}, ` : '    '}--${o.name}${o.type === 'boolean' ? '' : ` <${o.type}>`}${o.multiple ? ' ...' : ''}`;
        lines.push(`  ${flag.padEnd(26)} ${o.description}`);
    }
    return lines.join('\n');
}
/** A whole number option or positional, at least `min`. */
export function whole(what, value, min, fallback) {
    const v = value ?? fallback;
    if (v === undefined)
        throw new CliError('INVALID_ARG', `${what} is required`);
    if (!Number.isInteger(v) || v < min)
        throw new CliError('INVALID_ARG', `${what} must be a whole number of at least ${min}, got ${v}`);
    return v;
}
/** `"0,30,60"` as frame numbers. */
export function parseFrameList(what, text) {
    const frames = text.split(',').map((s) => s.trim());
    return frames.map((s) => {
        const n = Number(s);
        if (s === '' || !Number.isInteger(n) || n < 0) {
            throw new CliError('INVALID_ARG', `${what} must be comma-separated whole frame numbers, got "${text}"`);
        }
        return n;
    });
}
//# sourceMappingURL=args.js.map