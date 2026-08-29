
/**
 * Admin OS (Backoffice) -- Thin orchestrator
 *
 * Delegates rendering to specialized sub-components under pages/admin/.
 * Owns top-level state (activeTab, modal, formData) and routes to the correct tab.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Menu, PenTool, Calendar, Bell } from 'lucide-react';
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

import type { Tab, ToastState, AIStats, AdminFormData, AdminRecord } from './admin/types';
import type { ActionResult, Registration } from '../types';
import { TAB_NAMES, TAB_DESCRIPTIONS, NEW_LABELS, formatDateForInput, getGreeting } from './admin/constants';
import { describeActionError } from './admin/errors';
import { Toast } from './admin/components/Toast';
import { AdminSidebar } from './admin/components/AdminSidebar';
import { AdminPageHeader } from './admin/components/AdminPageHeader';
import { DeleteConfirmDialog } from './admin/components/DeleteConfirmDialog';
import type { DeleteConfirmState } from './admin/components/DeleteConfirmDialog';
import { RegistrationModal } from './admin/components/RegistrationModal';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminAITab } from './admin/AdminAITab';
import { AdminLeadsTab } from './admin/AdminLeadsTab';
import { AdminMemberQuotasTab } from './admin/AdminMemberQuotasTab';
import { AdminFormModal } from './admin/AdminFormModal';
import { HomepageTab } from './admin/tabs/HomepageTab';
import { EventsTab } from './admin/tabs/EventsTab';
import { NewsTab } from './admin/tabs/NewsTab';
import { MembersTab } from './admin/tabs/MembersTab';
import { SponsorsTab } from './admin/tabs/SponsorsTab';
import { CategoriesTab } from './admin/tabs/CategoriesTab';
import { TiersTab } from './admin/tabs/TiersTab';
import { DocumentsTab } from './admin/tabs/DocumentsTab';
import { NotificationsTab } from './admin/tabs/NotificationsTab';
import { MilestonesTab } from './admin/tabs/MilestonesTab';
import { AdminGalleryManager } from './admin/gallery/AdminGalleryManager';

/**
 * The wrappers return either an ActionResult (`error`) or the category shape
 * (`message`); this reads the failure text from both without narrowing games.
 */
const failureText = (result: unknown): string | undefined => {
    if (!result || typeof result !== 'object') return undefined;
    const r = result as { error?: unknown; message?: unknown };
    if (typeof r.error === 'string') return r.error;
    if (typeof r.message === 'string') return r.message;
    return undefined;
};

/** Entity type created by the primary action of each list tab. */
const NEW_ENTITY_BY_TAB: Partial<Record<Tab, string>> = {
    news: 'post', events: 'event', members: 'member', gallery: 'album', notifications: 'notification',
    sponsors: 'sponsor', categories: 'category', tiers: 'tier', documents: 'document',
    homepage: 'actionArea', historia: 'milestone',
};

export const AdminPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const {
        adminEvents: events, adminPosts: posts, members, categories, settings, activityLogs, registrations, sponsors, sponsorTiers,
        documents, notifications, albums, actionAreas, stats, isLoading,
        addEvent, updateEvent, deleteEvent,
        addPost, updatePost, deletePost,
        addMember, updateMember, deleteMember,
        addCategory, updateCategory, deleteCategory,
        addSponsor, updateSponsor, deleteSponsor,
        updateSettings, updateRegistrationStatus,
        addDocument, deleteDocument, updateDocument,
        sendNotification, deleteNotification, updateNotification,
        createAlbum, deleteAlbum, updateAlbum,
        addActionArea, updateActionArea, deleteActionArea,
        upsertStat, deleteStat,
        milestones, addMilestone, updateMilestone, deleteMilestone,
        upsertSponsorTier, deleteSponsorTier
    } = useData();

    const generateImageAction = useAction(api.ai.generateImage);
    const enhanceTextAction = useAction(api.ai.enhanceText);
    const aiStats = useQuery(api.aiLogs.getStats, { days: 7 }) as AIStats | undefined;

    // ── State ────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<Tab>('dashboard');
    const [showModal, setShowModal] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTierId, setEditingTierId] = useState<string | null>(null);
    const [formData, setFormData] = useState<AdminFormData>({});
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isEnhancingText, setIsEnhancingText] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSavingSettings, setIsSavingSettings] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [settingsForm, setSettingsForm] = useState(settings);
    const [toast, setToast] = useState<ToastState | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmState | null>(null);
    const [tempPhotoUrl, setTempPhotoUrl] = useState('');
    const [viewRegistration, setViewRegistration] = useState<Registration | null>(null);

    useEffect(() => { setSettingsForm(settings); }, [settings]);

    const dashboardStats = useMemo(() => {
        const activeEventCount = events.filter(e => new Date(e.date) >= new Date()).length;
        const confirmedRegistrations = registrations.filter(r => r.status === 'confirmed').length;
        const pendingRegistrations = registrations.filter(r => r.status === 'pending');
        return { activeEventCount, confirmedRegistrations, pendingRegistrations };
    }, [events, registrations]);

    const notify = (message: string, type: ToastState['type'] = 'success') => setToast({ message, type });

    // ── AI Handlers ──────────────────────────────────────────────────────────
    const handleGenerateImage = async (customPrompt?: string, options?: { model?: string; resolution?: string }) => {
        setIsGeneratingImage(true);
        const prompt = customPrompt || String(formData.title ?? '') || "Community event";
        try {
            const result = await generateImageAction({ prompt, style: settings.defaultImageStyle, model: options?.model, resolution: options?.resolution });
            const url = result.imageUrl;
            setFormData(prev => ({ ...prev, imageUrl: url, coverUrl: url, photoUrl: url, logoUrl: url }));
        } catch (e: unknown) {
            console.error("Image generation error:", e);
            notify('Não foi possível gerar a imagem. Tente outro pedido ou carregue uma imagem sua.', 'error');
        } finally { setIsGeneratingImage(false); }
    };

    const handleEnhanceText = async () => {
        const currentText = String(formData.description ?? formData.content ?? formData.excerpt ?? formData.message ?? '');
        if (!currentText) {
            notify('Escreva algum texto antes de pedir ajuda à IA.', 'info');
            return;
        }
        setIsEnhancingText(true);
        try {
            const result = await enhanceTextAction({ text: currentText, tone: settings.contentTone });
            if (result.enhancedText) {
                const key = showModal === 'event' ? 'description' : showModal === 'notification' ? 'message' : 'content';
                setFormData(prev => ({ ...prev, [key]: result.enhancedText }));
            }
        } catch (e: unknown) {
            console.error("AI Enhancement error:", e);
            notify('O assistente de texto está indisponível de momento.', 'error');
        } finally { setIsEnhancingText(false); }
    };

    // ── Modal Helpers ────────────────────────────────────────────────────────
    const openEditModal = (type: string, item: AdminRecord) => {
        setEditingId(item.id);
        setEditingTierId(type === 'tier' ? item.id : null);
        const d: AdminFormData = { ...item };
        if ((type === 'event' || type === 'post') && typeof item.date === 'string') d.date = formatDateForInput(item.date);
        if (type === 'album' && !item.photos) d.photos = [];
        if (type === 'event' && !item.registrationFields) d.registrationFields = [];
        if (type === 'tier' && Array.isArray(item.benefits)) d.benefits = item.benefits.join('\n');
        setFormData(d);
        setShowModal(type);
    };

    const handleDuplicate = (type: string, item: AdminRecord) => {
        const copy: AdminFormData = { ...item, id: null };
        if (typeof item.title === 'string') copy.title = `${item.title} (Cópia)`;
        if (typeof item.name === 'string') copy.name = `${item.name} (Cópia)`;
        if (type === 'event') { copy.date = formatDateForInput(new Date().toISOString()); copy.currentParticipants = 0; copy.slug = ''; copy.registrationOpen = false; }
        else if (type === 'post') { copy.date = formatDateForInput(new Date().toISOString()); copy.published = false; copy.slug = ''; }
        else if (type === 'document' || type === 'album') { copy.date = new Date().toISOString().split('T')[0]; }
        else if (type === 'notification') { copy.date = new Date().toISOString(); }
        setEditingId(null); setFormData(copy); setShowModal(type);
        notify('Cópia aberta. Reveja os dados e guarde para criar o novo registo.', 'info');
    };

    const handleDeleteRequest = (type: string, id: string, title: string) => setDeleteConfirm({ type, id, title });

    const confirmDelete = async () => {
        if (!deleteConfirm || isDeleting) return;
        const { type, id } = deleteConfirm;
        setIsDeleting(true);
        try {
            const map: Record<string, () => Promise<{ success: boolean; message?: string; error?: string }>> = {
                event: () => deleteEvent(id), post: () => deletePost(id), member: () => deleteMember(id),
                category: () => deleteCategory(id), sponsor: () => deleteSponsor(id), document: () => deleteDocument(id),
                notification: () => deleteNotification(id), album: () => deleteAlbum(id),
                actionArea: () => deleteActionArea(id), stat: () => deleteStat(id), tier: () => deleteSponsorTier(id),
                milestone: () => deleteMilestone(id),
            };
            const fn = map[type];
            if (!fn) return;
            const r = await fn();
            // Wrappers return either `error` (ActionResult) or `message` (categories)
            if (r.success) notify(`"${deleteConfirm.title}" foi removido.`);
            else notify(describeActionError(failureText(r), 'Não foi possível apagar o registo.'), 'error');
        } catch (e: unknown) {
            notify(describeActionError(e instanceof Error ? e.message : undefined, 'Não foi possível apagar o registo.'), 'error');
        } finally {
            setIsDeleting(false);
            setDeleteConfirm(null);
        }
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const buildPayload = (type: string, rest: AdminFormData): AdminFormData => {
        switch (type) {
            case 'event':
                return { ...rest, categoryId: rest.categoryId || categories[0]?.id || '', entryPrice: Number(rest.entryPrice) || 0, maxParticipants: Number(rest.maxParticipants) || 0, registrationFields: rest.registrationFields || [] };
            case 'post':
                return {
                    ...rest,
                    categoryId: rest.categoryId || categories[0]?.id || '',
                    tags: typeof rest.tags === 'string' ? rest.tags.split(',').map(t => t.trim()).filter(Boolean) : rest.tags,
                };
            case 'member':
                // Order and group render visual fallbacks without writing to formData
                return { ...rest, order: Number(rest.order) || 1, group: rest.group || 'Direção' };
            case 'tier':
                return { ...rest, benefits: typeof rest.benefits === 'string' ? rest.benefits.split('\n').filter(x => x.trim()) : (rest.benefits ?? []), order: Number(rest.order) || sponsorTiers.length + 1 };
            case 'document':
                // Whitelist mutation args: the form keeps the legacy `url` key and edits carry read-only fields the validator rejects
                return { title: rest.title, description: rest.description, category: rest.category || 'Outros', date: rest.date, size: rest.size, externalUrl: rest.externalUrl || rest.url || undefined };
            case 'notification':
                return { title: rest.title, message: rest.message, type: rest.type || 'info', target: rest.target || 'all' };
            case 'milestone':
                return { ...rest, year: Number(rest.year) || new Date().getFullYear(), order: Number(rest.order) || (milestones.length + 1) };
            case 'album':
                return { ...rest, date: rest.date || new Date().toISOString().split('T')[0] };
            case 'sponsor':
                // tier/active render visual defaults without writing to formData
                return { ...rest, active: rest.active !== false, tier: rest.tier || sponsorTiers[0]?.id || '' };
            default:
                return rest;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!showModal || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const { _id, _creationTime, id, ...rest } = formData;
            void _id; void _creationTime; void id;
            const payload = buildPayload(showModal, rest);

            // The wrappers each take their own args type; the form is a loose record
            const p = payload as never;
            const save: Record<string, () => Promise<ActionResult>> = {
                event: () => (editingId ? updateEvent(editingId, p) : addEvent(p)),
                post: () => (editingId ? updatePost(editingId, p) : addPost(p)),
                member: () => (editingId ? updateMember(editingId, p) : addMember(p)),
                category: () => (editingId ? updateCategory(editingId, p) : addCategory(p)),
                tier: () => upsertSponsorTier(p),
                stat: () => upsertStat(p),
                actionArea: () => (editingId ? updateActionArea(editingId, p) : addActionArea(p)),
                document: () => (editingId ? updateDocument(editingId, p) : addDocument(p)),
                notification: () => (editingId ? updateNotification(editingId, p) : sendNotification(p)),
                milestone: () => (editingId ? updateMilestone(editingId, p) : addMilestone(p)),
                album: () => (editingId ? updateAlbum(editingId, p) : createAlbum(p)),
                sponsor: () => (editingId ? updateSponsor(editingId, p) : addSponsor(p)),
            };

            const run = save[showModal];
            if (!run) return;
            const result = await run();

            if (result.success) {
                notify(editingId ? 'Alterações guardadas.' : 'Registo criado com sucesso.');
                setShowModal(null); setFormData({}); setEditingId(null); setEditingTierId(null);
            } else {
                notify(describeActionError(failureText(result), 'Não foi possível guardar. Verifique os campos obrigatórios.'), 'error');
            }
        } catch (err: unknown) {
            notify(describeActionError(err instanceof Error ? err.message : undefined, 'Não foi possível guardar.'), 'error');
        } finally { setIsSubmitting(false); }
    };

    const handleSaveSettings = async (label: string) => {
        if (isSavingSettings) return;
        setIsSavingSettings(true);
        try {
            const result = await updateSettings(settingsForm);
            if (result.success) notify(`${label} guardadas.`);
            else notify(describeActionError(failureText(result), 'Não foi possível guardar as definições.'), 'error');
        } finally { setIsSavingSettings(false); }
    };

    // ── New Record ────────────────────────────────────────────────────────────
    const openModalFor = (type: string) => {
        setEditingId(null); setTempPhotoUrl('');
        if (type === 'actionArea') setFormData({ iconName: 'Users', order: 0, features: [] });
        else if (type === 'event') setFormData({ categoryId: categories[0]?.id ?? '', status: 'published', registrationOpen: false, currentParticipants: 0, isTournament: false });
        else if (type === 'post') setFormData({ categoryId: categories[0]?.id ?? '', published: true });
        else setFormData({});
        setShowModal(type);
    };

    const openNewModal = () => {
        const type = NEW_ENTITY_BY_TAB[activeTab];
        if (type) openModalFor(type);
    };

    const handleTabSelect = (tab: Tab) => { setActiveTab(tab); setMobileMenuOpen(false); };
    const showNewButton = NEW_ENTITY_BY_TAB[activeTab] !== undefined;
    // Header counter for list tabs; the toolbar inside each tab shows the filtered subset
    const tabCounts: Partial<Record<Tab, number>> = {
        events: events.length, news: posts.length, members: members.length, sponsors: sponsors.length,
        gallery: albums.length, documents: documents.length, notifications: notifications.length,
        categories: categories.length, tiers: sponsorTiers.length, historia: milestones.length,
    };

    const handlers = { openEditModal, handleDeleteRequest, handleDuplicate, onCreate: openNewModal, isLoading };

    // The backoffice is dark-only: the `dark` class on the root makes every
    // shared component rendered inside it (dialogs, empty states) match
    return (
        <div className="dark flex h-screen overflow-hidden bg-dark-bg font-sans text-slate-200">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <AdminSidebar activeTab={activeTab} mobileMenuOpen={mobileMenuOpen} onTabSelect={handleTabSelect} onClose={() => setMobileMenuOpen(false)} onLogout={onLogout} />
            {mobileMenuOpen && <div className="fixed inset-0 z-[55] bg-black/60 md:hidden" onClick={() => setMobileMenuOpen(false)} />}

            <main className="relative flex-1 overflow-y-auto bg-dark-bg pt-16 md:pt-0">
                <div className="fixed left-0 right-0 top-0 z-[50] flex h-16 items-center justify-between border-b border-white/10 bg-dark-surface/95 px-4 backdrop-blur-xl md:hidden">
                    <div className="truncate font-serif text-lg font-bold text-white">{settings.siteName} <span className="font-sans font-light text-brand-400">OS</span></div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg p-2 text-slate-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500" aria-label="Abrir menu" aria-expanded={mobileMenuOpen}><Menu /></button>
                </div>

                <div className="mx-auto max-w-7xl p-4 pb-24 md:p-8 md:pb-8">
                    <AdminPageHeader
                        title={activeTab === 'dashboard' ? `${getGreeting()}, Admin` : TAB_NAMES[activeTab]}
                        description={TAB_DESCRIPTIONS[activeTab]}
                        count={tabCounts[activeTab]}
                        action={showNewButton ? { label: NEW_LABELS[activeTab] ?? 'Novo registo', onClick: openNewModal } : undefined}
                    />

                    <div className="mb-4 flex gap-3 overflow-x-auto pb-4 no-scrollbar md:hidden">
                        {[
                            { label: 'Notícia', icon: PenTool, tab: 'news' as Tab, type: 'post' },
                            { label: 'Evento', icon: Calendar, tab: 'events' as Tab, type: 'event' },
                            { label: 'Aviso', icon: Bell, tab: 'notifications' as Tab, type: 'notification' },
                        ].map(shortcut => (
                            <button
                                key={shortcut.type}
                                onClick={() => { setActiveTab(shortcut.tab); openModalFor(shortcut.type); }}
                                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-dark-surface px-4 py-2 text-xs font-bold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                            >
                                <shortcut.icon size={14} /> {shortcut.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'dashboard' && <AdminDashboard membersCount={members.length} dashboardStats={dashboardStats} activityLogs={activityLogs} aiStats={aiStats} onViewRegistration={setViewRegistration} onNewPost={() => openModalFor('post')} onNewEvent={() => openModalFor('event')} />}
                    {activeTab === 'settings' && <AdminSettingsTab settingsForm={settingsForm} onSettingsChange={setSettingsForm} onSave={() => void handleSaveSettings('Definições')} isSaving={isSavingSettings} />}
                    {activeTab === 'ai' && <AdminAITab aiStats={aiStats} settingsForm={settingsForm} onSettingsChange={setSettingsForm} onSave={() => void handleSaveSettings('Definições de IA')} isSaving={isSavingSettings} />}
                    {activeTab === 'leads' && <AdminLeadsTab />}
                    {activeTab === 'member-quotas' && <AdminMemberQuotasTab />}
                    {activeTab === 'homepage' && <HomepageTab actionAreas={actionAreas} stats={stats} {...handlers} onNewStat={() => openModalFor('stat')} />}
                    {activeTab === 'events' && <EventsTab events={events} {...handlers} />}
                    {activeTab === 'news' && <NewsTab posts={posts} {...handlers} />}
                    {activeTab === 'members' && <MembersTab members={members} {...handlers} />}
                    {activeTab === 'sponsors' && <SponsorsTab sponsors={sponsors} sponsorTiers={sponsorTiers} {...handlers} />}
                    {activeTab === 'categories' && <CategoriesTab categories={categories} {...handlers} />}
                    {activeTab === 'tiers' && <TiersTab sponsorTiers={sponsorTiers} {...handlers} />}
                    {activeTab === 'documents' && <DocumentsTab documents={documents} {...handlers} />}
                    {activeTab === 'notifications' && <NotificationsTab notifications={notifications} {...handlers} />}
                    {activeTab === 'gallery' && (
                        <AdminGalleryManager
                            albums={albums}
                            openEditModal={openEditModal}
                            handleDeleteRequest={handleDeleteRequest}
                            onNewAlbum={openNewModal}
                            notify={(message, type) => notify(message, type)}
                        />
                    )}
                    {activeTab === 'historia' && <MilestonesTab milestones={milestones} {...handlers} />}
                </div>
            </main>

            {deleteConfirm && <DeleteConfirmDialog deleteConfirm={deleteConfirm} isDeleting={isDeleting} onCancel={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />}
            {viewRegistration && (
                <RegistrationModal
                    registration={viewRegistration}
                    onClose={() => setViewRegistration(null)}
                    onConfirm={(id) => { void updateRegistrationStatus(id, 'confirmed'); setViewRegistration(null); notify('Inscrição confirmada.'); }}
                    onCancel={(id) => { void updateRegistrationStatus(id, 'cancelled'); setViewRegistration(null); notify('Inscrição cancelada.', 'info'); }}
                />
            )}
            {showModal && <AdminFormModal showModal={showModal} editingId={editingId} editingTierId={editingTierId} formData={formData} isSubmitting={isSubmitting} isGeneratingImage={isGeneratingImage} isEnhancingText={isEnhancingText} categories={categories} sponsorTiers={sponsorTiers} tempPhotoUrl={tempPhotoUrl} settings={settings} onFormDataChange={setFormData} onTempPhotoUrlChange={setTempPhotoUrl} onSubmit={handleSubmit} onClose={() => { setShowModal(null); setEditingTierId(null); }} onGenerateImage={handleGenerateImage} onEnhanceText={handleEnhanceText} />}
        </div>
    );
};

/** Router wrapper -- handles logout navigation */
export const AdminPageWrapper: React.FC = () => {
    const navigate = useNavigate();
    const { signOut } = useAuthActions();
    const handleLogout = async () => { await signOut(); navigate('/'); };
    return <AdminPage onLogout={handleLogout} />;
};
