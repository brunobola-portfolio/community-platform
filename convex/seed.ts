import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
    INITIAL_EVENTS, INITIAL_POSTS, INITIAL_MEMBERS, INITIAL_SPONSORS,
    INITIAL_CATEGORIES, INITIAL_NOTIFICATIONS,
    INITIAL_ACTION_AREAS, INITIAL_STATS, INITIAL_SPONSOR_TIERS, INITIAL_DOCUMENTS
} from "./mockData";

// Hardened fetch profile to avoid hotlink/UA blocks on Wikimedia, gov.pt, etc.
const FETCH_HEADERS: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 (compatible; CommunityPlatform-Seed/2.0)",
    "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    "Accept-Language": "pt-PT,pt;q=0.9,en;q=0.8",
};
const FETCH_TIMEOUT_MS = 30_000;
const MAX_ATTEMPTS = 3;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Deterministic colour pair from label so each placeholder has a stable, unique identity
const placeholderPalette = (label: string) => {
    let hash = 0;
    for (let i = 0; i < label.length; i++) hash = (hash * 31 + label.charCodeAt(i)) | 0;
    // Brand-aligned palette: deep, saturated, modern. Each entry = [from, to, accent].
    const palettes: Array<[string, string, string]> = [
        ["#0e7490", "#0891b2", "#67e8f9"], // brand cyan
        ["#0f766e", "#0d9488", "#5eead4"], // teal
        ["#5b21b6", "#7c3aed", "#c4b5fd"], // violet
        ["#9d174d", "#db2777", "#f9a8d4"], // pink
        ["#9a3412", "#ea580c", "#fed7aa"], // amber
        ["#365314", "#65a30d", "#bef264"], // lime
        ["#1e3a8a", "#2563eb", "#93c5fd"], // blue
        ["#7f1d1d", "#dc2626", "#fca5a5"], // red
        ["#312e81", "#4338ca", "#a5b4fc"], // indigo
    ];
    return palettes[Math.abs(hash) % palettes.length];
};

// Elegant SVG placeholder — used as last-resort image so every record always has a polished visual.
// Glassmorphism-aligned: deep gradient + soft mesh + monogram badge with brand-style rings.
const buildPlaceholderSvg = (label: string): Blob => {
    const safe = label.replace(/[<>&"']/g, "");
    const words = safe.split(/\s+/).filter(Boolean);
    const initials = (words.length >= 2
        ? words[0][0] + words[words.length - 1][0]
        : words[0]?.slice(0, 2) ?? "?").toUpperCase();
    const [from, to, accent] = placeholderPalette(safe);
    // Stable pseudo-random offsets from hash so each placeholder is visually distinct yet deterministic.
    let h = 0;
    for (let i = 0; i < safe.length; i++) h = (h * 17 + safe.charCodeAt(i)) | 0;
    const cx1 = 80 + (Math.abs(h) % 80);
    const cy1 = 80 + (Math.abs(h >> 3) % 80);
    const cx2 = 280 + (Math.abs(h >> 5) % 60);
    const cy2 = 280 + (Math.abs(h >> 7) % 60);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" role="img" aria-label="${safe}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${from}"/>
      <stop offset="100%" stop-color="${to}"/>
    </linearGradient>
    <radialGradient id="glow1" cx="${cx1}" cy="${cy1}" r="160" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glow2" cx="${cx2}" cy="${cy2}" r="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.2"/>
    </filter>
  </defs>
  <rect width="400" height="400" fill="url(#bg)"/>
  <rect width="400" height="400" fill="url(#glow1)"/>
  <rect width="400" height="400" fill="url(#glow2)"/>
  <circle cx="200" cy="200" r="118" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>
  <circle cx="200" cy="200" r="92" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.28)" stroke-width="1.5"/>
  <text x="200" y="200" font-family="ui-sans-serif,-apple-system,Segoe UI,Inter,system-ui,sans-serif"
        font-size="84" font-weight="600" letter-spacing="-2" fill="white"
        text-anchor="middle" dominant-baseline="central" filter="url(#soft)">${initials}</text>
  <text x="200" y="346" font-family="ui-sans-serif,-apple-system,Segoe UI,Inter,system-ui,sans-serif"
        font-size="13" font-weight="500" letter-spacing="3" fill="rgba(255,255,255,0.65)"
        text-anchor="middle" text-transform="uppercase">Portal</text>
</svg>`;
    return new Blob([svg], { type: "image/svg+xml" });
};

export const seed = internalAction({
    args: {},
    handler: async (ctx) => {
        // Fetch with retry + timeout + content-type validation
        const fetchImageBlob = async (url: string): Promise<Blob> => {
            let lastErr: unknown;
            for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
                const controller = new AbortController();
                const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
                try {
                    const res = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal, redirect: "follow" });
                    clearTimeout(timer);
                    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
                    const ct = (res.headers.get("content-type") || "").toLowerCase();
                    const blob = await res.blob();
                    if (blob.size < 100) throw new Error(`Imagem demasiado pequena (${blob.size} bytes)`);
                    if (!ct.startsWith("image/") && !ct.includes("octet-stream")) {
                        throw new Error(`Content-type não é imagem: ${ct || "<vazio>"}`);
                    }
                    return blob;
                } catch (e) {
                    clearTimeout(timer);
                    lastErr = e;
                    if (attempt < MAX_ATTEMPTS) await sleep(500 * 2 ** (attempt - 1));
                }
            }
            throw lastErr instanceof Error ? lastErr : new Error(String(lastErr));
        };

        // Push blob into Convex storage; undefined on storage failure (recoverable, seed continues)
        const persistBlob = async (blob: Blob) => {
            try {
                const uploadUrl = await ctx.runMutation(internal.seedHelpers.generateUploadUrl, {});
                const result = await fetch(uploadUrl, {
                    method: "POST",
                    headers: { "Content-Type": blob.type || "application/octet-stream" },
                    body: blob,
                });
                if (!result.ok) throw new Error(`Convex storage HTTP ${result.status}`);
                const { storageId } = await result.json();
                return storageId;
            } catch (e) {
                console.error("[Seed] Falha a gravar blob no storage Convex:", e);
                return undefined;
            }
        };

        // Public helper: try URL, fall back to deterministic SVG placeholder using label.
        // Garante que cada registo fica sempre com imagem mesmo se a fonte externa cair.
        const uploadImage = async (url?: string, fallbackLabel?: string) => {
            // Relative paths are bundled site assets (public/images/...); the frontend
            // serves them directly via the external* field, so skip storage upload.
            if (url && url.startsWith("/")) return undefined;
            let blob: Blob | undefined;
            if (url && url.startsWith("http")) {
                try {
                    blob = await fetchImageBlob(url);
                } catch (e) {
                    console.warn(`[Seed] Fetch falhou após ${MAX_ATTEMPTS} tentativas: ${url}`, e instanceof Error ? e.message : e);
                }
            }
            if (!blob) {
                if (!fallbackLabel) return undefined;
                console.log(`[Seed] A gerar placeholder SVG para "${fallbackLabel}".`);
                blob = buildPlaceholderSvg(fallbackLabel);
            }
            return await persistBlob(blob);
        };

        console.log("Starting seeding process...");

        // 1. Categories
        console.log("Seeding Categories...");
        for (const cat of INITIAL_CATEGORIES) {
            await ctx.runMutation(internal.seedHelpers.createCategory, {
                name: cat.name,
                slug: cat.slug,
                type: 'general',
                color: cat.color
            });
        }

        // Build mock numeric ID -> Convex category ID map
        const categorySlugMap: Record<number, string> = {};
        for (const cat of INITIAL_CATEGORIES) {
            const convexCats = await ctx.runQuery(internal.seedHelpers.listCategories, {});
            const match = convexCats.find((c: any) => c.slug === cat.slug);
            if (match) categorySlugMap[cat.id] = match._id;
        }

        // 2. Events
        console.log("Seeding Events...");
        const eventIdMap: Record<number, string> = {};
        for (const eventItem of INITIAL_EVENTS) {
            const event = eventItem as any;
            const storageId = await uploadImage(event.imageUrl, event.title);

            const { id, imageUrl, categoryId, category, createdAt, updatedAt, ...eventData } = event;

            const realId = await ctx.runMutation(internal.seedHelpers.createEvent, {
                ...eventData,
                categoryId: categorySlugMap[categoryId] || String(categoryId),
                image: storageId,
                externalImage: imageUrl,
                status: event.status || 'published'
            });
            eventIdMap[id] = realId;
        }

        // 3. Posts
        console.log("Seeding Posts...");
        for (const postItem of INITIAL_POSTS) {
            const post = postItem as any;
            const storageId = await uploadImage(post.coverUrl, post.title);

            const { id, coverUrl, categoryId, category, updatedAt, ...postData } = post;

            await ctx.runMutation(internal.seedHelpers.createPost, {
                ...postData,
                categoryId: categorySlugMap[categoryId] || String(categoryId),
                coverImage: storageId,
                externalImage: coverUrl
            });
        }

        // 4. Members
        console.log("Seeding Members...");
        await ctx.runMutation(internal.seedHelpers.clearMembers, {});

        for (const member of INITIAL_MEMBERS) {
            const storageId = await uploadImage(member.photoUrl, member.name);

            const { id, photoUrl, group, ...memberData } = member;

            await ctx.runMutation(internal.seedHelpers.createMember, {
                ...memberData,
                group: group,
                photo: storageId,
                externalPhoto: photoUrl
            });
        }

        // 5. Sponsors
        console.log("Seeding Sponsors...");
        for (const sponsor of INITIAL_SPONSORS) {
            const storageId = await uploadImage(sponsor.logoUrl, sponsor.name);

            const { id, logoUrl, tier, ...sponsorData } = sponsor;

            await ctx.runMutation(internal.seedHelpers.createSponsor, {
                ...sponsorData,
                tier: tier.toLowerCase(),
                logo: storageId,
                externalLogo: logoUrl
            });
        }

        // 6. Notifications
        console.log("Seeding Notifications...");
        for (const notif of INITIAL_NOTIFICATIONS) {
            await ctx.runMutation(internal.seedHelpers.createNotification, {
                title: notif.title,
                message: notif.message,
                type: (notif.type.toLowerCase() === "urgent" ? "warning" : notif.type.toLowerCase()) as "info" | "success" | "warning",
                target: (["all", "admin", "user"].includes(notif.target.toLowerCase()) ? notif.target.toLowerCase() : "all") as "all" | "admin" | "user"
            });
        }

        // 7. Action Areas
        console.log("Seeding Action Areas...");
        for (const aa of INITIAL_ACTION_AREAS) {
            const storageId = await uploadImage(aa.externalImage, aa.title);
            try {
                await ctx.runMutation(internal.seedHelpers.createActionArea, {
                    title: aa.title,
                    subtitle: aa.subtitle,
                    description: aa.description,
                    longDescription: aa.longDescription,
                    features: aa.features,
                    externalImage: aa.externalImage,
                    iconName: aa.iconName,
                    order: aa.order,
                    image: storageId || undefined
                });
            } catch (err) {
                console.error(`Failed to create action area ${aa.title}:`, err);
                throw err;
            }
        }

        // 8. Stats
        console.log("Seeding Stats...");
        for (const stat of INITIAL_STATS) {
            await ctx.runMutation(internal.seedHelpers.upsertStat, stat);
        }

        // 9. Sponsor Tiers
        console.log("Seeding Sponsor Tiers...");
        for (const tier of INITIAL_SPONSOR_TIERS) {
            await ctx.runMutation(internal.seedHelpers.upsertSponsorTier, tier);
        }

        // 10. Documents
        console.log("Seeding Documents...");
        for (const doc of INITIAL_DOCUMENTS) {
            try {
                await ctx.runMutation(internal.seedHelpers.createDocument, {
                    title: doc.title,
                    category: doc.category,
                    date: doc.date,
                    size: doc.size,
                    fileId: undefined,
                    externalUrl: doc.url || undefined,
                    description: ""
                });
            } catch (err) {
                console.error(`Failed to create document ${doc.title}:`, err);
                throw err;
            }
        }

        // 11. Settings
        console.log("Seeding Settings...");
        await ctx.runMutation(internal.seedHelpers.updateSettings, {
            // Fictitious demo identity: the real association is configured in
            // Admin > Definições (see docs/WHITE-LABEL.md)
            siteName: "ACR Vila Nova",
            siteFullName: "Associação Cultural e Recreativa de Vila Nova",
            locality: "Vila Nova",
            foundedYear: "1985",
            heroTagline: "Cultura. Desporto. Comunidade.",
            heroSubtitle: "Desde 1985 a construir o futuro da comunidade.",
            maintenanceMode: false,
            currentMandate: "2024-2026",
            contactEmail: "geral@exemplo.pt",
            phone: "+351 212 345 678",
            address: "Rua da Associação, 1, 0000-000 Vila Nova",
            latitude: "38.7223",
            longitude: "-9.1393",
            enableChatbot: true,
            showChatbotBubble: true,
            chatModel: "gemini-3.5-flash",
            chatModelFallback: "gemini-3.5-flash-lite",
            ttsModel: "gemini-2.5-flash-preview-tts",
            imageModel: "gemini-3.1-flash-image",
            thinkingBudget: 512,
            defaultImageStyle: "Cinematic lighting, photorealistic, 4k, community atmosphere, warm tones",
            contentTone: "Profissional e Inspirador",
            imageResolution: "1k",
            aiGuardrailsEnabled: true,
            aiAllowedTopics: "associação, eventos, cultura, desporto, comunidade",
            aiForbiddenTopics: "política partidária, religião, aconselhamento médico, conteúdo adulto",
        });

        console.log("Seeding complete!");
    }
});
