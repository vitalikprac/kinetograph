// plan/<name>.json beside the entry: where a submitted answer is kept. The directory may be a symlink the project owner
// did not intend, so both ways in check that the real plan directory is inside the real project directory and that the
// file is a plain file, never a link; the name is a panel kind or custom-<slug>, never text from a request.
import { randomBytes } from 'node:crypto';
import { lstatSync, mkdirSync, readdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isInside } from '../agent-fs.js';
import { StudioFailure } from '../util.js';
import { isApproved } from './stages.js';
import { CUSTOM_NAME } from './custom.js';
import { PANEL_KINDS, checkAnswer, checkDraft } from './validate.js';
/** The name of a plan file (without ".json"): a panel kind that keeps a file, or custom-<slug>. Never text from a request as it is. */
export const isPlanFile = (name) => (PANEL_KINDS.includes(name) && name !== 'custom') || (name.startsWith('custom-') && CUSTOM_NAME.test(name.slice(7)));
function checkedKind(kind) {
    if (!isPlanFile(kind))
        throw new StudioFailure('INVALID_ARG', `no plan file "${kind}"`);
}
/** The real plan directory, or null when it does not exist; throws when it leaves the project. */
function planDir(projectDir, create) {
    const dir = join(projectDir, 'plan');
    if (create)
        mkdirSync(dir, { recursive: true });
    let real;
    try {
        real = realpathSync(dir);
    }
    catch {
        return null;
    }
    if (!isInside(realpathSync(projectDir), real))
        throw new StudioFailure('FORBIDDEN', 'plan/ leads outside the project');
    return real;
}
/** Writes `answer` as pretty JSON: to a new file in the plan directory, then renamed over plan/<kind>.json. */
export function writePlan(projectDir, kind, answer) {
    checkedKind(kind);
    const dir = planDir(projectDir, true);
    const target = join(dir, `${kind}.json`);
    let existing;
    try {
        existing = lstatSync(target);
    }
    catch {
        existing = null;
    }
    if (existing && !existing.isFile())
        throw new StudioFailure('FORBIDDEN', `plan/${kind}.json is not a plain file`);
    const temp = join(dir, `.${kind}.${randomBytes(6).toString('hex')}.tmp`);
    try {
        writeFileSync(temp, `${JSON.stringify(answer, null, 2)}\n`, { flag: 'wx' });
        renameSync(temp, target);
    }
    catch (error) {
        rmSync(temp, { force: true });
        throw error;
    }
}
/** plan/<kind>.json parsed, or null when there is none or it does not read; throws when it is a link or leaves the project. */
export function readPlan(projectDir, kind) {
    checkedKind(kind);
    const dir = planDir(projectDir, false);
    if (dir === null)
        return null;
    const target = join(dir, `${kind}.json`);
    try {
        if (!lstatSync(target).isFile())
            throw new StudioFailure('FORBIDDEN', `plan/${kind}.json is not a plain file`);
    }
    catch (error) {
        if (error instanceof StudioFailure)
            throw error;
        return null;
    }
    try {
        return JSON.parse(readFileSync(target, 'utf8'));
    }
    catch {
        return null;
    }
}
/** The names of the custom panels with a plan file (`end-card` for plan/custom-end-card.json), sorted. */
function customPlanNames(projectDir) {
    try {
        const dir = planDir(projectDir, false);
        if (dir === null)
            return [];
        return readdirSync(dir)
            .flatMap((file) => {
            const found = /^custom-([a-z0-9-]{1,40})\.json$/.exec(file);
            return found ? [found[1]] : [];
        })
            .sort();
    }
    catch {
        return [];
    }
}
/** The custom plan `name` holds, or null when it is not a draft with an answer that fits it (a file from before drafts were kept has values only). */
function readCustomPlan(projectDir, name) {
    let saved;
    try {
        saved = readPlan(projectDir, `custom-${name}`);
    }
    catch {
        return null;
    }
    if (typeof saved !== 'object' || saved === null)
        return null;
    const { draft, answer } = saved;
    if (checkDraft('custom', draft) !== null || draft.name !== name)
        return null;
    if (checkAnswer('custom', answer, draft) !== null)
        return null;
    return { draft: draft, answer: answer };
}
/** What a restored panel carries as its data: only what its answer already says, as the window shows no more than that. */
const restoredData = (kind, answer) => {
    switch (kind) {
        case 'script':
            return { lines: answer.lines };
        case 'storyboard':
            return { comp: '', shots: answer.shots };
        case 'styleframes':
            return { frames: [] };
        case 'review':
            return { comp: '' };
        default:
            return {};
    }
};
/**
 * Rebuilds the stepper after a restart: each plan/<kind>.json that holds an approving answer comes back as a submitted
 * panel, so its stage is approved and can be looked at. A file that does not read, does not check or does not approve is
 * left out, and so is one the safe reader refuses (a link, or a plan directory that leaves the project).
 */
export function restorePanels(store, projectDir) {
    for (const kind of PANEL_KINDS) {
        // Custom panels come back below, each with the draft its plan file keeps.
        if (kind === 'custom')
            continue;
        let answer;
        try {
            answer = readPlan(projectDir, kind);
        }
        catch {
            continue;
        }
        if (answer === null || checkAnswer(kind, answer) !== null)
            continue;
        const probe = { panel: kind, status: 'submitted', answer };
        if (!isApproved(probe))
            continue;
        store.restore(kind, restoredData(kind, answer), answer);
    }
    for (const name of customPlanNames(projectDir)) {
        const saved = readCustomPlan(projectDir, name);
        if (saved)
            store.restore('custom', saved.draft, saved.answer);
    }
}
//# sourceMappingURL=plan.js.map