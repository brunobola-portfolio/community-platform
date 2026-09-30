import { describe, expect, it } from 'vitest';
import { claimChunkReload, isChunkLoadError } from '../utils/chunkError';

const memoryStorage = () => {
    const data = new Map<string, string>();
    return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
};

describe('isChunkLoadError', () => {
    it('recognises the browser messages for a failed dynamic import', () => {
        expect(isChunkLoadError(new TypeError('Failed to fetch dynamically imported module: https://x/assets/a.js'))).toBe(true);
        expect(isChunkLoadError(new Error('error loading dynamically imported module'))).toBe(true);
        expect(isChunkLoadError(new Error('Importing a module script failed.'))).toBe(true);
        const chunk = new Error('Loading chunk 12 failed.');
        chunk.name = 'ChunkLoadError';
        expect(isChunkLoadError(chunk)).toBe(true);
    });

    it('ignores ordinary errors', () => {
        expect(isChunkLoadError(new Error('x is undefined'))).toBe(false);
        expect(isChunkLoadError(null)).toBe(false);
    });
});

describe('claimChunkReload', () => {
    it('allows one reload per window and refuses the repeat', () => {
        const storage = memoryStorage();
        expect(claimChunkReload(storage, 1_000)).toBe(true);
        expect(claimChunkReload(storage, 5_000)).toBe(false);
        expect(claimChunkReload(storage, 1_000 + 61_000)).toBe(true);
    });

    it('never reloads without storage', () => {
        expect(claimChunkReload(null)).toBe(false);
    });
});
