/**
 * Provider-agnostic chat completion layer.
 *
 * The portal defaults to Google Gemini (grounding, TTS and image generation
 * stay Gemini-only), but plain text chat/classification/enhancement can be
 * served by any OpenAI-compatible endpoint: OpenRouter or a self-hosted model
 * (Ollama, LM Studio, vLLM). Selection and credentials live in the settings
 * table (Admin > IA & Chatbot) with env vars as fallback.
 */

export type AiProviderKind = "gemini" | "openrouter" | "custom";

export interface ProviderSettings {
    aiProvider?: string;
    openrouterApiKey?: string;
    openrouterModel?: string;
    customApiUrl?: string;
    customApiKey?: string;
    customModel?: string;
}

export interface ResolvedProvider {
    kind: AiProviderKind;
    /** OpenAI-compatible base URL, only for non-Gemini providers */
    baseUrl?: string;
    apiKey?: string;
    model?: string;
}

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const COMPLETION_TIMEOUT_MS = 60_000;

export function resolveProvider(settings: ProviderSettings | null): ResolvedProvider {
    const kind = (settings?.aiProvider ?? process.env.AI_PROVIDER ?? "gemini") as AiProviderKind;

    if (kind === "openrouter") {
        return {
            kind,
            baseUrl: OPENROUTER_BASE_URL,
            apiKey: settings?.openrouterApiKey || process.env.OPENROUTER_API_KEY,
            model: settings?.openrouterModel || process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        };
    }
    if (kind === "custom") {
        return {
            kind,
            baseUrl: (settings?.customApiUrl || process.env.CUSTOM_AI_URL || "").replace(/\/$/, ""),
            apiKey: settings?.customApiKey || process.env.CUSTOM_AI_API_KEY,
            model: settings?.customModel || process.env.CUSTOM_AI_MODEL || "llama3.1",
        };
    }
    return { kind: "gemini" };
}

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

/**
 * Call an OpenAI-compatible /chat/completions endpoint. Returns the assistant
 * text. Throws on missing configuration or upstream failure; callers map the
 * error into the existing ERR_* token flow.
 */
export async function openAiCompatibleChat(
    provider: ResolvedProvider,
    messages: ChatMessage[],
): Promise<string> {
    if (!provider.baseUrl) {
        throw new Error("Endpoint do fornecedor de IA não configurado (customApiUrl).");
    }
    if (provider.kind === "openrouter" && !provider.apiKey) {
        throw new Error("OPENROUTER_API_KEY não configurada (Admin > IA & Chatbot ou Convex env).");
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (provider.apiKey) headers["Authorization"] = `Bearer ${provider.apiKey}`;
    if (provider.kind === "openrouter") {
        // Attribution headers recommended by OpenRouter
        headers["HTTP-Referer"] = process.env.SITE_URL ?? "https://github.com/BolaLabs/community-platform";
        headers["X-Title"] = "Community Platform";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), COMPLETION_TIMEOUT_MS);
    try {
        const res = await fetch(`${provider.baseUrl}/chat/completions`, {
            method: "POST",
            headers,
            signal: controller.signal,
            body: JSON.stringify({
                model: provider.model,
                messages,
                temperature: 0.7,
            }),
        });
        if (!res.ok) {
            const body = await res.text().catch(() => "");
            throw new Error(`Fornecedor de IA devolveu HTTP ${res.status}: ${body.slice(0, 200)}`);
        }
        const data = (await res.json()) as {
            choices?: Array<{ message?: { content?: string } }>;
        };
        const text = data.choices?.[0]?.message?.content;
        if (!text) throw new Error("Fornecedor de IA devolveu resposta vazia.");
        return text;
    } finally {
        clearTimeout(timer);
    }
}
