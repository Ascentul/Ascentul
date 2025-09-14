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
import type * as applications from "../applications.js";
import type * as career_paths from "../career_paths.js";
import type * as contacts from "../contacts.js";
import type * as cover_letters from "../cover_letters.js";
import type * as followups from "../followups.js";
import type * as goals from "../goals.js";
import type * as interviews from "../interviews.js";
import type * as jobs from "../jobs.js";
import type * as projects from "../projects.js";
import type * as resumes from "../resumes.js";
import type * as support_tickets from "../support_tickets.js";
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
  applications: typeof applications;
  career_paths: typeof career_paths;
  contacts: typeof contacts;
  cover_letters: typeof cover_letters;
  followups: typeof followups;
  goals: typeof goals;
  interviews: typeof interviews;
  jobs: typeof jobs;
  projects: typeof projects;
  resumes: typeof resumes;
  support_tickets: typeof support_tickets;
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
