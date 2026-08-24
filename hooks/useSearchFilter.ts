import { useState, useMemo } from 'react';

/**
 * Normalizes a string for accent-insensitive, case-insensitive comparison.
 * Strips diacritics and lowercases the input.
 */
export function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface UseSearchFilterConfig<T> {
  searchFields: (keyof T)[];
  categoryField?: keyof T;
}

export function useSearchFilter<T extends Record<string, unknown>>(
  items: T[],
  config: UseSearchFilterConfig<T>
) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalize(searchTerm);

    return items.filter((item) => {
      // Category filter
      if (activeFilter !== 'Todos' && config.categoryField) {
        const categoryValue = String(item[config.categoryField] ?? '');
        if (categoryValue !== activeFilter) return false;
      }

      // Search filter
      if (normalizedSearch) {
        return config.searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return normalize(value).includes(normalizedSearch);
          }
          if (Array.isArray(value)) {
            return value.some(
              (v) => typeof v === 'string' && normalize(v).includes(normalizedSearch)
            );
          }
          return false;
        });
      }

      return true;
    });
  }, [items, searchTerm, activeFilter, config.searchFields, config.categoryField]);

  return { searchTerm, setSearchTerm, activeFilter, setActiveFilter, filteredItems };
}
