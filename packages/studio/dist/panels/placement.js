// Where a panel is shown. No Node, no DOM: the server, the UI and the tests use it.
export const PLACEMENTS = ['sheet', 'left', 'right', 'beside-preview'];
/** A review stays beside the preview so that it can be watched while the person writes notes; every other kind is a sheet. */
export const defaultPlacement = (kind) => (kind === 'review' ? 'beside-preview' : 'sheet');
export const placementOf = (panel) => panel.placement ?? defaultPlacement(panel.panel);
/** The name of a panel's plan file without ".json": the kind, or custom-<name> for a custom panel. */
export const planFileOf = (panel) => panel.panel === 'custom' ? `custom-${panel.data.name}` : panel.panel;
//# sourceMappingURL=placement.js.map