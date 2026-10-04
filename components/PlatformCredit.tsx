import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';
import { updateStatus } from '../convex/lib/semver';

/**
 * The footer credit carries the version in plain sight, so anyone checking an
 * instance reads it without opening a console. It also says, at a glance,
 * whether that version is the newest release, and the backend reports its own
 * version: when a deploy reached the web server but not Convex (or the other
 * way round) the credit says so, which is the one mismatch that breaks features.
 */
export const PlatformCredit: React.FC = () => {
  const backend = useQuery(api.platform.version);
  const latest = useQuery(api.platform.latest);
  const site = __PLATFORM_VERSION__;
  const mismatch = backend && backend.version !== site;
  const status = updateStatus(site, latest?.version);

  return (
    <span className="inline-flex flex-wrap items-center justify-center gap-x-1 gap-y-1 md:justify-start">
      <a
        href="https://bolalabs.pt"
        target="_blank"
        rel="noopener noreferrer"
        title={`Site v${site}${backend ? ` · servidor v${backend.version}` : ''}${latest ? ` · última publicada v${latest.version}` : ''}`}
        className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        Community Platform <span className="tabular-nums">v{site}</span> by BolaLabs
      </a>
      {mismatch && (
        <span className="ml-1 text-amber-700 dark:text-amber-400">
          (servidor <span className="tabular-nums">v{backend.version}</span>)
        </span>
      )}
      {status === 'current' && (
        <span className="ml-1 inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400" title="É a versão mais recente da plataforma">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" /> atualizada
        </span>
      )}
      {status === 'behind' && latest && (
        <a
          href={latest.url}
          target="_blank"
          rel="noopener noreferrer"
          title="Há uma versão mais recente da plataforma: ver as novidades"
          className="ml-1 inline-flex items-center gap-1 rounded text-amber-700 dark:text-amber-400 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
        >
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
          <span className="tabular-nums">v{latest.version}</span> disponível
        </a>
      )}
    </span>
  );
};
