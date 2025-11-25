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
import type * as activity from "../activity.js";
import type * as admin_syncRolesToClerk from "../admin/syncRolesToClerk.js";
import type * as admin_users from "../admin_users.js";
import type * as admin_users_actions from "../admin_users_actions.js";
import type * as ai_coach from "../ai_coach.js";
import type * as analytics from "../analytics.js";
import type * as applications from "../applications.js";
import type * as audit_logs from "../audit_logs.js";
import type * as avatar from "../avatar.js";
import type * as career_paths from "../career_paths.js";
import type * as contact_interactions from "../contact_interactions.js";
import type * as contacts from "../contacts.js";
import type * as cover_letters from "../cover_letters.js";
import type * as crons from "../crons.js";
import type * as dev_checkMetrics from "../dev/checkMetrics.js";
import type * as email from "../email.js";
import type * as followups from "../followups.js";
import type * as goals from "../goals.js";
import type * as interviews from "../interviews.js";
import type * as investor_metrics from "../investor_metrics.js";
import type * as jobs from "../jobs.js";
import type * as lib_roleValidation from "../lib/roleValidation.js";
import type * as lib_roles from "../lib/roles.js";
import type * as metrics from "../metrics.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as password_reset from "../password_reset.js";
import type * as platform_settings from "../platform_settings.js";
import type * as projects from "../projects.js";
import type * as recommendations from "../recommendations.js";
import type * as resumes from "../resumes.js";
import type * as roleValidation from "../roleValidation.js";
import type * as students from "../students.js";
import type * as support_tickets from "../support_tickets.js";
import type * as universities from "../universities.js";
import type * as university_admin from "../university_admin.js";
import type * as usage from "../usage.js";
import type * as users from "../users.js";
import type * as viewer from "../viewer.js";

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
  activity: typeof activity;
  "admin/syncRolesToClerk": typeof admin_syncRolesToClerk;
  admin_users: typeof admin_users;
  admin_users_actions: typeof admin_users_actions;
  ai_coach: typeof ai_coach;
  analytics: typeof analytics;
  applications: typeof applications;
  audit_logs: typeof audit_logs;
  avatar: typeof avatar;
  career_paths: typeof career_paths;
  contact_interactions: typeof contact_interactions;
  contacts: typeof contacts;
  cover_letters: typeof cover_letters;
  crons: typeof crons;
  "dev/checkMetrics": typeof dev_checkMetrics;
  email: typeof email;
  followups: typeof followups;
  goals: typeof goals;
  interviews: typeof interviews;
  investor_metrics: typeof investor_metrics;
  jobs: typeof jobs;
  "lib/roleValidation": typeof lib_roleValidation;
  "lib/roles": typeof lib_roles;
  metrics: typeof metrics;
  migrations: typeof migrations;
  notifications: typeof notifications;
  password_reset: typeof password_reset;
  platform_settings: typeof platform_settings;
  projects: typeof projects;
  recommendations: typeof recommendations;
  resumes: typeof resumes;
  roleValidation: typeof roleValidation;
  students: typeof students;
  support_tickets: typeof support_tickets;
  universities: typeof universities;
  university_admin: typeof university_admin;
  usage: typeof usage;
  users: typeof users;
  viewer: typeof viewer;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
