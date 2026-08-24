/**
 * Admin-only diagnostics for the AI provider settings UI: connection test
 * and model discovery. Form values take precedence over stored settings so
 * the admin can validate before saving; secrets left blank in the form fall
 * back to the stored key (write-only fields never round-trip to the client).
 */

import { action } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import {
    resolveProvider,
    openAiCompatibleChat,
    type ResolvedProvider,
} from "./lib/aiProvider";

const MODELS_TIMEOUT_MS = 15_000;

interface ProviderOverrides {
    provider: string;
    model?: string;
    apiUrl?: string;
    apiKey?: string;
}

/** Merge form overrides with stored settings/env into a ResolvedProvider. */
function buildProvider(
    stored: {
        openrouterApiKey?: string;
        openrouterModel?: string;
        customApiUrl?: string;
        customApiKey?: string;
        customModel?: string;
    } | null,
    o: ProviderOverrides,
): ResolvedProvider {
    const merged = {
        aiProvider: o.provider,
        openrouterApiKey: o.apiKey || stored?.openrouterApiKey,
        openrouterModel: o.model || stored?.openrouterModel,
        customApiUrl: o.apiUrl || stored?.customApiUrl,
        customApiKey: o.apiKey || stored?.customApiKey,
        customModel: o.model || stored?.customModel,
    };
    return resolveProvider(merged);
}

export const testProvider = action({
    args: {
        provider: v.string(),
        model: v.optional(v.string()),
        apiUrl: v.optional(v.string()),
        apiKey: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ ok: boolean; latencyMs: number; model: string; error?: string }> => {
        await ctx.runQuery(api.lib.actionAuth.checkAdminAuth);
        const started = Date.now();

        if (args.provider === "gemini") {
            if (!process.env.GEMINI_API_KEY) {
                return { ok: false, latencyMs: 0, model: "gemini", error: "GEMINI_API_KEY não configurada no Convex Dashboard." };
            }
            try {
                const { GoogleGenAI } = await import("@google/genai");
                const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                const model = args.model || "gemini-2.5-flash";
                const result = await genAI.models.generateContent({
                    model,
                    contents: [{ role: "user", parts: [{ text: "Responde apenas: OK" }] }],
                });
                if (!result.text) throw new Error("Resposta vazia.");
                return { ok: true, latencyMs: Date.now() - started, model };
            } catch (e) {
                return { ok: false, latencyMs: Date.now() - started, model: args.model || "gemini-2.5-flash", error: shortError(e) };
            }
        }

        const stored = await ctx.runQuery(internal.settings.getForAI);
        const provider = buildProvider(stored, args);
        try {
            await openAiCompatibleChat(provider, [
                { role: "user", content: "Responde apenas com a palavra: OK" },
            ]);
            return { ok: true, latencyMs: Date.now() - started, model: provider.model ?? "" };
        } catch (e) {
            return { ok: false, latencyMs: Date.now() - started, model: provider.model ?? "", error: shortError(e) };
        }
    },
});

export const listModels = action({
    args: {
        provider: v.string(),
        apiUrl: v.optional(v.string()),
        apiKey: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ id: string; name: string }[]> => {
        await ctx.runQuery(api.lib.actionAuth.checkAdminAuth);

        if (args.provider === "openrouter") {
            // Public catalog endpoint; no key required
            const data = await fetchJson("https://openrouter.ai/api/v1/models");
            const models = (data as { data?: Array<{ id?: string; name?: string }> }).data ?? [];
            return models
                .filter((m): m is { id: string; name?: string } => Boolean(m.id))
                .map((m) => ({ id: m.id, name: m.name ?? m.id }))
                .sort((a, b) => a.id.localeCompare(b.id));
        }

        if (args.provider === "custom") {
            const stored = await ctx.runQuery(internal.settings.getForAI);
            const baseUrl = (args.apiUrl || stored?.customApiUrl || process.env.CUSTOM_AI_URL || "").replace(/\/$/, "");
            if (!baseUrl) throw new ConvexError("Configura primeiro o URL base do endpoint.");
            const apiKey = args.apiKey || stored?.customApiKey || process.env.CUSTOM_AI_API_KEY;
            const headers: Record<string, string> = {};
            if (apiKey) headers["Authorization"] = `Bearer ${apiKey}`;
            const data = await fetchJson(`${baseUrl}/models`, headers);
            const models = (data as { data?: Array<{ id?: string }> }).data ?? [];
            return models
                .filter((m): m is { id: string } => Boolean(m.id))
                .map((m) => ({ id: m.id, name: m.id }))
                .sort((a, b) => a.id.localeCompare(b.id));
        }

        // Gemini has no public list endpoint worth exposing; curated set
        return [
            { id: "gemini-3-flash-preview", name: "Gemini 3 Flash (Preview)" },
            { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
            { id: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash Lite" },
            { id: "gemini-2.0-flash", name: "Gemini 2.0 Flash" },
            { id: "gemini-2.0-flash-lite", name: "Gemini 2.0 Flash Lite" },
        ];
    },
});

async function fetchJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MODELS_TIMEOUT_MS);
    try {
        const res = await fetch(url, { headers, signal: controller.signal });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new ConvexError(`O endpoint devolveu HTTP ${res.status}${body ? `: ${body.slice(0, 120)}` : ""}`);
        }
        return await res.json();
    } catch (e) {
        if (e instanceof ConvexError) throw e;
        throw new ConvexError(shortError(e));
    } finally {
        clearTimeout(timer);
    }
}

function shortError(e: unknown): string {
    if (e instanceof Error) {
        if (e.name === "AbortError") return "O pedido excedeu o tempo limite.";
        return e.message.slice(0, 200);
    }
    return "Erro desconhecido.";
}
