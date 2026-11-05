import type { ChatRecord } from './protocol.js';
export declare class ChatLog {
    private readonly maxRecords;
    private readonly maxBytes;
    private kept;
    private bytes;
    constructor(maxRecords?: number, maxBytes?: number);
    get records(): ChatRecord[];
    /** The size of what is kept, as JSON. */
    get size(): number;
    push(record: ChatRecord): void;
    clear(): void;
}
//# sourceMappingURL=chat-log.d.ts.map