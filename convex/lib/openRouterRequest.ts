/**
 * Raw OpenRouter calls the OpenAI-compatible text layer cannot express:
 * multimodal input (a reference image) and image output.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface ImageData { base64: string; mimeType: string }

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

interface OpenRouterMessage {
  content?: string | null;
  images?: Array<{ image_url?: { url?: string } }>;
}

export function toDataUrl(image: ImageData): string {
  return `data:${image.mimeType};base64,${image.base64}`;
}

/** "data:image/png;base64,AAAA" → parts; null for anything else. */
export function parseDataUrl(url: string): ImageData | null {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(url);
  return m ? { mimeType: m[1].toLowerCase(), base64: m[2] } : null;
}

export async function openRouterChat(
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number,
): Promise<OpenRouterMessage> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.SITE_URL ?? "https://github.com/brunobola-portfolio/community-platform",
        "X-Title": "Community Platform",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`OpenRouter HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    const data = (await res.json()) as { choices?: Array<{ message?: OpenRouterMessage }>; error?: { message?: string } };
    if (data.error?.message) throw new Error(`OpenRouter: ${data.error.message.slice(0, 200)}`);
    const message = data.choices?.[0]?.message;
    if (!message) throw new Error("OpenRouter devolveu uma resposta vazia.");
    return message;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw new Error("OpenRouter timeout");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
