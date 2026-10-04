/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as access from "../access.js";
import type * as actionAreas from "../actionAreas.js";
import type * as activityLogs from "../activityLogs.js";
import type * as ai from "../ai.js";
import type * as aiLogs from "../aiLogs.js";
import type * as aiMedia from "../aiMedia.js";
import type * as aiProviderTools from "../aiProviderTools.js";
import type * as aiStudio from "../aiStudio.js";
import type * as aiStudioInfo from "../aiStudioInfo.js";
import type * as aiText from "../aiText.js";
import type * as albums from "../albums.js";
import type * as auth from "../auth.js";
import type * as categories from "../categories.js";
import type * as contact from "../contact.js";
import type * as crons from "../crons.js";
import type * as documents from "../documents.js";
import type * as events from "../events.js";
import type * as files from "../files.js";
import type * as http from "../http.js";
import type * as lib_accessRules from "../lib/accessRules.js";
import type * as lib_actionAuth from "../lib/actionAuth.js";
import type * as lib_aiContext from "../lib/aiContext.js";
import type * as lib_aiCost from "../lib/aiCost.js";
import type * as lib_aiDefaults from "../lib/aiDefaults.js";
import type * as lib_aiImage from "../lib/aiImage.js";
import type * as lib_aiProvider from "../lib/aiProvider.js";
import type * as lib_aiShared from "../lib/aiShared.js";
import type * as lib_aiStudioDates from "../lib/aiStudioDates.js";
import type * as lib_aiStudioDraft from "../lib/aiStudioDraft.js";
import type * as lib_aiStudioPrompts from "../lib/aiStudioPrompts.js";
import type * as lib_aiStudioText from "../lib/aiStudioText.js";
import type * as lib_aiUsageStats from "../lib/aiUsageStats.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_cascade from "../lib/cascade.js";
import type * as lib_cleanupTestUsers from "../lib/cleanupTestUsers.js";
import type * as lib_keyHash from "../lib/keyHash.js";
import type * as lib_openRouterRequest from "../lib/openRouterRequest.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_referenceUrl from "../lib/referenceUrl.js";
import type * as lib_registrationRules from "../lib/registrationRules.js";
import type * as lib_shareHtml from "../lib/shareHtml.js";
import type * as lib_text from "../lib/text.js";
import type * as lib_time from "../lib/time.js";
import type * as lib_tokenBucket from "../lib/tokenBucket.js";
import type * as lib_uploads from "../lib/uploads.js";
import type * as lib_validation from "../lib/validation.js";
import type * as maintenance from "../maintenance.js";
import type * as memberProfiles from "../memberProfiles.js";
import type * as members from "../members.js";
import type * as milestones from "../milestones.js";
import type * as mockData from "../mockData.js";
import type * as notifications from "../notifications.js";
import type * as platform from "../platform.js";
import type * as posts from "../posts.js";
import type * as registrations from "../registrations.js";
import type * as seed from "../seed.js";
import type * as seedHelpers from "../seedHelpers.js";
import type * as settings from "../settings.js";
import type * as setup from "../setup.js";
import type * as share from "../share.js";
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
  access: typeof access;
  actionAreas: typeof actionAreas;
  activityLogs: typeof activityLogs;
  ai: typeof ai;
  aiLogs: typeof aiLogs;
  aiMedia: typeof aiMedia;
  aiProviderTools: typeof aiProviderTools;
  aiStudio: typeof aiStudio;
  aiStudioInfo: typeof aiStudioInfo;
  aiText: typeof aiText;
  albums: typeof albums;
  auth: typeof auth;
  categories: typeof categories;
  contact: typeof contact;
  crons: typeof crons;
  documents: typeof documents;
  events: typeof events;
  files: typeof files;
  http: typeof http;
  "lib/accessRules": typeof lib_accessRules;
  "lib/actionAuth": typeof lib_actionAuth;
  "lib/aiContext": typeof lib_aiContext;
  "lib/aiCost": typeof lib_aiCost;
  "lib/aiDefaults": typeof lib_aiDefaults;
  "lib/aiImage": typeof lib_aiImage;
  "lib/aiProvider": typeof lib_aiProvider;
  "lib/aiShared": typeof lib_aiShared;
  "lib/aiStudioDates": typeof lib_aiStudioDates;
  "lib/aiStudioDraft": typeof lib_aiStudioDraft;
  "lib/aiStudioPrompts": typeof lib_aiStudioPrompts;
  "lib/aiStudioText": typeof lib_aiStudioText;
  "lib/aiUsageStats": typeof lib_aiUsageStats;
  "lib/auth": typeof lib_auth;
  "lib/cascade": typeof lib_cascade;
  "lib/cleanupTestUsers": typeof lib_cleanupTestUsers;
  "lib/keyHash": typeof lib_keyHash;
  "lib/openRouterRequest": typeof lib_openRouterRequest;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/referenceUrl": typeof lib_referenceUrl;
  "lib/registrationRules": typeof lib_registrationRules;
  "lib/shareHtml": typeof lib_shareHtml;
  "lib/text": typeof lib_text;
  "lib/time": typeof lib_time;
  "lib/tokenBucket": typeof lib_tokenBucket;
  "lib/uploads": typeof lib_uploads;
  "lib/validation": typeof lib_validation;
  maintenance: typeof maintenance;
  memberProfiles: typeof memberProfiles;
  members: typeof members;
  milestones: typeof milestones;
  mockData: typeof mockData;
  notifications: typeof notifications;
  platform: typeof platform;
  posts: typeof posts;
  registrations: typeof registrations;
  seed: typeof seed;
  seedHelpers: typeof seedHelpers;
  settings: typeof settings;
  setup: typeof setup;
  share: typeof share;
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
