import { httpAction, internalQuery, type QueryCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { toExcerpt } from "./lib/text";
import { renderSharePage, type ShareCard } from "./lib/shareHtml";

/**
 * Link previews for shared events and articles. Only published content is
 * described: a draft's slug leaked in a message must not preview its contents.
 */

const cardShape = v.union(
    v.null(),
    v.object({
        title: v.string(),
        description: v.string(),
        image: v.optional(v.string()),
        siteName: v.string(),
    }),
);

async function siteName(ctx: QueryCtx) {
    const settings = await ctx.db.query("settings").first();
    return settings?.siteName ?? "Community Platform";
}

export const eventCard = internalQuery({
    args: { slug: v.string() },
    returns: cardShape,
    handler: async (ctx, { slug }) => {
        const event = await ctx.db
            .query("events")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
        if (!event || event.status !== "published") return null;

        const when = new Date(event.date);
        const dateLine = Number.isNaN(when.getTime())
            ? ""
            : when.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Lisbon" });
        const day = dateLine ? `${dateLine.charAt(0).toUpperCase()}${dateLine.slice(1)}` : "";
        const lead = [day, event.location].filter(Boolean).join(" · ");
        const image = event.image ? (await ctx.storage.getUrl(event.image)) ?? undefined : event.externalImage;

        return {
            title: event.title,
            description: [lead, toExcerpt(event.description)].filter(Boolean).join(" — "),
            image: image || undefined,
            siteName: await siteName(ctx),
        };
    },
});

export const postCard = internalQuery({
    args: { slug: v.string() },
    returns: cardShape,
    handler: async (ctx, { slug }) => {
        const post = await ctx.db
            .query("posts")
            .withIndex("by_slug", (q) => q.eq("slug", slug))
            .first();
        if (!post || !post.published) return null;

        const image = post.coverImage ? (await ctx.storage.getUrl(post.coverImage)) ?? undefined : post.externalImage;
        return {
            title: post.title,
            description: post.excerpt || toExcerpt(post.content),
            image: image || undefined,
            siteName: await siteName(ctx),
        };
    },
});

/**
 * The public site origin, from SITE_URL only. Request headers are never used:
 * Host and X-Forwarded-Host are chosen by the caller, and a page cached for
 * crawlers would otherwise carry, and redirect people to, whatever domain an
 * attacker put in them.
 */
function siteOrigin(): string | null {
    const configured = process.env.SITE_URL;
    if (!configured) return null;
    try {
        return new URL(configured).origin;
    } catch {
        return null;
    }
}

function htmlResponse(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            "Content-Type": "text/html; charset=utf-8",
            // Crawlers cache previews on their side; a short edge cache keeps a
            // corrected poster from lingering for days
            "Cache-Control": "public, max-age=300",
            "X-Robots-Tag": "noindex",
            // Served on the site's own URL in proxy mode: a shared cache must not
            // hand this crawler page to a person opening the same address
            "Vary": "User-Agent",
        },
    });
}

/** `/share/events/<slug>` and `/share/blog/<slug>`. */
export const sharePage = httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const [, , kind, rawSlug] = url.pathname.split("/");
    let slug = "";
    try {
        slug = decodeURIComponent(rawSlug ?? "");
    } catch {
        slug = ""; // A malformed escape is just an unknown address
    }
    const origin = siteOrigin();
    if (!origin) {
        // Without a trusted origin there is no safe canonical URL to describe or redirect to
        return new Response("Link previews need SITE_URL on this deployment.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        });
    }

    if (!slug || (kind !== "events" && kind !== "blog")) {
        return Response.redirect(origin, 302);
    }

    const card = kind === "events"
        ? await ctx.runQuery(internal.share.eventCard, { slug })
        : await ctx.runQuery(internal.share.postCard, { slug });

    const canonicalUrl = `${origin}/${kind}/${encodeURIComponent(slug)}`;
    if (!card) {
        // Unknown or unpublished: send people to the list, describe nothing
        return Response.redirect(`${origin}/${kind}`, 302);
    }

    const page: ShareCard = {
        siteName: card.siteName,
        title: card.title,
        description: card.description,
        image: card.image,
        canonicalUrl,
        type: kind === "events" ? "event" : "article",
    };
    return htmlResponse(renderSharePage(page));
});
