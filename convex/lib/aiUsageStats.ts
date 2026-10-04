/**
 * Aggregates for the backoffice "Utilização e custos" panel, from aiUsageLogs
 * rows. Pure so the query stays thin and the bucketing is testable.
 */

/** Feature names the panel groups by, in the admin's words; stored on each log row. */
export const AI_FEATURE = {
  draft: "Rascunho com IA",
  poster: "Cartaz",
  image: "Imagem",
  chat: "Assistente",
  classification: "Classificação",
  voice: "Voz",
  enhance: "Melhorar texto",
  geo: "Localização",
} as const;

/** Rows logged before features were stored are named after their action. */
const FEATURE_BY_ACTION: Record<string, string> = {
  chat: AI_FEATURE.chat,
  tts: AI_FEATURE.voice,
  generateImage: AI_FEATURE.image,
  enhanceText: AI_FEATURE.enhance,
  geoQuery: AI_FEATURE.geo,
  studioText: AI_FEATURE.draft,
  studioImage: AI_FEATURE.poster,
};

export interface UsageRow {
  timestamp: number;
  userId: string;
  action: string;
  feature?: string;
  model: string;
  latencyMs: number;
  success: boolean;
  errorMessage?: string;
  costUsd?: number;
}

export interface Breakdown { name: string; calls: number; costUsd: number; unpriced: number }
export interface DailyPoint { day: string; calls: number; costUsd: number; unpriced: number }

export interface UsageSummary {
  totalCostUsd: number;
  calls: number;
  successRate: number;
  avgLatencyMs: number;
  /** Rows with no recorded cost (logged before costs were tracked, or a custom endpoint). */
  unpricedCalls: number;
  byFeature: Breakdown[];
  byModel: Breakdown[];
  daily: DailyPoint[];
}

const DAY_MS = 86_400_000;
const MAX_DAYS = 93;

export function featureOf(row: Pick<UsageRow, "feature" | "action">): string {
  return row.feature ?? FEATURE_BY_ACTION[row.action] ?? row.action;
}

/** Local "YYYY-MM-DD"; the offset is the browser's getTimezoneOffset() (minutes, positive west of UTC). */
export function dayKey(timestamp: number, tzOffsetMinutes: number): string {
  return new Date(timestamp - tzOffsetMinutes * 60_000).toISOString().slice(0, 10);
}

const FAILURE_RULES: Array<[RegExp, string]> = [
  [/http 402|insufficient|credits|payment required/, "Sem saldo no OpenRouter"],
  [/guardrail/, "Filtro de segurança indisponível"],
  [/err_rate_limit|limite de pedidos|rate limit|too many requests/, "Demasiados pedidos seguidos"],
  [/err_quota|resource_exhausted|quota|\b429\b/, "Limite de utilização do fornecedor"],
  [/timeout/, "O fornecedor demorou demasiado"],
  [/no engine|no image engine/, "Sem motor de imagem configurado"],
  [/not_found|no longer available|404/, "Modelo retirado pelo fornecedor"],
  [/\b401\b|\b403\b|api key|api_key|permission_denied|unauthorized/, "Credenciais do fornecedor inválidas"],
  [/não devolveu|resposta vazia|empty/, "O modelo não devolveu resultado"],
  [/guardar|store|url da imagem/, "Não foi possível guardar o ficheiro"],
  [/err_unavailable|unavailable|\b50[0-4]\b|internal server error/, "Fornecedor indisponível"],
];

/** Plain-language reason for a failed row; the raw provider text never leaves the server. */
export function failureReason(errorMessage: string | undefined): string {
  const text = (errorMessage ?? "").toLowerCase();
  return FAILURE_RULES.find(([pattern]) => pattern.test(text))?.[1] ?? "Erro inesperado";
}

function addTo(map: Map<string, Breakdown>, name: string, cost: number | undefined) {
  const entry = map.get(name) ?? { name, calls: 0, costUsd: 0, unpriced: 0 };
  entry.calls += 1;
  if (typeof cost === "number") entry.costUsd += cost;
  else entry.unpriced += 1;
  map.set(name, entry);
}

/** Most expensive first, then the busiest. */
const byWeight = (a: Breakdown, b: Breakdown) => b.costUsd - a.costUsd || b.calls - a.calls;

/** Every day of the range, oldest first, including the empty ones, so the chart has no gaps. */
function emptyDays(since: number, until: number, tzOffsetMinutes: number): Map<string, DailyPoint> {
  const days = new Map<string, DailyPoint>();
  const start = Math.max(since, until - MAX_DAYS * DAY_MS);
  const last = dayKey(until, tzOffsetMinutes);
  for (let t = start; ; t += DAY_MS) {
    const day = dayKey(t, tzOffsetMinutes);
    days.set(day, { day, calls: 0, costUsd: 0, unpriced: 0 });
    if (day >= last) break;
  }
  return days;
}

export function summarizeUsage(rows: UsageRow[], range: { since: number; until: number; tzOffsetMinutes: number }): UsageSummary {
  const features = new Map<string, Breakdown>();
  const models = new Map<string, Breakdown>();
  const daily = emptyDays(range.since, range.until, range.tzOffsetMinutes);
  let totalCostUsd = 0;
  let successes = 0;
  let latency = 0;
  let unpricedCalls = 0;

  for (const row of rows) {
    if (typeof row.costUsd === "number") totalCostUsd += row.costUsd;
    else unpricedCalls += 1;
    if (row.success) successes += 1;
    latency += row.latencyMs;
    addTo(features, featureOf(row), row.costUsd);
    addTo(models, row.model, row.costUsd);
    const point = daily.get(dayKey(row.timestamp, range.tzOffsetMinutes));
    if (point) {
      point.calls += 1;
      if (typeof row.costUsd === "number") point.costUsd += row.costUsd;
      else point.unpriced += 1;
    }
  }

  return {
    totalCostUsd,
    calls: rows.length,
    successRate: rows.length ? Math.round((successes / rows.length) * 100) : 100,
    avgLatencyMs: rows.length ? Math.round(latency / rows.length) : 0,
    unpricedCalls,
    byFeature: [...features.values()].sort(byWeight),
    byModel: [...models.values()].sort(byWeight),
    daily: [...daily.values()],
  };
}

/** Clamps a client-chosen start so a query never scans more than ~3 months of logs. */
export function clampSince(since: number, now: number): number {
  return Math.max(since, now - MAX_DAYS * DAY_MS);
}
