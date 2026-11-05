import type { OpenPanel, PanelKind, Placement } from './types.js';
export declare const PLACEMENTS: readonly Placement[];
/** A review stays beside the preview so that it can be watched while the person writes notes; every other kind is a sheet. */
export declare const defaultPlacement: (kind: PanelKind) => Placement;
export declare const placementOf: (panel: Pick<OpenPanel, "panel" | "placement">) => Placement;
/** The name of a panel's plan file without ".json": the kind, or custom-<name> for a custom panel. */
export declare const planFileOf: (panel: Pick<OpenPanel, "panel" | "data">) => string;
//# sourceMappingURL=placement.d.ts.map