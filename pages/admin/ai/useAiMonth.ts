import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { monthStart } from './aiUsageCopy';

/** This month's AI spend and the admin's budget; undefined while loading, null for non-admins. */
export function useAiMonth() {
    const since = useMemo(() => monthStart(), []);
    return useQuery(api.aiLogs.monthSummary, { since });
}
