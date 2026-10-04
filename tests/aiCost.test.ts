import { describe, expect, it } from 'vitest';
import {
  createCostMeter, estimateImageCostUsd, formatUsd, geminiCost, geminiPrice, isFreeModel, openRouterCost, sumCosts,
} from '../convex/lib/aiCost';

describe('gemini cost estimate', () => {
  it('prices input and output tokens per million', () => {
    // gemini-3.5-flash: 1.50 in, 9.00 out
    expect(geminiCost('gemini-3.5-flash', { promptTokenCount: 2000, candidatesTokenCount: 1000 })).toBeCloseTo(0.012, 6);
  });

  it('bills thinking tokens as output', () => {
    expect(geminiCost('gemini-3.5-flash', { promptTokenCount: 0, candidatesTokenCount: 0, thoughtsTokenCount: 1000 })).toBeCloseTo(0.009, 6);
  });

  it('prices image tokens at the image rate, using the modality split when given', () => {
    // A 1K NanoBanana 2 picture: 1120 image tokens at 60 $/M = 0.0672 $
    expect(geminiCost('gemini-3.1-flash-image', {
      promptTokenCount: 0, candidatesTokenCount: 1120,
      candidatesTokensDetails: [{ modality: 'IMAGE', tokenCount: 1120 }],
    })).toBeCloseTo(0.0672, 6);
    expect(geminiCost('gemini-3.1-flash-image', {
      promptTokenCount: 0, candidatesTokenCount: 1130,
      candidatesTokensDetails: [{ modality: 'IMAGE', tokenCount: 1120 }, { modality: 'TEXT', tokenCount: 10 }],
    })).toBeCloseTo(0.0672 + (10 * 3) / 1e6, 8);
  });

  it('treats an unsplit image-model reply as the picture', () => {
    expect(geminiCost('gemini-3.1-flash-image', { candidatesTokenCount: 1120 })).toBeCloseTo(0.0672, 6);
  });

  it('matches preview suffixes to the longest known id and stays unknown otherwise', () => {
    expect(geminiPrice('gemini-3.5-flash-lite-preview')).toEqual(geminiPrice('gemini-3.5-flash-lite'));
    expect(geminiPrice('models/gemini-3.5-flash')).toEqual(geminiPrice('gemini-3.5-flash'));
    expect(geminiCost('some-other-model', { promptTokenCount: 10 })).toBeUndefined();
    expect(geminiCost('gemini-3.5-flash', undefined)).toBeUndefined();
  });
});

describe('openrouter cost', () => {
  it('uses the reported price', () => {
    expect(openRouterCost('openai/gpt-5.4-image-2', { cost: 0.2312 })).toBe(0.2312);
  });
  it('is zero for free slugs and unknown for paid ones without a report', () => {
    expect(isFreeModel('google/gemma-4-26b-a4b-it:free')).toBe(true);
    expect(isFreeModel('openrouter/free')).toBe(true);
    expect(openRouterCost('google/gemma-4-26b-a4b-it:free', undefined)).toBe(0);
    expect(openRouterCost('google/gemini-2.5-flash', {})).toBeUndefined();
  });
});

describe('summing', () => {
  it('adds the known parts and stays unknown only when nothing is known', () => {
    expect(sumCosts(0.01, undefined, 0.02)).toBeCloseTo(0.03, 8);
    expect(sumCosts(undefined, undefined)).toBeUndefined();
    const meter = createCostMeter();
    expect(meter.total).toBeUndefined();
    meter.add(0);
    meter.add(undefined);
    meter.add(0.005);
    expect(meter.total).toBeCloseTo(0.005, 8);
  });
});

describe('image estimate', () => {
  it('is ~0.07 $ for NanoBanana 2 at 1K and grows with resolution', () => {
    expect(estimateImageCostUsd({ engine: 'gemini' })).toBeCloseTo(0.0672, 4);
    expect(estimateImageCostUsd({ engine: 'gemini', resolution: '4k' })).toBeCloseTo(0.1512, 4);
  });
  it('uses the measured OpenRouter price, ~0.23 $ for GPT Image 2', () => {
    expect(estimateImageCostUsd({ engine: 'openrouter', openrouterModel: 'openai/gpt-5.4-image-2' })).toBe(0.23);
    expect(estimateImageCostUsd({ engine: 'openrouter', openrouterModel: 'unknown/model' })).toBeUndefined();
  });
});

describe('formatting', () => {
  it('shows a dash for unknown, never zero', () => {
    expect(formatUsd(undefined)).toBe('—');
    expect(formatUsd(0)).toBe('0 $');
  });
  it('rounds to cents and keeps one significant digit below a cent', () => {
    expect(formatUsd(0.0672)).toBe('0,07 $');
    expect(formatUsd(0.23)).toBe('0,23 $');
    expect(formatUsd(0.0042)).toBe('0,004 $');
    expect(formatUsd(0.00004)).toBe('0,00004 $');
  });
});
