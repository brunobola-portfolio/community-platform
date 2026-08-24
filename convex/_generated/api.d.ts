/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as actionAreas from "../actionAreas.js";
import type * as activityLogs from "../activityLogs.js";
import type * as ai from "../ai.js";
import type * as aiLogs from "../aiLogs.js";
import type * as aiProviderTools from "../aiProviderTools.js";
import type * as albums from "../albums.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_actionAuth from "../lib/actionAuth.js";
import type * as lib_aiContext from "../lib/aiContext.js";
import type * as lib_aiDefaults from "../lib/aiDefaults.js";
import type * as lib_aiProvider from "../lib/aiProvider.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_bootstrapAdmin from "../lib/bootstrapAdmin.js";
import type * as lib_cascade from "../lib/cascade.js";
import type * as lib_cleanupTestUsers from "../lib/cleanupTestUsers.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_validation from "../lib/validation.js";
import type * as maintenance from "../maintenance.js";
import type * as memberProfiles from "../memberProfiles.js";
import type * as members from "../members.js";
import type * as migrations from "../migrations.js";
import type * as milestones from "../milestones.js";
import type * as mockData from "../mockData.js";
import type * as notifications from "../notifications.js";
import type * as posts from "../posts.js";
import type * as registrations from "../registrations.js";
import type * as seed from "../seed.js";
import type * as seedHelpers from "../seedHelpers.js";
import type * as settings from "../settings.js";
import type * as setup from "../setup.js";
import type * as sponsorTiers from "../sponsorTiers.js";
import type * as sponsors from "../sponsors.js";
import type * as sponsorshipRequests from "../sponsorshipRequests.js";
import type * as stats from "../stats.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  actionAreas: typeof actionAreas;
  activityLogs: typeof activityLogs;
  ai: typeof ai;
  aiLogs: typeof aiLogs;
  aiProviderTools: typeof aiProviderTools;
  albums: typeof albums;
  auth: typeof auth;
  categories: typeof categories;
  contact: typeof contact;
  crons: typeof crons;
  documents: typeof documents;
  events: typeof events;
  files: typeof files;
  http: typeof http;
  "lib/actionAuth": typeof lib_actionAuth;
  "lib/aiContext": typeof lib_aiContext;
  "lib/aiDefaults": typeof lib_aiDefaults;
  "lib/aiProvider": typeof lib_aiProvider;
  "lib/auth": typeof lib_auth;
  "lib/bootstrapAdmin": typeof lib_bootstrapAdmin;
  "lib/cascade": typeof lib_cascade;
  "lib/cleanupTestUsers": typeof lib_cleanupTestUsers;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/validation": typeof lib_validation;
  maintenance: typeof maintenance;
  memberProfiles: typeof memberProfiles;
  members: typeof members;
  migrations: typeof migrations;
  milestones: typeof milestones;
  mockData: typeof mockData;
  notifications: typeof notifications;
  posts: typeof posts;
  registrations: typeof registrations;
  seed: typeof seed;
  seedHelpers: typeof seedHelpers;
  settings: typeof settings;
  setup: typeof setup;
  sponsorTiers: typeof sponsorTiers;
  sponsors: typeof sponsors;
  sponsorshipRequests: typeof sponsorshipRequests;
  stats: typeof stats;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
