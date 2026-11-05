// The boundary between the studio server and the project (packages/cli/skills/kinetograph/references/AUTHORING.md §11.5). The server never runs the
// project: a worker thread loads an *engine module* that exports `createEngine`, and everything the server needs of the
// project, the renderer and the addon goes through this interface. The default engine (`real-engine.ts`) drives the
// CLI's source and the addon; tests name a stub module in `StudioOptions.engine`, which opens no GPU.
export {};
//# sourceMappingURL=engine.js.map