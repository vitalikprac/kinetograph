import { type Command } from './types.js';
/** What the command needs of `@kinetographdev/studio` (its `startStudio`, packages/cli/skills/kinetograph/references/AUTHORING.md §11.5). */
export interface StudioModule {
    startStudio(options: {
        entry: string;
        port?: number;
        host?: string;
        open?: boolean;
        props?: Record<string, unknown>;
        agent?: string;
        allowRemoteAgent?: boolean;
        log?: (message: string) => void;
        publicDir?: string;
    }): Promise<{
        url: string;
        close(): Promise<void>;
    }>;
}
declare function loadStudio(): Promise<StudioModule>;
/** Resolves when the process is asked to stop (Ctrl-C, SIGTERM). */
declare function untilStopped(): Promise<void>;
declare const hooks: {
    load: typeof loadStudio;
    waitForStop: typeof untilStopped;
};
/** Tests put a stand-in studio, and a way to stop it, here. */
export declare function setStudioForTests(stub: Partial<typeof hooks> | undefined): void;
export declare const studio: Command;
export {};
//# sourceMappingURL=studio.d.ts.map