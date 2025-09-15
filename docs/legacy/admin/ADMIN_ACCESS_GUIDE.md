# Admin Access Guide (Legacy - Redacted)

This document previously contained plaintext demo credentials and referenced Supabase-based admin access. It has been archived and redacted for security and because the project has migrated to Clerk + Convex.

## Current Status

- Authentication: Clerk
- Database: Convex
- Admin portals: Protected by Clerk roles and application logic

## How to access admin portals now

1. Use Clerk to create or assign roles to admin users (via the Clerk Dashboard or seeding script).
2. Log in via the standard sign-in page at `/sign-in`.
3. Users are routed to the appropriate portal based on role metadata.

For details on admin roles and structure, see:
- `docs/admin/ADMIN_STRUCTURE.md`

For development/testing accounts, refer to the team's internal procedures or use the Clerk Dashboard to create test users. Do not store plaintext passwords in documentation.

If you need to seed test users locally, see:
- `scripts/seed-clerk-test-users.js`

Security note: Do not commit credentials or secrets to the repository. Use environment variables and Clerk Dashboard for secure management.
