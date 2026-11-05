export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';
/** From the lockfile, else the `packageManager` field of package.json, else npm. */
export declare function detectPackageManager(root: string): PackageManager;
export declare function readManifest(root: string): Record<string, unknown>;
/** The packages in `wanted` that the project's package.json lists in no dependency field, with the versions asked for. */
export declare function missingPackages(root: string, wanted: Record<string, string>): Record<string, string>;
export interface InstallCommand {
    command: string;
    args: string[];
}
export declare function installCommand(manager: PackageManager, packages: Record<string, string>): InstallCommand;
/** The command as a person would type it. */
export declare const showCommand: ({ command, args }: InstallCommand) => string;
export interface SpawnSpec {
    command: string;
    args: string[];
    shell: boolean;
}
/**
 * How to start `command` on `platform`. Elsewhere it is run directly with the argument array. On Windows `bun.exe` is
 * too; npm, pnpm and yarn are `.cmd` shims, which Node (20.12 and later) refuses to start without a shell, so those
 * run through one with every argument checked against SHELL_SAFE and double-quoted (nothing inside quotes means
 * anything to cmd.exe).
 */
export declare function spawnSpec({ command, args }: InstallCommand, platform?: NodeJS.Platform): SpawnSpec;
/** Runs the command in the project, its output going to stderr so that `--json` stays clean. Rejects when it fails. */
export declare function runInstall(install: InstallCommand, cwd: string): Promise<void>;
//# sourceMappingURL=packages.d.ts.map