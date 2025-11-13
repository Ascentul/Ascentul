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
   # Unix/Linux/macOS/PowerShell:
   npx convex run migrations:backfillStudentRoles '{"dryRun": true}'
   # Windows Command Prompt (cmd.exe):
   npx convex run migrations:backfillStudentRoles "{\"dryRun\": true}"

   # Execute migration
   # Unix/Linux/macOS/PowerShell:
   npx convex run migrations:backfillStudentRoles '{"dryRun": false}'
   # Windows Command Prompt (cmd.exe):
   npx convex run migrations:backfillStudentRoles "{\"dryRun\": false}"
   ```
3. Enable feature flag in `.env.local`:
   ```
   NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE=true
   ```
   **Note:** Changing `NEXT_PUBLIC_*` environment variables requires restarting the dev server (`npm run dev`) or rebuilding for production (`npm run build`)

### Testing the Student Invite Flow

**Step 1: Create a Student Invite (as University Admin)**

**Production Usage (Recommended):**

Use the `createInvite` action which handles token generation securely using cryptographically secure `crypto.randomBytes()`:

```typescript
// From React component with useAction
const createInvite = useAction(api.students.createInvite);

const result = await createInvite({
  universityId: universityId, // Id<"universities">
  email: "student@example.edu",
  createdByClerkId: currentUser.id, // Clerk ID of university admin
  expiresInDays: 7, // Optional, defaults to 7
  metadata: {
    // Optional: Pre-populate student profile fields
    // These values are applied to the studentProfile when the invite is accepted
    student_id: "STU123456", // University student ID
    major: "Computer Science",
    year: "Junior",
  },
});

// Returns: { inviteId, token, expiresAt }
// Send the token to the student via email
```

**❌ SECURITY WARNING: Never Create Invites Manually**

**DO NOT** insert studentInvites records directly via `ctx.db.insert()`. This bypasses critical security features:
- ❌ Skips cryptographically secure token generation (crypto.randomBytes)
- ❌ Bypasses email validation and normalization
- ❌ Ignores rate limiting (50 invites/hour/admin)
- ❌ Misses uniqueness checks (duplicate invite prevention)
- ❌ Bypasses optimistic concurrency control (race condition protection)
- ❌ No authorization validation (university admin verification)

**Always use the `createInvite` action** (shown above) which implements all security measures.

**Race Condition Mitigation**

The invite creation flow uses optimistic concurrency control to prevent duplicate invites:
1. **Pre-check**: Query for existing pending invite (fast path - catches most duplicates)
2. **Insert**: Create new invite
3. **Post-verification**: Re-query to detect concurrent inserts
4. **Conflict resolution**: If duplicates detected, keep oldest and delete newer ones

This approach handles the race window where concurrent requests can both pass the pre-check. Monitoring:
```bash
# Check for any duplicate pending invites
npx convex run students:detectDuplicateInvites
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
- Verify feature flag is set to the string `"true"` (not `"false"`, `"1"`, or any other value)
  - Environment variables are always strings in Node.js/Next.js
  - The code checks `process.env.NEXT_PUBLIC_ENABLE_STUDENT_ORG_BADGE === "true"`
- Verify student has `role: "student"` and `university_id` set
- Confirm `studentProfiles` record exists for the user
- Check browser console for errors

**Invite acceptance fails?**
- Verify token hasn't expired (`expires_at > Date.now()`)
- Check email matches between invite and Clerk account
- Ensure invite status is `"pending"` (not already accepted)
- Confirm university exists in `universities` table
- Check Convex logs for detailed error messages (including capacity checks, rollback operations)

**Role not updating?**
- Run migration again with `dryRun: false`
- Check Clerk `publicMetadata.role` matches Convex `users.role`
- Clear browser cache and sign out/in again

### Production Monitoring

**Known Limitation: Race Conditions**

Due to Convex's lack of unique constraints, duplicate student profiles are theoretically possible (though extremely rare with current mitigations). Set up periodic monitoring:

```bash
# Check for duplicate profiles (run weekly or daily)
npx convex run students:findDuplicateProfiles

# Check for invite acceptance issues
npx convex run students:findDuplicateInviteAcceptances
```

**Expected output (healthy system):**
```json
{
  "duplicatesFound": false,
  "count": 0,
  "duplicates": [],
  "cleanupInstructions": null
}
```

**If duplicates found:**

The output will show affected users with their `userId`. Use the automated cleanup mutation to safely remove duplicates:

```bash
# Cleanup duplicates for a specific user
npx convex run students:cleanupDuplicateProfiles --userId "user-id-from-output"
```

**Cleanup process:**
1. Review the `duplicates` array in `findDuplicateProfiles` output
2. For each affected user, run the cleanup mutation with their `userId`
3. The mutation will:
   - Keep the oldest profile (by `created_at`)
   - Delete all newer duplicate profiles
   - Return a detailed report of deletions
4. Re-run `findDuplicateProfiles` to verify cleanup
5. Test affected student accounts to ensure badge still displays

**Example cleanup workflow:**
```bash
# Step 1: Find duplicates
npx convex run students:findDuplicateProfiles

# Step 2: Output shows duplicates for user jkv4..., run cleanup
npx convex run students:cleanupDuplicateProfiles --userId "jkv4..."

# Step 3: Verify cleanup succeeded
npx convex run students:findDuplicateProfiles
# Should now show: "duplicatesFound": false
```

**Automated Monitoring:**

A daily cron job runs at 2 AM UTC to automatically detect duplicates:

```typescript
// convex/crons.ts - Scheduled monitoring
crons.daily(
  "monitor duplicate profiles",
  { hourUTC: 2, minuteUTC: 0 },
  internal.students.monitorDuplicateProfiles
);
```

**Alert response workflow:**
1. Check Convex logs daily for monitoring alerts
2. If alert found: `🚨 ALERT: Duplicate student profiles detected!`
3. Logs will include cleanup commands for each affected user
4. Run provided cleanup commands
5. If duplicates are frequent, investigate root cause

**Manual monitoring:**
```bash
# Check for duplicates on-demand
npx convex run students:findDuplicateProfiles

# Check logs for race condition warnings
# Search Convex logs for: "Race condition detected"
```

## Deployment

- Vercel recommended
- Set env vars for Clerk, Convex, and Stripe in the hosting provider
- Configure Stripe webhook to `/api/stripe/webhook` if using billing

## License

Proprietary — All rights reserved.
