import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Override the default authTables.users to add an application-level role.
  // The base fields match @convex-dev/auth's built-in user shape.
  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    role: v.optional(v.union(v.literal("admin"), v.literal("user"))),
  }).index("email", ["email"]),

  // Member quota profiles, keyed by email so the direção can register a
  // sócio before (or independently of) their portal account
  memberProfiles: defineTable({
    email: v.string(),
    memberNumber: v.optional(v.string()),
    quotaPaidUntil: v.optional(v.string()), // year, e.g. "2026"
    notes: v.optional(v.string()),
  }).index("by_email", ["email"]),

  // Events
  events: defineTable({
    title: v.string(),
    description: v.string(),
    date: v.string(), // ISO date
    location: v.string(),
    categoryId: v.string(), // Helper for easy filtering, though relational
    slug: v.string(),
    image: v.optional(v.union(v.id("_storage"), v.null())), // Storage ID
    externalImage: v.optional(v.string()), // Temporary: external URL fallback
    status: v.union(v.literal("published"), v.literal("draft")),
    isHighlight: v.optional(v.boolean()), // Featured status for Homepage
    isTournament: v.optional(v.boolean()),
    tournamentType: v.optional(v.string()), // 'Sueca', 'Futsal', 'Snooker', 'Chinquilho', 'Outro'
    entryPrice: v.optional(v.number()),
    maxParticipants: v.optional(v.number()),
    currentParticipants: v.optional(v.number()),
    registrationOpen: v.optional(v.boolean()),
    registrationFields: v.optional(v.array(v.object({
      id: v.string(),
      label: v.string(),
      type: v.string(),
      required: v.boolean(),
      placeholder: v.optional(v.string()),
    }))),
  })
    .index("by_date", ["date"])
    .index("by_slug", ["slug"])
    .index("by_status", ["status", "date"]),

  // Blog Posts
  posts: defineTable({
    title: v.string(),
    excerpt: v.string(),
    content: v.string(), // Rich text/HTML
    author: v.string(),
    authorRole: v.optional(v.string()), // e.g., "Presidente", "Diretor"
    authorAvatar: v.optional(v.string()), // URL or Storage ID
    date: v.string(),
    readTime: v.optional(v.string()), // e.g., "5 min"
    tags: v.optional(v.array(v.string())),
    categoryId: v.string(),
    slug: v.string(),
    coverImage: v.optional(v.union(v.id("_storage"), v.null())),
    externalImage: v.optional(v.string()),
    published: v.boolean(),
  })
    .index("by_date", ["date"])
    .index("by_slug", ["slug"])
    .index("by_category", ["categoryId", "date"])
    .index("by_published", ["published", "date"]),

  // Members (Team/Founders)
  members: defineTable({
    name: v.string(),
    role: v.string(),
    bio: v.optional(v.string()),
    photo: v.optional(v.union(v.id("_storage"), v.null())),
    externalPhoto: v.optional(v.string()),
    group: v.string(), // 'Direção', 'Assembleia Geral', 'Conselho Fiscal', 'founder'
    order: v.number(),
  })
    .index("by_group", ["group", "order"]),

  // Sponsors/Partners
  sponsors: defineTable({
    name: v.string(),
    tier: v.string(), // 'gold', 'silver', 'bronze'
    logo: v.optional(v.union(v.id("_storage"), v.null())),
    externalLogo: v.optional(v.string()),
    website: v.optional(v.string()),
    active: v.boolean(),
  })
    .index("by_tier", ["tier"])
    .index("by_active", ["active"]),

  // Categories (For events and blog)
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    type: v.string(), // 'event', 'blog'
    color: v.optional(v.string()),
  })
    .index("by_slug", ["slug"])
    .index("by_name", ["name"]),

  // Event Registrations
  registrations: defineTable({
    eventId: v.id("events"),
    userId: v.optional(v.id("users")), // Optional if guest
    name: v.string(), // Main contact name
    email: v.string(), // Main contact email
    phone: v.optional(v.string()),
    customData: v.optional(v.record(v.string(), v.union(v.string(), v.number(), v.boolean()))), // Dynamic form fields for tournament registrations
    status: v.union(v.literal("pending"), v.literal("confirmed"), v.literal("cancelled")),
    timestamp: v.number(),
  })
    .index("by_event", ["eventId"])
    .index("by_event_email", ["eventId", "email"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_timestamp", ["timestamp"]),

  // Documents
  documents: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    fileId: v.optional(v.id("_storage")),
    externalUrl: v.optional(v.string()),
    category: v.string(),
    date: v.optional(v.string()),
    size: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_category", ["category"]),

  // Notifications
  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(v.literal("info"), v.literal("success"), v.literal("warning"), v.literal("urgent")),
    target: v.union(v.literal("all"), v.literal("admin"), v.literal("user")),
    read: v.boolean(),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_target", ["target"]),

  // Notification Read Status (per-user tracking)
  notificationReads: defineTable({
    notificationId: v.id("notifications"),
    userId: v.id("users"),
    readAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_notification_user", ["notificationId", "userId"]),

  // Gallery Albums
  albums: defineTable({
    title: v.string(),
    date: v.string(),
    coverId: v.optional(v.union(v.id("_storage"), v.null())),
    externalCover: v.optional(v.string()),
    description: v.optional(v.string()),
  })
    .index("by_date", ["date"]),

  // Gallery Images
  galleryImages: defineTable({
    albumId: v.id("albums"),
    storageId: v.optional(v.union(v.id("_storage"), v.null())),
    externalUrl: v.optional(v.string()),
    caption: v.optional(v.string()),
    uploadedAt: v.number(),
  })
    .index("by_album", ["albumId"]),

  // Activity Logs
  activityLogs: defineTable({
    action: v.string(),
    target: v.string(),
    description: v.string(),
    user: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_timestamp", ["timestamp"])
    .index("by_action", ["action"]),

  // Settings (Singleton-ish)
  settings: defineTable({
    siteName: v.string(),
    maintenanceMode: v.boolean(),
    contactEmail: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    currentMandate: v.optional(v.string()), // e.g., "2024-2026"
    // Identity and editorial copy (white-label: every public string that names
    // the association or its locality comes from here, never from code)
    siteFullName: v.optional(v.string()),
    locality: v.optional(v.string()),
    region: v.optional(v.string()),
    foundedYear: v.optional(v.string()),
    heroTagline: v.optional(v.string()),
    heroSubtitle: v.optional(v.string()),
    historyIntro: v.optional(v.string()),
    historyQuote: v.optional(v.string()),
    venueName: v.optional(v.string()),
    venueDescription: v.optional(v.string()),
    foundersNote: v.optional(v.string()),
    contentTone: v.optional(v.string()),
    defaultImageStyle: v.optional(v.string()),
    // AI Configuration (runtime-configurable via admin UI)
    enableChatbot: v.optional(v.boolean()),
    chatModel: v.optional(v.string()),
    chatModelFallback: v.optional(v.string()),
    imageModel: v.optional(v.string()),
    thinkingBudget: v.optional(v.number()),
    aiSystemPromptExtra: v.optional(v.string()), // Admin-customizable prompt addition
    aiAllowedTopics: v.optional(v.string()), // Comma-separated for simplicity
    aiForbiddenTopics: v.optional(v.string()), // Comma-separated
    aiGuardrailsEnabled: v.optional(v.boolean()),
    imageResolution: v.optional(v.string()), // "1k", "2k", "4k"
    // Contact & Location (runtime-configurable via admin UI)
    phone: v.optional(v.string()),
    openingHours: v.optional(v.string()),
    address: v.optional(v.string()),
    mapsUrl: v.optional(v.string()),
    latitude: v.optional(v.string()),
    longitude: v.optional(v.string()),
    // Quota payments: shown to members in the member area; all optional so
    // the UI degrades to a "contacta a direção" state when unconfigured
    quotaAmount: v.optional(v.string()), // free text, e.g. "12€ / ano"
    mbwayNumber: v.optional(v.string()),
    iban: v.optional(v.string()),
    multibancoEntity: v.optional(v.string()),
    multibancoReference: v.optional(v.string()),
    // About page content (mission paragraph + pillars grid)
    aboutMission: v.optional(v.string()),
    aboutPillars: v.optional(v.array(v.object({
      icon: v.string(), // Lucide icon name resolved client-side
      title: v.string(),
      description: v.string(),
    }))),
    // Social Media
    facebookPageId: v.optional(v.string()),
    instagramUrl: v.optional(v.string()),
    facebookAccessToken: v.optional(v.string()),
    showChatbotBubble: v.optional(v.boolean()),
    ttsModel: v.optional(v.string()),
    // AI provider selection: 'gemini' (default) | 'openrouter' | 'custom'
    // (any OpenAI-compatible endpoint, e.g. Ollama/LM Studio). Keys are
    // write-only: stripped from getPublic/getAdmin responses.
    aiProvider: v.optional(v.string()),
    openrouterApiKey: v.optional(v.string()),
    openrouterModel: v.optional(v.string()),
    customApiUrl: v.optional(v.string()),
    customApiKey: v.optional(v.string()),
    customModel: v.optional(v.string()),
  }),

  // Homepage Action Areas
  actionAreas: defineTable({
    title: v.string(),
    subtitle: v.string(),
    description: v.string(),
    longDescription: v.string(),
    features: v.array(v.string()),
    image: v.optional(v.union(v.id("_storage"), v.null())),
    externalImage: v.optional(v.string()),
    iconName: v.string(), // Name of the Lucide icon
    order: v.number(),
  }).index("by_order", ["order"]),

  // History Page Timeline (editable milestones)
  milestones: defineTable({
    year: v.number(),
    title: v.string(),
    description: v.string(),
    image: v.optional(v.union(v.id("_storage"), v.null())),
    externalImage: v.optional(v.string()),
    order: v.number(),
  }).index("by_order", ["order"]),

  // Homepage / Site Stats
  stats: defineTable({
    label: v.string(),
    value: v.string(),
    order: v.number(),
  }).index("by_order", ["order"])
    .index("by_label", ["label"]),

  // Sponsor Tiers
  sponsorTiers: defineTable({
    name: v.string(), // gold, silver, bronze
    price: v.string(),
    benefits: v.array(v.string()),
    order: v.number(),
    color: v.optional(v.string()), // Gradient class for styling
    textColor: v.optional(v.string()), // Text color class
  }).index("by_order", ["order"]),

  // Contact Form Submissions
  contactSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    message: v.string(),
    timestamp: v.number(),
    status: v.union(v.literal("pending"), v.literal("replied"), v.literal("archived")),
  }).index("by_timestamp", ["timestamp"]),

  // Sponsorship/Partnership Requests
  sponsorshipRequests: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    tier: v.string(),
    timestamp: v.number(),
    status: v.union(v.literal("pending"), v.literal("contacted"), v.literal("confirmed"), v.literal("rejected")),
  }).index("by_timestamp", ["timestamp"]),

  // Rate Limits (for AI action throttling)
  rateLimits: defineTable({
    key: v.string(),
    tokens: v.number(),
    lastRefill: v.number(),
  }).index("by_key", ["key"]),

  // AI Usage Logs (analytics tracking)
  aiUsageLogs: defineTable({
    userId: v.string(),
    action: v.string(), // "chat", "tts", "generateImage", "enhanceText", "geoQuery"
    model: v.string(),
    classification: v.optional(v.string()), // "ASSOCIACAO", "LOCAL", "GERAL", "FORA_DE_TEMA", "INJECTION"
    latencyMs: v.number(),
    success: v.boolean(),
    errorMessage: v.optional(v.string()),
    timestamp: v.number(),
  }).index("by_timestamp", ["timestamp"]).index("by_action", ["action"]).index("by_user", ["userId"]),
});
