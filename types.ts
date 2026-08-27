
/**
 * Domain Models & Type Definitions
 *
 * This file defines the TypeScript interfaces that structure the application's data layer.
 * These interfaces represent the frontend shape of data AFTER mapping from Convex documents
 * (i.e., Convex _id is mapped to id, and storage URLs are resolved).
 */

// ── Strict Literal Types (matching Convex schema validators) ────────────────
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';
export type NotificationType = 'info' | 'success' | 'warning' | 'urgent';
export type NotificationTarget = 'all' | 'admin' | 'user';
export type EventStatus = 'published' | 'draft';
export type MemberGroup = 'Direção' | 'Assembleia Geral' | 'Conselho Fiscal' | 'founder';

// ── Action Result ──────────────────────────────────────────────────────────────
/** Standard result type returned by all DataContext mutation actions. */
export type ActionResult = { success: true } | { success: false; error: string };

// ── User ───────────────────────────────────────────────────────────────────────
/** User definition for authentication and role-based access control (RBAC). */
export interface User {
  id: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
}

// ── Settings ───────────────────────────────────────────────────────────────────
/**
 * Global configuration settings for the application.
 *
 * Fields stored in Convex: siteName, maintenanceMode, contactEmail, currentMandate,
 * contentTone, defaultImageStyle.
 *
 * Remaining fields are sourced from environment variables via INITIAL_SETTINGS
 * and merged at runtime in DataContext.
 */
/** Pillar card on the About page; icon is a Lucide icon name resolved client-side. */
export interface AboutPillar {
  icon: string;
  title: string;
  description: string;
}

export interface Settings {
  siteName: string;
  contactEmail: string;
  logoUrl?: string;
  maintenanceMode: boolean;
  currentMandate?: string;

  // Identity and editorial copy (DB-first; the repo ships generic demo defaults)
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

  // AI Chatbot Configuration (DB-configurable with env fallbacks)
  enableChatbot: boolean;
  showChatbotBubble: boolean;
  chatModel: string;
  chatModelFallback: string;
  ttsModel: string;
  thinkingBudget: number;

  // Generative Content Configuration
  defaultImageStyle: string;
  imageModel: string;
  contentTone: string;
  imageResolution: string;

  // AI Guardrails Configuration
  aiSystemPromptExtra?: string;
  aiAllowedTopics?: string;
  aiForbiddenTopics?: string;
  aiGuardrailsEnabled: boolean;

  // Contact & Location (DB-configurable with env fallbacks)
  phone: string;
  openingHours?: string;
  address: string;
  mapsUrl: string;
  latitude: string;
  longitude: string;

  // Quota Payment Configuration (DB-configurable; all optional so the
  // member area degrades gracefully when unconfigured)
  quotaAmount?: string;
  mbwayNumber?: string;
  iban?: string;
  multibancoEntity?: string;
  multibancoReference?: string;

  // About Page Content (DB-configurable)
  aboutMission?: string;
  aboutPillars?: AboutPillar[];

  // Social Media Integration (DB-configurable with env fallbacks)
  facebookPageId?: string;
  instagramUrl?: string;
  facebookAccessToken?: string; // Write-only: stripped from getAdmin response

  // AI Provider Selection ('gemini' | 'openrouter' | 'custom')
  aiProvider?: string;
  openrouterApiKey?: string; // Write-only: stripped from getAdmin response
  openrouterModel?: string;
  customApiUrl?: string;
  customApiKey?: string; // Write-only: stripped from getAdmin response
  customModel?: string;
  // Presence flags from getAdmin so the UI can show "chave configurada"
  // without ever echoing the secret
  hasOpenrouterApiKey?: boolean;
  hasCustomApiKey?: boolean;
}

// ── Category ───────────────────────────────────────────────────────────────────
/** Taxonomy model for grouping content (Events, Posts, Documents). */
export interface Category {
  id: string;
  name: string;
  slug: string;
  type?: string; // 'event', 'blog'
  color?: string; // Visual identifier (Tailwind class)
  createdAt?: string;
  updatedAt?: string;
}

// ── Registration Field Definition ──────────────────────────────────────────────
/** Definition for dynamic form fields, allowing admins to create custom registration forms. */
export interface RegistrationFieldDefinition {
  id: string;
  label: string;
  type: string; // 'text' | 'email' | 'phone' | 'number' | 'date' | 'textarea'
  required: boolean;
  placeholder?: string;
}

// ── Event ──────────────────────────────────────────────────────────────────────
/** Event entity representing calendar activities and tournaments. */
export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  location: string;
  imageUrl?: string;

  // Relationships
  categoryId: string;
  category?: string; // Denormalized field populated in DataContext enrichment

  // Display
  isHighlight?: boolean;
  status?: EventStatus;

  // Tournament Specific Logic
  isTournament?: boolean;
  tournamentType?: 'Sueca' | 'Futsal' | 'Snooker' | 'Chinquilho' | 'Outro' | string;
  entryPrice?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  registrationOpen?: boolean;

  // Dynamic Form Configuration
  registrationFields?: RegistrationFieldDefinition[];

  // Timestamps (Convex _creationTime is available, these may be virtual)
  createdAt?: string;
  updatedAt?: string;
}

// ── Registration ───────────────────────────────────────────────────────────────
/**
 * Registration entity linking a participant to a specific event.
 * Aligned with Convex schema: eventId, userId, name, email, phone, status, timestamp.
 * Legacy fields (paymentStatus, customData, etc.) are kept optional for mock data compatibility.
 */
export interface Registration {
  id: string;
  eventId: string;
  userId?: string;

  // Contact Information (Convex schema fields)
  name?: string;
  email?: string;
  phone?: string;

  // Status
  status: RegistrationStatus;
  timestamp?: number;

  // Legacy/mock fields (used in Admin.tsx, not yet in Convex schema)
  mainContactName?: string;
  mainContactEmail?: string;
  customData?: Record<string, string | number | boolean>;
  paymentStatus?: string; // 'unpaid' | 'paid'
  registrationDate?: string;
  paymentReference?: string;
  updatedAt?: string;
}

// ── Post ───────────────────────────────────────────────────────────────────────
/** Blog post entity for news and announcements. */
export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl?: string;

  // Relationships
  categoryId: string;
  category?: string; // Denormalized field populated in DataContext enrichment

  author?: string;
  authorRole?: string;
  authorAvatar?: string;
  readTime?: string;
  tags?: string[];
  published: boolean;
  date: string;
  updatedAt?: string;
}

// ── Member ─────────────────────────────────────────────────────────────────────
/** Organizational member entity (Board, Assembly, Fiscal Council). */
export interface Member {
  id: string;
  name: string;
  role: string;
  group: string; // 'Direção' | 'Assembleia Geral' | 'Conselho Fiscal'
  bio?: string;
  photoUrl?: string;
  order: number;
  updatedAt?: string;
}

// ── Milestone ──────────────────────────────────────────────────────────────────
/** History page timeline entry, editable via the backoffice. */
export interface Milestone {
  id: string;
  year: number;
  title: string;
  description: string;
  imageUrl?: string;
  order: number;
}

// ── Sponsor ────────────────────────────────────────────────────────────────────
/** Corporate partner or sponsor entity. */
export interface Sponsor {
  id: string;
  name: string;
  logoUrl?: string;
  website?: string;
  tier: string; // 'Platinum' | 'Gold' | 'Silver' | 'Institutional'
  active: boolean;
  createdAt?: string;
}

// ── Sponsor Tier ───────────────────────────────────────────────────────────────
/** Configuration model for sponsorship levels. */
export interface SponsorTier {
  id: string;
  name: string;
  price: string;
  benefits: string[];
  order?: number;
  color?: string; // Gradient class for styling
  textColor?: string; // Text color class
}

// ── Action Area ────────────────────────────────────────────────────────────────
/** Homepage Action Areas. */
export interface ActionArea {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  features: string[];
  imageUrl?: string;
  iconName: string;
  order: number;
}

// ── Stat ───────────────────────────────────────────────────────────────────────
/** Homepage / Site Stats. */
export interface Stat {
  id: string;
  label: string;
  value: string;
  order: number;
}

// ── Document ───────────────────────────────────────────────────────────────────
/** Document entity for public repository (PDFs, etc.). */
export interface Document {
  id: string;
  title: string;
  description?: string;
  category: string; // 'Atas' | 'Relatórios' | 'Estatutos' | 'Regulamentos' | 'Outros'
  url: string;
  externalUrl?: string;
  date?: string;
  size?: string;
  uploadedAt?: number;
}

// ── Notification ───────────────────────────────────────────────────────────────
/** System notification entity for user alerts. */
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  target: NotificationTarget;
  date?: string;
  read?: boolean;
  timestamp?: number;
}

// ── Album ──────────────────────────────────────────────────────────────────────
/** Photo album entity for the gallery. */
export interface Album {
  id: string;
  title: string;
  coverUrl?: string;
  coverImageId?: string;
  date: string;
  description?: string;
  photos: string[];
  photoCount?: number;
}

/** One photo of an album as managed in the backoffice gallery manager. */
export interface GalleryImage {
  id: string;
  url: string | null;
  caption?: string;
  order?: number;
  uploadedAt: number;
  isStored: boolean;
}

// ── Activity Log ───────────────────────────────────────────────────────────────
/** Audit log entity for tracking administrative actions. */
export interface ActivityLog {
  id: string;
  action: string; // 'create' | 'update' | 'delete' | 'system'
  target: string; // 'Evento' | 'Notícia' | 'Membro' | etc.
  description: string;
  timestamp: number;
  user?: string;
}
