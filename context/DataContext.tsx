import React, { createContext, useContext, ReactNode, useMemo, useCallback, useState, useEffect } from 'react';
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { ConvexError } from "convex/values";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  ActionArea, Stat, Event, Post, Member, Category, Settings, ActivityLog, Milestone,
  Registration, Sponsor, SponsorTier, Document, Notification, Album, ActionResult
} from '../types';
import type { RegistrationStatus, NotificationType, NotificationTarget, EventStatus } from '../types';
import { INITIAL_SETTINGS } from '../utils/defaultSettings';

// ── Convex Document Types ──────────────────────────────────────────────────────
// Raw shapes returned by Convex queries (with _id, _creationTime).

interface ConvexDoc {
  _id: string;
  _creationTime: number;
}

interface ConvexEvent extends ConvexDoc {
  title: string;
  description: string;
  date: string;
  location: string;
  categoryId: string;
  slug: string;
  image?: string | null;
  externalImage?: string;
  imageUrl?: string;
  status: string;
  isHighlight?: boolean;
  isTournament?: boolean;
  tournamentType?: string;
  entryPrice?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  registrationOpen?: boolean;
  registrationFields?: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
  }>;
}

interface ConvexPost extends ConvexDoc {
  title: string;
  excerpt: string;
  /** Absent in the public summary subscription; present in admin listAll */
  content?: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  date: string;
  readTime?: string;
  tags?: string[];
  categoryId: string;
  slug: string;
  coverImage?: string | null;
  externalImage?: string;
  coverImageUrl?: string;
  published: boolean;
}

interface ConvexMember extends ConvexDoc {
  name: string;
  role: string;
  bio?: string;
  photo?: string | null;
  externalPhoto?: string;
  photoUrl?: string;
  group: string;
  order: number;
}

interface ConvexCategory extends ConvexDoc {
  name: string;
  slug: string;
  type: string;
  color?: string;
}

interface ConvexSponsor extends ConvexDoc {
  name: string;
  tier: string;
  logo?: string | null;
  externalLogo?: string;
  logoUrl?: string;
  website?: string;
  active: boolean;
}

interface ConvexRegistration extends ConvexDoc {
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  timestamp: number;
}

interface ConvexDocument extends ConvexDoc {
  title: string;
  description?: string;
  fileId?: string;
  externalUrl?: string;
  url?: string;
  category: string;
  date?: string;
  size?: string;
  uploadedAt: number;
}

interface ConvexNotification extends ConvexDoc {
  title: string;
  message: string;
  type: string;
  target: string;
  read: boolean;
  timestamp: number;
}

interface ConvexAlbum extends ConvexDoc {
  title: string;
  date: string;
  coverId?: string | null;
  externalCover?: string;
  coverUrl?: string;
  description?: string;
  photos?: string[];
  photoCount?: number;
}

interface ConvexActivityLog extends ConvexDoc {
  action: string;
  target: string;
  description: string;
  user?: string;
  timestamp: number;
}

interface ConvexActionArea extends ConvexDoc {
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  features: string[];
  image?: string | null;
  externalImage?: string;
  imageUrl?: string;
  iconName: string;
  order: number;
}

interface ConvexMilestone extends ConvexDoc {
  year: number;
  title: string;
  description: string;
  image?: string | null;
  externalImage?: string;
  imageUrl?: string;
  order: number;
}

interface ConvexStat extends ConvexDoc {
  label: string;
  value: string;
  order: number;
}

interface ConvexSponsorTier extends ConvexDoc {
  name: string;
  price: string;
  benefits: string[];
  order: number;
  color?: string;
  textColor?: string;
}

// ── CRUD Argument Types ────────────────────────────────────────────────────────

interface EventCreateArgs {
  title: string;
  description: string;
  date: string;
  location: string;
  categoryId: string;
  slug: string;
  externalImage?: string;
  imageUrl?: string; // Alias for externalImage from frontend forms
  status?: string;
  isHighlight?: boolean;
  isTournament?: boolean;
  tournamentType?: string;
  entryPrice?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  registrationOpen?: boolean;
  registrationFields?: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    placeholder?: string;
  }>;
}

interface PostCreateArgs {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  authorRole?: string;
  authorAvatar?: string;
  date: string;
  readTime?: string;
  tags?: string[];
  categoryId: string;
  slug: string;
  externalImage?: string;
  coverUrl?: string; // Alias for externalImage from frontend forms
  published: boolean;
}

interface MemberCreateArgs {
  name: string;
  role: string;
  bio?: string;
  externalPhoto?: string;
  photoUrl?: string; // Alias for externalPhoto from frontend forms
  group: string;
  order: number;
}

interface SponsorCreateArgs {
  name: string;
  tier: string;
  externalLogo?: string;
  logoUrl?: string; // Alias for externalLogo from frontend forms
  website?: string;
  active: boolean;
}

interface CategoryCreateArgs {
  name: string;
  slug: string;
  type: string;
  color?: string;
}

interface RegistrationCreateArgs {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  customData?: Record<string, unknown>;
}

interface DocumentCreateArgs {
  title: string;
  description?: string;
  externalUrl?: string;
  category: string;
  date?: string;
  size?: string;
  fileId?: string; // Will be cast to Id<"_storage"> before passing to mutation
}

interface NotificationCreateArgs {
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
}

interface AlbumCreateArgs {
  title: string;
  date: string;
  externalCover?: string;
  /** Admin form alias for externalCover (MediaStudio writes coverUrl) */
  coverUrl?: string;
  /** Full photo list from the admin form; synced to galleryImages */
  photos?: string[];
  description?: string;
}

interface ActionAreaCreateArgs {
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  features: string[];
  externalImage?: string;
  /** Admin form alias for externalImage (MediaStudio writes imageUrl) */
  imageUrl?: string;
  iconName: string;
  order: number;
}

interface MilestoneCreateArgs {
  year: number;
  title: string;
  description: string;
  externalImage?: string;
  /** Admin form alias for externalImage (MediaStudio writes imageUrl) */
  imageUrl?: string;
  order: number;
}

interface StatUpsertArgs {
  id?: string;
  label: string;
  value: string;
  order: number;
}

interface SponsorTierUpsertArgs {
  id?: string;
  name: string;
  price: string;
  benefits: string[];
  order: number;
  color?: string;
  textColor?: string;
}

/** Only Convex-stored fields for settings update mutation. */
interface SettingsUpdateArgs {
  siteName?: string;
  maintenanceMode?: boolean;
  contactEmail?: string;
  logoUrl?: string;
  currentMandate?: string;
  siteFullName?: string;
  locality?: string;
  region?: string;
  foundedYear?: string;
  heroTagline?: string;
  heroSubtitle?: string;
  historyIntro?: string;
  historyQuote?: string;
  venueName?: string;
  venueDescription?: string;
  foundersNote?: string;
  contentTone?: string;
  defaultImageStyle?: string;
  enableChatbot?: boolean;
  chatModel?: string;
  chatModelFallback?: string;
  imageModel?: string;
  thinkingBudget?: number;
  aiSystemPromptExtra?: string;
  aiAllowedTopics?: string;
  aiForbiddenTopics?: string;
  aiGuardrailsEnabled?: boolean;
  imageResolution?: string;
  phone?: string;
  openingHours?: string;
  address?: string;
  mapsUrl?: string;
  latitude?: string;
  longitude?: string;
  facebookPageId?: string;
  instagramUrl?: string;
  aboutMission?: string;
  aboutPillars?: { icon: string; title: string; description: string }[];
  quotaAmount?: string;
  mbwayNumber?: string;
  iban?: string;
  multibancoEntity?: string;
  multibancoReference?: string;
  facebookAccessToken?: string;
  showChatbotBubble?: boolean;
  ttsModel?: string;
  aiProvider?: string;
  openrouterApiKey?: string;
  openrouterModel?: string;
  customApiUrl?: string;
  customApiKey?: string;
  customModel?: string;
}

// ── Context Type ───────────────────────────────────────────────────────────────

interface DataContextType {
  // Data (arrays default to [] when loading)
  events: (Event & { category: string })[];
  posts: (Post & { category: string })[];
  // Backoffice lists: include drafts when the session is an admin
  adminEvents: (Event & { category: string })[];
  adminPosts: (Post & { category: string })[];
  members: Member[];
  categories: Category[];
  settings: Settings;
  activityLogs: ActivityLog[];
  registrations: Registration[];
  sponsors: Sponsor[];
  sponsorTiers: SponsorTier[];
  documents: Document[];
  notifications: Notification[];
  albums: Album[];
  actionAreas: ActionArea[];
  stats: Stat[];
  // Loading state
  isLoading: boolean;
  /** True when core queries never resolved (Convex unreachable) */
  isBackendDown: boolean;

  // Event actions
  addEvent: (data: EventCreateArgs) => Promise<ActionResult>;
  updateEvent: (id: string, data: Partial<EventCreateArgs>) => Promise<ActionResult>;
  deleteEvent: (id: string) => Promise<ActionResult>;

  // Post actions
  addPost: (data: PostCreateArgs) => Promise<ActionResult>;
  updatePost: (id: string, data: Partial<PostCreateArgs>) => Promise<ActionResult>;
  deletePost: (id: string) => Promise<ActionResult>;

  // Member actions
  addMember: (data: MemberCreateArgs) => Promise<ActionResult>;
  updateMember: (id: string, data: Partial<MemberCreateArgs>) => Promise<ActionResult>;
  deleteMember: (id: string) => Promise<ActionResult>;

  // Category actions
  addCategory: (data: Partial<CategoryCreateArgs> & { name: string }) => Promise<ActionResult>;
  updateCategory: (id: string, data: Partial<CategoryCreateArgs>) => Promise<ActionResult>;
  deleteCategory: (id: string) => Promise<{ success: boolean; message: string }>;

  // Settings
  updateSettings: (settings: Partial<Settings>) => Promise<ActionResult>;

  // Registration actions
  addRegistration: (data: RegistrationCreateArgs) => Promise<ActionResult>;
  updateRegistrationStatus: (id: string, status: string, paymentStatus?: string) => Promise<ActionResult>;

  // Sponsor actions
  addSponsor: (data: SponsorCreateArgs) => Promise<ActionResult>;
  updateSponsor: (id: string, data: Partial<SponsorCreateArgs>) => Promise<ActionResult>;
  deleteSponsor: (id: string) => Promise<ActionResult>;

  // Sponsor tier actions
  updateSponsorTier: (data: SponsorTierUpsertArgs) => Promise<ActionResult>;
  upsertSponsorTier: (data: SponsorTierUpsertArgs) => Promise<ActionResult>;
  deleteSponsorTier: (id: string) => Promise<ActionResult>;

  // Milestone actions (History timeline)
  milestones: Milestone[];
  addMilestone: (data: MilestoneCreateArgs) => Promise<ActionResult>;
  updateMilestone: (id: string, data: Partial<MilestoneCreateArgs>) => Promise<ActionResult>;
  deleteMilestone: (id: string) => Promise<ActionResult>;

  // Document actions
  addDocument: (doc: DocumentCreateArgs) => Promise<ActionResult>;
  updateDocument: (id: string, doc: Partial<DocumentCreateArgs>) => Promise<ActionResult>;
  deleteDocument: (id: string) => Promise<ActionResult>;

  // Notification actions
  sendNotification: (notif: NotificationCreateArgs) => Promise<ActionResult>;
  updateNotification: (id: string, notif: Partial<NotificationCreateArgs & { read?: boolean }>) => Promise<ActionResult>;
  deleteNotification: (id: string) => Promise<ActionResult>;

  // Album actions
  createAlbum: (album: AlbumCreateArgs) => Promise<ActionResult>;
  updateAlbum: (id: string, album: Partial<AlbumCreateArgs>) => Promise<ActionResult>;
  deleteAlbum: (id: string) => Promise<ActionResult>;

  // Action area actions
  addActionArea: (data: ActionAreaCreateArgs) => Promise<ActionResult>;
  updateActionArea: (id: string, data: Partial<ActionAreaCreateArgs>) => Promise<ActionResult>;
  deleteActionArea: (id: string) => Promise<ActionResult>;

  // Stat actions
  upsertStat: (data: StatUpsertArgs) => Promise<ActionResult>;
  deleteStat: (id: string) => Promise<ActionResult>;

  // Utility
  logActivity: (action: string, target: string, description: string) => void;

  // Legacy/Compatibility
  updateSponsorTierLegacy?: (id: string, tier: Partial<SponsorTierUpsertArgs>) => Promise<ActionResult>;
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function toActionResult(error: unknown): ActionResult {
  // ConvexError data survives production redaction; plain Error messages
  // become a generic "Server Error" on prod deployments
  if (error instanceof ConvexError) {
    return { success: false, error: typeof error.data === 'string' ? error.data : 'Erro no servidor.' };
  }
  const message = error instanceof Error ? error.message : "Erro desconhecido";
  return { success: false, error: message };
}

// URL-safe slug from a title; guarantees a non-empty value for schema fields.
function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || `registo-${Date.now()}`;
}

// Plain-text excerpt derived from HTML content for posts saved without one.
function excerptFromContent(content: string, max = 160): string {
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

// ── Context ────────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useConvexAuth();

  // ── Queries (undefined = loading, "skip" = not subscribed) ────────────────
  const eventsPublicRaw = useQuery(api.events.list);
  // Summary variant strips post content: full articles load on demand via
  // posts.getBySlug in the article page
  const postsPublicRaw = useQuery(api.posts.listSummary, {});
  // Admin variants include drafts; they return null for non-admins so we can
  // fall back to the public lists without extra role plumbing on the client
  const eventsAllRaw = useQuery(api.events.listAll, isAuthenticated ? {} : "skip");
  const postsAllRaw = useQuery(api.posts.listAll, isAuthenticated ? {} : "skip");
  const eventsRaw = eventsAllRaw ?? eventsPublicRaw;
  const postsRaw = postsAllRaw ?? postsPublicRaw;
  const membersRaw = useQuery(api.members.list);
  const categoriesRaw = useQuery(api.categories.list);
  const settingsRaw = useQuery(api.settings.getPublic);
  // Admin-only overlay: non-secret provider fields (model ids, endpoint URL)
  // are excluded from getPublic but must round-trip in the admin settings form
  const settingsAdminRaw = useQuery(api.settings.getAdmin, isAuthenticated ? {} : "skip");
  const sponsorsRaw = useQuery(api.sponsors.list);
  const documentsRaw = useQuery(api.documents.list, {});
  const albumsRaw = useQuery(api.albums.listSummary);
  const actionAreasRaw = useQuery(api.actionAreas.list);
  const statsRaw = useQuery(api.stats.list);
  const milestonesRaw = useQuery(api.milestones.list);
  const sponsorTiersRaw = useQuery(api.sponsorTiers.list);

  // Admin-only queries: skip for anonymous visitors to reduce subscriptions
  const registrationsRaw = useQuery(
    api.registrations.list,
    isAuthenticated ? {} : "skip"
  );
  const activityLogsRaw = useQuery(
    api.activityLogs.list,
    isAuthenticated ? undefined : "skip"
  );
  const notificationsRaw = useQuery(
    api.notifications.list,
    isAuthenticated ? undefined : "skip"
  );

  // ── Loading state ──────────────────────────────────────────────────────────
  // Core queries required for all visitors
  const isLoading =
    eventsRaw === undefined ||
    postsRaw === undefined ||
    membersRaw === undefined ||
    categoriesRaw === undefined ||
    settingsRaw === undefined ||
    sponsorsRaw === undefined ||
    documentsRaw === undefined ||
    albumsRaw === undefined ||
    actionAreasRaw === undefined ||
    statsRaw === undefined ||
    milestonesRaw === undefined ||
    sponsorTiersRaw === undefined ||
    // Admin-only queries: only block loading when authenticated and still pending
    (isAuthenticated && registrationsRaw === undefined) ||
    (isAuthenticated && activityLogsRaw === undefined) ||
    (isAuthenticated && notificationsRaw === undefined);

  // Backend reachability: Convex queries stay undefined forever when the
  // server is unreachable, so surface an explicit offline state instead of
  // leaving visitors on eternal skeletons
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  useEffect(() => {
    if (!isLoading) {
      setLoadTimedOut(false);
      return;
    }
    const timer = setTimeout(() => setLoadTimedOut(true), 12000);
    return () => clearTimeout(timer);
  }, [isLoading]);
  const isBackendDown = isLoading && loadTimedOut;

  // ── Settings with fallback ─────────────────────────────────────────────────
  // DB values take priority over env defaults; filter out undefined/null DB fields
  // so that env defaults are preserved when a field hasn't been set in the DB yet.
  const settings: Settings = useMemo(() => {
    if (!settingsRaw) return INITIAL_SETTINGS;
    const dbValues: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(settingsRaw)) {
      if (value !== undefined && value !== null) {
        dbValues[key] = value;
      }
    }
    if (settingsAdminRaw) {
      const adminOnlyKeys = ['aiProvider', 'openrouterModel', 'customApiUrl', 'customModel', 'hasOpenrouterApiKey', 'hasCustomApiKey'] as const;
      for (const key of adminOnlyKeys) {
        const value = (settingsAdminRaw as Record<string, unknown>)[key];
        if (value !== undefined && value !== null) {
          dbValues[key] = value;
        }
      }
    }
    return { ...INITIAL_SETTINGS, ...dbValues };
  }, [settingsRaw, settingsAdminRaw]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const createEventMut = useMutation(api.events.create);
  const updateEventMut = useMutation(api.events.update);
  const deleteEventMut = useMutation(api.events.remove);

  const createPostMut = useMutation(api.posts.create);
  const updatePostMut = useMutation(api.posts.update);
  const deletePostMut = useMutation(api.posts.remove);

  const createMemberMut = useMutation(api.members.create);
  const updateMemberMut = useMutation(api.members.update);
  const deleteMemberMut = useMutation(api.members.remove);

  const createSponsorMut = useMutation(api.sponsors.create);
  const updateSponsorMut = useMutation(api.sponsors.update);
  const deleteSponsorMut = useMutation(api.sponsors.remove);

  const createCategoryMut = useMutation(api.categories.create);
  const updateCategoryMut = useMutation(api.categories.update);
  const deleteCategoryMut = useMutation(api.categories.remove);

  const createRegMut = useMutation(api.registrations.create);
  const updateRegStatusMut = useMutation(api.registrations.updateStatus);

  const createDocMut = useMutation(api.documents.create);
  const updateDocMut = useMutation(api.documents.update);
  const deleteDocMut = useMutation(api.documents.remove);

  const createNotifMut = useMutation(api.notifications.create);
  const updateNotifMut = useMutation(api.notifications.update);
  const deleteNotifMut = useMutation(api.notifications.remove);

  const createAlbumMut = useMutation(api.albums.create);
  const updateAlbumMut = useMutation(api.albums.update);
  const deleteAlbumMut = useMutation(api.albums.remove);
  const setAlbumImagesMut = useMutation(api.albums.setImages);

  const createMilestoneMut = useMutation(api.milestones.create);
  const updateMilestoneMut = useMutation(api.milestones.update);
  const deleteMilestoneMut = useMutation(api.milestones.remove);

  const createActionAreaMut = useMutation(api.actionAreas.create);
  const updateActionAreaMut = useMutation(api.actionAreas.update);
  const deleteActionAreaMut = useMutation(api.actionAreas.remove);

  const upsertStatMut = useMutation(api.stats.upsert);
  const deleteStatMut = useMutation(api.stats.remove);

  const upsertSponsorTierMut = useMutation(api.sponsorTiers.upsert);
  const deleteSponsorTierMut = useMutation(api.sponsorTiers.remove);

  const logActivityMut = useMutation(api.activityLogs.create);
  const updateSettingsMut = useMutation(api.settings.update);

  // ── Data Mapping (Convex _id -> id, safe fallback to []) ───────────────────

  const eventsMapped = useMemo(
    () => (eventsRaw ?? []).map((e: ConvexEvent) => ({ ...e, id: e._id as string })),
    [eventsRaw]
  );

  const postsMapped = useMemo(
    () => (postsRaw ?? []).map((p: ConvexPost) => ({ ...p, id: p._id as string, coverUrl: p.coverImageUrl, content: p.content ?? '' })),
    [postsRaw]
  );

  const members = useMemo<Member[]>(
    () => (membersRaw ?? []).map((m: ConvexMember) => ({ ...m, id: m._id })),
    [membersRaw]
  );

  const categories = useMemo<Category[]>(() => {
    // Deduplicate by name+type composite key to preserve valid categories
    // with the same name but different type (e.g. "Desporto" event vs blog)
    const unique = new Map<string, Category>();
    (categoriesRaw ?? []).forEach((c: ConvexCategory) => {
      const key = `${c.name}:${c.type}`;
      if (!unique.has(key)) {
        unique.set(key, { ...c, id: c._id });
      }
    });
    return Array.from(unique.values());
  }, [categoriesRaw]);

  const registrations = useMemo<Registration[]>(
    () => (registrationsRaw ?? []).map((r: ConvexRegistration) => ({ ...r, id: r._id, status: r.status as RegistrationStatus })),
    [registrationsRaw]
  );

  const sponsors = useMemo<Sponsor[]>(
    () => (sponsorsRaw ?? []).map((s: ConvexSponsor) => ({ ...s, id: s._id })),
    [sponsorsRaw]
  );

  const documents = useMemo<Document[]>(
    () => (documentsRaw ?? []).map((d: ConvexDocument) => ({ ...d, id: d._id, url: d.url || '' })),
    [documentsRaw]
  );

  const notifications = useMemo<Notification[]>(
    () => (notificationsRaw ?? []).map((n: ConvexNotification) => ({ ...n, id: n._id, type: n.type as NotificationType, target: n.target as NotificationTarget, date: new Date(n.timestamp).toISOString().split('T')[0] })),
    [notificationsRaw]
  );

  const albums = useMemo<Album[]>(
    () => (albumsRaw ?? []).map((a: ConvexAlbum) => ({ ...a, id: a._id, photos: a.photos ?? [], photoCount: a.photoCount ?? 0 })),
    [albumsRaw]
  );

  const activityLogs = useMemo<ActivityLog[]>(
    () => (activityLogsRaw ?? []).map((l: ConvexActivityLog) => ({ ...l, id: l._id })),
    [activityLogsRaw]
  );

  const actionAreas = useMemo<ActionArea[]>(
    () => (actionAreasRaw ?? []).map((aa: ConvexActionArea) => ({ ...aa, id: aa._id })),
    [actionAreasRaw]
  );

  const stats = useMemo<Stat[]>(
    () => (statsRaw ?? []).map((s: ConvexStat) => ({ ...s, id: s._id })),
    [statsRaw]
  );

  const sponsorTiers = useMemo<SponsorTier[]>(
    () => (sponsorTiersRaw ?? []).map((st: ConvexSponsorTier) => ({ ...st, id: st._id })),
    [sponsorTiersRaw]
  );

  const milestones = useMemo<Milestone[]>(
    () => (milestonesRaw ?? []).map((m: ConvexMilestone) => ({ ...m, id: m._id })),
    [milestonesRaw]
  );

  // ── Populate category names in events/posts ────────────────────────────────

  const adminEvents = useMemo(() => {
    return eventsMapped.map(e => ({
      ...e,
      status: e.status as EventStatus,
      category: categories.find(c => c.id === e.categoryId || c.slug === e.categoryId || c.name === e.categoryId)?.name || 'Sem Categoria'
    }));
  }, [eventsMapped, categories]);

  const adminPosts = useMemo(() => {
    return postsMapped.map(p => ({
      ...p,
      category: categories.find(c => c.id === p.categoryId || c.slug === p.categoryId || c.name === p.categoryId)?.name || 'Sem Categoria'
    }));
  }, [postsMapped, categories]);

  // Public-facing lists exclude drafts (the admin subscription can inject them
  // when the session belongs to an administrator)
  const events = useMemo(() => adminEvents.filter(e => e.status !== 'draft'), [adminEvents]);
  const posts = useMemo(() => adminPosts.filter(p => p.published !== false), [adminPosts]);

  // ── Action Wrappers (all wrapped in useCallback with ActionResult) ─────────

  const logActivity = useCallback(
    (action: string, target: string, description: string) => {
      logActivityMut({ action, target, description }).catch(console.error);
    },
    [logActivityMut]
  );

  // ── Event Actions ──────────────────────────────────────────────────────────

  const addEvent = useCallback(
    async (data: EventCreateArgs): Promise<ActionResult> => {
      try {
        // category is joined client-side for display; the validator rejects it
        const { imageUrl, category: _category, ...rest } = data as EventCreateArgs & { category?: string };
        // Fill schema-required fields so a minimal form saves without errors.
        await createEventMut({
          ...rest,
          description: data.description || '',
          date: data.date || new Date().toISOString(),
          location: data.location || 'Sede da associação',
          slug: data.slug?.trim() || slugify(data.title),
          categoryId: String(data.categoryId),
          externalImage: imageUrl || data.externalImage,
          status: (data.status || 'published') as 'published' | 'draft',
        });
        logActivity('create', 'Evento', `Evento criado: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addEvent error:", e);
        return toActionResult(e);
      }
    },
    [createEventMut, logActivity]
  );

  const updateEvent = useCallback(
    async (id: string, data: Partial<EventCreateArgs>): Promise<ActionResult> => {
      try {
        // category is joined client-side for display; the validator rejects it
        const { imageUrl, status, category: _category, ...rest } =
          data as Partial<EventCreateArgs> & { category?: string };
        if (rest.categoryId) rest.categoryId = String(rest.categoryId);
        // '' means the admin removed the image; undefined means untouched
        if (imageUrl !== undefined) rest.externalImage = imageUrl;
        await updateEventMut({
          id: id as Id<"events">,
          ...rest,
          ...(status !== undefined ? { status: status as 'published' | 'draft' } : {}),
        });
        logActivity('update', 'Evento', `Evento atualizado ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("updateEvent error:", e);
        return toActionResult(e);
      }
    },
    [updateEventMut, logActivity]
  );

  const deleteEvent = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteEventMut({ id: id as Id<"events"> });
        logActivity('delete', 'Evento', `Evento removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteEvent error:", e);
        return toActionResult(e);
      }
    },
    [deleteEventMut, logActivity]
  );

  // ── Post Actions ───────────────────────────────────────────────────────────

  const addPost = useCallback(
    async (data: PostCreateArgs): Promise<ActionResult> => {
      try {
        // category/coverImageUrl are joined client-side; the validator rejects them
        const { coverUrl, category: _category, coverImageUrl: _cover, ...rest } =
          data as PostCreateArgs & { category?: string; coverImageUrl?: string };
        // Fill schema-required fields so a minimal form (title + content) saves.
        await createPostMut({
          ...rest,
          author: data.author?.trim() || 'Direção',
          excerpt: data.excerpt?.trim() || excerptFromContent(data.content || '') || data.title,
          date: data.date || new Date().toISOString(),
          slug: data.slug?.trim() || slugify(data.title),
          content: data.content || '',
          categoryId: String(data.categoryId),
          published: data.published !== undefined ? data.published : true,
          externalImage: coverUrl || data.externalImage,
        });
        logActivity('create', 'Notícia', `Notícia criada: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addPost error:", e);
        return toActionResult(e);
      }
    },
    [createPostMut, logActivity]
  );

  const updatePost = useCallback(
    async (id: string, data: Partial<PostCreateArgs>): Promise<ActionResult> => {
      try {
        // category/coverImageUrl are joined client-side; the validator rejects them
        const { coverUrl, category: _category, coverImageUrl: _cover, ...rest } =
          data as Partial<PostCreateArgs> & { category?: string; coverImageUrl?: string };
        if (coverUrl !== undefined) rest.externalImage = coverUrl;
        if (rest.categoryId) rest.categoryId = String(rest.categoryId);
        await updatePostMut({ id: id as Id<"posts">, ...rest });
        logActivity('update', 'Notícia', `Notícia atualizada ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("updatePost error:", e);
        return toActionResult(e);
      }
    },
    [updatePostMut, logActivity]
  );

  const deletePost = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deletePostMut({ id: id as Id<"posts"> });
        logActivity('delete', 'Notícia', `Notícia removida ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deletePost error:", e);
        return toActionResult(e);
      }
    },
    [deletePostMut, logActivity]
  );

  // ── Member Actions ─────────────────────────────────────────────────────────

  const addMember = useCallback(
    async (data: MemberCreateArgs): Promise<ActionResult> => {
      try {
        const { photoUrl, ...rest } = data;
        await createMemberMut({
          ...rest,
          externalPhoto: photoUrl || data.externalPhoto,
        });
        logActivity('create', 'Membro', `Membro criado: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("addMember error:", e);
        return toActionResult(e);
      }
    },
    [createMemberMut, logActivity]
  );

  const updateMember = useCallback(
    async (id: string, data: Partial<MemberCreateArgs>): Promise<ActionResult> => {
      try {
        const { photoUrl, ...rest } = data;
        if (photoUrl !== undefined) rest.externalPhoto = photoUrl;
        await updateMemberMut({ id: id as Id<"members">, ...rest });
        logActivity('update', 'Membro', `Membro atualizado: ${data.name || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateMember error:", e);
        return toActionResult(e);
      }
    },
    [updateMemberMut, logActivity]
  );

  const deleteMember = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteMemberMut({ id: id as Id<"members"> });
        logActivity('delete', 'Membro', `Membro removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteMember error:", e);
        return toActionResult(e);
      }
    },
    [deleteMemberMut, logActivity]
  );

  // ── Sponsor Actions ────────────────────────────────────────────────────────

  const addSponsor = useCallback(
    async (data: SponsorCreateArgs): Promise<ActionResult> => {
      try {
        const { logoUrl, ...rest } = data;
        await createSponsorMut({
          ...rest,
          externalLogo: logoUrl || data.externalLogo,
          tier: data.tier.toLowerCase(),
        });
        logActivity('create', 'Parceiro', `Parceiro criado: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("addSponsor error:", e);
        return toActionResult(e);
      }
    },
    [createSponsorMut, logActivity]
  );

  const updateSponsor = useCallback(
    async (id: string, data: Partial<SponsorCreateArgs>): Promise<ActionResult> => {
      try {
        const { logoUrl, ...rest } = data;
        if (logoUrl !== undefined) rest.externalLogo = logoUrl;
        await updateSponsorMut({ id: id as Id<"sponsors">, ...rest });
        logActivity('update', 'Parceiro', `Parceiro atualizado: ${data.name || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateSponsor error:", e);
        return toActionResult(e);
      }
    },
    [updateSponsorMut, logActivity]
  );

  const deleteSponsor = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteSponsorMut({ id: id as Id<"sponsors"> });
        logActivity('delete', 'Parceiro', `Parceiro removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteSponsor error:", e);
        return toActionResult(e);
      }
    },
    [deleteSponsorMut, logActivity]
  );

  // ── Category Actions ───────────────────────────────────────────────────────

  const addCategory = useCallback(
    async (data: Partial<CategoryCreateArgs> & { name: string }): Promise<ActionResult> => {
      try {
        const slug = (data.slug ?? data.name)
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        await createCategoryMut({
          name: data.name,
          slug,
          type: data.type ?? "general",
          color: data.color,
        });
        logActivity('create', 'Categoria', `Categoria criada: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("addCategory error:", e);
        return toActionResult(e);
      }
    },
    [createCategoryMut, logActivity]
  );

  const updateCategory = useCallback(
    async (id: string, data: Partial<CategoryCreateArgs>): Promise<ActionResult> => {
      try {
        await updateCategoryMut({ id: id as Id<"categories">, ...data });
        logActivity('update', 'Categoria', `Categoria atualizada: ${data.name || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateCategory error:", e);
        return toActionResult(e);
      }
    },
    [updateCategoryMut, logActivity]
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<{ success: boolean; message: string }> => {
      try {
        await deleteCategoryMut({ id: id as Id<"categories"> });
        logActivity('delete', 'Categoria', `Categoria removida ID: ${id}`);
        return { success: true, message: "OK" };
      } catch (e) {
        console.error("deleteCategory error:", e);
        const message = e instanceof Error ? e.message : "Erro";
        return { success: false, message };
      }
    },
    [deleteCategoryMut, logActivity]
  );

  // ── Registration Actions ───────────────────────────────────────────────────

  const addRegistration = useCallback(
    async (data: RegistrationCreateArgs): Promise<ActionResult> => {
      try {
        await createRegMut({
          ...data,
          eventId: data.eventId as Id<"events">,
          customData: data.customData as Record<string, string | number | boolean> | undefined,
        });
        return { success: true };
      } catch (e) {
        console.error("addRegistration error:", e);
        return toActionResult(e);
      }
    },
    [createRegMut]
  );

  const updateRegistrationStatus = useCallback(
    async (id: string, status: string, _paymentStatus?: string): Promise<ActionResult> => {
      try {
        await updateRegStatusMut({ id: id as Id<"registrations">, status: status as "pending" | "confirmed" | "cancelled" });
        return { success: true };
      } catch (e) {
        console.error("updateRegistrationStatus error:", e);
        return toActionResult(e);
      }
    },
    [updateRegStatusMut]
  );

  // ── Document Actions ───────────────────────────────────────────────────────

  const addDocument = useCallback(
    async (doc: DocumentCreateArgs): Promise<ActionResult> => {
      try {
        const { fileId, ...rest } = doc;
        await createDocMut({
          ...rest,
          fileId: fileId ? fileId as Id<"_storage"> : undefined,
        });
        logActivity('create', 'Documento', `Documento carregado: ${doc.title}`);
        return { success: true };
      } catch (e) {
        console.error("addDocument error:", e);
        return toActionResult(e);
      }
    },
    [createDocMut, logActivity]
  );

  const updateDocument = useCallback(
    async (id: string, doc: Partial<DocumentCreateArgs>): Promise<ActionResult> => {
      try {
        const { fileId, ...rest } = doc;
        await updateDocMut({
          id: id as Id<"documents">,
          ...rest,
          ...(fileId !== undefined ? { fileId: fileId as Id<"_storage"> } : {}),
        });
        logActivity('update', 'Documento', `Documento atualizado: ${doc.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateDocument error:", e);
        return toActionResult(e);
      }
    },
    [updateDocMut, logActivity]
  );

  const deleteDocument = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteDocMut({ id: id as Id<"documents"> });
        logActivity('delete', 'Documento', `Documento removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteDocument error:", e);
        return toActionResult(e);
      }
    },
    [deleteDocMut, logActivity]
  );

  // ── Notification Actions ───────────────────────────────────────────────────

  const sendNotification = useCallback(
    async (notif: NotificationCreateArgs): Promise<ActionResult> => {
      try {
        await createNotifMut(notif);
        logActivity('create', 'Notificação', `Notificação enviada: ${notif.title}`);
        return { success: true };
      } catch (e) {
        console.error("sendNotification error:", e);
        return toActionResult(e);
      }
    },
    [createNotifMut, logActivity]
  );

  const updateNotification = useCallback(
    async (id: string, data: Partial<NotificationCreateArgs & { read?: boolean }>): Promise<ActionResult> => {
      try {
        await updateNotifMut({ id: id as Id<"notifications">, ...data });
        logActivity('update', 'Notificação', `Notificação atualizada ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("updateNotification error:", e);
        return toActionResult(e);
      }
    },
    [updateNotifMut, logActivity]
  );

  const deleteNotification = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteNotifMut({ id: id as Id<"notifications"> });
        logActivity('delete', 'Notificação', `Notificação removida ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteNotification error:", e);
        return toActionResult(e);
      }
    },
    [deleteNotifMut, logActivity]
  );

  // ── Album Actions ──────────────────────────────────────────────────────────

  const createAlbum = useCallback(
    async (album: AlbumCreateArgs): Promise<ActionResult> => {
      try {
        const albumId = await createAlbumMut({
          title: album.title,
          date: album.date,
          // The admin form (MediaStudio) writes coverUrl; alias it to the Convex field
          externalCover: album.coverUrl || album.externalCover,
          description: album.description,
        });
        if (album.photos && album.photos.length > 0) {
          await setAlbumImagesMut({ albumId, photos: album.photos });
        }
        logActivity('create', 'Álbum', `Álbum criado: ${album.title}`);
        return { success: true };
      } catch (e) {
        console.error("createAlbum error:", e);
        return toActionResult(e);
      }
    },
    [createAlbumMut, setAlbumImagesMut, logActivity]
  );

  const updateAlbum = useCallback(
    async (id: string, data: Partial<AlbumCreateArgs>): Promise<ActionResult> => {
      try {
        await updateAlbumMut({
          id: id as Id<"albums">,
          title: data.title,
          date: data.date,
          // coverUrl '' means the admin removed the cover; undefined means untouched
          externalCover: data.coverUrl !== undefined ? data.coverUrl : data.externalCover,
          description: data.description,
        });
        if (data.photos !== undefined) {
          await setAlbumImagesMut({ albumId: id as Id<"albums">, photos: data.photos });
        }
        logActivity('update', 'Álbum', `Álbum atualizado: ${data.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateAlbum error:", e);
        return toActionResult(e);
      }
    },
    [updateAlbumMut, setAlbumImagesMut, logActivity]
  );

  const deleteAlbum = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteAlbumMut({ id: id as Id<"albums"> });
        logActivity('delete', 'Álbum', `Álbum removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteAlbum error:", e);
        return toActionResult(e);
      }
    },
    [deleteAlbumMut, logActivity]
  );

  // ── Milestone Actions ──────────────────────────────────────────────────────

  const addMilestone = useCallback(
    async (data: MilestoneCreateArgs): Promise<ActionResult> => {
      try {
        const { imageUrl, ...rest } = data;
        await createMilestoneMut({
          ...rest,
          year: Number(data.year) || new Date().getFullYear(),
          order: Number(data.order) || 1,
          externalImage: imageUrl || data.externalImage,
        });
        logActivity('create', 'Marco Histórico', `Marco criado: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addMilestone error:", e);
        return toActionResult(e);
      }
    },
    [createMilestoneMut, logActivity]
  );

  const updateMilestone = useCallback(
    async (id: string, data: Partial<MilestoneCreateArgs>): Promise<ActionResult> => {
      try {
        const { imageUrl, ...rest } = data;
        if (rest.year !== undefined) rest.year = Number(rest.year);
        if (rest.order !== undefined) rest.order = Number(rest.order);
        // '' means the admin removed the image; undefined means untouched
        if (imageUrl !== undefined) rest.externalImage = imageUrl;
        await updateMilestoneMut({ id: id as Id<"milestones">, ...rest });
        logActivity('update', 'Marco Histórico', `Marco atualizado: ${data.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateMilestone error:", e);
        return toActionResult(e);
      }
    },
    [updateMilestoneMut, logActivity]
  );

  const deleteMilestone = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteMilestoneMut({ id: id as Id<"milestones"> });
        logActivity('delete', 'Marco Histórico', `Marco removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteMilestone error:", e);
        return toActionResult(e);
      }
    },
    [deleteMilestoneMut, logActivity]
  );

  // ── Settings Action ────────────────────────────────────────────────────────

  const updateSettings = useCallback(
    async (s: Partial<Settings>): Promise<ActionResult> => {
      try {
        // Only pass Convex-stored fields to the mutation
        const convexFields: SettingsUpdateArgs = {
          siteName: s.siteName,
          maintenanceMode: s.maintenanceMode,
          contactEmail: s.contactEmail,
          logoUrl: s.logoUrl,
          currentMandate: s.currentMandate,
          siteFullName: s.siteFullName,
          locality: s.locality,
          region: s.region,
          foundedYear: s.foundedYear,
          heroTagline: s.heroTagline,
          heroSubtitle: s.heroSubtitle,
          historyIntro: s.historyIntro,
          historyQuote: s.historyQuote,
          venueName: s.venueName,
          venueDescription: s.venueDescription,
          foundersNote: s.foundersNote,
          contentTone: s.contentTone,
          defaultImageStyle: s.defaultImageStyle,
          enableChatbot: s.enableChatbot,
          chatModel: s.chatModel,
          chatModelFallback: s.chatModelFallback,
          imageModel: s.imageModel,
          thinkingBudget: s.thinkingBudget,
          aiSystemPromptExtra: s.aiSystemPromptExtra,
          aiAllowedTopics: s.aiAllowedTopics,
          aiForbiddenTopics: s.aiForbiddenTopics,
          aiGuardrailsEnabled: s.aiGuardrailsEnabled,
          imageResolution: s.imageResolution,
          phone: s.phone,
          openingHours: s.openingHours,
          address: s.address,
          mapsUrl: s.mapsUrl,
          latitude: s.latitude,
          longitude: s.longitude,
          facebookPageId: s.facebookPageId,
          instagramUrl: s.instagramUrl,
          aboutMission: s.aboutMission,
          // Rows the admin added but left blank are dropped rather than saved
          aboutPillars: s.aboutPillars?.filter(p => p.title.trim() || p.description.trim()),
          quotaAmount: s.quotaAmount,
          mbwayNumber: s.mbwayNumber,
          iban: s.iban,
          multibancoEntity: s.multibancoEntity,
          multibancoReference: s.multibancoReference,
          // Secrets are write-only and never echoed to the form: an empty
          // string means "unchanged", so drop it instead of erasing the value
          facebookAccessToken: s.facebookAccessToken || undefined,
          showChatbotBubble: s.showChatbotBubble,
          ttsModel: s.ttsModel,
          aiProvider: s.aiProvider,
          openrouterApiKey: s.openrouterApiKey || undefined,
          openrouterModel: s.openrouterModel,
          customApiUrl: s.customApiUrl,
          customApiKey: s.customApiKey || undefined,
          customModel: s.customModel,
        };
        await updateSettingsMut(convexFields);
        logActivity('update', 'Definições', 'Definições do site atualizadas');
        return { success: true };
      } catch (e) {
        console.error("updateSettings error:", e);
        return toActionResult(e);
      }
    },
    [updateSettingsMut, logActivity]
  );

  // ── Action Area Actions ────────────────────────────────────────────────────

  const addActionArea = useCallback(
    async (data: ActionAreaCreateArgs): Promise<ActionResult> => {
      try {
        await createActionAreaMut({
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          longDescription: data.longDescription,
          features: data.features,
          // The admin form (MediaStudio) writes imageUrl; alias it to the Convex field
          externalImage: data.imageUrl || data.externalImage,
          iconName: data.iconName,
          order: data.order,
        });
        logActivity('create', 'Área de Atuação', `Área de atuação criada: ${data.title}`);
        return { success: true };
      } catch (e) {
        console.error("addActionArea error:", e);
        return toActionResult(e);
      }
    },
    [createActionAreaMut, logActivity]
  );

  const updateActionArea = useCallback(
    async (id: string, data: Partial<ActionAreaCreateArgs>): Promise<ActionResult> => {
      try {
        await updateActionAreaMut({
          id: id as Id<"actionAreas">,
          title: data.title,
          subtitle: data.subtitle,
          description: data.description,
          longDescription: data.longDescription,
          features: data.features,
          // imageUrl '' means the admin removed the image; undefined means untouched
          externalImage: data.imageUrl !== undefined ? data.imageUrl : data.externalImage,
          iconName: data.iconName,
          order: data.order,
        });
        logActivity('update', 'Área de Atuação', `Área de atuação atualizada: ${data.title || id}`);
        return { success: true };
      } catch (e) {
        console.error("updateActionArea error:", e);
        return toActionResult(e);
      }
    },
    [updateActionAreaMut, logActivity]
  );

  const deleteActionArea = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteActionAreaMut({ id: id as Id<"actionAreas"> });
        logActivity('delete', 'Área de Atuação', `Área de atuação removida ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteActionArea error:", e);
        return toActionResult(e);
      }
    },
    [deleteActionAreaMut, logActivity]
  );

  // ── Stat Actions ───────────────────────────────────────────────────────────

  const upsertStat = useCallback(
    async (data: StatUpsertArgs): Promise<ActionResult> => {
      try {
        await upsertStatMut({
          ...data,
          id: data.id ? data.id as Id<"stats"> : undefined,
        });
        logActivity('update', 'Estatística', `Estatística atualizada: ${data.label}`);
        return { success: true };
      } catch (e) {
        console.error("upsertStat error:", e);
        return toActionResult(e);
      }
    },
    [upsertStatMut, logActivity]
  );

  const deleteStat = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteStatMut({ id: id as Id<"stats"> });
        logActivity('delete', 'Estatística', `Estatística removida ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteStat error:", e);
        return toActionResult(e);
      }
    },
    [deleteStatMut, logActivity]
  );

  // ── Sponsor Tier Actions ───────────────────────────────────────────────────

  const upsertSponsorTier = useCallback(
    async (data: SponsorTierUpsertArgs): Promise<ActionResult> => {
      try {
        await upsertSponsorTierMut({
          ...data,
          id: data.id ? data.id as Id<"sponsorTiers"> : undefined,
        });
        logActivity('update', 'Nível de Parceiro', `Nível de parceria atualizado: ${data.name}`);
        return { success: true };
      } catch (e) {
        console.error("upsertSponsorTier error:", e);
        return toActionResult(e);
      }
    },
    [upsertSponsorTierMut, logActivity]
  );

  const deleteSponsorTier = useCallback(
    async (id: string): Promise<ActionResult> => {
      try {
        await deleteSponsorTierMut({ id: id as Id<"sponsorTiers"> });
        logActivity('delete', 'Nível de Parceiro', `Nível de parceria removido ID: ${id}`);
        return { success: true };
      } catch (e) {
        console.error("deleteSponsorTier error:", e);
        return toActionResult(e);
      }
    },
    [deleteSponsorTierMut, logActivity]
  );

  // ── Context Value (memoized) ───────────────────────────────────────────────

  const contextValue = useMemo<DataContextType>(
    () => ({
      events,
      posts,
      adminEvents,
      adminPosts,
      members,
      categories,
      settings,
      activityLogs,
      registrations,
      sponsors,
      sponsorTiers,
      documents,
      notifications,
      albums,
      actionAreas,
      stats,
      milestones,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      isLoading,
      isBackendDown,
      addEvent,
      updateEvent,
      deleteEvent,
      addPost,
      updatePost,
      deletePost,
      addMember,
      updateMember,
      deleteMember,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      addRegistration,
      updateRegistrationStatus,
      addSponsor,
      updateSponsor,
      deleteSponsor,
      updateSponsorTier: upsertSponsorTier, // compatibility
      addDocument,
      updateDocument,
      deleteDocument,
      sendNotification,
      updateNotification,
      deleteNotification,
      createAlbum,
      updateAlbum,
      deleteAlbum,
      addActionArea,
      updateActionArea,
      deleteActionArea,
      upsertStat,
      deleteStat,
      upsertSponsorTier,
      deleteSponsorTier,
      logActivity,
    }),
    [
      events,
      posts,
      adminEvents,
      adminPosts,
      members,
      categories,
      settings,
      activityLogs,
      registrations,
      sponsors,
      sponsorTiers,
      documents,
      notifications,
      albums,
      actionAreas,
      stats,
      milestones,
      addMilestone,
      updateMilestone,
      deleteMilestone,
      isLoading,
      isBackendDown,
      addEvent,
      updateEvent,
      deleteEvent,
      addPost,
      updatePost,
      deletePost,
      addMember,
      updateMember,
      deleteMember,
      addCategory,
      updateCategory,
      deleteCategory,
      updateSettings,
      addRegistration,
      updateRegistrationStatus,
      addSponsor,
      updateSponsor,
      deleteSponsor,
      addDocument,
      updateDocument,
      deleteDocument,
      sendNotification,
      updateNotification,
      deleteNotification,
      createAlbum,
      updateAlbum,
      deleteAlbum,
      addActionArea,
      updateActionArea,
      deleteActionArea,
      upsertStat,
      deleteStat,
      upsertSponsorTier,
      deleteSponsorTier,
      logActivity,
    ]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
