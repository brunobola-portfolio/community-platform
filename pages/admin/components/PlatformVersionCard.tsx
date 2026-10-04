import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { Package, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { isMonitoringEnabled } from '../../../utils/monitoring';
import { api } from '../../../convex/_generated/api';
import { updateStatus } from '../../../convex/lib/semver';

/**
 * Two versions that are easy to confuse and expensive to mix up: the one this
 * browser is running, baked into the bundle at build time, and the one the
 * server is serving right now. They differ while a tab stays open across a
 * deploy, which is exactly when a report of "it is still broken" arrives.
 */
interface VersionManifest {
    version: string;
    builtAt: string;
}

const formatBuiltAt = (iso: string) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
        ? '—'
        : date.toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
};

export const PlatformVersionCard: React.FC = () => {
    const [served, setServed] = useState<VersionManifest | null>(null);
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        let active = true;
        // Cache-busted: a cached manifest would report the version this browser
        // already has, which is the one question it cannot answer
        fetch(`/version.json?cb=${Date.now()}`, { cache: 'no-store' })
            .then((response) => (response.ok ? response.json() : null))
            .then((manifest: VersionManifest | null) => {
                if (active) { setServed(manifest); setChecked(true); }
            })
            .catch(() => { if (active) setChecked(true); });
        return () => { active = false; };
    }, []);

    const backend = useQuery(api.platform.version);
    const latest = useQuery(api.platform.latest);
    const running = __PLATFORM_VERSION__;
    const release = updateStatus(served?.version ?? running, latest?.version);
    const isStale = Boolean(served && served.version !== running);
    // The web server and Convex deploy separately; a mismatch means one of them missed the release
    const backendBehind = Boolean(backend && served && backend.version !== served.version);

    return (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 flex items-center gap-2 font-serif text-lg text-white">
                <Package size={18} className="text-slate-400" /> Plataforma
            </h3>

            <dl className="space-y-3 text-sm">
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-slate-400">Nesta janela</dt>
                    <dd className="font-mono tabular-nums text-white">{running}</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-slate-400">Publicada no servidor</dt>
                    <dd className="font-mono tabular-nums text-white">
                        {served ? served.version : checked ? '—' : '…'}
                    </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-slate-400">Servidor Convex</dt>
                    <dd className={backendBehind ? 'font-mono tabular-nums text-amber-300' : 'font-mono tabular-nums text-white'}>
                        {backend ? backend.version : '…'}
                    </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-slate-400">Última publicada</dt>
                    <dd className="flex items-center gap-2 font-mono tabular-nums text-white">
                        {latest ? latest.version : '—'}
                        {release === 'current' && <span className="font-sans text-xs text-emerald-400">atualizada</span>}
                        {release === 'behind' && latest && (
                            <a href={latest.url} target="_blank" rel="noopener noreferrer" className="rounded font-sans text-xs text-amber-300 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                ver novidades
                            </a>
                        )}
                    </dd>
                </div>
                {served && (
                    <div className="flex items-baseline justify-between gap-4">
                        <dt className="text-slate-400">Build</dt>
                        <dd className="tabular-nums text-slate-300">{formatBuiltAt(served.builtAt)}</dd>
                    </div>
                )}
                <div className="flex items-baseline justify-between gap-4">
                    <dt className="text-slate-400">Monitorização de erros</dt>
                    <dd className={isMonitoringEnabled ? 'flex items-center gap-1.5 text-emerald-400' : 'flex items-center gap-1.5 text-slate-400'}>
                        {isMonitoringEnabled
                            ? <><ShieldCheck size={14} /> Ativa</>
                            : <><ShieldOff size={14} /> Desligada</>}
                    </dd>
                </div>
            </dl>

            {backendBehind && (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    O servidor Convex não está na mesma versão do site. Falta publicar o backend: peça à equipa técnica.
                </p>
            )}
            {release === 'behind' && latest && (
                <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Existe a versão {latest.version} da plataforma. Peça à equipa técnica para atualizar este site.
                </p>
            )}
            {isStale && (
                <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                >
                    <RefreshCw size={14} /> Há uma versão mais recente publicada — recarregar
                </button>
            )}
        </div>
    );
};
