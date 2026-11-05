import type { PanelRoute } from './routes.js';
/** `path` as segments below the project when it is a plain relative path with an audio extension, else null. */
export declare function audioSegments(path: string): string[] | null;
/** The byte range a `Range` header asks for in a file of `size` bytes: null for no header, 'bad' when it cannot be met. */
export declare function rangeOf(header: string | undefined, size: number): {
    start: number;
    end: number;
} | 'bad' | null;
export declare const scriptRoute: PanelRoute;
//# sourceMappingURL=script-routes.d.ts.map