/**
 * Forms for the system entities: documents, notifications and the homepage
 * stats ribbon.
 */

import React from 'react';
import { cn } from '../../../utils/cn';
import { AdminSelect } from '../components/AdminSelect';
import { STD_INPUT_CLASS } from '../constants';
import type { FieldHelpers, NumHelper } from './types';
import { Field } from '../components/Field';

// ── Document Form ───────────────────────────────────────────────────────────

export const DocumentForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <Field label="Título"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></Field>
        <Field label="Categoria"><AdminSelect value={str('category', 'Outros')} onChange={e => setField('category', e.target.value)}>
                <option value="Atas">Atas</option>
                <option value="Relatórios">Relatórios</option>
                <option value="Estatutos">Estatutos</option>
                <option value="Regulamentos">Regulamentos</option>
                <option value="Outros">Outros</option>
            </AdminSelect></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="URL do Ficheiro"><input value={str('url')} onChange={e => setField('url', e.target.value)} className={STD_INPUT_CLASS} placeholder="https://..." /></Field>
            <Field label="Tamanho (Ex: 2 MB)"><input value={str('size')} onChange={e => setField('size', e.target.value)} className={STD_INPUT_CLASS} placeholder="1.5 MB" /></Field>
        </div>
    </div>
);

// ── Notification Form ───────────────────────────────────────────────────────

export const NotificationForm: React.FC<FieldHelpers> = ({ str, setField }) => (
    <div className="space-y-6">
        <Field label="Título"><input required value={str('title')} onChange={e => setField('title', e.target.value)} className={STD_INPUT_CLASS} /></Field>
        <Field label="Mensagem"><textarea required value={str('message')} onChange={e => setField('message', e.target.value)} className={cn(STD_INPUT_CLASS, 'h-24')} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tipo"><AdminSelect value={str('type', 'info')} onChange={e => setField('type', e.target.value)}>
                    <option value="info">Informação</option>
                    <option value="warning">Aviso</option>
                    <option value="urgent">Urgente</option>
                    <option value="success">Sucesso</option>
                </AdminSelect></Field>
            <Field label="Destinatários"><AdminSelect value={str('target', 'all')} onChange={e => setField('target', e.target.value)}>
                    <option value="all">Todos</option>
                    <option value="user">Sócios</option>
                    <option value="admin">Administração</option>
                </AdminSelect></Field>
        </div>
    </div>
);

// ── Stat Form ───────────────────────────────────────────────────────────────

interface StatFormProps extends FieldHelpers, NumHelper {}

export const StatForm: React.FC<StatFormProps> = ({ str, num, setField }) => (
    <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Rótulo (Ex: Fundada em...)" className="sm:col-span-2"><input required value={str('label')} onChange={e => setField('label', e.target.value)} className={STD_INPUT_CLASS} /></Field>
            <Field label="Valor (Ex: 1982)"><input required value={str('value')} onChange={e => setField('value', e.target.value)} className={STD_INPUT_CLASS} /></Field>
        </div>
        <Field label="Ordem de Exibição"><input type="number" value={num('order')} onChange={e => setField('order', parseInt(e.target.value))} className={STD_INPUT_CLASS} /></Field>
    </div>
);
