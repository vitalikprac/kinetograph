// What the engine could not draw in the frames a command drew (kinetograph site, /docs/compat/): the frame is drawn anyway, with
// the native approximation, and this says what was left out. `--strict` turns it into an error.
import { CliError } from './errors.js';
/** Collects what was left out, frame by frame, into one entry per kind. */
export class LeftOutCollector {
    kinds = new Map();
    frames = 0;
    add(frame, unsupported) {
        if (unsupported.length > 0)
            this.frames += 1;
        const seen = new Set();
        for (const item of unsupported) {
            const key = `${item.element}\u0000${item.property ?? ''}\u0000${item.reason}`;
            let entry = this.kinds.get(key);
            if (!entry) {
                entry = { element: item.element, property: item.property, reason: item.reason, values: [], frames: 0, firstFrame: frame, lastFrame: frame };
                this.kinds.set(key, entry);
            }
            if (!seen.has(key)) {
                seen.add(key);
                entry.frames += 1;
                entry.lastFrame = Math.max(entry.lastFrame, frame);
                entry.firstFrame = Math.min(entry.firstFrame, frame);
            }
            if (item.value !== null && entry.values.length < 3 && !entry.values.includes(item.value))
                entry.values.push(item.value);
        }
    }
    /** Most frames first. */
    result() {
        return [...this.kinds.values()].sort((a, b) => b.frames - a.frames || a.element.localeCompare(b.element));
    }
    report() {
        return { unsupportedFrames: this.frames, leftOut: this.result() };
    }
}
function describeItem(item) {
    return item.property ? `${item.element} { ${item.property}${item.values.length ? `: ${item.values.join(' | ')}` : ''} }` : item.element;
}
/** The warning `still`, `strip` and `render` print on stderr for what they left out. */
export function describeLeftOut(report, limit = 12) {
    const items = report.leftOut;
    if (items.length === 0)
        return [];
    const kinds = `${items.length} kind${items.length === 1 ? '' : 's'}`;
    const frames = `${report.unsupportedFrames} frame${report.unsupportedFrames === 1 ? '' : 's'}`;
    const lines = [`warning: ${kinds} of unsupported content in ${frames}, drawn without it or approximated (--strict fails instead):`];
    for (const item of items.slice(0, limit)) {
        const where = item.firstFrame === item.lastFrame ? `frame ${item.firstFrame}` : `${item.frames} frames, ${item.firstFrame}..=${item.lastFrame}`;
        lines.push(`  ${describeItem(item)}: ${item.reason} (${where})`);
    }
    if (items.length > limit)
        lines.push(`  … and ${items.length - limit} more`);
    return lines;
}
/** `--strict`: the error for the first frame that holds something the engine cannot draw. */
export function strictError(frame, unsupported, limit = 5) {
    const collector = new LeftOutCollector();
    collector.add(frame, unsupported);
    const items = collector.result();
    const lines = items.slice(0, limit).map((item) => `  ${describeItem(item)}: ${item.reason}`);
    if (items.length > limit)
        lines.push(`  … and ${items.length - limit} more`);
    return new CliError('UNSUPPORTED_CONTENT', `--strict: frame ${frame} holds content the engine cannot draw:\n${lines.join('\n')}\n` +
        'run `kinetograph doctor <entry>` for all of it, or leave out --strict to draw the frame without it');
}
//# sourceMappingURL=compat-report.js.map