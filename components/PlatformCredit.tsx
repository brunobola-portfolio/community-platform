import React from 'react';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

/**
 * The footer credit carries the version in plain sight, so anyone checking an
 * instance reads it without opening a console. The backend reports its own
 * version; when a deploy reached the web server but not Convex (or the other way
 * round) the credit says so, which is the one mismatch that breaks features.
 */
export const PlatformCredit: React.FC = () => {
  const backend = useQuery(api.platform.version);
  const site = __PLATFORM_VERSION__;
  const mismatch = backend && backend.version !== site;

  return (
    <span className="block sm:inline">
      <a
        href="https://bolalabs.pt"
        target="_blank"
        rel="noopener noreferrer"
        title={`Site v${site}${backend ? ` · servidor v${backend.version}` : ''}`}
        className="text-slate-600 dark:text-slate-400 hover:text-brand-500 transition-colors rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        Community Platform <span className="tabular-nums">v{site}</span> by BolaLabs
      </a>
      {mismatch && (
        <span className="ml-1 text-amber-700 dark:text-amber-400">
          (servidor <span className="tabular-nums">v{backend.version}</span>)
        </span>
      )}
    </span>
  );
};
