/**
 * A deploy replaces the hashed chunk files; a tab opened before it then fails
 * to import the page it asks for. One reload fetches the new index and fixes
 * it, but an unguarded reload would loop if the chunk is truly missing.
 */

const RELOAD_KEY = 'chunk-reload-at';
const RELOAD_WINDOW_MS = 60_000;

const CHUNK_PATTERNS = [
    /dynamically imported module/i,
    /Importing a module script failed/i,
    /ChunkLoadError/i,
    /Loading chunk [\w-]+ failed/i,
];

export function isChunkLoadError(error: unknown): boolean {
    if (!error) return false;
    const name = error instanceof Error ? error.name : '';
    const message = error instanceof Error ? error.message : String(error);
    return CHUNK_PATTERNS.some((pattern) => pattern.test(name) || pattern.test(message));
}

interface ReloadStorage {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/** True once per window; records the attempt so a second failure shows the fallback. */
export function claimChunkReload(storage: ReloadStorage | null, now: number = Date.now()): boolean {
    if (!storage) return false;
    try {
        const last = Number(storage.getItem(RELOAD_KEY));
        if (last && now - last < RELOAD_WINDOW_MS) return false;
        storage.setItem(RELOAD_KEY, String(now));
        return true;
    } catch {
        return false;
    }
}
