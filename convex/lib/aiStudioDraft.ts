/**
 * Shapes and coercion of the AI studio drafts.
 *
 * The model is asked for strict JSON, but nothing it returns is trusted: every
 * field is type-checked, clamped and defaulted here, HTML goes through the same
 * sanitiser the events and posts mutations use, and a category the model made
 * up is replaced by a real one. Pure functions, so the rules are tested.
 */

import { sanitizeContentServer } from "./validation";
import { resolveEventDate } from "./aiStudioDates";

export type StudioKind = "event" | "post";

export interface StudioCategory { id: string; name: string }

export interface DraftRegistrationField {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

export interface PosterLines { title: string; date: string; place: string; extra: string }

export interface EventDraft {
  title: string;
  summary: string;
  descriptionHtml: string;
  /** "YYYY-MM-DDTHH:mm" in the association's local time. */
  date: string;
  location: string;
  categoryId: string;
  isTournament: boolean;
  tournamentType: string;
  entryPrice: number;
  maxParticipants: number | null;
  registrationOpen: boolean;
  registrationFields: DraftRegistrationField[];
  imagePrompt: string;
  posterLines: PosterLines;
}

export interface PostDraft {
  title: string;
  excerpt: string;
  contentHtml: string;
  tags: string[];
  categoryId: string;
  imagePrompt: string;
}

/** What the studio action returns to the browser. */
export interface StudioResult {
  kind: StudioKind;
  event?: EventDraft;
  post?: PostDraft;
  imageUrl?: string;
  imageEngine?: string;
  /** Plain pt-PT sentences the secretary should read before saving. */
  notes: string[];
}

export interface CoerceContext {
  brief: string;
  today: string;
  categories: StudioCategory[];
  fallbackLocation: string;
}

const FIELD_TYPES = new Set(["text", "textarea", "number", "date", "phone", "email"]);
/** The registration form always asks these; a duplicate question would confuse whoever signs up. */
const BUILT_IN_FIELD = /^(nome( completo)?|e-?mail|telem[oó]vel|telefone|contacto)$/i;

/** Pulls the JSON object out of a reply that may carry fences or a sentence around it. */
export function extractJson(raw: string): Record<string, unknown> | null {
  const unfenced = raw.replace(/```(?:json)?/gi, "");
  const start = unfenced.indexOf("{");
  const end = unfenced.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed: unknown = JSON.parse(unfenced.slice(start, end + 1));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function str(value: unknown, max: number, fallback = ""): string {
  if (typeof value !== "string" && typeof value !== "number") return fallback;
  const clean = String(value).replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, max) : fallback;
}

export function bool(value: unknown): boolean {
  return value === true || value === "true" || value === "sim";
}

/** Accepts 5, "5", "5,50 €", "5€"; anything else, negative or absurd is 0. */
export function price(value: unknown): number {
  const n = typeof value === "number" ? value : Number(String(value ?? "").replace(",", ".").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(n) || n <= 0 || n > 10_000) return 0;
  return Math.round(n * 100) / 100;
}

/** A positive whole number of places, or null for "no limit". */
export function places(value: unknown): number | null {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1 || n > 100_000) return null;
  return Math.round(n);
}

export function pickCategory(value: unknown, categories: StudioCategory[]): string {
  const wanted = str(value, 100);
  const match = categories.find(c => c.id === wanted)
    ?? categories.find(c => c.name.toLowerCase() === wanted.toLowerCase());
  return match?.id ?? categories[0]?.id ?? "";
}

function escapeText(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sanitised HTML, or the fallback text as a paragraph when the model sent none. */
export function safeHtml(value: unknown, fallbackText: string): string {
  const html = typeof value === "string" ? sanitizeContentServer(value.slice(0, 12_000)).trim() : "";
  if (html.replace(/<[^>]+>/g, "").trim()) return html;
  return fallbackText ? `<p>${escapeText(fallbackText)}</p>` : "";
}

export function registrationFields(value: unknown): DraftRegistrationField[] {
  if (!Array.isArray(value)) return [];
  const fields: DraftRegistrationField[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const entry = item as Record<string, unknown>;
    const label = str(entry.label, 80);
    if (!label || BUILT_IN_FIELD.test(label) || fields.some(f => f.label.toLowerCase() === label.toLowerCase())) continue;
    const type = str(entry.type, 20).toLowerCase();
    fields.push({ id: `field_ai_${fields.length + 1}`, label, type: FIELD_TYPES.has(type) ? type : "text", required: bool(entry.required) });
    if (fields.length >= 6) break;
  }
  return fields;
}

export function coerceEventDraft(raw: Record<string, unknown>, ctx: CoerceContext): { draft: EventDraft; notes: string[] } {
  const notes: string[] = [];
  const title = str(raw.title, 200, "Novo evento");
  const summary = str(raw.summary, 300);
  const date = resolveEventDate(raw.date, ctx.brief, ctx.today);
  if (date.note) notes.push(date.note);
  const isTournament = bool(raw.isTournament);
  const registrationOpen = bool(raw.registrationOpen);
  const poster = (raw.posterLines && typeof raw.posterLines === "object" ? raw.posterLines : {}) as Record<string, unknown>;
  const location = str(raw.location, 200, ctx.fallbackLocation);

  return {
    notes,
    draft: {
      title,
      summary,
      descriptionHtml: safeHtml(raw.descriptionHtml, summary || ctx.brief.slice(0, 600)),
      date: date.value,
      location,
      categoryId: pickCategory(raw.categoryId, ctx.categories),
      isTournament,
      tournamentType: isTournament ? str(raw.tournamentType, 60) : "",
      entryPrice: price(raw.entryPrice),
      maxParticipants: places(raw.maxParticipants),
      registrationOpen,
      registrationFields: registrationOpen ? registrationFields(raw.registrationFields) : [],
      imagePrompt: str(raw.imagePrompt, 1500, `Poster for a community event: ${title}`),
      posterLines: {
        title: str(poster.title, 120, title),
        date: str(poster.date, 120),
        place: str(poster.place, 120, location),
        extra: str(poster.extra, 160),
      },
    },
  };
}

export function coercePostDraft(raw: Record<string, unknown>, ctx: CoerceContext): { draft: PostDraft; notes: string[] } {
  const title = str(raw.title, 200, "Nova notícia");
  const excerpt = str(raw.excerpt, 300);
  const tags = Array.isArray(raw.tags)
    ? [...new Set(raw.tags.map(t => str(t, 30)).filter(Boolean))].slice(0, 6)
    : [];
  return {
    notes: [],
    draft: {
      title,
      excerpt,
      contentHtml: safeHtml(raw.contentHtml, excerpt || ctx.brief.slice(0, 1200)),
      tags,
      categoryId: pickCategory(raw.categoryId, ctx.categories),
      imagePrompt: str(raw.imagePrompt, 1500, `Editorial photo illustrating: ${title}`),
    },
  };
}
