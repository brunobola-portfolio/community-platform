"use node";

import { action, type ActionCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { api, internal } from "./_generated/api";
import { classifyProviderError } from "./lib/aiShared";
import { formatDay, parseDay } from "./lib/aiStudioDates";
import { coerceEventDraft, coercePostDraft, extractJson, type PosterLines, type StudioCategory, type StudioKind, type StudioResult } from "./lib/aiStudioDraft";
import { buildDraftPrompt, buildPosterPrompt } from "./lib/aiStudioPrompts";
import { draftText } from "./lib/aiStudioText";
import { availableEngines, generateWithFallback, loadReference, storeGeneratedImage, type ImageEngine, type ImageSettings, preferredImageEngine, fallbackReason } from "./lib/aiImage";
import type { ImageData } from "./lib/openRouterRequest";
import type { Id } from "./_generated/dataModel";

/**
 * AI studio: turns a short brief (and optionally last year's poster) into a
 * complete event or news draft, with a generated poster. Nothing is saved
 * here: the browser opens the normal form filled in, and the secretary saves.
 */

const MAX_BRIEF = 2000;
const ENGINE_LABEL: Record<ImageEngine, string> = { gemini: "NanoBanana (Gemini)", openrouter: "OpenRouter" };

async function logAi(ctx: ActionCtx, entry: { userId: string; action: string; model: string; startedAt: number; error?: string }) {
  try {
    await ctx.runMutation(internal.aiLogs.log, {
      userId: entry.userId,
      action: entry.action,
      model: entry.model,
      latencyMs: Date.now() - entry.startedAt,
      success: !entry.error,
      errorMessage: entry.error?.slice(0, 200),
    });
  } catch { /* logging must never fail the draft */ }
}

async function requireStudioAdmin(ctx: ActionCtx): Promise<string> {
  try {
    return (await ctx.runQuery(api.lib.actionAuth.checkAdminAuth)) as string;
  } catch {
    throw new ConvexError("Só administradores podem usar o estúdio de IA.");
  }
}

/** Categories that suit the record; a deployment with untyped categories offers them all. */
async function loadCategories(ctx: ActionCtx, kind: StudioKind): Promise<StudioCategory[]> {
  const all = await ctx.runQuery(api.categories.list);
  const wanted = kind === "event" ? "event" : "blog";
  const typed = all.filter(c => !c.type || c.type === wanted);
  return (typed.length ? typed : all).map(c => ({ id: c._id as string, name: c.name }));
}

async function readReference(ctx: ActionCtx, args: { referenceStorageId?: Id<"_storage">; referenceUrl?: string }, notes: string[]) {
  if (!args.referenceStorageId && !args.referenceUrl) return null;
  try {
    return await loadReference(ctx, { storageId: args.referenceStorageId, url: args.referenceUrl });
  } catch (error) {
    if (error instanceof ConvexError) throw error;
    console.warn("AI studio reference unreadable:", error instanceof Error ? error.message : error);
    notes.push("Não foi possível ler a imagem de referência; o rascunho foi feito só com a descrição.");
    return null;
  }
}

const studioArgs = {
  kind: v.union(v.literal("event"), v.literal("post")),
  brief: v.string(),
  referenceStorageId: v.optional(v.id("_storage")),
  referenceUrl: v.optional(v.string()),
  withImage: v.boolean(),
  posterText: v.boolean(),
  imageEngine: v.optional(v.union(v.literal("gemini"), v.literal("openrouter"))),
  /** The secretary's local day, so "sábado" resolves in her calendar and not in UTC. */
  today: v.string(),
};

export const draft = action({
  args: studioArgs,
  handler: async (ctx, args): Promise<StudioResult> => {
    const userId = await requireStudioAdmin(ctx);
    await ctx.runMutation(internal.lib.rateLimit.checkAndConsume, { key: "ai:studio", userId });

    const brief = args.brief.trim().slice(0, MAX_BRIEF);
    if (brief.length < 3) throw new ConvexError("Descreva em poucas palavras o que quer criar.");
    const today = parseDay(args.today) ? args.today : formatDay(new Date());
    const notes: string[] = [];

    const settings = await ctx.runQuery(internal.settings.getForAI);
    const categories = await loadCategories(ctx, args.kind);
    const reference = await readReference(ctx, args, notes);

    const prompt = buildDraftPrompt({
      kind: args.kind,
      brief,
      today,
      categories,
      hasReference: Boolean(reference),
      identity: {
        siteName: settings?.siteName ?? "associação",
        siteFullName: settings?.siteFullName,
        locality: settings?.locality,
        address: settings?.venueName ?? settings?.address,
        tone: settings?.contentTone ?? "Profissional e Inspirador",
      },
    });

    const textStart = Date.now();
    let reply;
    try {
      reply = await draftText(settings, prompt, reference);
    } catch (error) {
      const raw = error instanceof Error ? error.message : String(error);
      const token = classifyProviderError(raw);
      console.error("AI studio text error:", raw);
      await logAi(ctx, { userId, action: "studioText", model: "unknown", startedAt: textStart, error: `${token}: ${raw}` });
      throw new ConvexError(token);
    }
    await logAi(ctx, { userId, action: "studioText", model: reply.model, startedAt: textStart });

    const json = extractJson(reply.text);
    if (!json) {
      console.error("AI studio: reply was not JSON:", reply.text.slice(0, 300));
      throw new ConvexError("ERR_GENERIC");
    }
    if (reference && !reply.sawReference) {
      notes.push("O modelo de texto disponível não lê imagens: a referência só foi usada no cartaz.");
    }

    const coerceCtx = { brief, today, categories, fallbackLocation: settings?.venueName ?? settings?.address ?? "Sede da associação" };
    const result: StudioResult = { kind: args.kind, notes };
    let imagePrompt: string;
    let lines: PosterLines | undefined;
    if (args.kind === "event") {
      const coerced = coerceEventDraft(json, coerceCtx);
      result.event = coerced.draft;
      notes.push(...coerced.notes);
      imagePrompt = coerced.draft.imagePrompt;
      lines = coerced.draft.posterLines;
    } else {
      const coerced = coercePostDraft(json, coerceCtx);
      result.post = coerced.draft;
      imagePrompt = coerced.draft.imagePrompt;
    }

    if (args.withImage) {
      await attachImage(ctx, { userId, args, settings, reference, imagePrompt, lines, result });
    }
    return result;
  },
});

interface AttachOptions {
  userId: string;
  args: { kind: StudioKind; posterText: boolean; imageEngine?: ImageEngine };
  settings: (ImageSettings & { brandColor?: string; defaultImageStyle?: string; siteName?: string }) | null;
  reference: ImageData | null;
  imagePrompt: string;
  lines?: PosterLines;
  result: StudioResult;
}

/** Generates and stores the poster; any failure becomes a note, never a stock photo. */
async function attachImage(ctx: ActionCtx, o: AttachOptions) {
  const { result } = o;
  const noun = o.args.kind === "event" ? "o cartaz" : "a imagem";
  if (availableEngines(o.settings).length === 0) {
    result.notes.push(`Não há nenhum motor de imagem configurado, por isso o rascunho segue sem ${o.args.kind === "event" ? "cartaz" : "imagem"}.`);
    return;
  }
  const requested = o.args.imageEngine ?? preferredImageEngine(o.settings);
  const prompt = buildPosterPrompt({
    kind: o.args.kind,
    imagePrompt: o.imagePrompt,
    posterText: o.args.posterText,
    lines: o.lines,
    brandColor: o.settings?.brandColor,
    organizer: o.settings?.siteName,
    // A poster with rendered text should not be pushed towards photorealism
    style: o.args.posterText && o.args.kind === "event" ? undefined : o.settings?.defaultImageStyle,
    hasReference: Boolean(o.reference),
  });
  const startedAt = Date.now();
  const { result: generated, errors } = await generateWithFallback({
    prompt, reference: o.reference, settings: o.settings, engine: o.args.imageEngine, aspect: o.args.kind === "event" ? "3:4" : "16:9",
  });
  if (!generated) {
    console.error("AI studio image failed:", errors.join(" | "));
    await logAi(ctx, { userId: o.userId, action: "studioImage", model: requested, startedAt, error: errors.join(" | ") || "no engine" });
    result.notes.push(`Não foi possível criar ${noun} desta vez. Pode gerar de novo no formulário ou carregar uma imagem.`);
    return;
  }
  if (errors.length) {
    // The fallback hid a failure; the AI usage tab must still show why the first engine gave up
    console.warn("AI studio image fallback:", errors.join(" | "));
    await logAi(ctx, { userId: o.userId, action: "studioImage", model: requested, startedAt, error: errors.join(" | ") });
  }
  try {
    const stored = await storeGeneratedImage(ctx, generated.image);
    result.imageUrl = stored.url;
    result.imageEngine = generated.engine;
    await logAi(ctx, { userId: o.userId, action: "studioImage", model: generated.model, startedAt });
    if (generated.engine !== requested) {
      const why = fallbackReason(errors);
      const made = `${noun} foi criad${o.args.kind === "event" ? "o" : "a"} com ${ENGINE_LABEL[generated.engine]}`;
      result.notes.push(why ? `Como ${why}, ${made}.` : `O motor escolhido falhou; ${made}.`);
    }
  } catch (error) {
    const raw = error instanceof Error ? error.message : String(error);
    await logAi(ctx, { userId: o.userId, action: "studioImage", model: generated.model, startedAt, error: raw });
    result.notes.push(`${o.args.kind === "event" ? "O cartaz foi criado" : "A imagem foi criada"} mas não foi possível guardar o ficheiro. Tente gerar de novo no formulário.`);
  }
}
