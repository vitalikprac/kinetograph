// The coding agents the studio can talk to. Each is started as a subprocess that speaks ACP on stdin and stdout; the
// Claude Code and Codex adapters are fetched by `npx` on first use, so nothing is installed globally.
import { accessSync, constants } from 'node:fs';
import { delimiter, join } from 'node:path';
export const PRESETS = [
    { id: 'claude', name: 'Claude Code', needs: 'claude', command: 'npx -y @agentclientprotocol/claude-agent-acp' },
    { id: 'codex', name: 'Codex', needs: 'codex', command: 'npx -y @zed-industries/codex-acp' },
    { id: 'gemini', name: 'Gemini CLI', needs: 'gemini', command: 'gemini --acp' },
];
/** Whether an executable called `name` is in a directory of `pathVar`. */
export function onPath(name, pathVar = process.env.PATH) {
    for (const dir of (pathVar ?? '').split(delimiter)) {
        if (dir === '')
            continue;
        try {
            accessSync(join(dir, name), constants.X_OK);
            return true;
        }
        catch {
            // not here
        }
    }
    return false;
}
/** The presets found on this machine, plus the `--agent` command when there is one. */
export function availableAgents(custom, pathVar) {
    const found = PRESETS.filter((p) => onPath(p.needs, pathVar)).map(({ id, name, command }) => ({ id, name, command }));
    if (custom !== undefined && !found.some((p) => p.command === custom))
        found.unshift({ id: 'custom', name: 'Custom agent', command: custom });
    return found;
}
//# sourceMappingURL=agent-presets.js.map