import { type ItemType, type RegistryIndex, type RegistryItem } from './item.js';
import { type InstallCommand, type PackageManager } from './packages.js';
import { type Registry } from './source.js';
export type InstallStatus = 'none' | 'installed' | 'declined' | 'not-run' | 'failed';
export interface AddOptions {
    names: string[];
    /** Where to look for the project (the nearest package.json at or above it). */
    dir: string;
    registry: Registry;
    overwrite: boolean;
    /** Install missing npm packages without asking. */
    yes: boolean;
    /** Asks a yes/no question; absent when there is nobody to ask (not a terminal, or `--json`). */
    confirm?: (question: string) => Promise<boolean>;
    /** Runs the install command; for tests. */
    runInstall?: (command: InstallCommand, cwd: string) => Promise<void>;
    progress?: (message: string) => void;
}
export interface AddedItem {
    name: string;
    type: ItemType;
    title: string;
    written: string[];
    skipped: string[];
}
export interface AddResult {
    project: string;
    added: AddedItem[];
    dependencies: {
        missing: Record<string, string>;
        manager: PackageManager;
        /** The command that installs `missing`; undefined when nothing is missing. */
        command?: string;
        status: InstallStatus;
        error?: string;
    };
    warnings: string[];
    next: string[];
}
/** The folder of the nearest package.json at or above `dir`. */
export declare function findProject(dir: string): string;
/** The requested items and their `registryDependencies`, each once, dependencies first. */
export declare function resolveItems(registry: Registry, names: string[]): Promise<RegistryItem[]>;
export declare function listItems(registry: Registry, type?: ItemType): Promise<RegistryIndex['items']>;
export declare function addItems(options: AddOptions): Promise<AddResult>;
/** The text a person sees for an `AddResult`. */
export declare function describeAdd(result: AddResult): string;
//# sourceMappingURL=install.d.ts.map