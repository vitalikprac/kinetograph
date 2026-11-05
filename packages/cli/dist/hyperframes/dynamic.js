// `import()` of a specifier built at run time (`import(`./locale/${lang}.js`)`): esbuild cannot find it, so `modules.ts`
// hands each such call to the host with the importing module's URL. Here the host resolves it through the page's import
// map, builds the module from the cache (the whole graph under it, bundled by esbuild), and answers with its namespace.
//
//   - The pre-download step runs the page's first frames in discovery mode: the specifiers the page asks for are downloaded
//     and locked, so a render finds them in the cache.
//   - A specifier first seen during a render is downloaded once, locked and noted, as a remote picture is.
//   - With `--offline` nothing is downloaded: an uncached module is an error naming the specifier.
import { Script } from 'node:vm';
import { noteStylesheetProblem } from '@kinetographdev/compat/dom';
import { trackPending } from '@kinetographdev/compat/shim';
import { lockPathOf } from '@kinetographdev/core/lock';
import { existsSync } from 'node:fs';
import { activeLockFile, dataCachePath, MAX_DATA_BYTES, resolveCdnData, useLockFile } from './deps.js';
import { notCachedPicture, REMOTE_PICTURE } from './images.js';
import { bundleDynamicImport, DYNAMIC_IMPORT } from './modules.js';
/** What the project's bundle leaves for the host: the page's import map and where the project is. */
export const DYNAMIC_CONFIG = Symbol.for('kinetograph.hf.dynamic');
/** Set while the pre-download step runs the page: downloads are allowed, and what happens is kept in `discovered`. */
let discovery = null;
export const discovered = {
    fetched: [],
    failed: [],
    pictures: new Set(),
};
export function setDiscovery(options) {
    discovery = options;
    if (options !== null) {
        discovered.fetched = [];
        discovered.failed = [];
        discovered.pictures = new Set();
    }
}
let slots = 0;
const loaded = new Map();
async function load(referrer, specifier) {
    const config = globalThis[DYNAMIC_CONFIG];
    if (config === undefined)
        throw new Error(`import(${JSON.stringify(specifier)}) from ${referrer}: the project's import map is not loaded`);
    // A render worker never built the plan: the lock the downloads are checked against and recorded in is the project's.
    if (activeLockFile() === null)
        useLockFile(lockPathOf(config.entry));
    const offline = process.env.KINETOGRAPH_OFFLINE === '1';
    const fetch = discovery ?? (offline ? null : { maxBytes: MAX_DATA_BYTES });
    const name = `import(${JSON.stringify(specifier)}) from ${referrer}`;
    const slot = Symbol.for(`kinetograph.import.slot.${slots++}`);
    let built;
    try {
        built = await bundleDynamicImport(specifier, slot, referrer, config.root, config.importMap, fetch);
    }
    catch (error) {
        const e = error;
        const hint = fetch === null && (e.missing?.length ?? 0) > 0
            ? `\n--offline is set, so ${e.missing.join(', ')} is not downloaded: run without --offline once, or \`kinetograph fetch-deps\``
            : '';
        const code = e.code ?? (/kinetograph\.lock\.json/.test(e.message) ? 'LOCK_MISMATCH' : undefined);
        discovered.failed.push({ specifier, referrer, error: e.message, ...(code ? { code } : {}) });
        throw new Error(`${name} failed: ${e.message}${hint}`);
    }
    discovered.fetched.push(...built.fetched);
    if (discovery === null && built.fetched.some((f) => f.status === 'fetched')) {
        noteStylesheetProblem(`${name} was first requested during the render (the pre-download pass did not reach it): downloaded now and added to the lock`);
    }
    try {
        await new Script(built.code, { filename: name }).runInThisContext();
        return globalThis[slot];
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        discovered.failed.push({ specifier, referrer, error: message });
        throw error;
    }
    finally {
        delete globalThis[slot];
    }
}
/** Makes `import()` of a computed specifier in the page's module scripts answer from here. */
export function installDynamicImport() {
    globalThis[DYNAMIC_IMPORT] = (referrer, specifier) => {
        const text = String(specifier);
        const key = `${referrer}\n${text}`;
        let promise = loaded.get(key);
        if (promise === undefined) {
            promise = load(referrer, text);
            loaded.set(key, promise);
            // The page sees the rejection; the next frame must not report it as unhandled here too.
            promise.catch(() => { });
        }
        return trackPending(promise);
    };
}
/**
 * Where a remote picture a page's script set at run time (`img.src = url`, `el.style.backgroundImage`) is read from: the
 * pre-download cache, as a picture in the markup is (`plan.ts`, `localImage`). The page's runtime asks through
 * `REMOTE_PICTURE` (`@kinetographdev/core/hyperframes`); a render never downloads. While the pre-download step runs the
 * page, a picture that is not cached is kept, to be downloaded after the run.
 */
export function installRemotePictures() {
    globalThis[REMOTE_PICTURE] = (url) => {
        if (/^https:/i.test(url)) {
            const found = resolveCdnData(url);
            if ('file' in found)
                return found;
            // A cached file that does not match the lock is not drawn, and the reason is said.
            if (existsSync(dataCachePath(url)))
                return found;
        }
        if (discovery === null)
            return { error: notCachedPicture(url) };
        discovered.pictures.add(url);
        return { error: notCachedPicture(url), discovering: true };
    };
}
/** Forgets the modules already answered (tests; a studio rebuild). */
export function resetDynamicImports() {
    loaded.clear();
}
//# sourceMappingURL=dynamic.js.map