import { internalAction, internalMutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import pkg from "../package.json";
import { githubRepo, parseVersion } from "./lib/semver";

/**
 * The platform version this backend was deployed from. The frontend bakes its own at
 * build time; comparing the two is the only way to see, from outside, that a deploy
 * reached Convex and not just the web server. Public on purpose: it names a release,
 * never data.
 */
export const version = query({
    args: {},
    handler: async () => ({ version: pkg.version }),
});

/**
 * The newest release of the platform, as last seen on GitHub. The browser cannot ask
 * GitHub itself (the CSP only allows this site and Convex), so a cron stores it here
 * and every instance can show at a glance whether it is up to date. Public: it names a
 * release, never data.
 */
export const latest = query({
    args: {},
    handler: async (ctx) => {
        const row = await ctx.db.query("platformRelease").first();
        return row ? { version: row.version, url: row.url, checkedAt: row.checkedAt } : null;
    },
});

export const storeLatest = internalMutation({
    args: { version: v.string(), url: v.string() },
    handler: async (ctx, args) => {
        const row = await ctx.db.query("platformRelease").first();
        const doc = { ...args, checkedAt: Date.now() };
        if (row) await ctx.db.replace(row._id, doc);
        else await ctx.db.insert("platformRelease", doc);
    },
});

/**
 * Asks GitHub for the latest release of the repository named in package.json. The
 * releases page redirects to the newest tag and, unlike the REST API, is not rate
 * limited per IP (Convex egress IPs are shared, so the anonymous API answers 403).
 * A failed check keeps the last known value: an hour without GitHub must not make
 * every site look outdated.
 */
export const refreshLatest = internalAction({
    args: {},
    handler: async (ctx) => {
        const repo = githubRepo(pkg.repository?.url ?? "");
        if (!repo) return;
        try {
            const res = await fetch(`https://github.com/${repo}/releases/latest`, {
                redirect: "manual",
                headers: { "User-Agent": "community-platform-update-check" },
                signal: AbortSignal.timeout(15_000),
            });
            const location = res.headers.get("location") ?? "";
            const tag = /\/releases\/tag\/([^/?#]+)$/.exec(location)?.[1] ?? "";
            const parsed = parseVersion(decodeURIComponent(tag));
            if (!parsed) {
                console.warn(`Release check: no release tag in the redirect (HTTP ${res.status})`);
                return;
            }
            await ctx.runMutation(internal.platform.storeLatest, {
                version: parsed.join("."),
                url: location,
            });
        } catch (error) {
            console.warn("Release check failed:", error instanceof Error ? error.message : error);
        }
    },
});
