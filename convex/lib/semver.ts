/**
 * Version comparison for the "is this site up to date" badge. Releases are
 * plain MAJOR.MINOR.PATCH tags (optionally prefixed with v), so a full semver
 * parser would only add surface.
 */

export function parseVersion(text: string): [number, number, number] | null {
    const match = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(text.trim());
    return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

/** Negative when a is older than b, 0 when equal, positive when newer; null if either is not a version. */
export function compareVersions(a: string, b: string): number | null {
    const pa = parseVersion(a);
    const pb = parseVersion(b);
    if (!pa || !pb) return null;
    for (let i = 0; i < 3; i++) {
        if (pa[i] !== pb[i]) return pa[i] - pb[i];
    }
    return 0;
}

export type UpdateStatus = "current" | "behind" | "ahead" | "unknown";

/** Where a running version stands against the latest published release. */
export function updateStatus(running: string, latest: string | null | undefined): UpdateStatus {
    if (!latest) return "unknown";
    const diff = compareVersions(running, latest);
    if (diff === null) return "unknown";
    return diff === 0 ? "current" : diff < 0 ? "behind" : "ahead";
}

/** "owner/repo" from a GitHub repository URL, so the source follows package.json. */
export function githubRepo(url: string): string | null {
    const match = /github\.com[/:]([^/]+)\/([^/.#?]+)/.exec(url);
    return match ? `${match[1]}/${match[2]}` : null;
}
