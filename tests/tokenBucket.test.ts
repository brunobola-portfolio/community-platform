import { describe, expect, it } from 'vitest';
import { consume, openBucket, STALE_AFTER_MS, type BucketConfig } from '../convex/lib/tokenBucket';

/** The public chat bucket: ten tokens of burst, one back every six seconds. */
const CHAT: BucketConfig = { maxTokens: 10, refillPerMinute: 10 };

/**
 * Replays a traffic pattern from a full bucket and reports how many of the
 * `requests` were rejected. The first request is part of the count.
 */
function replay(config: BucketConfig, spacingMs: number, requests: number) {
  let state: { tokens: number; lastRefill: number } = { tokens: config.maxTokens, lastRefill: 0 };
  let rejected = 0;
  for (let i = 0; i < requests; i++) {
    const decision = consume(state, config, i * spacingMs);
    if (decision.allowed) state = decision.state;
    else rejected++;
  }
  return { rejected, state };
}

describe('token bucket', () => {
  it('spends one token per request while the bucket lasts', () => {
    const first = consume({ tokens: 5, lastRefill: 0 }, CHAT, 0);
    expect(first).toEqual({ allowed: true, state: { tokens: 4, lastRefill: 0 } });
  });

  it('rejects the request that finds an empty bucket', () => {
    expect(consume({ tokens: 0, lastRefill: 0 }, CHAT, 1_000)).toEqual({ allowed: false });
  });

  it('leaves the clock untouched when it rejects, so waiting is what pays off', () => {
    // A rejected request returns no state: the caller cannot reset its own clock
    // by hammering, and the tokens it has earned since are still owed to it
    expect(consume({ tokens: 0, lastRefill: 0 }, CHAT, 5_000)).not.toHaveProperty('state');
  });

  it('credits a whole token once its refill interval has passed', () => {
    const decision = consume({ tokens: 0, lastRefill: 0 }, CHAT, 6_000);
    expect(decision).toEqual({ allowed: true, state: { tokens: 0, lastRefill: 6_000 } });
  });

  it('keeps the fraction of a token earned between two requests', () => {
    // 5s at 10/min is 0.83 of a token: nothing is credited yet, and the clock
    // must not move, otherwise that fraction is lost at every single call
    const decision = consume({ tokens: 4, lastRefill: 0 }, CHAT, 5_000);
    expect(decision).toEqual({ allowed: true, state: { tokens: 3, lastRefill: 0 } });
  });

  it('lets a caller inside its budget through, however bursty', () => {
    // 24 requests, 5s apart: 9 tokens of burst plus 20 refilled over two minutes
    // is a budget of 29. Stamping the clock at every call rejected 8 of these.
    expect(replay(CHAT, 5_000, 24).rejected).toBe(0);
  });

  it('still throttles a caller that outruns the refill rate for long enough', () => {
    // One request per second against ten per minute: the burst absorbs the start
    // and the rest is rejected, which is the limit doing its job
    expect(replay(CHAT, 1_000, 60).rejected).toBeGreaterThan(30);
  });

  it('never lets idle time accumulate past the burst allowance', () => {
    const afterAnHourIdle = consume({ tokens: 0, lastRefill: 0 }, CHAT, STALE_AFTER_MS);
    expect(afterAnHourIdle).toEqual({
      allowed: true,
      state: { tokens: CHAT.maxTokens - 1, lastRefill: STALE_AFTER_MS },
    });
  });

  it('treats a bucket older than an hour as a fresh one', () => {
    const decision = consume({ tokens: 0, lastRefill: 0 }, CHAT, STALE_AFTER_MS + 1);
    expect(decision).toEqual({
      allowed: true,
      state: openBucket(CHAT, STALE_AFTER_MS + 1),
    });
  });

  it('holds the tight public-form buckets to their own rate', () => {
    const contact: BucketConfig = { maxTokens: 3, refillPerMinute: 1 };
    // Three submissions go through, the fourth in the same minute does not
    expect(replay(contact, 1_000, 3).rejected).toBe(0);
    expect(replay(contact, 1_000, 4).rejected).toBe(1);
    // A minute later the sender is welcome again
    expect(replay(contact, 60_000, 6).rejected).toBe(0);
  });
});
