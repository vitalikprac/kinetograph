import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { PROJECT_OPTIONS } from '../args.js';
import { PREFERRED_EFFECT_BACKEND_OPTION, parsePreferredEffectBackend, setPreferredEffectBackend } from '../effects.js';
import { native } from '../native.js';
import { setOffline } from '../prefetch.js';
import { openSource, projectRootOf } from '../source.js';
export const ENTRY = {
    name: 'entry',
    description: 'A project file (.tsx, .ts, .jsx, .js), a .json scene, or a HyperFrames project (its index.html, or the directory holding it)',
};
export const OUTPUT_OPTION = { name: 'output', short: 'o', type: 'string', description: 'Output file path (default: out/stills, out/sheets or out/renders under the project folder)' };
/** `--strict`, on the commands that draw frames (kinetograph site, /docs/compat/). */
export const STRICT_OPTION = {
    name: 'strict',
    type: 'boolean',
    description: 'Fail on a frame holding content the engine cannot draw (Remotion compat), instead of drawing it without and warning',
};
export { PREFERRED_EFFECT_BACKEND_OPTION };
/** `--dev-react`, on the commands that run a project to render it (packages/cli/skills/kinetograph/references/AUTHORING.md §9). */
export const DEV_REACT_OPTION = {
    name: 'dev-react',
    type: 'boolean',
    description: "Run React's development build (warnings, slower: about 5x on a heavy film) instead of the production one",
};
/**
 * Selects the React build the project's bundle loads: React reads `process.env.NODE_ENV` when it is first imported,
 * which is when the bundle is, so this is set before the project is opened. Returns a function that puts the old value
 * back (the render worker threads copy the environment when they start, so they see this one).
 */
export function setReactMode(dev) {
    const before = process.env.NODE_ENV;
    process.env.NODE_ENV = dev ? 'development' : 'production';
    return () => {
        if (before === undefined)
            delete process.env.NODE_ENV;
        else
            process.env.NODE_ENV = before;
    };
}
export function allOptions(command) {
    return command.project ? [...command.options, ...PROJECT_OPTIONS] : command.options;
}
export function openFromArgs(args, extra = {}) {
    const offline = args.options.offline === true;
    setOffline(offline);
    // Before the project loads: a project that sets `window.remotion_preferredEffectBackend` itself has the last word.
    setPreferredEffectBackend(parsePreferredEffectBackend(args.options['preferred-effect-backend']));
    return openSource(String(args.positionals.entry), {
        offline,
        // The pre-download step speaks on stderr, unless the command prints JSON.
        ...(args.options.json === true ? {} : { progress: (message) => process.stderr.write(`${message}\n`) }),
        comp: args.options.comp,
        props: args.options.props,
        ...(args.options['public-dir'] === undefined ? {} : { publicDir: args.options['public-dir'] }),
        ...extra,
    });
}
/** The composition id as a file name part. */
function fileStem(id) {
    return id.replace(/[^A-Za-z0-9._-]+/g, '_') || 'video';
}
/**
 * `-o` when given; else `out/<folder>/<file>` under the project folder (the nearest package.json at or above the entry,
 * else the entry's folder), where `file` is built from the composition id by `name`.
 */
export function outputPath(args, folder, compId, name) {
    const output = args.options.output;
    if (typeof output === 'string' && output !== '')
        return output;
    return join(projectRootOf(String(args.positionals.entry)), 'out', folder, name(fileStem(compId)));
}
export function ensureParentDir(file) {
    mkdirSync(dirname(file), { recursive: true });
}
export function newRenderer() {
    return new (native().Renderer)();
}
//# sourceMappingURL=types.js.map