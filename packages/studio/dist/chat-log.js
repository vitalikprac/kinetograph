// The conversation the server keeps for a window that reloads (server.ts): bounded by records and by bytes, trimmed by
// whole turns from the start so a replay always begins at one of the user's messages.
const sizeOf = (record) => JSON.stringify(record).length;
export class ChatLog {
    maxRecords;
    maxBytes;
    kept = [];
    bytes = 0;
    constructor(maxRecords = 5_000, maxBytes = 4 << 20) {
        this.maxRecords = maxRecords;
        this.maxBytes = maxBytes;
    }
    get records() {
        return this.kept;
    }
    /** The size of what is kept, as JSON. */
    get size() {
        return this.bytes;
    }
    push(record) {
        const last = this.kept.at(-1);
        // Streamed text joins the record before it, as the chat shows it: one record per paragraph, not per chunk.
        if (record.kind === 'event' && record.event.kind === 'message' && last?.kind === 'event' && last.event.kind === 'message') {
            const joined = { kind: 'event', event: { kind: 'message', text: last.event.text + record.event.text } };
            this.bytes += sizeOf(joined) - sizeOf(last);
            this.kept[this.kept.length - 1] = joined;
        }
        else {
            this.kept.push(record);
            this.bytes += sizeOf(record);
        }
        while ((this.kept.length > this.maxRecords || this.bytes > this.maxBytes) && this.kept.length > 1) {
            let cut = this.kept.findIndex((r, i) => i > 0 && r.kind === 'user');
            // No later turn to start at: keep only the newest record.
            if (cut === -1)
                cut = this.kept.length - 1;
            for (const r of this.kept.slice(0, cut))
                this.bytes -= sizeOf(r);
            this.kept = this.kept.slice(cut);
        }
    }
    clear() {
        this.kept = [];
        this.bytes = 0;
    }
}
//# sourceMappingURL=chat-log.js.map