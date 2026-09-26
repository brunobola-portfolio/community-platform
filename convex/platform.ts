import { query } from "./_generated/server";
import pkg from "../package.json";

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
