import React, { createContext, useContext, ReactNode, useMemo, useCallback, useRef, useState, useEffect } from 'react';
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  ActionArea, Stat, Member, Category, Settings, ActivityLog, Milestone,
  Registration, Sponsor, SponsorTier, Document, Notification, Album
} from '../types';
import type { RegistrationStatus, NotificationType, NotificationTarget, EventStatus } from '../types';
import { INITIAL_SETTINGS } from '../utils/defaultSettings';
import type { ConvexEvent, ConvexPost, ConvexMember, ConvexCategory, ConvexSponsor, ConvexRegistration, ConvexDocument, ConvexNotification, ConvexAlbum, ConvexActivityLog, ConvexActionArea, ConvexMilestone, ConvexStat, ConvexSponsorTier, DataContextType } from './data/types';
import { useEventActions } from './data/useEventActions';
import { usePostActions } from './data/usePostActions';
import { useMemberActions } from './data/useMemberActions';
import { useSponsorActions } from './data/useSponsorActions';
import { useCategoryActions } from './data/useCategoryActions';
import { useRegistrationActions } from './data/useRegistrationActions';
import { useDocumentActions } from './data/useDocumentActions';
import { useNotificationActions } from './data/useNotificationActions';
import { useAlbumActions } from './data/useAlbumActions';
import { useMilestoneActions } from './data/useMilestoneActions';
import { useSettingsActions } from './data/useSettingsActions';
import { useActionAreaActions } from './data/useActionAreaActions';
import { useStatActions } from './data/useStatActions';
import { useSponsorTierActions } from './data/useSponsorTierActions';

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
  // Members-only archive: not subscribed for anonymous visitors
  const documentsRaw = useQuery(api.documents.list, isAuthenticated ? {} : "skip");
  const documentsLoaded = !isAuthenticated || documentsRaw !== undefined;
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
    !documentsLoaded ||
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
      const adminOnlyKeys = ['aiProvider', 'openrouterModel', 'customApiUrl', 'customModel', 'aiSystemPromptExtra', 'hasOpenrouterApiKey', 'hasCustomApiKey', 'hasFacebookAccessToken'] as const;
      for (const key of adminOnlyKeys) {
        const value = (settingsAdminRaw as Record<string, unknown>)[key];
        if (value !== undefined && value !== null) {
          dbValues[key] = value;
        }
      }
    }
    return { ...INITIAL_SETTINGS, ...dbValues };
  }, [settingsRaw, settingsAdminRaw]);

  const logActivityMut = useMutation(api.activityLogs.create);

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

  // Activity log entries are read by humans: keep the record's own name in the
  // ref so a delete or update never shows a raw document id
  const namedRecordsRef = useRef<Array<{ id: string; title?: string; name?: string; label?: string }>>([]);
  useEffect(() => {
    namedRecordsRef.current = [
      ...adminEvents, ...adminPosts, ...members, ...categories, ...sponsors, ...documents,
      ...notifications, ...albums, ...milestones, ...actionAreas, ...stats, ...sponsorTiers,
    ];
  }, [adminEvents, adminPosts, members, categories, sponsors, documents, notifications, albums, milestones, actionAreas, stats, sponsorTiers]);
  const describeAction = useCallback((prefix: string, id: string) => {
    const record = namedRecordsRef.current.find(item => item.id === id);
    const name = record?.title ?? record?.name ?? record?.label;
    return name ? `${prefix}: ${name}` : prefix;
  }, []);

  const actionDeps = { logActivity, describeAction };
  const { addEvent, updateEvent, deleteEvent } = useEventActions(actionDeps);
  const { addPost, updatePost, deletePost } = usePostActions(actionDeps);
  const { addMember, updateMember, deleteMember } = useMemberActions(actionDeps);
  const { addSponsor, updateSponsor, deleteSponsor } = useSponsorActions(actionDeps);
  const { addCategory, updateCategory, deleteCategory } = useCategoryActions(actionDeps);
  const { addRegistration, updateRegistrationStatus } = useRegistrationActions();
  const { addDocument, updateDocument, deleteDocument } = useDocumentActions(actionDeps);
  const { sendNotification, updateNotification, deleteNotification } = useNotificationActions(actionDeps);
  const { createAlbum, updateAlbum, deleteAlbum } = useAlbumActions(actionDeps);
  const { addMilestone, updateMilestone, deleteMilestone } = useMilestoneActions(actionDeps);
  const { updateSettings } = useSettingsActions(actionDeps);
  const { addActionArea, updateActionArea, deleteActionArea } = useActionAreaActions(actionDeps);
  const { upsertStat, deleteStat } = useStatActions(actionDeps);
  const { upsertSponsorTier, deleteSponsorTier } = useSponsorTierActions(actionDeps);

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
