import type { ToolDiff, ToolInput } from './protocol.js';
/** The fields of an agent's tool input worth showing, whatever the agent calls them. */
export declare function toolInput(raw: unknown): ToolInput | undefined;
/** A long output keeps its start and, longer, its end (where a command says how it went). */
export declare function cutOutput(output: string): string;
/** The text a tool printed: the text content of the call, else the raw output. */
export declare function toolOutput(content: unknown, rawOutput: unknown): string | undefined;
/** A line diff of two texts: counts, and the changed lines with `CONTEXT` lines around each change, each starting with ' ', '+' or '-'. */
export declare function lineDiff(oldText: string | null | undefined, newText: string): Omit<ToolDiff, 'path'>;
/** The diffs among a call's content, with paths relative to the project. */
export declare function toolDiffs(cwd: string, content: unknown): ToolDiff[] | undefined;
//# sourceMappingURL=tool-details.d.ts.map