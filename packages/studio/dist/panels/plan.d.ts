import type { PanelStore } from './store.js';
import type { CustomAnswer, CustomDraft } from './types.js';
/** The name of a plan file (without ".json"): a panel kind that keeps a file, or custom-<slug>. Never text from a request as it is. */
export declare const isPlanFile: (name: string) => boolean;
/** Writes `answer` as pretty JSON: to a new file in the plan directory, then renamed over plan/<kind>.json. */
export declare function writePlan(projectDir: string, kind: string, answer: unknown): void;
/** plan/<kind>.json parsed, or null when there is none or it does not read; throws when it is a link or leaves the project. */
export declare function readPlan(projectDir: string, kind: string): unknown;
/**
 * What plan/custom-<name>.json holds: the draft the person saw (its blocks) and their answer. A custom answer is values
 * by block id and says nothing of the blocks, so the draft is kept with it, for the agent and to show the panel again.
 */
export interface CustomPlan {
    draft: CustomDraft;
    answer: CustomAnswer;
}
/**
 * Rebuilds the stepper after a restart: each plan/<kind>.json that holds an approving answer comes back as a submitted
 * panel, so its stage is approved and can be looked at. A file that does not read, does not check or does not approve is
 * left out, and so is one the safe reader refuses (a link, or a plan directory that leaves the project).
 */
export declare function restorePanels(store: PanelStore, projectDir: string): void;
//# sourceMappingURL=plan.d.ts.map