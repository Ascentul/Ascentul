# Convex Security Hardening Notes

- Convex is now the source of truth for `role` and `university_id`; Clerk public metadata is treated as a mirror only.
- `convex/users` entry points now require authenticated ctx (or the new `CONVEX_INTERNAL_SERVICE_TOKEN` for trusted server calls). Privileged roles cannot be created via client payloads, and role/university updates require super admin or tenant-scoped admins.
- User list/read/update flows (`getUserByClerkId`, onboarding toggles, subscription updates, admin create/regenerate flows) enforce ctx.auth identity and tenant guards; spoofed `clerkId` inputs are rejected.
- University admin and analytics queries now gate on authenticated super admins (or scoped admins where appropriate) instead of caller-supplied IDs.
- Clerk webhook and admin API routes set Convex auth, update Convex first, and only mirror changes to Clerk. Client-side role auto-sync from Clerk metadata was removed to avoid overwriting Convex authority.
- New server-to-server guard: set `CONVEX_INTERNAL_SERVICE_TOKEN` in the environment for Clerk webhooks to call Convex mutations/queries without a user identity. This token is required for webhook-driven Convex writes.
