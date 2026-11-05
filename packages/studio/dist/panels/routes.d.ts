import type { IncomingMessage, ServerResponse } from 'node:http';
export interface PanelRouteContext {
    /** The directory that holds the project's entry; plan files live in <projectDir>/plan/. */
    projectDir: string;
    /** True when the request carries the window's token (not the agent's). */
    fromWindow: boolean;
}
/** Handles the request and returns true, or returns false to leave it to the next handler. */
export type PanelRoute = (req: IncomingMessage, res: ServerResponse, url: URL, ctx: PanelRouteContext) => Promise<boolean>;
export declare const panelRoutes: PanelRoute[];
//# sourceMappingURL=routes.d.ts.map