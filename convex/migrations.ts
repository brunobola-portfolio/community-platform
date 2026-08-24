// One-off idempotent content migrations, run via `npx convex run` (dev/prod).
// Aligns existing deployments with the original ARCVA site identity: real board
// member photos, real supporters and the recovered event poster albums.
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { INITIAL_MEMBERS, INITIAL_SPONSORS, INITIAL_ALBUMS, INITIAL_EVENTS } from "./mockData";

// Attach an uploaded storage file to a member, keyed by natural key (name+group).
// Used by the asset-upload script so real photos live in Convex storage and do
// not depend on the static hosting being up to date.
export const setMemberPhotoByName = internalMutation({
    args: {
        name: v.string(),
        group: v.string(),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const member = (await ctx.db.query("members").collect()).find(
            (m) => m.name === args.name && m.group === args.group
        );
        if (!member) throw new Error(`Membro nao encontrado: ${args.name} (${args.group})`);
        if (member.photo && member.photo !== args.storageId) {
            try { await ctx.storage.delete(member.photo); } catch (e) {
                console.warn("Storage delete falhou (membro):", e);
            }
        }
        await ctx.db.patch(member._id, { photo: args.storageId });
        return `ok: ${args.name}`;
    },
});

// Insert the real ARCVA events (petanca club, matraquilhos, copa, monthly
// walks) confirmed via public sources. Idempotent: keyed by slug, existing
// events are never touched. Run with `npx convex run migrations:addRealArcvaEvents`.
export const addRealArcvaEvents = internalMutation({
    args: {},
    handler: async (ctx) => {
        const REAL_SLUGS = new Set([
            "torneio-amigavel-petanca-2026",
            "torneio-aberto-petanca-2025",
            "torneio-matraquilhos-2026",
            "torneio-copa-2026",
            "caminhada-mensal-agosto-2026",
        ]);
        const categories = await ctx.db.query("categories").collect();
        const categoryBySlug = new Map(categories.map((c) => [c.slug, c._id]));
        const CATEGORY_SLUG_BY_MOCK_ID: Record<number, string> = { 3: "desporto", 6: "lazer" };

        let created = 0;
        for (const eventItem of INITIAL_EVENTS) {
            const event = eventItem as Record<string, unknown>;
            const slug = event.slug as string;
            if (!REAL_SLUGS.has(slug)) continue;
            const existing = await ctx.db
                .query("events")
                .withIndex("by_slug", (q) => q.eq("slug", slug))
                .first();
            if (existing) continue;

            const mockCategoryId = event.categoryId as number;
            const categoryId = categoryBySlug.get(CATEGORY_SLUG_BY_MOCK_ID[mockCategoryId] ?? "eventos");
            await ctx.db.insert("events", {
                title: event.title as string,
                description: event.description as string,
                date: event.date as string,
                location: event.location as string,
                categoryId: (categoryId as string) ?? String(mockCategoryId),
                slug,
                externalImage: event.imageUrl as string,
                status: "published",
                isHighlight: event.isHighlight === true,
                isTournament: event.isTournament === true,
                tournamentType: event.tournamentType as string | undefined,
                registrationOpen: event.registrationOpen === true,
                maxParticipants: event.maxParticipants as number | undefined,
            });
            created++;
        }
        const summary = `eventos reais criados: ${created}/${REAL_SLUGS.size}`;
        console.log("addRealArcvaEvents:", summary);
        return summary;
    },
});

// Seed the history timeline into the new milestones table so the page
// becomes backoffice-editable. Idempotent: keyed by year, existing rows
// are never touched. Run with `npx convex run migrations:seedMilestones`.
export const seedMilestones = internalMutation({
    args: {},
    handler: async (ctx) => {
        const MILESTONES = [
            { year: 1982, order: 1, title: "A Fundação", description: "A 28 de janeiro, a ARCVA nasce do sonho de um grupo de residentes locais. Sem instalações próprias, a primeira sede funcionou numa casa antiga remodelada, que rapidamente se tornou o coração pulsante da aldeia.", externalImage: "https://images.unsplash.com/photo-1577083288073-40892c0860a4?q=80&w=2070&auto=format&fit=crop" },
            { year: 1990, order: 2, title: "O Grande Projeto", description: "A ambição cresce. Num terreno doado pela Câmara Municipal de Alcanena, lançam-se as primeiras pedras do que viria a ser o Pavilhão. A construção avançou com a força braçal de voluntários que dedicavam os seus sábados à causa.", externalImage: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=2070&auto=format&fit=crop" },
            { year: 1993, order: 3, title: "Resiliência", description: "Após uma breve paragem nas obras, a comunidade une-se novamente. Com novos apoios e materiais doados pela população, o 'esqueleto' de betão começa a ganhar forma final, desenhando a silhueta que hoje conhecemos.", externalImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=2070&auto=format&fit=crop" },
            { year: 1994, order: 4, title: "A Inauguração", description: "A 26 de julho, o sonho materializa-se. O Eng.º Carlos Cunha inaugura o complexo desportivo de 1170m². Vale Alto celebra a abertura de um espaço com bancadas, balneários, bar e salas de convívio.", externalImage: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=2070&auto=format&fit=crop" },
            { year: 2019, order: 5, title: "Nova Era", description: "Eleição de novos órgãos sociais e revitalização total da marca. A ARCVA moderniza-se, digitaliza processos e renova a sua oferta cultural, mantendo o espírito dos fundadores mas olhando para o futuro.", externalImage: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?q=80&w=2070&auto=format&fit=crop" },
        ];
        const existing = await ctx.db.query("milestones").collect();
        const existingYears = new Set(existing.map((m) => m.year));
        let created = 0;
        for (const m of MILESTONES) {
            if (existingYears.has(m.year)) continue;
            await ctx.db.insert("milestones", m);
            created++;
        }
        const summary = `milestones criados: ${created}/${MILESTONES.length}`;
        console.log("seedMilestones:", summary);
        return summary;
    },
});

export const applyOriginalContent = internalMutation({
    args: {},
    handler: async (ctx) => {
        const report: string[] = [];

        // 1. Members: point each board member at the original site photo.
        // Any stored placeholder/stock photo is removed so externalPhoto wins.
        const members = await ctx.db.query("members").collect();
        let membersPatched = 0;
        for (const real of INITIAL_MEMBERS) {
            const match = members.find(
                (m) => m.name === real.name && m.group === real.group
            );
            if (!match) {
                await ctx.db.insert("members", {
                    name: real.name,
                    role: real.role,
                    group: real.group,
                    order: real.order,
                    externalPhoto: real.photoUrl,
                });
                membersPatched++;
                continue;
            }
            // Already migrated: externalPhoto points at the real photo and any
            // storage photo present was uploaded intentionally afterwards
            // (uploadMemberPhotos.mjs) — leave it alone.
            if (match.externalPhoto === real.photoUrl) continue;
            if (match.photo) {
                try { await ctx.storage.delete(match.photo); } catch (e) {
                    console.warn("Storage delete falhou (membro):", e);
                }
            }
            await ctx.db.patch(match._id, {
                externalPhoto: real.photoUrl,
                photo: undefined,
                role: real.role,
                order: real.order,
            });
            membersPatched++;
        }
        report.push(`members: ${membersPatched} atualizados`);

        // 2. Sponsors: keep only the real supporters from the original site.
        const realNames = new Set(INITIAL_SPONSORS.map((s) => s.name));
        const sponsors = await ctx.db.query("sponsors").collect();
        let sponsorsRemoved = 0;
        for (const sponsor of sponsors) {
            if (realNames.has(sponsor.name)) continue;
            if (sponsor.logo) {
                try { await ctx.storage.delete(sponsor.logo); } catch (e) {
                    console.warn("Storage delete falhou (sponsor):", e);
                }
            }
            await ctx.db.delete(sponsor._id);
            sponsorsRemoved++;
        }
        let sponsorsUpserted = 0;
        for (const real of INITIAL_SPONSORS) {
            const match = sponsors.find((s) => s.name === real.name);
            if (match) {
                if (match.externalLogo !== real.logoUrl || match.logo) {
                    if (match.logo) {
                        try { await ctx.storage.delete(match.logo); } catch (e) {
                            console.warn("Storage delete falhou (sponsor):", e);
                        }
                    }
                    await ctx.db.patch(match._id, {
                        externalLogo: real.logoUrl,
                        logo: undefined,
                        tier: real.tier,
                        website: real.website,
                        active: true,
                    });
                    sponsorsUpserted++;
                }
            } else {
                await ctx.db.insert("sponsors", {
                    name: real.name,
                    tier: real.tier,
                    externalLogo: real.logoUrl,
                    website: real.website,
                    active: true,
                });
                sponsorsUpserted++;
            }
        }
        report.push(`sponsors: ${sponsorsRemoved} removidos, ${sponsorsUpserted} atualizados`);

        // 3. Albums: recovered original event posters, keyed by title.
        const albums = await ctx.db.query("albums").collect();
        let albumsCreated = 0;
        for (const real of INITIAL_ALBUMS) {
            const existing = albums.find((a) => a.title === real.title);
            if (existing) continue;
            const albumId = await ctx.db.insert("albums", {
                title: real.title,
                date: real.date,
                externalCover: real.coverUrl,
            });
            for (const photo of real.photos) {
                await ctx.db.insert("galleryImages", {
                    albumId,
                    externalUrl: photo,
                    uploadedAt: Date.now(),
                });
            }
            albumsCreated++;
        }
        report.push(`albums: ${albumsCreated} criados`);

        // 3b. Events: restore tournament metadata that the original seeder
        // stripped (isTournament, tournamentType, registrationOpen, isHighlight).
        let eventsPatched = 0;
        for (const real of INITIAL_EVENTS) {
            const event = real as Record<string, unknown>;
            const existing = await ctx.db
                .query("events")
                .withIndex("by_slug", (q) => q.eq("slug", event.slug as string))
                .first();
            if (!existing) continue;
            const patch: Record<string, unknown> = {};
            if (existing.isTournament === undefined && event.isTournament !== undefined) patch.isTournament = event.isTournament;
            if (existing.tournamentType === undefined && event.tournamentType !== undefined) patch.tournamentType = event.tournamentType;
            if (existing.registrationOpen === undefined && event.registrationOpen !== undefined) patch.registrationOpen = event.registrationOpen;
            if (existing.isHighlight === undefined && event.isHighlight !== undefined) patch.isHighlight = event.isHighlight;
            if (existing.maxParticipants === undefined && event.maxParticipants !== undefined) patch.maxParticipants = event.maxParticipants;
            if (Object.keys(patch).length > 0) {
                await ctx.db.patch(existing._id, patch);
                eventsPatched++;
            }
        }
        report.push(`events: ${eventsPatched} com metadados de torneio repostos`);

        // 3c. Posts: seed data attributed articles to invented people with
        // stock avatars; normalize authorship to the board.
        const FAKE_AUTHORS = new Set(["António Rocha", "Carlos Mendes", "Direção"]);
        const posts = await ctx.db.query("posts").collect();
        let postsPatched = 0;
        for (const post of posts) {
            if (!FAKE_AUTHORS.has(post.author)) continue;
            await ctx.db.patch(post._id, {
                author: "Direção ARCVA",
                authorRole: "Comunicação",
                authorAvatar: undefined,
            });
            postsPatched++;
        }
        report.push(`posts: ${postsPatched} com autoria normalizada`);

        // 4. Remove seed-era demo albums (stock photos, fictitious events).
        const FAKE_ALBUM_TITLES = new Set([
            "Festa de Verão 2025",
            "Torneio de Futsal 24H",
            "Caminhada da Primavera",
            "Jantar de Aniversário 42 Anos",
            "Renovação da Sede",
            "Torneio de Sueca",
        ]);
        let albumsRemoved = 0;
        for (const album of albums) {
            if (!FAKE_ALBUM_TITLES.has(album.title)) continue;
            const images = await ctx.db
                .query("galleryImages")
                .withIndex("by_album", (q) => q.eq("albumId", album._id))
                .collect();
            for (const img of images) {
                if (img.storageId) {
                    try { await ctx.storage.delete(img.storageId); } catch (e) {
                        console.warn("Storage delete falhou (galleryImage):", e);
                    }
                }
                await ctx.db.delete(img._id);
            }
            if (album.coverId) {
                try { await ctx.storage.delete(album.coverId); } catch (e) {
                    console.warn("Storage delete falhou (albumCover):", e);
                }
            }
            await ctx.db.delete(album._id);
            albumsRemoved++;
        }
        report.push(`albums fake removidos: ${albumsRemoved}`);

        // 4b. Remove test/demo categories that no event or post references.
        const INITIAL_CATEGORY_SLUGS = new Set([
            "institucional", "eventos", "desporto", "solidariedade", "cultura", "lazer", "formacao",
        ]);
        const allEvents = await ctx.db.query("events").collect();
        const allPosts = await ctx.db.query("posts").collect();
        const referencedCategoryIds = new Set([
            ...allEvents.map((e) => e.categoryId),
            ...allPosts.map((p) => p.categoryId),
        ]);
        const categories = await ctx.db.query("categories").collect();
        let categoriesRemoved = 0;
        for (const cat of categories) {
            if (INITIAL_CATEGORY_SLUGS.has(cat.slug)) continue;
            if (referencedCategoryIds.has(cat._id)) continue;
            await ctx.db.delete(cat._id);
            categoriesRemoved++;
        }
        report.push(`categorias orfas removidas: ${categoriesRemoved}`);

        // 5. Settings: replace known placeholder phone numbers with the real
        // contact, provided via env var so personal data never lives in the
        // repository (npx convex env set SITE_PHONE "+351 ..." before running)
        const realPhone = process.env.SITE_PHONE;
        const PLACEHOLDER_PHONES = ["+351 212 345 678", "+351 249 979 123"];
        const settings = await ctx.db.query("settings").first();
        if (realPhone && settings && (!settings.phone || PLACEHOLDER_PHONES.includes(settings.phone))) {
            await ctx.db.patch(settings._id, { phone: realPhone });
            report.push("settings: telefone atualizado");
        }

        console.log("applyOriginalContent:", report.join(" | "));
        return report.join(" | ");
    },
});
