/**
 * Convex document shapes, mutation argument types and the DataContext contract.
 */

import type {
  NotificationType, NotificationTarget, ActionResult, Settings, Category, Event, Registration, Post, Member, Milestone, Sponsor, SponsorTier, ActionArea, Stat, Document, Notification, Album, ActivityLog
} from '../../types';

// ── Convex Document Types ──────────────────────────────────────────────────────
// Raw shapes returned by Convex queries (with _id, _creationTime).

export interface ConvexDoc {
  _id: string;
  _creationTime: number;
}

export interface ConvexEvent extends ConvexDoc {
  title: string;
  /** Absent in the public summary subscription; present in admin listAll */
  description?: string;
  /** Plain-text stand-in for the body, only in the public summary */
  excerpt?: string;
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

export interface ConvexPost extends ConvexDoc {
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

export interface ConvexMember extends ConvexDoc {
  name: string;
  role: string;
  bio?: string;
  photo?: string | null;
  externalPhoto?: string;
  photoUrl?: string;
  group: string;
  order: number;
}

export interface ConvexCategory extends ConvexDoc {
  name: string;
  slug: string;
  type: string;
  color?: string;
}

export interface ConvexSponsor extends ConvexDoc {
  name: string;
  tier: string;
  logo?: string | null;
  externalLogo?: string;
  logoUrl?: string;
  website?: string;
  active: boolean;
}

export interface ConvexRegistration extends ConvexDoc {
  eventId: string;
  userId?: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  timestamp: number;
}

export interface ConvexDocument extends ConvexDoc {
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

export interface ConvexNotification extends ConvexDoc {
  title: string;
  message: string;
  type: string;
  target: string;
  read: boolean;
  timestamp: number;
}

export interface ConvexAlbum extends ConvexDoc {
  title: string;
  date: string;
  coverId?: string | null;
  externalCover?: string;
  coverUrl?: string;
  description?: string;
  photos?: string[];
  photoCount?: number;
}

export interface ConvexActivityLog extends ConvexDoc {
  action: string;
  target: string;
  description: string;
  user?: string;
  timestamp: number;
}

export interface ConvexActionArea extends ConvexDoc {
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

export interface ConvexMilestone extends ConvexDoc {
  year: number;
  title: string;
  description: string;
  image?: string | null;
  externalImage?: string;
  imageUrl?: string;
  order: number;
}

export interface ConvexStat extends ConvexDoc {
  label: string;
  value: string;
  order: number;
}

export interface ConvexSponsorTier extends ConvexDoc {
  name: string;
  price: string;
  benefits: string[];
  order: number;
  color?: string;
  textColor?: string;
}

// ── CRUD Argument Types ────────────────────────────────────────────────────────

export interface EventCreateArgs {
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

export interface PostCreateArgs {
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

export interface MemberCreateArgs {
  name: string;
  role: string;
  bio?: string;
  externalPhoto?: string;
  photoUrl?: string; // Alias for externalPhoto from frontend forms
  group: string;
  order: number;
}

export interface SponsorCreateArgs {
  name: string;
  tier: string;
  externalLogo?: string;
  logoUrl?: string; // Alias for externalLogo from frontend forms
  website?: string;
  active: boolean;
}

export interface CategoryCreateArgs {
  name: string;
  slug: string;
  type: string;
  color?: string;
}

export interface RegistrationCreateArgs {
  eventId: string;
  name: string;
  email: string;
  phone?: string;
  customData?: Record<string, unknown>;
}

export interface DocumentCreateArgs {
  title: string;
  description?: string;
  externalUrl?: string;
  category: string;
  date?: string;
  size?: string;
  fileId?: string; // Will be cast to Id<"_storage"> before passing to mutation
}

export interface NotificationCreateArgs {
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
}

export interface AlbumCreateArgs {
  title: string;
  date: string;
  externalCover?: string;
  /** Admin form alias for externalCover (MediaStudio writes coverUrl) */
  coverUrl?: string;
  /** Full photo list from the admin form; synced to galleryImages */
  photos?: string[];
  description?: string;
}

export interface ActionAreaCreateArgs {
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

export interface MilestoneCreateArgs {
  year: number;
  title: string;
  description: string;
  externalImage?: string;
  /** Admin form alias for externalImage (MediaStudio writes imageUrl) */
  imageUrl?: string;
  order: number;
}

export interface StatUpsertArgs {
  id?: string;
  label: string;
  value: string;
  order: number;
}

export interface SponsorTierUpsertArgs {
  id?: string;
  name: string;
  price: string;
  benefits: string[];
  order: number;
  color?: string;
  textColor?: string;
}

/** Only Convex-stored fields for settings update mutation. */
export interface SettingsUpdateArgs {
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

export interface DataContextType {
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
