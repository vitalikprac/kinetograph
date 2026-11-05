import type { OpenPanel } from './types.js';
export type Stage = 'brief' | 'script' | 'board' | 'style' | 'animatic' | 'build' | 'deliver';
export declare const STAGES: {
    id: Stage;
    label: string;
}[];
export type StageState = 'empty' | 'open' | 'approved';
export interface StageInfo {
    state: StageState;
    /** The open panel to bring up, when the stage is open. */
    panelId: string | null;
    /** The approved panel to show read-only, when the stage is approved and nothing waits. */
    approvedId: string | null;
}
/** True for a submitted panel whose answer approves: a brief always does, the others say so in their answer. */
export declare function isApproved(panel: OpenPanel): boolean;
/**
 * Where each stage stands. A stage with its own panel (Brief, Script, Board, Style) is open while one waits and
 * approved once one was approved. The review panel serves two stages: reviews up to and including the first approved
 * one are the Animatic's, the ones after it the Build's. Deliver has no panel; `delivered` says an export has finished.
 */
export declare function stageStates(panels: OpenPanel[], delivered?: boolean): Record<Stage, StageInfo>;
/** A custom panel in the stepper: not a stage, so it comes after Deliver as a pill of its own. */
export interface CustomPill {
    /** The panel to bring up: the latest one with this name. */
    id: string;
    name: string;
    title: string;
    /** 'open' waits for the person; 'answered' was sent and shows read-only. */
    state: 'open' | 'answered';
}
/** One pill per custom panel name, from its latest panel that was not dismissed, oldest name first. */
export declare function customPills(panels: OpenPanel[]): CustomPill[];
//# sourceMappingURL=stages.d.ts.map