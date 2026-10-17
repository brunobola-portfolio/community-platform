import React, { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { MailX, RotateCcw } from 'lucide-react';
import { Badge, Button } from '../../../components/ui/UIComponents';
import { EntityList } from '../components/EntityList';
import { api } from '../../../convex/_generated/api';
import type { Doc, Id } from '../../../convex/_generated/dataModel';
import { KIND_LABELS, type EmailKind } from '../../../convex/lib/email/kinds';
import type { ListFilter, ListSort } from '../../../hooks/useAdminList';
import { STATUS_LABELS } from './emailCopy';
import { EmailPreviewModal } from './EmailPreviewModal';
import { PROVIDER_LABELS, type EmailProviderId } from '../../../convex/lib/email/providers';

type LogRow = Omit<Doc<'emailLogs'>, 'html' | 'text'>;

interface EmailLogListProps {
    notify: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const FILTERS: ListFilter<LogRow>[] = [
    { key: 'all', label: 'Todos', predicate: () => true },
    { key: 'sent', label: 'Enviados', predicate: r => r.status === 'sent' },
    { key: 'problems', label: 'Com problemas', predicate: r => r.status === 'failed' || r.status === 'skipped' },
    { key: 'pending', label: 'Na fila', predicate: r => r.status === 'queued' || r.status === 'sending' },
];

const SORTS: ListSort<LogRow>[] = [
    { key: 'recent', label: 'Mais recentes', compare: (a, b) => b.createdAt - a.createdAt },
    { key: 'oldest', label: 'Mais antigos', compare: (a, b) => a.createdAt - b.createdAt },
];

const when = (ms: number) => new Date(ms).toLocaleString('pt-PT', { dateStyle: 'short', timeStyle: 'short' });
const kindLabel = (kind: string) => KIND_LABELS[kind as EmailKind] ?? kind;

const StatusBadge: React.FC<{ row: LogRow }> = ({ row }) => {
    const status = STATUS_LABELS[row.status] ?? STATUS_LABELS.queued;
    return <Badge className={status.className} title={row.error}>{status.label}</Badge>;
};

/** The email exactly as it went out, with when, through what and how many tries. */
const PreviewModal: React.FC<{ id: Id<'emailLogs'>; onClose: () => void }> = ({ id, onClose }) => {
    const log = useQuery(api.email.getLog, { id });
    const status = log ? (STATUS_LABELS[log.status] ?? STATUS_LABELS.queued).label : '';
    return (
        <EmailPreviewModal
            eyebrow={log ? kindLabel(log.kind) : 'Email'}
            title={log?.subject ?? 'A carregar…'}
            description={log ? `Para ${log.toName ? `${log.toName} <${log.to}>` : log.to}${log.replyTo ? ` · respostas para ${log.replyTo}` : ''}` : undefined}
            html={log?.html}
            details={log ? [
                { label: 'Estado', value: log.error ? `${status} · ${log.error}` : status },
                { label: 'Pedido', value: when(log.createdAt) },
                { label: 'Enviado', value: log.sentAt ? when(log.sentAt) : '—' },
                { label: 'Serviço · tentativas', value: `${PROVIDER_LABELS[log.provider as EmailProviderId] ?? log.provider ?? '—'} · ${log.attempts}` },
            ] : undefined}
            onClose={onClose}
        />
    );
};

/** Every email the site sent or tried to, newest first, with the reason when it failed. */
export const EmailLogList: React.FC<EmailLogListProps> = ({ notify }) => {
    const logs = useQuery(api.email.listLogs);
    const retry = useMutation(api.email.retry);
    const remove = useMutation(api.email.removeLog);
    const [preview, setPreview] = useState<Id<'emailLogs'> | null>(null);

    const run = async (work: () => Promise<unknown>, done: string) => {
        try {
            await work();
            notify(done);
        } catch (e) {
            notify(e instanceof ConvexError && typeof e.data === 'string' ? e.data : 'Não foi possível concluir.', 'error');
        }
    };

    return (
        <section aria-labelledby="email-log-title" className="space-y-4">
            <div>
                <h3 id="email-log-title" className="font-serif text-xl text-white">Histórico de envios</h3>
                <p className="mt-1 text-sm text-slate-400">Os últimos 100 emails, guardados durante 90 dias. Abra um para ver exatamente o que foi enviado.</p>
            </div>
            <EntityList<LogRow>
                items={logs ?? []}
                isLoading={logs === undefined}
                getKey={r => r._id}
                getTitle={r => r.subject}
                getSubtitle={r => `${r.to} · ${when(r.createdAt)}`}
                getStatus={r => <StatusBadge row={r} />}
                search={r => `${r.to} ${r.toName ?? ''} ${r.subject} ${kindLabel(r.kind)} ${r.error ?? ''}`}
                filters={FILTERS}
                sorts={SORTS}
                searchPlaceholder="Pesquisar por destinatário ou assunto"
                noun={['email', 'emails']}
                columns={[
                    { header: 'Email', cell: r => <div className="min-w-0"><div className="line-clamp-1 max-w-[280px] font-medium text-white">{r.subject}</div><div className="text-xs text-slate-400">{kindLabel(r.kind)}</div></div> },
                    { header: 'Para', cell: r => <span className="line-clamp-1 max-w-[220px] text-slate-300">{r.to}</span> },
                    { header: 'Quando', cell: r => <span className="tabular-nums text-slate-400">{when(r.createdAt)}</span> },
                    { header: 'Estado', cell: r => <div className="max-w-[260px] space-y-1"><StatusBadge row={r} />{r.error && <p className="line-clamp-2 text-xs text-slate-400">{r.error}</p>}</div> },
                ]}
                extraActions={r => (r.status === 'failed' || r.status === 'skipped') ? (
                    <Button size="sm" variant="ghost" className="text-sky-300 hover:text-sky-200" aria-label={`Tentar enviar de novo: ${r.subject}`} onClick={() => void run(() => retry({ id: r._id }), 'Vai ser enviado de novo.')}>
                        <RotateCcw size={16} /> Reenviar
                    </Button>
                ) : null}
                onEdit={r => setPreview(r._id)}
                editLabel="Ver"
                onDelete={r => void run(() => remove({ id: r._id }), 'Registo apagado.')}
                emptyIcon={MailX}
                emptyTitle="Ainda não foi enviado nenhum email"
                emptyDescription="Quando alguém se inscrever ou escrever pelo site, os emails aparecem aqui com o estado de cada um."
            />
            {preview && <PreviewModal id={preview} onClose={() => setPreview(null)} />}
        </section>
    );
};
