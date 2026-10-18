import { useEffect, useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Domains (of the given addresses) that cannot receive mail, checked on the
 * server after the board stops typing. Unknown results count as fine: a DNS
 * hiccup must not raise a false alarm.
 */
export function useMailboxCheck(addresses: string[]): Set<string> {
    const check = useAction(api.emailChecks.checkMailDomains);
    const [dead, setDead] = useState<Set<string>>(new Set());
    const key = addresses.map(a => a.trim().toLowerCase()).filter(a => EMAIL.test(a)).sort().join(',');

    useEffect(() => {
        if (!key) { setDead(new Set()); return; }
        let cancelled = false;
        const timer = setTimeout(() => {
            check({ addresses: key.split(',') })
                .then(results => { if (!cancelled) setDead(new Set(results.filter(r => r.receives === false).map(r => r.domain))); })
                .catch(() => { if (!cancelled) setDead(new Set()); });
        }, 600);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [key, check]);

    return dead;
}

export const domainOf = (address: string) => address.trim().toLowerCase().split('@')[1] ?? '';
