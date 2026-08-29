/**
 * Forms for the system entities: documents, notifications and the homepage
 * stats ribbon.
 */

import React from 'react';
import { cn } from '../../../utils/cn';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS, LABEL_CLASS } from '../constants';
import type { FieldHelpers, NumHelper } from './types';

// ── Document Form ───────────────────────────────────────────────────────────

export const DocumentForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div>
            <label className={LABEL_CLASS}>Categoria</label>
            <AdminSelect value={str('category', 'Outros')} onChange={e => setField('category', e.target.value)}>
                <option value="Atas">Atas</option>
                <option value="Relatórios">Relatórios</option>
                <option value="Estatutos">Estatutos</option>
                <option value="Regulamentos">Regulamentos</option>
                <option value="Outros">Outros</option>
            </AdminSelect>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={LABEL_CLASS}>URL do Ficheiro</label><input value={str('url')} onChange={e => setField('url', e.target.value)} className={STD_INPUT_CLASS} placeholder="https://..." /></div>
            <div><label className={LABEL_CLASS}>Tamanho (Ex: 2 MB)</label><input value={str('size')} onChange={e => setField('size', e.target.value)} className={STD_INPUT_CLASS} placeholder="1.5 MB" /></div>
        </div>
    </div>
);

// ── Notification Form ───────────────────────────────────────────────────────

export const NotificationForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <div><label className={LABEL_CLASS}>Título</label><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></div>
        <div><label className={LABEL_CLASS}>Mensagem</label><textarea required value={str('message')} onChange={e => setField('message', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-24')} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
                <label className={LABEL_CLASS}>Tipo</label>
                <AdminSelect value={str('type', 'info')} onChange={e => setField('type', e.target.value)}>
                    <option value="info">Informação</option>
                    <option value="warning">Aviso</option>
                    <option value="urgent">Urgente</option>
                    <option value="success">Sucesso</option>
                </AdminSelect>
            </div>
            <div>
                <label className={LABEL_CLASS}>Destinatários</label>
                <AdminSelect value={str('target', 'all')} onChange={e => setField('target', e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="user">Sócios</option>
                    <option value="admin">Administração</option>
                </AdminSelect>
            </div>
        </div>
    </div>
);

// ── Stat Form ───────────────────────────────────────────────────────────────

interface StatFormProps extends FieldHelpers, NumHelper {}

export const StatForm: React.FC<StatFormProps> = ({ str, num, setField }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2"><label className={LABEL_CLASS}>Rótulo (Ex: Fundada em...)</label><input required value={str('label')} onChange={e => setField('label', e.target.value)} className={STD_INPUT_CLASS} /></div>
            <div><label className={LABEL_CLASS}>Valor (Ex: 1982)</label><input required value={str('value')} onChange={e => setField('value', e.target.value)} className={STD_INPUT_CLASS} /></div>
        </div>
        <div><label className={LABEL_CLASS}>Ordem de Exibição</label><input type="number" value={num('order')} onChange={e => setField('order', parseInt(e.target.value))} className={STD_INPUT_CLASS} /></div>
    </div>
);
