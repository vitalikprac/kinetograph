import { existsSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { bundleProject } from './bundle.js';
import { CliError } from './errors.js';
import { installDynamicImport, installRemotePictures } from './hyperframes/dynamic.js';
import { isHyperframesEntry, resolveEntry } from './hyperframes/entry.js';
import { LABEL_FONT_PATH } from './scenes.js';
import { modelNotes } from './model-notes.js';
import { prefetchBeforePlan, prefetchBundleAssets } from './prefetch.js';
import { native } from './native.js';
import { nowMs } from './time.js';
export function isSceneFile(entry) {
    return extname(entry).toLowerCase() === '.json';
}
/** `--props`: a JSON object, or the path of a file holding one (a value that does not start with `{` and names a file). */
export function parseProps(text) {
    if (text === undefined)
        return {};
    let value;
    let source = text;
    if (!text.trimStart().startsWith('{') && existsSync(text) && statSync(text).isFile()) {
        source = readFileSync(text, 'utf8');
    }
    // A file saved with a UTF-8 byte order mark (Windows PowerShell 5.1, some editors) would not parse, as in Remotion 4.0.540.
    source = source.replace(/^\uFEFF/, '');
    try {
        value = JSON.parse(source);
    }
    catch (error) {
        throw new CliError('INVALID_ARG', `--props is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        throw new CliError('INVALID_ARG', '--props must be a JSON object');
    }
    return value;
}
function requireEntry(entry) {
    // A directory is its index.html (a HyperFrames project).
    const absolute = resolveEntry(entry);
    if (!existsSync(absolute))
        throw new CliError('ENTRY_NOT_FOUND', `no such file: ${entry}`);
    return absolute;
}
/**
 * Where `staticFile` reads from: `public/` beside the entry, or else `public/` beside the nearest package.json (where
 * Remotion keeps it, with the entry in `src/`). Beside the entry when neither exists.
 */
export function publicDirOf(entry, override) {
    if (override !== undefined) {
        const absolute = resolve(override);
        if (!existsSync(absolute))
            throw new CliError('PUBLIC_DIR_NOT_FOUND', `no such directory: ${override}`);
        return absolute;
    }
    const beside = join(dirname(entry), 'public');
    if (existsSync(beside))
        return beside;
    for (let dir = dirname(entry);; dir = dirname(dir)) {
        if (existsSync(join(dir, 'package.json'))) {
            const atRoot = join(dir, 'public');
            return existsSync(atRoot) ? atRoot : beside;
        }
        if (dirname(dir) === dir)
            return beside;
    }
}
/**
 * The project's folder: the one holding the nearest package.json at or above the entry (a directory entry counts as
 * itself), else the entry's own folder. Generated files go under its `out/` (`still`, `strip`, `onion`, `render`).
 */
export function projectRootOf(entry) {
    const absolute = resolve(entry);
    const start = existsSync(absolute) && statSync(absolute).isDirectory() ? absolute : dirname(absolute);
    for (let dir = start;; dir = dirname(dir)) {
        if (existsSync(join(dir, 'package.json')))
            return dir;
        if (dirname(dir) === dir)
            return start;
    }
}
async function loadProject(entry, bundleFile, unsupported, prefetch = null, publicDirOverride) {
    // What the project loads from the web is downloaded before it is read, so frame 0 starts offline.
    if (prefetch !== null)
        await prefetchBeforePlan(entry, prefetch);
    const file = bundleFile ?? (await bundleProject(entry, unsupported ? { unsupported } : {})).file;
    // A Remotion project: the remote pictures and videos its bundle names, before the project runs.
    if (prefetch !== null)
        await prefetchBundleAssets(entry, file, prefetch);
    process.setSourceMapsEnabled(true);
    // A HyperFrames page's `import()` of a specifier built at run time is answered by the host.
    if (isHyperframesEntry(entry))
        installDynamicImport();
    // ... and so is a remote picture a script sets at run time, from the pre-download cache.
    if (isHyperframesEntry(entry))
        installRemotePictures();
    // Set before the import: a staticFile() call made while the project loads (a font, a module-level constant) runs
    // before setPublicDir below can.
    const publicDir = publicDirOf(entry, publicDirOverride);
    process.env.KINETOGRAPH_PUBLIC_DIR = publicDir;
    process.env.KINETOGRAPH_BASE_DIR = dirname(entry);
    let mod;
    try {
        mod = (await import(pathToFileURL(file).href));
    }
    catch (error) {
        throw new CliError('PROJECT_ERROR', `${entry} failed while loading: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`);
    }
    mod.setPublicDir(publicDir);
    mod.setLayoutText(native().layoutText);
    // Text with no font of the project's is set in the font Kinetograph ships (and reported), not left out.
    mod.setFallbackFont(LABEL_FONT_PATH);
    // The DOM engine: islands are styled, laid out and painted by the addon, relative paths resolve from the entry.
    mod.setDomAddon(native());
    mod.setDomEnvironment({ baseDir: dirname(entry), publicDir });
    // A relative `src` is read from where the scenes' assets are (the entry's directory), not the working directory.
    mod.setMediaProbe((path, baseDir) => native().probeMedia(path, baseDir ?? dirname(entry)));
    mod.setAudioDecoder((path, sampleRate) => native().decodeAudio(path, sampleRate, dirname(entry)));
    // `@remotion/media-parser` and `@remotion/webcodecs` read files through the addon, relative paths from the entry too.
    mod.setMediaParserAddon({
        probeStreams: (path, baseDir) => native().probeStreams(path, baseDir ?? dirname(entry)),
        scanStreams: (path, baseDir) => native().scanStreams(path, baseDir ?? dirname(entry)),
        decodeAudio: (path, sampleRate, baseDir) => native().decodeAudio(path, sampleRate, baseDir ?? dirname(entry)),
    });
    return { mod, file };
}
/** The compositions a project (or a scene file, which is one) offers. */
export async function listCompositions(entry, options = {}) {
    const absolute = requireEntry(entry);
    if (isSceneFile(absolute))
        return [sceneComposition(absolute, readFileSync(absolute, 'utf8'))];
    return (await loadProject(absolute, options.bundleFile, undefined, options, options.publicDir)).mod.getCompositions();
}
function sceneComposition(file, text) {
    const info = native().validateScene(text, dirname(file));
    return {
        id: basename(file, extname(file)),
        width: info.width,
        height: info.height,
        fps: info.fps,
        durationInFrames: info.durationInFrames,
        defaultProps: {},
    };
}
/** The keys of a scene file the format does not read, as unsupported content named by its JSON path. */
export function sceneUnknownKeys(text) {
    return native()
        .sceneUnknownKeys(text)
        .map((key) => ({ path: key, element: 'scene', property: key, value: null, reason: 'not a key of the scene format, so it is ignored (a misspelt name?)' }));
}
export async function openSource(entry, options = {}) {
    const absolute = requireEntry(entry);
    const baseDir = dirname(absolute);
    const notes = modelNotes(baseDir);
    if (isSceneFile(absolute)) {
        const text = readFileSync(absolute, 'utf8');
        const composition = sceneComposition(absolute, text);
        // A key the format does not read is ignored; it is said on every frame, so `--strict` fails on it.
        const unknown = sceneUnknownKeys(text);
        return {
            kind: 'scene',
            entry: absolute,
            baseDir,
            composition,
            frame: async () => ({ sceneJson: text, audio: [], sequences: [], unsupported: [...notes(text), ...unknown], jsMs: 0, stringifyMs: 0 }),
            dispose: () => { },
        };
    }
    const inputProps = parseProps(options.props);
    const { mod, file: bundleFile } = await loadProject(absolute, options.bundleFile, options.unsupportedImports, options.prefetch === false ? null : options, options.publicDir);
    const compositions = mod.getCompositions();
    if (compositions.length === 0) {
        throw new CliError('NO_COMPOSITIONS', `${entry} registered no compositions: call registerRoot() with a root that renders <Composition>`);
    }
    const composition = options.comp ? compositions.find((c) => c.id === options.comp) : compositions[0];
    if (!composition) {
        throw new CliError('COMPOSITION_NOT_FOUND', `no composition "${options.comp}" in ${entry}; it has: ${compositions.map((c) => c.id).join(', ')}`);
    }
    const renderer = mod.createFrameRenderer(composition.id, { inputProps });
    // calculateMetadata and lazy components resolve asynchronously.
    const config = await renderer.ready();
    return {
        kind: 'project',
        entry: absolute,
        baseDir,
        composition: {
            ...composition,
            width: config.width,
            height: config.height,
            fps: config.fps,
            durationInFrames: config.durationInFrames,
        },
        frame: async (frame) => {
            const started = nowMs();
            const result = await renderer.renderFrame(frame);
            const rendered = nowMs();
            const sceneJson = JSON.stringify(result.scene);
            const unsupported = [...result.unsupported, ...notes(sceneJson)];
            return { sceneJson, audio: result.audio, sequences: result.sequences, ...(result.names !== undefined ? { names: result.names } : {}), unsupported, jsMs: rendered - started, stringifyMs: nowMs() - rendered };
        },
        worker: { entry: absolute, comp: composition.id, props: options.props, bundleFile, ...(options.publicDir !== undefined ? { publicDir: options.publicDir } : {}) },
        notes: () => mod.stylesheetNotes(),
        artifacts: () => mod.getArtifacts(),
        clearArtifacts: () => mod.clearArtifacts(),
        dispose: () => renderer.dispose(),
    };
}
/** A frame number checked against the composition. */
export function checkFrame(frame, durationInFrames) {
    if (!Number.isInteger(frame) || frame < 0) {
        throw new CliError('FRAME_OUT_OF_RANGE', `frame ${frame} is out of range: frames are whole numbers from 0`);
    }
    if (frame >= durationInFrames) {
        throw new CliError('FRAME_OUT_OF_RANGE', `frame ${frame} is out of range: the composition has ${durationInFrames} frames (0..${durationInFrames - 1})`);
    }
    return frame;
}
/** `--range a..b` as inclusive first and last frame; the whole composition if left out. */
export function frameRange(range, durationInFrames) {
    if (range === undefined)
        return [0, durationInFrames - 1];
    const [first, last] = native().parseRange(range, durationInFrames);
    return [first, last];
}
/** `count` frames spread evenly over `first..=last`, ends included, without repeats. */
export function evenFrames(first, last, count) {
    const available = last - first + 1;
    const n = Math.min(count, available);
    if (n <= 1)
        return [first];
    const frames = [];
    for (let i = 0; i < n; i++)
        frames.push(first + Math.round((i * (last - first)) / (n - 1)));
    return [...new Set(frames)];
}
//# sourceMappingURL=source.js.map