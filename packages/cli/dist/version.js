import { createRequire } from 'node:module';
/** The `kinetograph` package version. */
export function cliVersion() {
    return createRequire(import.meta.url)('../package.json').version;
}
//# sourceMappingURL=version.js.map