import { chmodSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { CliError } from './errors.js';
/** The platform packages that carry the addon and `bin/ffmpeg`, by `process.platform-process.arch`. */
const PLATFORM_PACKAGES = {
    'darwin-arm64': 'darwin-arm64',
    'linux-x64': 'linux-x64-gnu',
    'win32-x64': 'win32-x64-msvc',
};
/**
 * The GPL `ffmpeg` program the platform package ships (`bin/ffmpeg`, `bin/ffmpeg.exe`), if this install has one. The
 * addon runs it for the encoders its own LGPL ffmpeg lacks (libx264, libx265); it is never linked.
 */
export function bundledFfmpeg() {
    const name = PLATFORM_PACKAGES[`${process.platform}-${process.arch}`];
    if (!name)
        return undefined;
    try {
        const require = createRequire(import.meta.url);
        // The platform package is an optional dependency of the addon's package, so it is looked up from there.
        const nativeDir = path.dirname(require.resolve('@kinetographdev/native/package.json'));
        const pkg = createRequire(path.join(nativeDir, 'package.json')).resolve(`@kinetographdev/native-${name}/package.json`);
        const binary = path.join(path.dirname(pkg), 'bin', process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg');
        if (!existsSync(binary))
            return undefined;
        // A package unpacked by a tool that drops the executable bit would fail with EACCES at the first render.
        if (process.platform !== 'win32') {
            try {
                chmodSync(binary, 0o755);
            }
            catch {
                // Read-only install: it either has the bit already or the spawn reports it.
            }
        }
        return binary;
    }
    catch {
        return undefined;
    }
}
let loaded;
/**
 * The addon, loaded on first use so that commands that never render (`effects`, `doctor`, argument errors) work where
 * the addon's binary is missing. A CommonJS package, so it is loaded with `require`.
 */
export function native() {
    if (loaded)
        return loaded;
    try {
        loaded = createRequire(import.meta.url)('@kinetographdev/native');
        loaded.setFfmpegPath?.(bundledFfmpeg() ?? null);
    }
    catch (error) {
        throw new CliError('NATIVE_UNAVAILABLE', `cannot load @kinetographdev/native: ${error instanceof Error ? error.message : String(error)}`);
    }
    return loaded;
}
/** Tests put a stand-in addon here. */
export function setNativeForTests(stub) {
    loaded = stub;
}
//# sourceMappingURL=native.js.map