import { effectCatalog } from '@kinetographdev/scene';
import { PROJECT_OPTIONS } from '../args.js';
import { listCompositions } from '../source.js';
import { ENTRY } from './types.js';
export const compositions = {
    name: 'compositions',
    summary: 'List the compositions of a project',
    project: false,
    positionals: [ENTRY],
    options: [...PROJECT_OPTIONS],
    async run(args) {
        const list = await listCompositions(String(args.positionals.entry), { ...(args.options['public-dir'] === undefined ? {} : { publicDir: args.options['public-dir'] }) });
        const text = list
            .map((c) => `${c.id}  ${c.width}x${c.height}  ${c.fps} fps  ${c.durationInFrames} frames (${(c.durationInFrames / c.fps).toFixed(2)} s)`)
            .join('\n');
        return { data: { compositions: list }, text: text || '(no compositions)' };
    },
};
export const effects = {
    name: 'effects',
    summary: 'List the effects and their parameters',
    project: false,
    positionals: [],
    options: [],
    async run() {
        const lines = [];
        for (const effect of effectCatalog) {
            lines.push(`${effect.type}: ${effect.description}`);
            for (const f of effect.fields) {
                const fallback = f.default === undefined ? 'required' : `default ${JSON.stringify(f.default)}`;
                lines.push(`  ${f.name} (${f.type}, ${fallback}): ${f.description}`);
            }
        }
        return { data: { effects: effectCatalog }, text: lines.join('\n') || '(no effects listed)' };
    },
};
//# sourceMappingURL=basic.js.map