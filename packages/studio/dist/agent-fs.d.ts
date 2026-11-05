/** Whether `child` is `root` or inside it. */
export declare function isInside(root: string, child: string): boolean;
/** `path` (absolute, or relative to `root`) as an absolute real path inside `root`; throws `FORBIDDEN` when it is not. */
export declare function resolveInside(root: string, path: string): string;
/** The text of the file, or of `limit` lines of it from the 1-based `line`. */
export declare function readTextFile(root: string, path: string, line?: number | null, limit?: number | null): Promise<string>;
export declare function writeTextFile(root: string, path: string, content: string): Promise<void>;
//# sourceMappingURL=agent-fs.d.ts.map