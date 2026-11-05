export declare const SKILLS_UPDATE_COMMAND = "npx skills add 0xS4N4TG/kinetograph";
/** Ends each notice, so an agent whose skills predate the notice rule still asks the user. */
export declare const AGENT_HINT = " (coding agents: tell the user and ask first)";
interface Version {
    core: [number, number, number];
    pre: string[];
}
export declare function parseVersion(text: string): Version | null;
/** Semver order: negative when `a` is older than `b`. Throws on text that is not a version. */
export declare function compareVersions(a: string, b: string): number;
/** Whether `latest` is an update for `current`. A prerelease is ignored unless `current` is one too. */
export declare function isNewer(latest: string, current: string): boolean;
/** True when no notice may be shown or checked for: `CI` set (other than 0 or false) or `KINETOGRAPH_NO_UPDATE_CHECK=1`. */
export declare function updateChecksOff(env?: NodeJS.ProcessEnv): boolean;
/** `~/.cache/kinetograph/update-check.json`, beside the font and sound caches. */
export declare function updateCachePath(): string;
/** Asks the registry for the latest version and caches the answer. Null when it cannot be reached; never throws. */
export declare function checkLatest(): Promise<string | null>;
export interface InstalledSkill {
    name: string;
    /** The skill's folder, as found. */
    path: string;
    /** The `skills` folder it is in: the unit "once a day" counts by. */
    location: string;
    /** `metadata.version` of its SKILL.md, null when missing. */
    version: string | null;
}
/** `metadata: { version }` from a SKILL.md's frontmatter. */
export declare function skillVersion(markdown: string): string | null;
/** The `skills` folders to look in: the project's (from `cwd` up to the home folder) and the user's. */
export declare function skillLocations(cwd?: string, env?: NodeJS.ProcessEnv): string[];
/** The Kinetograph skills installed in those folders (symlinks followed, one entry per real folder). */
export declare function findInstalledSkills(cwd?: string): InstalledSkill[];
/** A skill is current when it is stamped with a version at least the CLI's. */
export declare function skillIsCurrent(skill: InstalledSkill, cliVersion: string): boolean;
export declare function cliNotice(latest: string, current: string): string;
export declare function skillsNotice(oldest: string | null, cliVersion: string): string;
export interface NoticeSession {
    /** The notice lines to show now (usually none), recorded as shown. Call once, after the work is done. */
    collect(): Promise<string[]>;
}
/**
 * Starts the registry check if the last one is over a day old (in the background: nothing here waits for the network)
 * and returns the session whose `collect()` gives the notices. Undefined when checks are off.
 */
export declare function beginNotices(cliVersion: string): NoticeSession | undefined;
export interface UpdateReport {
    cli: {
        version: string;
        latest: string | null;
        current: boolean | null;
        checkedAt: number | null;
    };
    skills: {
        name: string;
        path: string;
        version: string | null;
        current: boolean;
    }[];
}
/** For `doctor`: the CLI against the latest (asked now if the cache is over a day old, unless checks are off) and every installed skill. */
export declare function updateReport(cliVersion: string): Promise<UpdateReport>;
/** `doctor`'s lines for an `UpdateReport`. */
export declare function formatUpdateReport(report: UpdateReport): string[];
export {};
//# sourceMappingURL=update-notice.d.ts.map