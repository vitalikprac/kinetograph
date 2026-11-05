export interface TypeDiagnostic {
    /** Relative to the directory the command ran in, or absolute if outside it. */
    file: string | null;
    line: number | null;
    column: number | null;
    /** The TypeScript error number: 2322 for `TS2322`. */
    code: number;
    message: string;
}
export interface TypeCheckResult {
    /** False for a scene file or a JavaScript project with no tsconfig: nothing to check. */
    checked: boolean;
    /** The tsconfig used, or null when the entry was checked alone with the defaults. */
    tsconfig: string | null;
    diagnostics: TypeDiagnostic[];
}
/**
 * `tsc --noEmit` on a project, in-process. Like `tsc` it checks the files of the nearest `tsconfig.json` above the
 * entry; with none, the entry and what it imports, under the defaults above. The CLI never type-checks to render
 * (esbuild strips types); this is for `check` and `lint`, so that a typo such as `opactiy` is seen by an agent that
 * has no editor.
 */
export declare function typeCheck(entry: string, cwd?: string): TypeCheckResult;
//# sourceMappingURL=typecheck.d.ts.map