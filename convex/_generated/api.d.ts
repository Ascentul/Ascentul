/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as achievements from "../achievements.js";
import type * as admin_users from "../admin_users.js";
import type * as ai_coach from "../ai_coach.js";
import type * as analytics from "../analytics.js";
import type * as applications from "../applications.js";
import type * as avatar from "../avatar.js";
import type * as builder_blocks from "../builder_blocks.js";
import type * as builder_exports from "../builder_exports.js";
import type * as builder_exports_v2 from "../builder_exports_v2.js";
import type * as builder_resumes from "../builder_resumes.js";
import type * as builder_resumes_v2 from "../builder_resumes_v2.js";
import type * as builder_templates from "../builder_templates.js";
import type * as builder_templates_v2 from "../builder_templates_v2.js";
import type * as builder_themes from "../builder_themes.js";
import type * as builder_themes_v2 from "../builder_themes_v2.js";
import type * as career_paths from "../career_paths.js";
import type * as contact_interactions from "../contact_interactions.js";
import type * as contacts from "../contacts.js";
import type * as cover_letters from "../cover_letters.js";
import type * as debug from "../debug.js";
import type * as devSeed from "../devSeed.js";
import type * as email from "../email.js";
import type * as followups from "../followups.js";
import type * as goals from "../goals.js";
import type * as interviews from "../interviews.js";
import type * as jobs from "../jobs.js";
import type * as migrations_updateTemplatePreviews from "../migrations/updateTemplatePreviews.js";
import type * as migrations from "../migrations.js";
import type * as password_reset from "../password_reset.js";
import type * as platform_settings from "../platform_settings.js";
import type * as profiles from "../profiles.js";
import type * as projects from "../projects.js";
import type * as recommendations from "../recommendations.js";
import type * as resumes from "../resumes.js";
import type * as stripe from "../stripe.js";
import type * as support_tickets from "../support_tickets.js";
import type * as templates from "../templates.js";
import type * as themes from "../themes.js";
import type * as universities from "../universities.js";
import type * as university_admin from "../university_admin.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";
import type * as utils_auth from "../utils/auth.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  admin_users: typeof admin_users;
  ai_coach: typeof ai_coach;
  analytics: typeof analytics;
  applications: typeof applications;
  avatar: typeof avatar;
  builder_blocks: typeof builder_blocks;
  builder_exports: typeof builder_exports;
  builder_exports_v2: typeof builder_exports_v2;
  builder_resumes: typeof builder_resumes;
  builder_resumes_v2: typeof builder_resumes_v2;
  builder_templates: typeof builder_templates;
  builder_templates_v2: typeof builder_templates_v2;
  builder_themes: typeof builder_themes;
  builder_themes_v2: typeof builder_themes_v2;
  career_paths: typeof career_paths;
  contact_interactions: typeof contact_interactions;
  contacts: typeof contacts;
  cover_letters: typeof cover_letters;
  debug: typeof debug;
  devSeed: typeof devSeed;
  email: typeof email;
  followups: typeof followups;
  goals: typeof goals;
  interviews: typeof interviews;
  jobs: typeof jobs;
  "migrations/updateTemplatePreviews": typeof migrations_updateTemplatePreviews;
  migrations: typeof migrations;
  password_reset: typeof password_reset;
  platform_settings: typeof platform_settings;
  profiles: typeof profiles;
  projects: typeof projects;
  recommendations: typeof recommendations;
  resumes: typeof resumes;
  stripe: typeof stripe;
  support_tickets: typeof support_tickets;
  templates: typeof templates;
  themes: typeof themes;
  universities: typeof universities;
  university_admin: typeof university_admin;
  usage: typeof usage;
  users: typeof users;
  "utils/auth": typeof utils_auth;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
