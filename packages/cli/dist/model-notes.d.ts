import type { Unsupported } from '@kinetographdev/scene';
/**
 * Lists the unsupported content of the models in a frame's scene JSON. Models are resolved against `baseDir`, as the
 * addon does, and each file is read once. A file that cannot be read says nothing here: the render fails on it.
 */
export declare function modelNotes(baseDir: string): (sceneJson: string) => Unsupported[];
//# sourceMappingURL=model-notes.d.ts.map