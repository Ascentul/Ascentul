# Convex Users Module Layout

- `convex/users_core.ts`: shared helpers (`resolveProfileImageUrl`, `logRoleChange`, `getActingUser`) used across user mutations/queries.
- `convex/users_queries.ts`: user read endpoints (by Clerk ID, admin lists, university-scoped lists, onboarding progress).
- `convex/users_subscriptions.ts`: subscription and Stripe-related mutations (`setStripeCustomer`, `updateSubscriptionByIdentifier`).
- `convex/users_profile.ts`: user lifecycle and profile mutations (`createUser`/`createUserFromClerk`, `updateUser`, `updateUserById`, `deleteUser` stub).
- `convex/users_onboarding.ts`: onboarding progress and UI preferences (`updateOnboardingProgress`, `toggleHideProgressCard`).
- `convex/users.ts`: re-exports all public user functions so external imports remain unchanged.
- `convex/universities_admin.ts`: university CRUD and lifecycle (create, list, update, toggle test, archive/restore, hard delete, deprecated delete).
- `convex/universities_assignments.ts`: assigning universities to users and university-admin settings updates.
- `convex/universities_queries.ts`: university lookups and admin counts (by id/slug, settings for current user, admin count map).
- `convex/universities.ts`: re-exports all university functions for existing import paths.
- `convex/students_all.ts`: full students module (actions, mutations, queries, helpers) preserved as-is; `convex/students.ts` now re-exports it to keep import paths minimal.
