import type { AgentEvent } from './protocol.js';
export interface AgentBridgeOptions {
    /** The project directory: the agent's working directory and the only place it may read or write. */
    cwd: string;
    /** The commands `select` accepts (the presets and `--agent`); anything else is refused. */
    allowed: string[];
    /** The command to use at first, or null. */
    command: string | null;
    /** Receives every event for the UI. */
    emit(event: AgentEvent): void;
    /** Whether a UI is connected to answer permission requests. */
    hasViewer(): boolean;
    version: string;
    /** The MCP servers every new session gets (ACP `session/new`); asked for when the session starts. Default none. */
    mcpServers?(): McpServerConfig[];
    /** Called when a prompt has run its course and the agent is ready for the next (not when it failed to start). */
    idle?(): void;
}
/** A stdio MCP server as ACP names it. */
export interface McpServerConfig {
    name: string;
    command: string;
    args: string[];
    env: {
        name: string;
        value: string;
    }[];
}
/** A picture for the agent: base64 data and its type. */
export interface PromptImage {
    data: string;
    mimeType: string;
}
/** What a failure means to someone who does not read stack traces. */
export declare function explain(error: unknown, stderr: string, command: string | null): string;
export declare class AgentBridge {
    private readonly options;
    private command;
    private live;
    private liveNow;
    private status;
    private image;
    private readonly permissions;
    private nextPermission;
    private closed;
    /** A prompt is being sent or has not run its course: the window between asking and the status turning busy. */
    private prompting;
    /** When each tool call of the turn was first seen, to say how long it took. */
    private readonly toolStarts;
    constructor(options: AgentBridgeOptions);
    get currentCommand(): string | null;
    /** Whether the agent is running and between turns: a prompt sent now starts at once. */
    get ready(): boolean;
    /** Whether a prompt is starting, running or being sent: anything sent now has to wait for `idle`. */
    get working(): boolean;
    /** Tells the UI where things stand (also used for a socket that has just connected). */
    announce(): void;
    private setStatus;
    /** Chooses the agent and drops the conversation. Only the offered commands are accepted. */
    select(command: string | null): Promise<void>;
    /** Stops the agent; the next prompt starts a fresh conversation. */
    reset(): Promise<void>;
    private kill;
    close(): Promise<void>;
    private cancelPermissions;
    answerPermission(id: string, optionId: string | null): void;
    private askPermission;
    private onUpdate;
    private start;
    private crashed;
    /** Sends the user's words and the context about the selection (and pictures, if the agent takes images). */
    prompt(text: string, context: string, images?: PromptImage | PromptImage[]): Promise<void>;
    /** Asks the agent to stop what it is doing. */
    cancel(): Promise<void>;
}
//# sourceMappingURL=agent-bridge.d.ts.map