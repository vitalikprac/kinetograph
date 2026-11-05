import type { ServerResponse } from 'node:http';
/** The UI's built files; `ui/dist` of this package (one level above both `src/` and `dist/`). */
export declare const UI_DIR: string;
/**
 * Serves a file of the UI for `pathname`, or `index.html` for a path that is no file (the UI routes itself), or a plain
 * message when the UI is not built. `dir` is replaceable for tests.
 */
export declare function serveStatic(pathname: string, res: ServerResponse, head: boolean, dir?: string): Promise<void>;
//# sourceMappingURL=static.d.ts.map