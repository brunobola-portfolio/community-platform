
/**
 * Admin OS (Backoffice) -- Thin orchestrator
 *
 * Delegates rendering to specialized sub-components under pages/admin/.
 * Owns top-level state (activeTab, modal, formData) and routes to the correct tab.
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Button } from '../components/ui/UIComponents';
import { Plus, Menu, PenTool, Calendar, Bell } from 'lucide-react';
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

import type { Tab, ToastState, AIStats } from './admin/types';
import type { Registration } from '../types';
import { TAB_NAMES, NEW_LABELS, formatDateForInput, getGreeting } from './admin/constants';
import { Toast } from './admin/components/Toast';
import { AdminSidebar } from './admin/components/AdminSidebar';
import { DeleteConfirmDialog } from './admin/components/DeleteConfirmDialog';
import type { DeleteConfirmState } from './admin/components/DeleteConfirmDialog';
import { AdminDashboard } from './admin/AdminDashboard';
import { AdminSettingsTab } from './admin/AdminSettingsTab';
import { AdminAITab } from './admin/AdminAITab';
import { AdminLeadsTab } from './admin/AdminLeadsTab';
import { AdminMemberQuotasTab } from './admin/AdminMemberQuotasTab';
import { AdminFormModal } from './admin/AdminFormModal';
import {
    HomepageTab, SponsorsTab,
    CategoriesTab, TiersTab, DocumentsTab, NotificationsTab,
    MilestonesTab, RegistrationModal
} from './admin/AdminEntityTabs';
import { EventsTab } from './admin/tabs/EventsTab';
import { NewsTab } from './admin/tabs/NewsTab';
import { MembersTab } from './admin/tabs/MembersTab';
import { AdminGalleryManager } from './admin/gallery/AdminGalleryManager';

type AnyRecord = Record<string, any>;

export const AdminPage: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
    const {
        adminEvents: events, adminPosts: posts, members, categories, settings, activityLogs, registrations, sponsors, sponsorTiers,
        documents, notifications, albums, actionAreas, stats,
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
    const [formData, setFormData] = useState<AnyRecord>({});
    const [isGeneratingImage, setIsGeneratingImage] = useState(false);
    const [isEnhancingText, setIsEnhancingText] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    // ── AI Handlers ──────────────────────────────────────────────────────────
    const handleGenerateImage = async (customPrompt?: string, options?: { model?: string; resolution?: string }) => {
        setIsGeneratingImage(true);
        const prompt = customPrompt || formData.title || "Community event";
        try {
            const result = await generateImageAction({ prompt, style: settings.defaultImageStyle, model: options?.model, resolution: options?.resolution });
            const url = result.imageUrl;
            setFormData((prev: AnyRecord) => ({ ...prev, imageUrl: url, coverUrl: url, photoUrl: url, logoUrl: url }));
        } catch (e: unknown) {
            console.error("Image generation error:", e);
            setToast({ message: "Erro na geração de imagem.", type: 'error' });
            const fallback = `https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?q=80&w=1000`;
            setFormData((prev: AnyRecord) => ({ ...prev, imageUrl: fallback, coverUrl: fallback, photoUrl: fallback, logoUrl: fallback }));
        } finally { setIsGeneratingImage(false); }
    };

    const handleEnhanceText = async () => {
        const currentText = formData.description || formData.content || formData.excerpt || formData.message;
        if (!currentText) return;
        setIsEnhancingText(true);
        try {
            const result = await enhanceTextAction({ text: currentText, tone: settings.contentTone });
            if (result.enhancedText) {
                const key = showModal === 'event' ? 'description' : showModal === 'notification' ? 'message' : 'content';
                setFormData((prev: AnyRecord) => ({ ...prev, [key]: result.enhancedText }));
            }
        } catch (e: unknown) {
            console.error("AI Enhancement error:", e);
            setToast({ message: "Erro Gemini.", type: 'error' });
        } finally { setIsEnhancingText(false); }
    };

    // ── Modal Helpers ────────────────────────────────────────────────────────
    const openEditModal = (type: string, item: AnyRecord) => {
        setEditingId(item.id);
        setEditingTierId(type === 'tier' ? item.id : null);
        const d = { ...item };
        if ((type === 'event' || type === 'post') && item.date) d.date = formatDateForInput(item.date);
        if (type === 'album' && !item.photos) d.photos = [];
        if (type === 'event' && !item.registrationFields) d.registrationFields = [];
        if (type === 'tier' && Array.isArray(item.benefits)) d.benefits = item.benefits.join('\n');
        setFormData(d);
        setShowModal(type);
    };

    const handleDuplicate = (type: string, item: AnyRecord) => {
        const copy: AnyRecord = { ...item, id: null, title: item.title ? `${item.title} (Cópia)` : undefined, name: item.name ? `${item.name} (Cópia)` : undefined };
        if (type === 'event') { copy.date = formatDateForInput(new Date().toISOString()); copy.currentParticipants = 0; copy.slug = ''; copy.registrationOpen = false; }
        else if (type === 'post') { copy.date = formatDateForInput(new Date().toISOString()); copy.published = false; copy.slug = ''; }
        else if (type === 'document' || type === 'album') { copy.date = new Date().toISOString().split('T')[0]; }
        else if (type === 'notification') { copy.date = new Date().toISOString(); }
        setEditingId(null); setFormData(copy); setShowModal(type); setToast({ message: "Item duplicado.", type: 'success' });
    };

    const handleDeleteRequest = (type: string, id: string, title: string) => setDeleteConfirm({ type, id, title });

    const confirmDelete = async () => {
        if (!deleteConfirm) return;
        const { type, id } = deleteConfirm;
        let success = false;
        try {
            const map: Record<string, () => Promise<{ success: boolean; message?: string; error?: string }>> = {
                event: () => deleteEvent(id), post: () => deletePost(id), member: () => deleteMember(id),
                category: () => deleteCategory(id), sponsor: () => deleteSponsor(id), document: () => deleteDocument(id),
                notification: () => deleteNotification(id), album: () => deleteAlbum(id),
                actionArea: () => deleteActionArea(id), stat: () => deleteStat(id), tier: () => deleteSponsorTier(id),
                milestone: () => deleteMilestone(id),
            };
            const fn = map[type];
            if (fn) {
                const r = await fn();
                success = r.success;
                // Wrappers return either `error` (ActionResult) or `message` (categories)
                if (!success) setToast({ message: r.error || r.message || 'Erro ao apagar.', type: 'error' });
            }
            if (success) setToast({ message: "Item removido.", type: 'success' });
        } catch (_: unknown) { setToast({ message: "Erro ao apagar.", type: 'error' }); }
        setDeleteConfirm(null);
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        let success = false;
        try {
            const { _id, _creationTime, id, ...rest } = formData;
            if (showModal === 'event') {
                const payload = { ...rest, categoryId: rest.categoryId || categories[0]?.id || '', entryPrice: Number(rest.entryPrice) || 0, maxParticipants: Number(rest.maxParticipants) || 0, registrationFields: rest.registrationFields || [] };
                const r = editingId ? await updateEvent(editingId, payload as any) : await addEvent(payload as any);
                success = r.success;
            } else if (showModal === 'post') {
                const tags = typeof rest.tags === 'string' ? rest.tags.split(',').map((t: string) => t.trim()).filter((t: string) => t !== '') : rest.tags;
                const r = editingId ? await updatePost(editingId, { ...rest, categoryId: rest.categoryId || categories[0]?.id || '', tags } as any) : await addPost({ ...rest, categoryId: rest.categoryId || categories[0]?.id || '', tags } as any);
                success = r.success;
            } else if (showModal === 'member') {
                // Order and group render visual fallbacks without writing to formData
                const payload = { ...rest, order: Number(rest.order) || 1, group: rest.group || 'Direção' };
                const r = editingId ? await updateMember(editingId, payload as any) : await addMember(payload as any);
                success = r.success;
            }
            else if (showModal === 'category') { const r = editingId ? await updateCategory(editingId, rest as any) : await addCategory(rest as any); success = r.success; }
            else if (showModal === 'tier') {
                const b = typeof rest.benefits === 'string' ? rest.benefits.split('\n').filter((x: string) => x.trim()) : rest.benefits;
                const payload = { ...rest, benefits: b ?? [], order: Number(rest.order) || sponsorTiers.length + 1 };
                const r = await upsertSponsorTier(payload as any);
                success = r.success;
            }
            else if (showModal === 'stat') { const r = await upsertStat(rest as any); success = r.success; }
            else if (showModal === 'actionArea') { const r = editingId ? await updateActionArea(editingId, rest as any) : await addActionArea(rest as any); success = r.success; }
            else if (showModal === 'document') {
                // Whitelist mutation args: the form keeps the legacy `url` key and edits carry read-only fields the Convex validator rejects
                // The category select renders 'Outros' as visual default without writing it to formData
                const payload = { title: rest.title, description: rest.description, category: rest.category || 'Outros', date: rest.date, size: rest.size, externalUrl: rest.externalUrl || rest.url || undefined };
                const r = editingId ? await updateDocument(editingId, payload as any) : await addDocument(payload as any);
                success = r.success;
            }
            else if (showModal === 'notification') {
                const payload = { title: rest.title, message: rest.message, type: rest.type || 'info', target: rest.target || 'all' };
                const r = editingId ? await updateNotification(editingId, payload as any) : await sendNotification(payload as any);
                success = r.success;
            }
            else if (showModal === 'milestone') {
                const payload = { ...rest, year: Number(rest.year) || new Date().getFullYear(), order: Number(rest.order) || (milestones.length + 1) };
                const r = editingId ? await updateMilestone(editingId, payload as any) : await addMilestone(payload as any);
                success = r.success;
            }
            else if (showModal === 'album') {
                const payload = { ...rest, date: rest.date || new Date().toISOString().split('T')[0] };
                const r = editingId ? await updateAlbum(editingId, payload as any) : await createAlbum(payload as any);
                success = r.success;
            }
            else if (showModal === 'sponsor') {
                // tier/active render visual defaults without writing to formData
                const payload = { ...rest, active: rest.active !== false, tier: rest.tier || sponsorTiers[0]?.name || 'Silver' };
                const r = editingId ? await updateSponsor(editingId, payload as any) : await addSponsor(payload as any);
                success = r.success;
            }
            if (success) { setToast({ message: "Guardado com sucesso!", type: 'success' }); setShowModal(null); setFormData({}); setEditingId(null); setEditingTierId(null); }
            else { setToast({ message: "Erro de validação.", type: 'error' }); }
        } catch (_: unknown) { setToast({ message: "Erro crítico.", type: 'error' }); } finally { setIsSubmitting(false); }
    };

    // ── New Record ────────────────────────────────────────────────────────────
    const openNewModal = () => {
        setEditingId(null); setFormData({}); setTempPhotoUrl('');
        const map: Record<string, string> = { news: 'post', events: 'event', members: 'member', gallery: 'album', notifications: 'notification', sponsors: 'sponsor', categories: 'category', tiers: 'tier', documents: 'document', homepage: 'actionArea', historia: 'milestone' };
        const mt = map[activeTab]; if (!mt) return;
        if (mt === 'actionArea') setFormData({ iconName: 'Users', order: 0, features: [] });
        else if (mt === 'event') setFormData({ categoryId: categories[0]?.id ?? '', status: 'published', registrationOpen: false, currentParticipants: 0, isTournament: false });
        else if (mt === 'post') setFormData({ categoryId: categories[0]?.id ?? '', published: true });
        setShowModal(mt);
    };

    const handleTabSelect = (tab: Tab) => { setActiveTab(tab); setMobileMenuOpen(false); };
    const showNewButton = ['events', 'news', 'members', 'documents', 'notifications', 'gallery', 'sponsors', 'categories', 'homepage', 'tiers', 'historia'].includes(activeTab);
    // Header counter for list tabs; the toolbar inside each tab shows the filtered subset
    const tabCounts: Partial<Record<string, number>> = {
        events: events.length, news: posts.length, members: members.length, sponsors: sponsors.length,
        gallery: albums.length, documents: documents.length, notifications: notifications.length,
        categories: categories.length, tiers: sponsorTiers.length, historia: milestones.length,
    };

    return (
        <div className="flex h-screen bg-dark-bg text-slate-200 font-sans overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <AdminSidebar activeTab={activeTab} mobileMenuOpen={mobileMenuOpen} onTabSelect={handleTabSelect} onLogout={onLogout} />
            {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-[55] md:hidden" onClick={() => setMobileMenuOpen(false)} />}

            <main className="flex-1 overflow-y-auto relative bg-dark-bg pt-16 md:pt-0">
                <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-dark-surface/95 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 z-[50]">
                    <div className="font-serif font-bold text-white text-lg">{settings.siteName} <span className="text-brand-400 font-sans font-light">OS</span></div>
                    <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-400 hover:text-white" aria-label="Menu"><Menu /></button>
                </div>
                <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
                        <h1 className="text-2xl md:text-3xl font-serif text-white capitalize flex items-center gap-3">
                            {activeTab === 'dashboard' ? `${getGreeting()}, Admin` : TAB_NAMES[activeTab]}
                            {tabCounts[activeTab] !== undefined && <span className="font-sans text-xs font-bold text-slate-400 bg-white/5 border border-white/10 rounded-full px-2.5 py-1 tabular-nums">{tabCounts[activeTab]}</span>}
                        </h1>
                        {showNewButton && <Button onClick={openNewModal} className="shadow-lg w-full md:w-auto"><Plus size={18} className="mr-2" /> {NEW_LABELS[activeTab] ?? 'Novo Registo'}</Button>}
                    </div>
                    <div className="md:hidden flex gap-3 overflow-x-auto pb-4 mb-4 no-scrollbar">
                        {[{ l: 'Notícia', i: PenTool, a: () => { setActiveTab('news'); setShowModal('post'); setFormData({}); } }, { l: 'Evento', i: Calendar, a: () => { setActiveTab('events'); setShowModal('event'); setFormData({}); } }, { l: 'Aviso', i: Bell, a: () => { setActiveTab('notifications'); setShowModal('notification'); setFormData({}); } }].map((b, i) => (<button key={i} onClick={b.a} className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-dark-surface border border-white/10 rounded-full text-xs font-bold text-white whitespace-nowrap"><b.i size={14} /> {b.l}</button>))}
                    </div>

                    {activeTab === 'dashboard' && <AdminDashboard membersCount={members.length} dashboardStats={dashboardStats} activityLogs={activityLogs} aiStats={aiStats} onViewRegistration={setViewRegistration} onNewPost={() => { setEditingId(null); setFormData({}); setShowModal('post'); }} onNewEvent={() => { setEditingId(null); setFormData({}); setShowModal('event'); }} />}
                    {activeTab === 'settings' && <AdminSettingsTab settingsForm={settingsForm} onSettingsChange={setSettingsForm} onSave={() => { updateSettings(settingsForm); setToast({ message: "Definições guardadas.", type: 'success' }); }} />}
                    {activeTab === 'ai' && <AdminAITab aiStats={aiStats} settingsForm={settingsForm} onSettingsChange={setSettingsForm} onSave={() => { updateSettings(settingsForm); setToast({ message: "Definições de IA guardadas.", type: 'success' }); }} />}
                    {activeTab === 'leads' && <AdminLeadsTab />}
                    {activeTab === 'member-quotas' && <AdminMemberQuotasTab />}
                    {activeTab === 'homepage' && <HomepageTab actionAreas={actionAreas} stats={stats} openEditModal={openEditModal} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'events' && <EventsTab events={events} openEditModal={openEditModal} handleDuplicate={handleDuplicate} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'news' && <NewsTab posts={posts} openEditModal={openEditModal} handleDuplicate={handleDuplicate} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'members' && <MembersTab members={members} openEditModal={openEditModal} handleDuplicate={handleDuplicate} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'sponsors' && <SponsorsTab sponsors={sponsors} openEditModal={openEditModal} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'categories' && <CategoriesTab categories={categories} openEditModal={openEditModal} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'tiers' && <TiersTab sponsorTiers={sponsorTiers} openEditModal={openEditModal} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'documents' && <DocumentsTab documents={documents} openEditModal={openEditModal} handleDuplicate={handleDuplicate} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'notifications' && <NotificationsTab notifications={notifications} openEditModal={openEditModal} handleDuplicate={handleDuplicate} handleDeleteRequest={handleDeleteRequest} />}
                    {activeTab === 'gallery' && (
                        <AdminGalleryManager
                            albums={albums}
                            openEditModal={openEditModal}
                            handleDeleteRequest={handleDeleteRequest}
                            onNewAlbum={openNewModal}
                            notify={(message, type) => setToast({ message, type })}
                        />
                    )}
                    {activeTab === 'historia' && <MilestonesTab milestones={milestones} openEditModal={openEditModal} handleDeleteRequest={handleDeleteRequest} />}
                </div>
            </main>

            {deleteConfirm && <DeleteConfirmDialog deleteConfirm={deleteConfirm} onCancel={() => setDeleteConfirm(null)} onConfirm={confirmDelete} />}
            {viewRegistration && <RegistrationModal reg={viewRegistration} onClose={() => setViewRegistration(null)} onConfirm={(id) => { updateRegistrationStatus(id, 'confirmed'); setViewRegistration(null); setToast({ message: 'Inscrição Confirmada!', type: 'success' }); }} onCancel={(id) => { updateRegistrationStatus(id, 'cancelled'); setViewRegistration(null); }} />}
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
