import { EventEmitter } from 'node:events';
import type { AudioMix } from './audio-mix.js';
import type { Call } from './worker-client.js';
import { WorkerClient } from './worker-client.js';
import type { WorkerRole } from './engine.js';
import type { CompositionInfo, StudioError, TimelineData, TimelineProgress } from './protocol.js';
export interface ProjectEvents {
    /** A good build is being served (and the workers replaced). */
    reload: [buildId: number];
    /** A build failed; the last good one keeps running. */
    buildError: [error: StudioError];
}
export interface ProjectOptions {
    entry: string;
    engine: string;
    log?: (message: string) => void;
    publicDir?: string;
}
/**
 * The project the studio serves: watches the entry, builds it, and keeps the worker that runs the current good
 * build. A new build gets a new worker; the old one finishes the calls it has and stops.
 */
export declare class Project extends EventEmitter<ProjectEvents> {
    private readonly options;
    buildId: number;
    buildError: StudioError | null;
    private current;
    private stopWatching;
    /** Builds are applied one at a time, in order. */
    private applying;
    private readonly timelines;
    private readonly timelineProgress;
    /** The mix of the sound a sweep collected, made right after the sweep by the worker that did it. */
    private readonly audios;
    /** Sweeps still reading frames: a newer request for the same composition stops them. */
    private readonly sweeping;
    private closed;
    /** The code of the build being served, so that a rebuild of identical code is not a reload. */
    private servedCode;
    private readonly written;
    constructor(options: ProjectOptions);
    /** Builds the project once, then keeps watching it. Resolves when the first build has been applied (or failed). */
    start(): Promise<void>;
    get compositions(): CompositionInfo[];
    get bundleFile(): string | null;
    /** The build being served; throws `BUILD` (409) before the first good one. */
    private serving;
    /** Runs `call` in the worker of the current build; resolves with its result and that build's id. */
    call<T>(call: Call): Promise<{
        result: T;
        buildId: number;
    }>;
    /** The timeline of a composition, computed once per (build, composition, props) in a worker of its own. */
    timeline(comp: string, props: Record<string, unknown>): Promise<TimelineData>;
    /** The mix of a composition's sound, from the same sweep as its timeline; null when it has none. */
    audio(comp: string, props: Record<string, unknown>): Promise<AudioMix | null>;
    /** How far the timeline of this composition has got: `total` is 0 when no sweep has started for it. */
    timelineProgressOf(comp: string, props: Record<string, unknown>): TimelineProgress;
    private timelineKey;
    private sweep;
    /** A worker for `role` over the bundle `bundleFile`. */
    spawn(role: WorkerRole, bundleFile: string | null, cancel?: SharedArrayBuffer): WorkerClient;
    private apply;
    private applyOne;
    private failed;
    private bundlePrefix;
    private writeBundle;
    private prune;
    close(): Promise<void>;
}
//# sourceMappingURL=project.d.ts.map