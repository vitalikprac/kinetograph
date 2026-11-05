import type { AgentPreset } from './protocol.js';
interface Preset {
    id: string;
    name: string;
    /** The program the user must already have; the preset is offered only when it is on PATH. */
    needs: string;
    command: string;
}
export declare const PRESETS: Preset[];
/** Whether an executable called `name` is in a directory of `pathVar`. */
export declare function onPath(name: string, pathVar?: string | undefined): boolean;
/** The presets found on this machine, plus the `--agent` command when there is one. */
export declare function availableAgents(custom: string | undefined, pathVar?: string): AgentPreset[];
export {};
//# sourceMappingURL=agent-presets.d.ts.map