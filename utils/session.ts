const KEY = 'portal-session';

/**
 * Random id kept in localStorage so anonymous visitors get their own AI
 * rate-limit bucket. It identifies a browser, never a person.
 */
export function getSessionId(): string {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored) return stored;
    const fresh = crypto.randomUUID();
    localStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return 'anonymous';
  }
}
