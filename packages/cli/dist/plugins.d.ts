export interface PluginInfo {
    name: string;
    version: string;
    /** The SKILL.md, absolute; null when the plugin ships none. */
    skill: string | null;
    /** The panel module's source, absolute; null when the plugin has no panel. */
    panelFile: string | null;
    /** The tools module's source, absolute; null when the plugin has no tools. */
    toolsFile: string | null;
    /** Shown name: the manifest's `title`, else the package name without its scope, capitalised. */
    title: string;
    /** One line about what the plugin does; '' when the manifest has none. */
    description: string;
    /** The icon SVG, absolute; null when the plugin ships none. */
    iconFile: string | null;
    /** The React components the plugin exports that draw layers. */
    components: string[];
}
/** The plugins the project at `entry` (a file or a directory) depends on, by name. */
export declare function findPlugins(entry: string): PluginInfo[];
/** A plugin's panel module bundled for the browser (ESM, its imports included). Throws with esbuild's message. */
export declare function bundlePanel(file: string): Promise<string>;
/** A tool a plugin offers (contract §7). `input` is a zod 4 object schema. */
export interface PluginTool {
    name: string;
    description: string;
    input: unknown;
    run(input: unknown): unknown;
}
/** `@kinetographdev/hexed` → `hexed`; `my-fx` → `my_fx`. The prefix of a plugin's MCP tool names. */
export declare function pluginShortName(name: string): string;
/**
 * The tools of a plugin, loaded: its tools module bundled for node (ESM, its imports included) and imported. Throws with
 * a plain message when the module does not build, import or export valid tools.
 */
export declare function loadPluginTools(plugin: Pick<PluginInfo, 'name' | 'toolsFile'>): Promise<PluginTool[]>;
/** The MCP name of a plugin's tool. */
export declare function mcpToolName(plugin: Pick<PluginInfo, 'name'>, tool: Pick<PluginTool, 'name'>): string;
/** The MCP names of a plugin's tools; a plugin whose tools fail to load has none, and `onError` hears why. */
export declare function pluginToolNames(plugin: PluginInfo, onError?: (message: string) => void): Promise<string[]>;
//# sourceMappingURL=plugins.d.ts.map