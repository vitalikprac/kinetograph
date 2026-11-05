import { type Source } from '../source.js';
import { type Command } from './types.js';
export type SnapshotStatus = 'match' | 'mismatch' | 'missing' | 'created' | 'updated';
export interface SnapshotResult {
    frame: number;
    status: SnapshotStatus;
    snapshot: string;
    /** The new render, written beside the snapshot when it differs. */
    actual?: string;
    maxDiff?: number;
    differingPixels?: number;
}
/** `__snapshots__/<entry>[.<composition>].f<frame>.png` next to the entry. */
export declare function snapshotPath(source: Source, frame: number): string;
/** Compares a rendered PNG with the approved file, or writes it if asked to. */
export declare function compareSnapshot(png: Uint8Array, frame: number, snapshot: string, update: boolean): SnapshotResult;
export declare const snapshot: Command;
//# sourceMappingURL=snapshot.d.ts.map