import React from 'react';
import { Bell } from 'lucide-react';
import { Badge } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import type { AdminRecord, EntityHandlers } from '../types';
import type { Notification as AppNotification } from '../../../types';

const TYPE_STYLES: Record<string, string> = {
    info: 'bg-blue-500/10 text-blue-300 border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    urgent: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const TARGET_LABELS: Record<string, string> = {
    all: 'Todos',
    user: 'Sócios',
    admin: 'Administração',
};

const FILTERS: ListFilter<AppNotification>[] = [
    { key: 'all', label: 'Todas', predicate: () => true },
    { key: 'info', label: 'Informação', predicate: n => n.type === 'info' },
    { key: 'warning', label: 'Aviso', predicate: n => n.type === 'warning' },
    { key: 'success', label: 'Sucesso', predicate: n => n.type === 'success' },
    { key: 'urgent', label: 'Urgente', predicate: n => n.type === 'urgent' },
];

const SORTS: ListSort<AppNotification>[] = [
    { key: 'date-desc', label: 'Mais recentes', compare: (a, b) => (b.date ?? '').localeCompare(a.date ?? '') },
    { key: 'title', label: 'Título A–Z', compare: (a, b) => a.title.localeCompare(b.title, 'pt') },
];

const TypeBadge: React.FC<{ type?: string }> = ({ type }) => (
    <Badge className={TYPE_STYLES[type ?? 'info'] ?? TYPE_STYLES.info}>{type ?? 'info'}</Badge>
);

export const NotificationsTab: React.FC<EntityHandlers & { notifications: AppNotification[] }> = ({ notifications, ...h }) => (
    <EntityList<AppNotification>
        items={notifications}
        isLoading={h.isLoading}
        getKey={n => n.id}
        getTitle={n => n.title}
        getSubtitle={n => n.message}
        getStatus={n => <TypeBadge type={n.type} />}
        search={n => `${n.title} ${n.message} ${n.type ?? ''}`}
        filters={FILTERS}
        sorts={SORTS}
        searchPlaceholder="Pesquisar notificações por título ou mensagem"
        noun={['notificação', 'notificações']}
        columns={[
            { header: 'Título', cell: n => <span className="font-medium text-white">{n.title}</span> },
            {
                header: 'Mensagem',
                className: 'max-w-md',
                cell: n => <span className="line-clamp-2 text-slate-400">{n.message}</span>,
            },
            { header: 'Tipo', cell: n => <TypeBadge type={n.type} /> },
            { header: 'Destinatários', cell: n => <span className="text-xs text-slate-400">{TARGET_LABELS[n.target ?? 'all'] ?? n.target}</span> },
        ]}
        onEdit={n => h.openEditModal('notification', n as unknown as AdminRecord)}
        onDelete={n => h.handleDeleteRequest('notification', n.id, n.title)}
        onDuplicate={h.handleDuplicate ? n => h.handleDuplicate?.('notification', n as unknown as AdminRecord) : undefined}
        emptyIcon={Bell}
        emptyTitle="Ainda não há notificações"
        emptyDescription="Envie avisos aos sócios — aparecem na área reservada de quem tem sessão iniciada."
        onCreate={h.onCreate}
        createLabel="Enviar notificação"
    />
);
