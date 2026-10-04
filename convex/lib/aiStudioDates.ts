/**
 * Date handling for the AI studio. Pure functions over "YYYY-MM-DD" strings in
 * the secretary's local calendar, so the server (UTC) never shifts a day.
 *
 * The model is asked to resolve "sábado" or "dia 12" itself, but models get
 * weekdays wrong often enough that its answer is validated here, and a
 * deterministic reading of the brief is used whenever its answer is unusable.
 */

const WEEKDAYS: Array<[RegExp, number]> = [
  [/\bdomingo\b/, 0],
  [/\bsegunda(-feira)?\b/, 1],
  [/\bter[cç]a(-feira)?\b/, 2],
  [/\bquarta(-feira)?\b/, 3],
  [/\bquinta(-feira)?\b/, 4],
  [/\bsexta(-feira)?\b/, 5],
  [/\bs[aá]bado\b/, 6],
];

const MONTHS = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const WEEKDAY_NAMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

/** Time used when the brief names a day but no hour. */
export const DEFAULT_EVENT_TIME = "15:00";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATETIME_RE = /^(\d{4}-\d{2}-\d{2})[T ](\d{2}):(\d{2})/;

const pad = (n: number) => String(n).padStart(2, "0");

/** Parses "YYYY-MM-DD" as a UTC-midnight Date; null when malformed or not a real day. */
export function parseDay(day: string): Date | null {
  const m = DATE_RE.exec(day);
  if (!m) return null;
  const date = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return date.getUTCDate() === Number(m[3]) && date.getUTCMonth() === Number(m[2]) - 1 ? date : null;
}

export function formatDay(date: Date): string {
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function addDays(day: string, days: number): string {
  const date = parseDay(day) ?? new Date();
  return formatDay(new Date(date.getTime() + days * 86_400_000));
}

/** "sábado, 4 de outubro de 2026": given to the model so relative dates have an anchor it can read. */
export function describeDay(day: string): string {
  const date = parseDay(day);
  if (!date) return day;
  return `${WEEKDAY_NAMES[date.getUTCDay()]}, ${date.getUTCDate()} de ${MONTHS[date.getUTCMonth()]} de ${date.getUTCFullYear()}`;
}

/** Hour named in the brief ("às 21h", "15:30", "9h30"), or null. */
export function findTime(text: string): string | null {
  const m = /\b([01]?\d|2[0-3])\s*(?:h(?:oras)?|:)\s*([0-5]\d)?\b/i.exec(text);
  if (!m) return null;
  return `${pad(Number(m[1]))}:${m[2] ?? "00"}`;
}

/**
 * Deterministic reading of the day in a Portuguese brief, relative to `today`.
 * A weekday means its next occurrence after today (on a Saturday, "sábado"
 * means next week: nobody announces an event for the same afternoon); "dia 12"
 * means this month if still ahead, otherwise next month.
 */
export function resolveRelativeDay(text: string, today: string): string | null {
  const base = parseDay(today);
  if (!base) return null;
  const lower = text.toLowerCase();

  const explicit = /\b(\d{1,2})\s+de\s+([a-zç]+)(?:\s+de\s+(\d{4}))?/.exec(lower);
  if (explicit) {
    const month = MONTHS.indexOf(explicit[2]);
    if (month >= 0) {
      let year = explicit[3] ? Number(explicit[3]) : base.getUTCFullYear();
      let candidate = new Date(Date.UTC(year, month, Number(explicit[1])));
      if (!explicit[3] && candidate < base) candidate = new Date(Date.UTC(++year, month, Number(explicit[1])));
      if (candidate.getUTCDate() === Number(explicit[1])) return formatDay(candidate);
    }
  }
  if (/\bhoje\b/.test(lower)) return today;
  if (/\bdepois de amanh[aã](?![a-zà-ÿ])/.test(lower)) return addDays(today, 2);
  if (/\bamanh[aã](?![a-zà-ÿ])/.test(lower)) return addDays(today, 1);

  const dayOfMonth = /\bdia\s+(\d{1,2})\b/.exec(lower);
  if (dayOfMonth) {
    const d = Number(dayOfMonth[1]);
    for (let offset = 0; offset < 3; offset++) {
      const candidate = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + offset, d));
      if (candidate.getUTCDate() === d && candidate >= base) return formatDay(candidate);
    }
  }
  for (const [pattern, weekday] of WEEKDAYS) {
    if (!pattern.test(lower)) continue;
    const delta = ((weekday - base.getUTCDay() + 7) % 7) || 7;
    return addDays(today, delta);
  }
  return null;
}

export interface ResolvedDate {
  /** "YYYY-MM-DDTHH:mm", what an <input type="datetime-local"> takes. */
  value: string;
  /** Set when the secretary should look at the date before saving. */
  note?: string;
}

/**
 * Validates the model's date and falls back to reading the brief. The result is
 * always a usable datetime-local value; doubts travel as a note, not an error.
 */
export function resolveEventDate(raw: unknown, brief: string, today: string): ResolvedDate {
  const text = typeof raw === "string" ? raw.trim() : "";
  const time = findTime(brief);
  const full = DATETIME_RE.exec(text);
  const dayOnly = DATE_RE.test(text) ? text : null;
  const modelDay = full?.[1] ?? dayOnly;

  if (modelDay && parseDay(modelDay)) {
    const hour = full ? `${full[2]}:${full[3]}` : time ?? DEFAULT_EVENT_TIME;
    const validHour = /^([01]\d|2[0-3]):[0-5]\d$/.test(hour) ? hour : DEFAULT_EVENT_TIME;
    const value = `${modelDay}T${validHour}`;
    if (modelDay < today) return { value, note: "A data proposta já passou. Confirme-a antes de guardar." };
    return { value };
  }

  const fromBrief = resolveRelativeDay(brief, today);
  if (fromBrief) return { value: `${fromBrief}T${time ?? DEFAULT_EVENT_TIME}` };
  return {
    value: `${addDays(today, 7)}T${time ?? DEFAULT_EVENT_TIME}`,
    note: "Não foi indicada uma data: ficou daqui a uma semana. Ajuste-a antes de guardar.",
  };
}
