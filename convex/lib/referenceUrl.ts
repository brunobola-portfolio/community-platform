/**
 * Guard for reference images given by URL. The server fetches whatever passes,
 * so only files served by this deployment's own storage are accepted: anything
 * else would let a caller point the backend at internal or third-party hosts
 * (SSRF). Every legitimate reference in the UI is a storage URL already.
 */

export const REFERENCE_URL_ERROR = "Use uma imagem carregada no site como referência.";

/** True only for https URLs on `cloudUrl`'s origin under /api/storage/, without credentials. */
export function isOwnStorageUrl(url: string, cloudUrl: string | undefined): boolean {
  if (!cloudUrl) return false;
  let parsed: URL;
  let own: URL;
  try {
    parsed = new URL(url);
    own = new URL(cloudUrl);
  } catch {
    return false;
  }
  return parsed.protocol === "https:"
    && parsed.origin === own.origin
    && !parsed.username && !parsed.password
    && parsed.pathname.startsWith("/api/storage/")
    && !parsed.pathname.includes("..");
}
