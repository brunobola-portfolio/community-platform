import { afterEach, describe, expect, it } from 'vitest';
import { fallbackReason, preferredImageEngine } from '../convex/lib/aiImage';
import { buildPosterPrompt } from '../convex/lib/aiStudioPrompts';
import { posterWaitHint } from '../pages/admin/studio/studioCopy';

describe('default image engine', () => {
  const saved = { GEMINI_API_KEY: process.env.GEMINI_API_KEY, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY };
  afterEach(() => {
    for (const [name, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  it('is NanoBanana (Gemini) whenever a Gemini key exists, even with OpenRouter configured', () => {
    process.env.GEMINI_API_KEY = 'g-key';
    process.env.OPENROUTER_API_KEY = 'sk-or-env';
    expect(preferredImageEngine({ openrouterApiKey: 'sk-or-x' })).toBe('gemini');
    expect(preferredImageEngine(null)).toBe('gemini');
  });

  it('is GPT Image (OpenRouter) only when OpenRouter is the sole engine with a key', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    expect(preferredImageEngine({ openrouterApiKey: 'sk-or-x' })).toBe('openrouter');
    process.env.OPENROUTER_API_KEY = 'sk-or-env';
    expect(preferredImageEngine({})).toBe('openrouter');
  });

  it('is Gemini when no engine has a key', () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENROUTER_API_KEY;
    expect(preferredImageEngine({})).toBe('gemini');
    expect(preferredImageEngine(null)).toBe('gemini');
  });

  it('respects an explicit choice', () => {
    process.env.GEMINI_API_KEY = 'g-key';
    expect(preferredImageEngine({ imageProvider: 'openrouter' })).toBe('openrouter');
    expect(preferredImageEngine({ imageProvider: 'gemini', openrouterApiKey: 'sk-or-x' })).toBe('gemini');
  });
});

describe('fallback reason', () => {
  it('names an empty OpenRouter balance and how to fix it', () => {
    expect(fallbackReason(['openrouter/openai/gpt-5.4-image-2: OpenRouter HTTP 402: insufficient credits'])).toMatch(/sem saldo.*openrouter\.ai/);
  });
  it('names quotas and timeouts, and stays quiet otherwise', () => {
    expect(fallbackReason(['gemini/x: 429 RESOURCE_EXHAUSTED'])).toMatch(/limite/);
    expect(fallbackReason(['openrouter/x: OpenRouter timeout'])).toMatch(/demorou/);
    expect(fallbackReason(['openrouter/x: something odd'])).toBeNull();
  });
});

describe('poster prompt', () => {
  const base = {
    kind: 'event' as const, imagePrompt: 'cards on a table', posterText: true, hasReference: false,
    lines: { title: 'Torneio de Sueca', date: 'Sábado, 17 de outubro · 15h00', place: 'Sede', extra: '5 € por dupla' },
  };
  it('signs the poster with the real organiser and forbids invented names and crests', () => {
    const prompt = buildPosterPrompt({ ...base, organizer: 'ACR Vila Nova' });
    expect(prompt).toContain('"ACR Vila Nova"');
    expect(prompt).toMatch(/invented names, logos, crests/);
  });
  it('adds no organiser line when the name is unknown', () => {
    expect(buildPosterPrompt(base)).not.toMatch(/organiser/);
  });
});

it('tells the admin how long the chosen engine takes', () => {
  expect(posterWaitHint('openrouter', 'openai/gpt-5.4-image-2')).toMatch(/2 minutos/);
  expect(posterWaitHint('gemini', undefined)).toMatch(/meio minuto/);
  expect(posterWaitHint(undefined, undefined)).toMatch(/segundos/);
});

describe('OpenRouter model on fallback', () => {
  it('keeps NanoBanana when Gemini was preferred, so a fallback never jumps to GPT prices', async () => {
    const { openRouterImageModel } = await import('../convex/lib/aiImage');
    expect(openRouterImageModel('gemini', { openrouterImageModel: 'openai/gpt-5.4-image-2' })).toBe('google/gemini-3.1-flash-image');
  });
  it('uses the admin OpenRouter choice when OpenRouter was preferred', async () => {
    const { openRouterImageModel } = await import('../convex/lib/aiImage');
    expect(openRouterImageModel('openrouter', { openrouterImageModel: 'openai/gpt-5-image-mini' })).toBe('openai/gpt-5-image-mini');
    expect(openRouterImageModel('openrouter', {})).toBe('openai/gpt-5.4-image-2');
  });
});
