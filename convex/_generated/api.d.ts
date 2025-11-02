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
import type * as agent from "../agent.js";
import type * as ai_coach from "../ai_coach.js";
import type * as analytics from "../analytics.js";
import type * as applications from "../applications.js";
import type * as avatar from "../avatar.js";
import type * as career_paths from "../career_paths.js";
import type * as contact_interactions from "../contact_interactions.js";
import type * as contacts from "../contacts.js";
import type * as cover_letters from "../cover_letters.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as followups from "../followups.js";
import type * as goals from "../goals.js";
import type * as interviews from "../interviews.js";
import type * as jobs from "../jobs.js";
import type * as lib_pii_redaction from "../lib/pii-redaction.js";
import type * as lib_user_resolution from "../lib/user-resolution.js";
import type * as maintenance from "../maintenance.js";
import type * as migrations from "../migrations.js";
import type * as password_reset from "../password_reset.js";
import type * as platform_settings from "../platform_settings.js";
import type * as projects from "../projects.js";
import type * as recommendations from "../recommendations.js";
import type * as resumes from "../resumes.js";
import type * as support_tickets from "../support_tickets.js";
import type * as universities from "../universities.js";
import type * as university_admin from "../university_admin.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";

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
  agent: typeof agent;
  ai_coach: typeof ai_coach;
  analytics: typeof analytics;
  applications: typeof applications;
  avatar: typeof avatar;
  career_paths: typeof career_paths;
  contact_interactions: typeof contact_interactions;
  contacts: typeof contacts;
  cover_letters: typeof cover_letters;
  crons: typeof crons;
  email: typeof email;
  followups: typeof followups;
  goals: typeof goals;
  interviews: typeof interviews;
  jobs: typeof jobs;
  "lib/pii-redaction": typeof lib_pii_redaction;
  "lib/user-resolution": typeof lib_user_resolution;
  maintenance: typeof maintenance;
  migrations: typeof migrations;
  password_reset: typeof password_reset;
  platform_settings: typeof platform_settings;
  projects: typeof projects;
  recommendations: typeof recommendations;
  resumes: typeof resumes;
  support_tickets: typeof support_tickets;
  universities: typeof universities;
  university_admin: typeof university_admin;
  usage: typeof usage;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
