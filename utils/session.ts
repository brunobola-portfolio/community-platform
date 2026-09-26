const KEY = 'portal-session';

/**
 * Random id kept in localStorage so anonymous visitors get their own AI
 * rate-limit bucket. It identifies a browser, never a person.
 */
let memoryId: string | null = null;

export function getSessionId(): string {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    // Without storage every such browser would share one bucket, and one abuser
    // could lock them all out; a per-visit id keeps them apart
    memoryId ??= `mem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return memoryId;
  }
}
