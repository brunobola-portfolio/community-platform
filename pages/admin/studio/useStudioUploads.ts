import { useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { optimizeImage } from '../../../utils/imageOptimize';

/**
 * Storage plumbing of the AI studio, all through the normal upload path so
 * every file lands in the uploads ledger: retained when the record is saved,
 * swept if it never is, and dropped at once when it has served its purpose.
 */
export function useStudioUploads() {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const getFileUrl = useMutation(api.files.getUrl);
    const discardUnsaved = useMutation(api.files.discardUnsaved);

    const upload = useCallback(async (file: File): Promise<{ storageId: Id<'_storage'>; url: string }> => {
        const target = await generateUploadUrl();
        const res = await fetch(target, { method: 'POST', headers: { 'Content-Type': file.type || 'application/octet-stream' }, body: file });
        if (!res.ok) throw new Error(`Upload falhou (HTTP ${res.status})`);
        const { storageId } = (await res.json()) as { storageId: Id<'_storage'> };
        const url = await getFileUrl({ storageId });
        if (!url) throw new Error('Não foi possível obter o URL do ficheiro.');
        return { storageId, url };
    }, [generateUploadUrl, getFileUrl]);

    /** Best effort: a file left behind is still swept by the daily cleanup. */
    const release = useCallback((url: string | undefined) => {
        if (url) void discardUnsaved({ url }).catch(() => undefined);
    }, [discardUnsaved]);

    /**
     * Generated posters come out as multi-megabyte PNGs. The browser re-encodes
     * them like any upload, stores the light copy and drops the original; if any
     * step fails the original URL is kept, which is heavier but still correct.
     */
    const optimizeGenerated = useCallback(async (url: string): Promise<string> => {
        try {
            const res = await fetch(url);
            if (!res.ok) return url;
            const blob = await res.blob();
            const original = new File([blob], 'cartaz-ia.png', { type: blob.type || 'image/png' });
            const optimized = await optimizeImage(original);
            if (optimized === original) return url;
            const stored = await upload(optimized);
            release(url);
            return stored.url;
        } catch (error) {
            console.warn('AI studio: could not optimise the generated image', error);
            return url;
        }
    }, [upload, release]);

    return { upload, release, optimizeGenerated };
}
