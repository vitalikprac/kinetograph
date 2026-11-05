import type { PanelKind } from './types.js';
export declare const PANEL_KINDS: readonly PanelKind[];
/** The problem with the data a panel is opened with, or null. */
export declare function checkDraft(kind: PanelKind, data: unknown): string | null;
/** The problem with the answer submitted for a panel, or null. */
export declare function checkAnswer(kind: PanelKind, answer: unknown, draft?: unknown): string | null;
/** The problem with a placement, or null when it is one of the four or left out. */
export declare function checkPlacement(placement: unknown): string | null;
//# sourceMappingURL=validate.d.ts.map