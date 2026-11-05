/** Whether profiling is on. */
export declare const profiling: boolean;
/** Milliseconds on a clock shared by all threads (the monotonic one; `performance.now` is held still while frames render). */
export declare const now: () => number;
type Stages = Record<string, number>;
/** What the project's JS stages recorded since the last call (`dom_*` from the DOM engine), emptied. */
export declare function takeJs(): Stages;
/** This thread's addon stages since the last call (`takeProfile`), emptied. */
export declare function takeAddon(): Stages;
/** One thread's log. */
export declare class ProfileLog {
    private readonly file;
    private lines;
    constructor(main: boolean);
    /** Records `row` (a frame's stages, or any event with a `kind`). */
    add(row: Record<string, number | string>): void;
    flush(): void;
}
/** The encoder thread's totals and the DOM island thread's, written once when a render ends. */
export declare function writeShared(): void;
/** Marks a stage of the whole render (bundle, workers up, first frame, audio, finish...) in `<prefix>.stages.jsonl`: `t` on the shared clock, `up` ms since the process started. */
export declare function stage(name: string): void;
export {};
//# sourceMappingURL=profile.d.ts.map