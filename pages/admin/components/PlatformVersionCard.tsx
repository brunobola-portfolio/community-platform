import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, ShieldCheck, ShieldOff } from 'lucide-react';
import { isMonitoringEnabled } from '../../../utils/monitoring';

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

    const running = __PLATFORM_VERSION__;
    const isStale = Boolean(served && served.version !== running);

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
