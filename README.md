# Ascentul

Modern career development platform built with Next.js App Router, Clerk authentication, and Convex database.

## Stack

- Framework: Next.js 14 (App Router, TypeScript)
- Auth: Clerk
- Database + Realtime: Convex
- UI: Tailwind CSS
- Payments: Stripe (Payment Links + Webhooks)

## Quick Start

1. Copy env file and fill in values

```bash
cp .env.example .env.local
```

2. Install dependencies

```bash
npm install
```

3. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

## Environment

Fill these keys in `.env.local` (see `.env.example`):

- Clerk: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Convex: `CONVEX_DEPLOYMENT`, `CONVEX_SITE_URL` (as needed)
- Stripe (optional features): `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, plus price/payment-link variables if used

Do not add Supabase variables—this project has fully migrated to Clerk + Convex.

## Documentation

The documentation has moved under `docs/` to keep the project root clean. Start here:

- Docs Hub: `docs/README.md`
  - Admin: `docs/admin/ADMIN_STRUCTURE.md`
  - Product: `docs/product/FEATURE_AUDIT.md`
  - QA: `docs/qa/CAREER_APP_BUG_CHECKLIST.md`
  - Migration (Next.js): `docs/migration/nextjs/`
  - Legacy (historical): `docs/legacy/`

Supabase-related guides are archived under `docs/legacy/supabase/` and retained for historical reference only.

## Development Notes

- Use Clerk hooks and middleware for route protection
- Use Convex queries and mutations for all data access (see `convex/`)
- Keep new documentation in `docs/`; mark deprecated content under `docs/legacy/`
- Tailwind brand color utilities: use `bg-primary`, `text-primary`, with shades like `bg-primary-700` for hover (primary base `#0C29AB`)

## Student Invite System Validation

The platform now distinguishes **individuals** from **students** at both data and UI layers. Students must belong to a university and see their university name in the dashboard.

### Prerequisites

1. Deploy schema changes to Convex (includes `studentProfiles` and `studentInvites` tables)
2. Run migration to backfill existing users:
   ```bash
   # Dry run (test mode)
   npx convex run migrations:backfillStudentRoles '{"dryRun": true}'

   # Execute migration
   npx convex run migrations:backfillStudentRoles '{"dryRun": false}'
   ```
3. Enable feature flag in `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE=true
   ```

### Testing the Student Invite Flow

**Step 1: Create a Student Invite (as University Admin)**

Use the university admin panel or directly insert into Convex:

```javascript
// In Convex dashboard or mutation
await ctx.db.insert("studentInvites", {
  university_id: "<university-id>",
  email: "student@example.edu",
  token: "unique-random-token-123",
  created_by_id: "<admin-user-id>",
  status: "pending",
  expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
  metadata: {
    major: "Computer Science",
    year: "Junior",
  },
  created_at: Date.now(),
  updated_at: Date.now(),
})
```

**Step 2: Validate Token**

Query to check invite validity:

```typescript
// In your React component
const inviteValidation = useQuery(api.students.validateInviteToken, {
  token: "unique-random-token-123"
})

// Returns: { valid: true, email: "...", universityName: "...", expiresAt: ... }
```

**Step 3: Accept Invite**

The student signs up and accepts the invite:

```typescript
// After student creates Clerk account
const result = await acceptInvite({
  token: "unique-random-token-123",
  clerkId: user.id,
})

// Returns: { success: true, universityName: "...", studentProfileId: "..." }
```

**Step 4: Verify Student Dashboard**

1. Student logs in → should see university badge in sidebar (top left, below logo)
2. Badge displays: `🏫 [University Name]`
3. Student role is now `"student"` (not `"user"`)
4. `studentProfiles` record exists with `university_id` link

### Validation Checklist

- [ ] Schema deployed with `studentProfiles` and `studentInvites` tables
- [ ] Migration executed: legacy "user" roles converted to "individual" or "student"
- [ ] Feature flag `NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE=true` set
- [ ] Student invite created in database
- [ ] Token validation returns correct university name
- [ ] Student can accept invite after signup
- [ ] Student sees university badge in sidebar
- [ ] `viewer.getViewer` returns `{ role: "student", student: { universityName } }`
- [ ] No console errors or loading flickers

### Troubleshooting

**Badge not showing?**
- Check feature flag is set to `"true"` (string, not boolean)
- Verify student has `role: "student"` and `university_id` set
- Confirm `studentProfiles` record exists for the user
- Check browser console for errors

**Invite acceptance fails?**
- Verify token hasn't expired (`expires_at > Date.now()`)
- Check email matches between invite and Clerk account
- Ensure invite status is `"pending"` (not already accepted)
- Confirm university exists in `universities` table

**Role not updating?**
- Run migration again with `dryRun: false`
- Check Clerk `publicMetadata.role` matches Convex `users.role`
- Clear browser cache and sign out/in again

## Deployment

- Vercel recommended
- Set env vars for Clerk, Convex, and Stripe in the hosting provider
- Configure Stripe webhook to `/api/stripe/webhook` if using billing

## License

Proprietary — All rights reserved.
