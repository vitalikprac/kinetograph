import { cliVersion } from './version.js';
export { createMcpServer, toolCommands, toolName } from './mcp.js';
export { bundleProject, cacheDir, resolveSpecifier, syntheticEntry, watchProject } from './bundle.js';
export type { BundleResult, ProjectBuild } from './bundle.js';
export { CliError, toErrorObject } from './errors.js';
export { native } from './native.js';
export type { InspectLayer, InspectResult, Native } from './native.js';
export { bundlePanel, findPlugins, loadPluginTools, mcpToolName, pluginToolNames } from './plugins.js';
export type { PluginInfo, PluginTool } from './plugins.js';
export { renderSource } from './render-job.js';
export type { RenderJobOptions } from './render-job.js';
export { checkFrame, frameRange, isSceneFile, listCompositions, openSource, parseProps, projectRootOf } from './source.js';
export type { FrameOutput, OpenOptions, Source } from './source.js';
export { cliVersion };
export interface Io {
    out(text: string): void;
    err(text: string): void;
}
/**
 * Runs the CLI with `argv` (without `node` and the script) and returns the exit code. Results go to `io.out` (text, or
 * one JSON object with `--json`); progress and plain errors to `io.err`.
 */
export declare function run(argv: string[], io?: Io): Promise<number>;
//# sourceMappingURL=index.d.ts.map