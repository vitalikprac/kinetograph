// The npm packages an item needs: which are missing from the project, and the command that installs them with the
// project's own package manager. The command runs only after the person agreed (install.ts).
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const LOCKFILES = [
    ['pnpm-lock.yaml', 'pnpm'],
    ['yarn.lock', 'yarn'],
    ['bun.lock', 'bun'],
    ['bun.lockb', 'bun'],
    ['package-lock.json', 'npm'],
];
/** From the lockfile, else the `packageManager` field of package.json, else npm. */
export function detectPackageManager(root) {
    for (const [file, manager] of LOCKFILES)
        if (existsSync(join(root, file)))
            return manager;
    const field = readManifest(root).packageManager?.split('@')[0];
    return field === 'pnpm' || field === 'yarn' || field === 'bun' ? field : 'npm';
}
export function readManifest(root) {
    try {
        const parsed = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
        return typeof parsed === 'object' && parsed !== null ? parsed : {};
    }
    catch {
        return {};
    }
}
/** The packages in `wanted` that the project's package.json lists in no dependency field, with the versions asked for. */
export function missingPackages(root, wanted) {
    const manifest = readManifest(root);
    const have = new Set();
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
        const section = manifest[field];
        if (typeof section === 'object' && section !== null)
            for (const name of Object.keys(section))
                have.add(name);
    }
    return Object.fromEntries(Object.entries(wanted).filter(([name]) => !have.has(name)));
}
export function installCommand(manager, packages) {
    return { command: manager, args: [manager === 'npm' ? 'install' : 'add', ...Object.entries(packages).map(([name, version]) => `${name}@${version}`)] };
}
/** The command as a person would type it. */
export const showCommand = ({ command, args }) => [command, ...args.map((a) => (/^[\w@./^~=*-]+$/.test(a) ? a : `'${a}'`))].join(' ');
// What an install argument may hold (package name, `@`, a version or range). Checked again here, so that nothing a
// registry wrote can reach a Windows shell with a metacharacter in it: no quotes, `%`, `!`, `&`, `(`, `)`, `;`, `$`.
const SHELL_SAFE = /^[\w@./^~=*<>|+ -]+$/;
/**
 * How to start `command` on `platform`. Elsewhere it is run directly with the argument array. On Windows `bun.exe` is
 * too; npm, pnpm and yarn are `.cmd` shims, which Node (20.12 and later) refuses to start without a shell, so those
 * run through one with every argument checked against SHELL_SAFE and double-quoted (nothing inside quotes means
 * anything to cmd.exe).
 */
export function spawnSpec({ command, args }, platform = process.platform) {
    if (platform !== 'win32')
        return { command, args, shell: false };
    if (command === 'bun')
        return { command: 'bun.exe', args, shell: false };
    for (const arg of args)
        if (!SHELL_SAFE.test(arg))
            throw new Error(`not installing: "${arg}" is not a plain package name or version`);
    return { command: `${command}.cmd`, args: args.map((a) => `"${a}"`), shell: true };
}
/** Runs the command in the project, its output going to stderr so that `--json` stays clean. Rejects when it fails. */
export function runInstall(install, cwd) {
    return new Promise((resolve, reject) => {
        let spec;
        try {
            spec = spawnSpec(install);
        }
        catch (error) {
            reject(error);
            return;
        }
        const child = spawn(spec.command, spec.args, { cwd, stdio: ['ignore', 2, 2], shell: spec.shell });
        child.on('error', reject);
        child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`${install.command} exited with code ${code}`))));
    });
}
//# sourceMappingURL=packages.js.map