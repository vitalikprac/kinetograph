import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { type Command } from './commands/types.js';
import { type PluginTool } from './plugins.js';
import { type NoticeSession } from './update-notice.js';
export interface ChildResult {
    stdout: string;
    stderr: string;
    code: number | null;
}
/**
 * Runs the CLI with `argv`. A child process, so that the server never installs a project's determinism shim. The child
 * is quiet about updates: the server tells the agent itself (`createMcpServer`'s `notices`).
 */
export type Runner = (argv: string[]) => Promise<ChildResult>;
export declare const runCli: Runner;
/** The commands that are tools: all but `mcp` itself, `studio`, which serves until it is stopped, and `fetch-deps`, which downloads (a person runs it). */
export declare function toolCommands(): Command[];
/** `audio analyze` → `audio_analyze`. */
export declare function toolName(command: Command): string;
export declare function inputShape(command: Command): Record<string, z.ZodType>;
/** The CLI arguments for a tool call: positionals in order, then `--name value` for each option given. */
export declare function toArgv(command: Command, input: Record<string, unknown>): string[];
type Content = {
    type: 'text';
    text: string;
} | {
    type: 'image';
    data: string;
    mimeType: string;
};
export declare function callTool(command: Command, input: Record<string, unknown>, runner: Runner): Promise<{
    content: Content[];
    isError?: boolean;
}>;
/** A plugin's tool under its MCP name. */
export interface LoadedPluginTool {
    name: string;
    tool: PluginTool;
}
/** The tools of the plugins the project at `dir` depends on. A plugin whose tools fail to load is skipped; `onError` hears why. */
export declare function loadProjectTools(dir: string, onError?: (message: string) => void): Promise<LoadedPluginTool[]>;
/** A running studio the MCP server can reach. */
export interface StudioTarget {
    /** `http://127.0.0.1:3000`; any query (the token the studio opens with) is ignored. */
    url: string;
    token: string;
}
/**
 * `notices` are the update notices (update-notice.ts). A server's stderr is not shown to the model, so the first
 * command or plugin tool result of the process gets them as a short text part at the end.
 */
export declare function createMcpServer(runner?: Runner, plugins?: LoadedPluginTool[], studio?: StudioTarget, notices?: NoticeSession): McpServer;
/** Serves on stdio until the client closes it. */
export declare function startMcpServer(studioUrl?: string): Promise<void>;
export {};
//# sourceMappingURL=mcp.d.ts.map