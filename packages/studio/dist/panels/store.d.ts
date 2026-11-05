import type { OpenPanel, PanelAnswer, PanelDraft, PanelKind, Placement } from './types.js';
export declare class PanelStore {
    private panels;
    private next;
    /** Opens a panel; the one of the same kind (and, for a custom panel, of the same name) that waited is dismissed and returned. */
    open<K extends PanelKind>(kind: K, data: PanelDraft[K], message: string | null, now?: number, placement?: Placement): {
        panel: OpenPanel<K>;
        replaced: OpenPanel | null;
    };
    /** Adds an already answered panel, read back from its plan file when the studio starts (no one is told). */
    restore<K extends PanelKind>(kind: K, data: PanelDraft[K], answer: PanelAnswer[K], now?: number): OpenPanel<K>;
    get(id: string): OpenPanel | undefined;
    /** Closes an open panel as submitted (with its answer) or dismissed; undefined when it is not open. */
    close(id: string, status: 'submitted' | 'dismissed', answer?: PanelAnswer[PanelKind] | null): OpenPanel | undefined;
    /** What a window is sent when it connects: the open panels and the submitted ones, oldest first. */
    shown(): OpenPanel[];
}
//# sourceMappingURL=store.d.ts.map