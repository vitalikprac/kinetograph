/** The command that opens `url` in the default browser on `platform`. */
export declare function openerCommand(platform: NodeJS.Platform, url: string): {
    command: string;
    args: string[];
};
/** Opens `url` in the default browser. A machine without one (a server over SSH) is not an error. */
export declare function openBrowser(url: string, platform?: NodeJS.Platform): void;
//# sourceMappingURL=open-browser.d.ts.map