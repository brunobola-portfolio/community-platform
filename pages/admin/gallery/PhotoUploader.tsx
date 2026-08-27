import React, { useRef, useState } from 'react';
import { useMutation } from 'convex/react';
import { UploadCloud, Link as LinkIcon, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { Button, cn } from '../../../components/ui/UIComponents';
import { STD_INPUT_CLASS } from '../constants';

interface PhotoUploaderProps {
    albumId: Id<'albums'>;
    onDone: (added: number, failed: number) => void;
}

interface QueueItem {
    name: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
    error?: string;
}

const MAX_BYTES = 10 * 1024 * 1024;

/**
 * Drag-and-drop / multi-file uploader straight into Convex storage, plus an
 * "add by URL" row. Files go one by one so a single failure never aborts the
 * batch; each row reports its own state.
 */
export const PhotoUploader: React.FC<PhotoUploaderProps> = ({ albumId, onDone }) => {
    const generateUploadUrl = useMutation(api.files.generateUploadUrl);
    const addImage = useMutation(api.albums.addImage);
    const inputRef = useRef<HTMLInputElement>(null);
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [dragging, setDragging] = useState(false);
    const [url, setUrl] = useState('');
    const busy = queue.some(q => q.status === 'uploading' || q.status === 'pending');

    const setItem = (index: number, patch: Partial<QueueItem>) =>
        setQueue(prev => prev.map((q, i) => (i === index ? { ...q, ...patch } : q)));

    const uploadFiles = async (files: File[]) => {
        const accepted = files.filter(f => f.type.startsWith('image/'));
        if (accepted.length === 0) return;
        const base = queue.length;
        setQueue(prev => [...prev, ...accepted.map(f => ({ name: f.name, status: 'pending' as const }))]);
        let added = 0;
        let failed = 0;
        for (let i = 0; i < accepted.length; i++) {
            const file = accepted[i];
            const index = base + i;
            if (file.size > MAX_BYTES) {
                setItem(index, { status: 'error', error: 'Mais de 10 MB' });
                failed++;
                continue;
            }
            setItem(index, { status: 'uploading' });
            try {
                const uploadUrl = await generateUploadUrl();
                const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': file.type }, body: file });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const { storageId } = (await res.json()) as { storageId: Id<'_storage'> };
                await addImage({ albumId, storageId });
                setItem(index, { status: 'done' });
                added++;
            } catch (e) {
                setItem(index, { status: 'error', error: e instanceof Error ? e.message : 'Falhou' });
                failed++;
            }
        }
        onDone(added, failed);
        setTimeout(() => setQueue(prev => prev.filter(q => q.status === 'error')), 2500);
    };

    const addByUrl = async () => {
        const trimmed = url.trim();
        if (!trimmed) return;
        try {
            await addImage({ albumId, externalUrl: trimmed });
            setUrl('');
            onDone(1, 0);
        } catch {
            onDone(0, 1);
        }
    };

    return (
        <div className="space-y-3">
            <div
                role="button"
                tabIndex={0}
                aria-label="Carregar fotos: arrasta para aqui ou clica para escolher"
                onClick={() => inputRef.current?.click()}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={e => { e.preventDefault(); setDragging(false); void uploadFiles(Array.from(e.dataTransfer.files)); }}
                className={cn(
                    'rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    dragging ? 'border-brand-500 bg-brand-500/10' : 'border-white/15 bg-black/20 hover:border-white/30'
                )}
            >
                <UploadCloud className="mx-auto mb-3 text-brand-400" size={32} />
                <p className="text-white font-medium">Arrasta fotos para aqui ou clica para escolher</p>
                <p className="text-slate-500 text-xs mt-1">JPG, PNG ou WebP · até 10 MB cada · várias de uma vez</p>
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={e => { void uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ''; }}
                />
            </div>

            {queue.length > 0 && (
                <ul className="space-y-1" aria-live="polite">
                    {queue.map((q, i) => (
                        <li key={`${q.name}-${i}`} className="flex items-center gap-2 text-xs text-slate-300 bg-black/20 rounded-lg px-3 py-2">
                            {q.status === 'uploading' && <Loader2 size={14} className="animate-spin text-brand-400 shrink-0" />}
                            {q.status === 'pending' && <span className="w-3.5 h-3.5 rounded-full border border-slate-600 shrink-0" />}
                            {q.status === 'done' && <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />}
                            {q.status === 'error' && <XCircle size={14} className="text-red-400 shrink-0" />}
                            <span className="truncate">{q.name}</span>
                            {q.error && <span className="ml-auto text-red-400 shrink-0">{q.error}</span>}
                        </li>
                    ))}
                </ul>
            )}

            <div className="flex gap-2">
                <div className="relative flex-1">
                    <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        value={url}
                        onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void addByUrl(); } }}
                        className={cn(STD_INPUT_CLASS, 'pl-9')}
                        placeholder="Ou cola o URL de uma foto já alojada"
                        aria-label="URL da foto"
                    />
                </div>
                <Button type="button" variant="glass" onClick={() => void addByUrl()} disabled={busy || !url.trim()}>Adicionar</Button>
            </div>
        </div>
    );
};
