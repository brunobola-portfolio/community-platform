/**
 * Entity List
 *
 * The single list surface of the backoffice: toolbar (search, filters, sort,
 * counter), desktop table, mobile cards and both empty states — the one for an
 * empty collection and the one for a search that matched nothing. Every entity
 * tab describes its columns and handlers here instead of rebuilding a table, so
 * the actions, spacing and behaviour stay identical across the panel.
 */

import React from 'react';
import { Copy, Edit2, Trash2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../../components/ui/UIComponents';
import { EmptyState } from '../../../components/ui/EmptyState';
import { AdminListToolbar, AdminListEmpty } from './AdminListToolbar';
import { useAdminList, type ListFilter, type ListSort } from '../../../hooks/useAdminList';

export interface EntityColumn<T> {
  header: string;
  cell: (item: T) => React.ReactNode;
  /** Extra classes for the cell, e.g. a width cap for long text. */
  className?: string;
}

export interface EntityListProps<T> {
  items: T[];
  columns: EntityColumn<T>[];
  getKey: (item: T) => string;
  /** Used by the delete confirmation and as the mobile card title. */
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string | undefined;
  getImage?: (item: T) => string | undefined;
  getStatus?: (item: T) => React.ReactNode;
  /** Haystack for the search box. */
  search: (item: T) => string;
  filters?: ListFilter<T>[];
  sorts?: ListSort<T>[];
  searchPlaceholder: string;
  /** Singular and plural, e.g. ['evento', 'eventos']. */
  noun: [string, string];
  onEdit: (item: T) => void;
  onDelete: (item: T) => void;
  onDuplicate?: (item: T) => void;
  /** Empty collection state (no records at all). */
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription: string;
  onCreate?: () => void;
  createLabel?: string;
  isLoading?: boolean;
}

const RowActions = <T,>({
  item,
  onEdit,
  onDelete,
  onDuplicate,
}: Pick<EntityListProps<T>, 'onEdit' | 'onDelete' | 'onDuplicate'> & { item: T }) => (
  <div className="flex items-center justify-end gap-1">
    {onDuplicate && (
      <Button size="sm" variant="ghost" aria-label="Duplicar" title="Duplicar" onClick={() => onDuplicate(item)}>
        <Copy size={16} />
      </Button>
    )}
    <Button size="sm" variant="ghost" aria-label="Editar" title="Editar" onClick={() => onEdit(item)}>
      <Edit2 size={16} />
    </Button>
    <Button
      size="sm"
      variant="ghost"
      aria-label="Apagar"
      title="Apagar"
      className="text-red-400 hover:text-red-300"
      onClick={() => onDelete(item)}
    >
      <Trash2 size={16} />
    </Button>
  </div>
);

const LoadingRows: React.FC<{ columns: number }> = ({ columns }) => (
  <>
    {[0, 1, 2].map(row => (
      <tr key={row} className="animate-pulse">
        {Array.from({ length: columns + 1 }).map((_, cell) => (
          <td key={cell} className="p-4">
            <span className="block h-3 rounded bg-white/10" />
          </td>
        ))}
      </tr>
    ))}
  </>
);

export function EntityList<T>({
  items,
  columns,
  getKey,
  getTitle,
  getSubtitle,
  getImage,
  getStatus,
  search,
  filters,
  sorts,
  searchPlaceholder,
  noun,
  onEdit,
  onDelete,
  onDuplicate,
  emptyIcon,
  emptyTitle,
  emptyDescription,
  onCreate,
  createLabel,
  isLoading = false,
}: EntityListProps<T>) {
  const list = useAdminList(items, { searchText: search, filters, sorts });
  const hasToolbar = items.length > 0 && !isLoading;

  if (!isLoading && items.length === 0) {
    return (
      <div className="rounded-2xl border border-white/10 bg-dark-surface animate-fade-in-up">
        <EmptyState
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
          action={onCreate && createLabel ? { label: createLabel, onClick: onCreate } : undefined}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in-up">
      {hasToolbar && <AdminListToolbar list={list} placeholder={searchPlaceholder} noun={noun} />}

      {!isLoading && list.visible.length === 0 ? (
        <AdminListEmpty query={list.query} noun={noun[0]} />
      ) : (
        <>
          {/* Desktop: scrolls horizontally instead of clipping long content */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-dark-surface shadow-sm md:block">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-slate-400">
                  <tr>
                    {columns.map(column => (
                      <th key={column.header} scope="col" className="whitespace-nowrap p-4 font-medium">
                        {column.header}
                      </th>
                    ))}
                    <th scope="col" className="p-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <LoadingRows columns={columns.length} />
                  ) : (
                    list.visible.map(item => (
                      <tr key={getKey(item)} className="transition-colors hover:bg-white/[0.04]">
                        {columns.map(column => (
                          <td key={column.header} className={`p-4 align-middle ${column.className ?? ''}`}>
                            {column.cell(item)}
                          </td>
                        ))}
                        <td className="p-4 align-middle">
                          <RowActions item={item} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile: same actions as the desktop row, never a reduced set */}
          <div className="space-y-3 md:hidden">
            {isLoading
              ? [0, 1, 2].map(i => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />)
              : list.visible.map(item => {
                const image = getImage?.(item);
                const subtitle = getSubtitle?.(item);
                const status = getStatus?.(item);
                return (
                  <div
                    key={getKey(item)}
                    className="rounded-2xl border border-white/10 bg-dark-surface p-3 shadow-sm"
                  >
                    {/* Actions sit on their own row so the title keeps the full width */}
                    <div className="flex items-start gap-3">
                      {image && (
                        <img
                          src={image}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-xl border border-white/5 bg-black/40 object-cover"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-medium text-white">{getTitle(item)}</h4>
                        {subtitle && <p className="mt-0.5 truncate text-xs text-slate-400">{subtitle}</p>}
                        {status && <div className="mt-1.5">{status}</div>}
                      </div>
                    </div>
                    <div className="mt-2 border-t border-white/5 pt-2">
                      <RowActions item={item} onEdit={onEdit} onDelete={onDelete} onDuplicate={onDuplicate} />
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
