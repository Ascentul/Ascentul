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
import type * as applications from "../applications.js";
import type * as contacts from "../contacts.js";
import type * as cover_letters from "../cover_letters.js";
import type * as followups from "../followups.js";
import type * as goals from "../goals.js";
import type * as interviews from "../interviews.js";
import type * as jobs from "../jobs.js";
import type * as projects from "../projects.js";
import type * as resumes from "../resumes.js";
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
  applications: typeof applications;
  contacts: typeof contacts;
  cover_letters: typeof cover_letters;
  followups: typeof followups;
  goals: typeof goals;
  interviews: typeof interviews;
  jobs: typeof jobs;
  projects: typeof projects;
  resumes: typeof resumes;
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
