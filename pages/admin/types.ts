
/**
 * Admin panel type definitions.
 */

import type { Settings, Registration, ActivityLog } from '../../types';

export type Tab =
    | 'dashboard'
    | 'homepage'
    | 'events'
    | 'registrations'
    | 'news'
    | 'members'
    | 'sponsors'
    | 'categories'
    | 'tiers'
    | 'settings'
    | 'documents'
    | 'notifications'
    | 'gallery'
    | 'historia'
    | 'leads'
    | 'member-quotas'
    | 'access'
    | 'ai'
    | 'help';

export type AdminFormData = Record<string, unknown>;

/** Record shape shared by every admin entity list. */
export type AdminRecord = Record<string, unknown> & { id: string };

/**
 * Handlers every entity tab receives from the admin shell. Tabs adapt them to
 * the per-item callbacks of EntityList.
 */
export interface EntityHandlers {
    openEditModal: (type: string, item: AdminRecord) => void;
    handleDeleteRequest: (type: string, id: string, title: string) => void;
    handleDuplicate?: (type: string, item: AdminRecord) => void;
    /** Opens the create form of the active tab (used by empty states). */
    onCreate?: () => void;
    isLoading?: boolean;
}

/** Toast notification state */
export interface ToastState {
    message: string;
    type: 'success' | 'error' | 'info';
}

/** AI usage statistics returned by aiLogs.getStats */
export interface AIStats {
    totalCalls: number;
    successCount: number;
    errorCount: number;
    successRate: number;
    avgLatency: number;
    byAction: Record<string, number>;
    byModel: Record<string, number>;
    byClassification: Record<string, number>;
    daily: Record<string, number>;
}

/** Dashboard computed statistics */
export interface DashboardStats {
    activeEventCount: number;
    confirmedRegistrations: number;
    pendingRegistrations: Registration[];
}

/** Props for the settings tab */
export interface AdminSettingsTabProps {
    settingsForm: Settings;
    onSettingsChange: (settings: Settings) => void;
    onSave: () => void;
    isSaving?: boolean;
}

/** Props for the AI tab */
export interface AdminAITabProps {
    aiStats: AIStats | undefined;
    settingsForm: Settings;
    onSettingsChange: (settings: Settings) => void;
    onSave: () => void;
    isSaving?: boolean;
}

/** Props for the dashboard */
export interface AdminDashboardProps {
    membersCount: number;
    dashboardStats: DashboardStats;
    activityLogs: ActivityLog[];
    aiStats: AIStats | undefined;
    onViewRegistration: (reg: Registration) => void;
    onNewPost: () => void;
    onNewEvent: () => void;
    /** Event titles by id, so a pending registration says which event it is for. */
    eventTitles?: Map<string, string>;
}

/** What the MediaStudio "Gerar com IA" panel may ask for besides the prompt. */
export interface GenerateImageOptions {
    model?: string;
    resolution?: string;
    /** The current image, to start from it instead of from nothing. */
    referenceUrl?: string;
    engine?: 'gemini' | 'openrouter';
}

/** Props for the form modal */
export interface AdminFormModalProps {
    showModal: string;
    editingId: string | null;
    editingTierId: string | null;
    formData: AdminFormData;
    isSubmitting: boolean;
    isGeneratingImage: boolean;
    isEnhancingText: boolean;
    categories: Array<{ id: string; name: string }>;
    sponsorTiers: Array<{ id: string; name: string }>;
    tempPhotoUrl: string;
    settings: Settings;
    onFormDataChange: (data: AdminFormData) => void;
    onTempPhotoUrlChange: (url: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    onGenerateImage: (prompt?: string, options?: GenerateImageOptions) => Promise<void>;
    onEnhanceText: () => Promise<void>;
}
