/**
 * Token bucket arithmetic, kept apart from the mutation that stores it so the
 * refill rules can be exercised directly. The subtlety this isolates: crediting
 * whole tokens while advancing the clock only by the time those tokens cost.
 * Stamping the clock at every call instead discards the leftover fraction, and a
 * caller whose requests are spaced just under the refill interval never gets a
 * token back — the burst allowance becomes usable exactly once.
 */

export interface BucketConfig {
  maxTokens: number;
  refillPerMinute: number;
}

export interface BucketState {
  tokens: number;
  lastRefill: number;
}

export type BucketDecision =
  | { allowed: true; state: BucketState }
  | { allowed: false };

/** Entries untouched for this long are treated as new rather than replayed. */
export const STALE_AFTER_MS = 60 * 60 * 1000;

const MINUTE_MS = 60_000;

/** State for a caller with no bucket yet: the request is allowed and costs one token. */
export function openBucket(config: BucketConfig, now: number): BucketState {
  return { tokens: config.maxTokens - 1, lastRefill: now };
}

export function isStale(state: BucketState, now: number): boolean {
  return now - state.lastRefill > STALE_AFTER_MS;
}

/**
 * Decides one request against an existing bucket. Returns the state to store
 * when allowed, and nothing to store when the caller is over the limit — the
 * clock must not move on a rejected request or waiting would never pay off.
 */
export function consume(state: BucketState, config: BucketConfig, now: number): BucketDecision {
  if (isStale(state, now)) {
    return { allowed: true, state: openBucket(config, now) };
  }

  const elapsedMinutes = (now - state.lastRefill) / MINUTE_MS;
  const credited = Math.floor(elapsedMinutes * config.refillPerMinute);
  const refilled = Math.min(config.maxTokens, state.tokens + credited);

  if (refilled < 1) return { allowed: false };

  // A full bucket resets to now, so idle time cannot accumulate into a burst
  // beyond maxTokens; otherwise the clock advances only by what was credited.
  const lastRefill = refilled >= config.maxTokens
    ? now
    : state.lastRefill + (credited / config.refillPerMinute) * MINUTE_MS;

  return { allowed: true, state: { tokens: refilled - 1, lastRefill } };
}
