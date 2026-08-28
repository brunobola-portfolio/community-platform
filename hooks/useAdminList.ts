import { useMemo, useState } from 'react';

export interface ListFilter<T> {
    key: string;
    label: string;
    predicate: (item: T) => boolean;
}

export interface ListSort<T> {
    key: string;
    label: string;
    compare: (a: T, b: T) => number;
}

interface UseAdminListOptions<T> {
    /** Text used for the search box; lowercased before matching. */
    searchText: (item: T) => string;
    filters?: ListFilter<T>[];
    sorts?: ListSort<T>[];
    defaultFilter?: string;
    defaultSort?: string;
}

export interface AdminListState<T> {
    visible: T[];
    total: number;
    query: string;
    setQuery: (value: string) => void;
    filterKey: string;
    setFilterKey: (key: string) => void;
    sortKey: string;
    setSortKey: (key: string) => void;
    filters: ListFilter<T>[];
    sorts: ListSort<T>[];
    /** Count per filter key, computed on the unfiltered set so chips stay informative. */
    counts: Record<string, number>;
}

const normalize = (value: string) => value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Search + filter chips + sort for backoffice lists. Pure client-side: the
 * lists are already loaded by DataContext, so filtering here is instant and
 * keeps Convex queries simple.
 */
export function useAdminList<T>(items: T[], options: UseAdminListOptions<T>): AdminListState<T> {
    const { searchText, filters = [], sorts = [], defaultFilter, defaultSort } = options;
    const [query, setQuery] = useState('');
    const [filterKey, setFilterKey] = useState(defaultFilter ?? filters[0]?.key ?? 'all');
    const [sortKey, setSortKey] = useState(defaultSort ?? sorts[0]?.key ?? '');

    const counts = useMemo(() => {
        const result: Record<string, number> = {};
        for (const f of filters) result[f.key] = items.filter(f.predicate).length;
        return result;
    }, [items, filters]);

    const visible = useMemo(() => {
        const q = normalize(query.trim());
        const filter = filters.find(f => f.key === filterKey);
        const sort = sorts.find(s => s.key === sortKey);
        let list = items;
        if (filter) list = list.filter(filter.predicate);
        if (q) list = list.filter(item => normalize(searchText(item)).includes(q));
        if (sort) list = [...list].sort(sort.compare);
        return list;
    }, [items, query, filterKey, sortKey, filters, sorts, searchText]);

    return { visible, total: items.length, query, setQuery, filterKey, setFilterKey, sortKey, setSortKey, filters, sorts, counts };
}
