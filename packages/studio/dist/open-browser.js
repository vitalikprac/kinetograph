import { spawn } from 'node:child_process';
/** The command that opens `url` in the default browser on `platform`. */
export function openerCommand(platform, url) {
    if (platform === 'darwin')
        return { command: 'open', args: [url] };
    if (platform === 'win32')
        return { command: 'cmd', args: ['/c', 'start', '""', url] };
    return { command: 'xdg-open', args: [url] };
}
/** Opens `url` in the default browser. A machine without one (a server over SSH) is not an error. */
export function openBrowser(url, platform = process.platform) {
    const { command, args } = openerCommand(platform, url);
    try {
        const child = spawn(command, args, { stdio: 'ignore', detached: true });
        child.on('error', () => undefined);
        child.unref();
    }
    catch {
        // No opener: the URL has been printed.
    }
}
//# sourceMappingURL=open-browser.js.map