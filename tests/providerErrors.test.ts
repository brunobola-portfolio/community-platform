import { describe, expect, it } from 'vitest';
import { classifyProviderError } from '../convex/lib/aiShared';

/**
 * The client maps these tokens to friendly Portuguese copy. Raw provider text
 * must never reach a visitor, and the tokens must stay stable: renaming one
 * silently degrades every message to the generic fallback.
 */
describe('classifyProviderError', () => {
  it('reads an exhausted quota as such', () => {
    expect(classifyProviderError('429 RESOURCE_EXHAUSTED: quota exceeded')).toBe('ERR_QUOTA');
    expect(classifyProviderError('You exceeded your current quota')).toBe('ERR_QUOTA');
  });

  it('separates our own rate limit from the provider being down', () => {
    expect(classifyProviderError('Limite de pedidos atingido. Aguarde um momento.')).toBe('ERR_RATE_LIMIT');
    expect(classifyProviderError('503 Service Unavailable')).toBe('ERR_UNAVAILABLE');
  });

  it('never leaks a credentials problem as a credentials problem', () => {
    // A visitor must not learn that the key is wrong; the operator reads the logs
    for (const raw of ['401 Unauthorized', 'PERMISSION_DENIED', 'invalid api key']) {
      expect(classifyProviderError(raw)).toBe('ERR_UNAVAILABLE');
    }
  });

  it('treats a retired model id as a temporary outage for the visitor', () => {
    expect(classifyProviderError('404 NOT_FOUND: models/gemini-x is not found')).toBe('ERR_UNAVAILABLE');
  });

  it('falls back to the generic token rather than inventing one', () => {
    expect(classifyProviderError('something nobody predicted')).toBe('ERR_GENERIC');
  });

  it('returns a token and never the provider text', () => {
    const secretish = 'key sk-abc123 rejected by upstream';
    expect(classifyProviderError(secretish)).not.toContain('sk-abc123');
    expect(classifyProviderError(secretish)).toMatch(/^ERR_[A-Z_]+$/);
  });
});
