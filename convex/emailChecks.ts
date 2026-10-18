"use node";

import { action } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { resolveMx } from "node:dns/promises";
import { api } from "./_generated/api";

/**
 * Whether an address can receive mail at all, judged by its domain's MX
 * records. A reply-to or board address on a domain without MX loses every
 * answer silently, which is how a board finds out weeks later.
 */

const TIMEOUT_MS = 4000;

type Verdict = { address: string; domain: string; receives: boolean | null };

async function hasMx(domain: string): Promise<boolean | null> {
    try {
        const records = await Promise.race([
            resolveMx(domain),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS)),
        ]);
        return records.some((r) => r.exchange && r.exchange !== ".");
    } catch (error) {
        const code = (error as { code?: string }).code;
        // No records or no such domain: it does not receive. Anything else: unknown
        return code === "ENODATA" || code === "ENOTFOUND" ? false : null;
    }
}

export const checkMailDomains = action({
    args: { addresses: v.array(v.string()) },
    handler: async (ctx, args): Promise<Verdict[]> => {
        if (!(await ctx.runQuery(api.lib.actionAuth.isAdminCaller))) throw new ConvexError("Sem permissão.");
        const unique = [...new Set(args.addresses.map((a) => a.trim().toLowerCase()).filter((a) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a)))].slice(0, 5);
        const byDomain = new Map<string, Promise<boolean | null>>();
        return Promise.all(unique.map(async (address) => {
            const domain = address.split("@")[1];
            if (!byDomain.has(domain)) byDomain.set(domain, hasMx(domain));
            return { address, domain, receives: await (byDomain.get(domain) as Promise<boolean | null>) };
        }));
    },
});
