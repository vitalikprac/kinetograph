// Single frames as PNGs: what `still`, `strip` and `onion` draw with.
import { LeftOutCollector, describeLeftOut, strictError } from './compat-report.js';
export class FrameDrawer {
    source;
    options;
    renderer = null;
    leftOut = new LeftOutCollector();
    constructor(source, options) {
        this.source = source;
        this.options = options;
    }
    /** Frame `frame` of the source as a PNG. */
    async png(frame) {
        const out = await this.source.frame(frame);
        const unsupported = out.unsupported ?? [];
        if (this.options.strict && unsupported.length > 0)
            throw strictError(frame, unsupported);
        this.leftOut.add(frame, unsupported);
        this.renderer ??= this.options.renderer();
        return this.renderer.still(out.sceneJson, frame, this.source.baseDir);
    }
    /** What the frames drawn so far left out. */
    report() {
        return this.leftOut.report();
    }
    /** What the frames left out, as a warning on the progress channel (stderr). */
    reportLeftOut() {
        for (const line of describeLeftOut(this.leftOut.report()))
            this.options.progress?.(line);
    }
}
//# sourceMappingURL=frame-drawer.js.map