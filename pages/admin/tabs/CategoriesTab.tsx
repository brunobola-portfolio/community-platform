import React from 'react';
import { Layers } from 'lucide-react';
import { EntityList } from '../components/EntityList';
import { categoryColorClass } from '../../../utils/categoryColors';
import type { ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Category } from '../../../types';

const SORTS: ListSort<Category>[] = [
    { key: 'name', label: 'Nome A–Z', compare: (a, b) => a.name.localeCompare(b.name, 'pt') },
];

const Swatch: React.FC<{ color?: string }> = ({ color }) => (
    <span className={`inline-block h-5 w-5 rounded-full ring-1 ring-white/20 ${categoryColorClass(color)}`} />
);

export const CategoriesTab: React.FC<EntityHandlers & { categories: Category[] }> = ({ categories, ...h }) => (
    <EntityList<Category>
        items={categories}
        isLoading={h.isLoading}
        getKey={c => c.id}
        getTitle={c => c.name}
        getSubtitle={c => c.slug}
        getStatus={c => <Swatch color={c.color} />}
        search={c => `${c.name} ${c.slug}`}
        sorts={SORTS}
        searchPlaceholder="Pesquisar categorias"
        noun={['categoria', 'categorias']}
        columns={[
            { header: 'Nome', cell: c => <span className="font-medium text-white">{c.name}</span> },
            { header: 'Cor', cell: c => <Swatch color={c.color} /> },
            { header: 'Slug', cell: c => <span className="font-mono text-xs text-slate-500">{c.slug}</span> },
        ]}
        onEdit={c => h.openEditModal('category', c as unknown as AdminRecord)}
        onDelete={c => h.handleDeleteRequest('category', c.id, c.name)}
        emptyIcon={Layers}
        emptyTitle="Ainda não há categorias"
        emptyDescription="As categorias organizam eventos e notícias e dão-lhes a cor que aparece no portal."
        onCreate={h.onCreate}
        createLabel="Criar categoria"
    />
);
