import type { Command } from './types.js';
/** Every command, in the order of packages/cli/skills/kinetograph/references/AUTHORING.md §9. */
export declare const commands: Command[];
export declare function findCommand(argv: string[]): {
    command: Command;
    rest: string[];
} | undefined;
export type { Command } from './types.js';
//# sourceMappingURL=index.d.ts.map