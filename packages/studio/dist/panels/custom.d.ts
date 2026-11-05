import type { Block, CustomDraft } from './types.js';
export declare const CUSTOM_NAME: RegExp;
/** The limits on what an agent sends; a panel is a question for a person, not a document. */
export declare const LIMITS: {
    blocks: number;
    options: number;
    columns: number;
    rows: number;
    items: number;
    notes: number;
    title: number;
    label: number;
    help: number;
    text: number;
    cell: number;
    answerText: number;
};
/** Block types that take an answer; the rest only show something. */
export declare const INPUT_TYPES: readonly ["choice", "slider", "input", "list", "table", "notes", "compare"];
export declare const BLOCK_TYPES: readonly ["heading", "text", "still", "clip", "choice", "slider", "input", "list", "table", "notes", "compare"];
export type InputBlock = Extract<Block, {
    type: (typeof INPUT_TYPES)[number];
}>;
export declare const takesAnswer: (block: Block) => block is InputBlock;
type Problem = string | null;
/** The problem with the data a custom panel is opened with, or null. */
export declare function checkCustomDraft(d: Record<string, unknown>): Problem;
/** Whether a block has a value to send: a required block must, and the panel's button waits for it. */
export declare function isFilled(block: Block, value: unknown): boolean;
/** The problem with an answer to `draft`: only its input blocks, in the shapes they answer with, and every required one filled. */
export declare function checkCustomAnswer(draft: CustomDraft, a: Record<string, unknown>): Problem;
export {};
//# sourceMappingURL=custom.d.ts.map