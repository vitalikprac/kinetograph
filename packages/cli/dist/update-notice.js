// Update notices: a newer `kinetograph` on npm, and agent skills installed by `npx skills add` that are older than the CLI.
// The only network request is one GET of the registry's `latest` for this package, at most once a day, with no data of
// the user's. Nothing is ever installed or updated from here. The result and the times notices were shown are kept in
// `~/.cache/kinetograph/update-check.json`. Quiet when `CI` is set or `KINETOGRAPH_NO_UPDATE_CHECK=1`.
import { existsSync, mkdirSync, readFileSync, realpathSync, renameSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, parse, resolve } from 'node:path';
const DAY_MS = 24 * 60 * 60 * 1000;
const REGISTRY_URL = 'https://registry.npmjs.org/kinetograph/latest';
const TIMEOUT_MS = 1500;
const SKILL_NAMES = ['kinetograph', 'kinetograph-migrate'];
export const SKILLS_UPDATE_COMMAND = 'npx skills add 0xS4N4TG/kinetograph';
/** Ends each notice, so an agent whose skills predate the notice rule still asks the user. */
export const AGENT_HINT = ' (coding agents: tell the user and ask first)';
export function parseVersion(text) {
    const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(text.trim());
    if (!match)
        return null;
    return { core: [Number(match[1]), Number(match[2]), Number(match[3])], pre: match[4] === undefined ? [] : match[4].split('.') };
}
/** Semver order: negative when `a` is older than `b`. Throws on text that is not a version. */
export function compareVersions(a, b) {
    const x = parseVersion(a);
    const y = parseVersion(b);
    if (!x || !y)
        throw new Error(`not a version: ${x ? b : a}`);
    for (let i = 0; i < 3; i++)
        if (x.core[i] !== y.core[i])
            return x.core[i] < y.core[i] ? -1 : 1;
    if (x.pre.length === 0 || y.pre.length === 0)
        return x.pre.length === y.pre.length ? 0 : x.pre.length === 0 ? 1 : -1;
    for (let i = 0; i < Math.max(x.pre.length, y.pre.length); i++) {
        const p = x.pre[i];
        const q = y.pre[i];
        if (p === undefined)
            return -1;
        if (q === undefined)
            return 1;
        if (p === q)
            continue;
        const pn = /^\d+$/.test(p);
        const qn = /^\d+$/.test(q);
        if (pn && qn)
            return Number(p) < Number(q) ? -1 : 1;
        if (pn !== qn)
            return pn ? -1 : 1;
        return p < q ? -1 : 1;
    }
    return 0;
}
/** Whether `latest` is an update for `current`. A prerelease is ignored unless `current` is one too. */
export function isNewer(latest, current) {
    const l = parseVersion(latest);
    const c = parseVersion(current);
    if (!l || !c)
        return false;
    if (l.pre.length > 0 && c.pre.length === 0)
        return false;
    return compareVersions(latest, current) > 0;
}
/** True when no notice may be shown or checked for: `CI` set (other than 0 or false) or `KINETOGRAPH_NO_UPDATE_CHECK=1`. */
export function updateChecksOff(env = process.env) {
    const ci = env.CI;
    return env.KINETOGRAPH_NO_UPDATE_CHECK === '1' || (ci !== undefined && ci !== '' && ci !== '0' && ci.toLowerCase() !== 'false');
}
/** `~/.cache/kinetograph/update-check.json`, beside the font and sound caches. */
export function updateCachePath() {
    return join(homedir(), '.cache', 'kinetograph', 'update-check.json');
}
function readCache() {
    try {
        const parsed = JSON.parse(readFileSync(updateCachePath(), 'utf8'));
        return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? parsed : {};
    }
    catch {
        return {};
    }
}
function writeCache(patch) {
    try {
        const file = updateCachePath();
        mkdirSync(dirname(file), { recursive: true });
        const tmp = `${file}.${process.pid}.tmp`;
        writeFileSync(tmp, JSON.stringify({ ...readCache(), ...patch }));
        renameSync(tmp, file);
    }
    catch {
        // A cache that cannot be written only means the next command asks again.
    }
}
const isFresh = (checkedAt, now) => checkedAt !== undefined && now - checkedAt >= 0 && now - checkedAt < DAY_MS;
// ---- the registry ----
let inflight;
/** Asks the registry for the latest version and caches the answer. Null when it cannot be reached; never throws. */
export function checkLatest() {
    inflight ??= (async () => {
        const abort = new AbortController();
        let timer;
        // The abort ends a request that is still open; the race ends the wait even for a fetch that ignores the abort.
        const timeout = new Promise((done) => {
            timer = setTimeout(() => {
                abort.abort();
                done(null);
            }, TIMEOUT_MS);
            timer.unref();
        });
        const ask = async () => {
            try {
                const response = await globalThis.fetch(REGISTRY_URL, { signal: abort.signal });
                if (!response.ok)
                    return null;
                const body = (await response.json());
                return typeof body.version === 'string' && parseVersion(body.version) ? body.version : null;
            }
            catch {
                return null; // Offline, slow or refused: silent.
            }
        };
        const latest = await Promise.race([ask(), timeout]);
        clearTimeout(timer);
        writeCache({ checkedAt: Date.now(), ...(latest === null ? {} : { latest }) });
        return latest;
    })().finally(() => {
        inflight = undefined;
    });
    return inflight;
}
/** `metadata: { version }` from a SKILL.md's frontmatter. */
export function skillVersion(markdown) {
    const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(markdown)?.[1];
    if (front === undefined)
        return null;
    const block = /^metadata:[ \t]*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m.exec(front)?.[1];
    if (block === undefined)
        return null;
    const value = /^[ \t]+version:[ \t]*["']?([^"'\s#]+)/m.exec(block)?.[1];
    return value ?? null;
}
// Where `skills add` puts skills (https://github.com/vercel-labs/skills, docs/agents.md): the project folder of each
// agent, or the user's. The canonical copy is `.agents/skills`; the rest are symlinks to it or copies.
const PROJECT_DIRS = ['.agents/skills', '.claude/skills', '.codex/skills', '.cursor/skills', '.gemini/skills', '.github/skills'];
const GLOBAL_DIRS = [
    '.agents/skills',
    '.config/agents/skills',
    '.claude/skills',
    '.codex/skills',
    '.cursor/skills',
    '.gemini/skills',
    '.copilot/skills',
    '.config/opencode/skills',
    '.factory/skills',
];
/** The `skills` folders to look in: the project's (from `cwd` up to the home folder) and the user's. */
export function skillLocations(cwd = process.cwd(), env = process.env) {
    const home = homedir();
    const out = [];
    for (let dir = resolve(cwd), depth = 0; depth < 10 && dir !== home; dir = dirname(dir), depth++) {
        for (const rel of PROJECT_DIRS)
            out.push(join(dir, rel));
        if (dir === parse(dir).root)
            break;
    }
    for (const rel of GLOBAL_DIRS)
        out.push(join(home, rel));
    if (env.CLAUDE_CONFIG_DIR)
        out.push(join(env.CLAUDE_CONFIG_DIR, 'skills'));
    if (env.CODEX_HOME)
        out.push(join(env.CODEX_HOME, 'skills'));
    return out;
}
/** The Kinetograph skills installed in those folders (symlinks followed, one entry per real folder). */
export function findInstalledSkills(cwd = process.cwd()) {
    const seen = new Set();
    const out = [];
    for (const location of skillLocations(cwd)) {
        for (const name of SKILL_NAMES) {
            const path = join(location, name);
            const file = join(path, 'SKILL.md');
            if (!existsSync(file))
                continue;
            let real;
            try {
                real = realpathSync(path);
            }
            catch {
                continue;
            }
            if (seen.has(real))
                continue;
            seen.add(real);
            let version = null;
            try {
                version = skillVersion(readFileSync(file, 'utf8'));
            }
            catch {
                // Unreadable: counts as unstamped.
            }
            out.push({ name, path, location, version });
        }
    }
    return out;
}
/** A skill is current when it is stamped with a version at least the CLI's. */
export function skillIsCurrent(skill, cliVersion) {
    if (skill.version === null || !parseVersion(skill.version))
        return false;
    return compareVersions(skill.version, cliVersion) >= 0;
}
// ---- the notices ----
export function cliNotice(latest, current) {
    return `kinetograph ${latest} is out (you have ${current}): npm install kinetograph@latest${AGENT_HINT}`;
}
export function skillsNotice(oldest, cliVersion) {
    const have = oldest === null ? 'have no version stamp' : `are ${oldest}`;
    return `Your Kinetograph agent skills ${have} and the CLI is ${cliVersion}: update them with ${SKILLS_UPDATE_COMMAND}${AGENT_HINT}`;
}
/**
 * Starts the registry check if the last one is over a day old (in the background: nothing here waits for the network)
 * and returns the session whose `collect()` gives the notices. Undefined when checks are off.
 */
export function beginNotices(cliVersion) {
    if (updateChecksOff())
        return undefined;
    let answered;
    let pending;
    if (!isFresh(readCache().checkedAt, Date.now()))
        pending = checkLatest().then((latest) => void (answered = latest));
    return {
        async collect() {
            // An answer that has already come is used; one still in flight is left for the next command.
            if (pending)
                await Promise.race([pending, new Promise((r) => setImmediate(r))]);
            const now = Date.now();
            const cache = readCache();
            const lines = [];
            const patch = {};
            const latest = answered ?? cache.latest;
            if (latest && isNewer(latest, cliVersion) && !isFresh(cache.notifiedAt, now)) {
                lines.push(cliNotice(latest, cliVersion));
                patch.notifiedAt = now;
            }
            const stale = findInstalledSkills().filter((s) => !skillIsCurrent(s, cliVersion) && !isFresh(cache.skillNotified?.[s.location], now));
            if (stale.length > 0) {
                const stamped = stale.flatMap((s) => (s.version !== null && parseVersion(s.version) ? [s.version] : []));
                const oldest = stale.some((s) => s.version === null || !parseVersion(s.version)) ? null : stamped.sort(compareVersions)[0];
                lines.push(skillsNotice(oldest, cliVersion));
                patch.skillNotified = { ...cache.skillNotified, ...Object.fromEntries(stale.map((s) => [s.location, now])) };
            }
            if (Object.keys(patch).length > 0)
                writeCache(patch);
            return lines;
        },
    };
}
/** For `doctor`: the CLI against the latest (asked now if the cache is over a day old, unless checks are off) and every installed skill. */
export async function updateReport(cliVersion) {
    if (!isFresh(readCache().checkedAt, Date.now()) && process.env.KINETOGRAPH_NO_UPDATE_CHECK !== '1')
        await checkLatest();
    const cache = readCache();
    const latest = cache.latest ?? null;
    return {
        cli: { version: cliVersion, latest, current: latest === null ? null : !isNewer(latest, cliVersion), checkedAt: cache.checkedAt ?? null },
        skills: findInstalledSkills().map((s) => ({ name: s.name, path: s.path, version: s.version, current: skillIsCurrent(s, cliVersion) })),
    };
}
/** `doctor`'s lines for an `UpdateReport`. */
export function formatUpdateReport(report) {
    const { cli, skills } = report;
    const lines = [
        cli.latest === null
            ? `kinetograph ${cli.version} (latest version unknown: not checked yet, or the registry did not answer)`
            : cli.current
                ? `kinetograph ${cli.version} is the latest`
                : cliNotice(cli.latest, cli.version),
    ];
    if (skills.length === 0)
        lines.push('agent skills: none installed (npx skills add 0xS4N4TG/kinetograph)');
    for (const s of skills)
        lines.push(`skill ${s.name}: ${s.version ?? 'no version stamp'}, ${s.current ? 'current' : `out of date (${SKILLS_UPDATE_COMMAND})`}  ${s.path}`);
    return lines;
}
//# sourceMappingURL=update-notice.js.map