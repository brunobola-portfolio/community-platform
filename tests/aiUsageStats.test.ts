import { describe, expect, it } from 'vitest';
import { clampSince, dayKey, failureReason, featureOf, summarizeUsage, type UsageRow } from '../convex/lib/aiUsageStats';

const DAY = 86_400_000;
const until = Date.UTC(2026, 9, 4, 12);
const row = (over: Partial<UsageRow>): UsageRow => ({
  timestamp: until - 1000, userId: 'u1', action: 'chat', model: 'gemini-3.5-flash', latencyMs: 1000, success: true, ...over,
});

describe('usage summary', () => {
  it('totals cost, success and latency, counting unpriced rows apart', () => {
    const s = summarizeUsage([
      row({ costUsd: 0.01, feature: 'Assistente' }),
      row({ costUsd: 0.07, action: 'studioImage', feature: 'Cartaz', model: 'gemini-3.1-flash-image', latencyMs: 3000 }),
      row({ success: false, latencyMs: 2000 }),
    ], { since: until - 6 * DAY, until, tzOffsetMinutes: 0 });
    expect(s.calls).toBe(3);
    expect(s.totalCostUsd).toBeCloseTo(0.08, 8);
    expect(s.unpricedCalls).toBe(1);
    expect(s.successRate).toBe(67);
    expect(s.avgLatencyMs).toBe(2000);
    expect(s.byFeature[0]).toMatchObject({ name: 'Cartaz', calls: 1 });
    expect(s.byFeature.find(f => f.name === 'Assistente')).toMatchObject({ calls: 2, unpriced: 1 });
  });

  it('has one point per day of the range, gaps included', () => {
    const s = summarizeUsage([row({ costUsd: 0.02, timestamp: until - 2 * DAY })], { since: until - 6 * DAY, until, tzOffsetMinutes: 0 });
    expect(s.daily).toHaveLength(7);
    expect(s.daily.filter(d => d.calls > 0)).toEqual([{ day: '2026-10-02', calls: 1, costUsd: 0.02, unpriced: 0 }]);
    expect(s.daily[s.daily.length - 1].day).toBe('2026-10-04');
  });

  it('is calm with no rows', () => {
    const s = summarizeUsage([], { since: until - DAY, until, tzOffsetMinutes: 0 });
    expect(s).toMatchObject({ calls: 0, successRate: 100, avgLatencyMs: 0, totalCostUsd: 0 });
  });
});

describe('helpers', () => {
  it('names old rows after their action', () => {
    expect(featureOf({ action: 'tts' })).toBe('Voz');
    expect(featureOf({ action: 'studioText', feature: undefined })).toBe('Rascunho com IA');
    expect(featureOf({ action: 'x', feature: 'Imagem' })).toBe('Imagem');
  });
  it('buckets days in the browser calendar', () => {
    // 23:30 UTC is already the next day in UTC+1 (offset -60)
    expect(dayKey(Date.UTC(2026, 9, 3, 23, 30), -60)).toBe('2026-10-04');
    expect(dayKey(Date.UTC(2026, 9, 3, 23, 30), 0)).toBe('2026-10-03');
  });
  it('turns provider errors into plain reasons', () => {
    expect(failureReason('openrouter/x: OpenRouter HTTP 402: insufficient credits')).toBe('Sem saldo no OpenRouter');
    expect(failureReason('ERR_UNAVAILABLE: guardrail classifier unavailable')).toBe('Filtro de segurança indisponível');
    expect(failureReason('ERR_QUOTA: 429 RESOURCE_EXHAUSTED')).toBe('Limite de utilização do fornecedor');
    expect(failureReason('OpenRouter timeout')).toBe('O fornecedor demorou demasiado');
    expect(failureReason(undefined)).toBe('Erro inesperado');
  });
  it('never scans more than ~3 months', () => {
    expect(clampSince(0, until)).toBe(until - 93 * DAY);
    expect(clampSince(until - DAY, until)).toBe(until - DAY);
  });
});
