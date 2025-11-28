# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Auth**: Clerk (JWT-based authentication)
- **Database**: Convex (realtime, typed queries/mutations)
- **UI**: Tailwind CSS + Radix UI components
- **Payments**: Clerk Billing (integrated with Stripe)
- **AI**: OpenAI API (resume analysis, career coaching)
- **Email**: SendGrid + Mailgun

## Development Commands

```bash
# Development
npm run dev                    # Start Next.js dev server (localhost:3000)
npm run build                  # Production build
npm run start                  # Start production server
npm run lint                   # Run ESLint
npm run type-check             # TypeScript type checking

# Testing
npm test                       # Run Jest tests
npm run test:watch             # Run tests in watch mode
npm run test:coverage          # Generate coverage report
npm run test:ci                # CI test run

# Seeding/Scripts
npm run seed:clerk             # Seed test users in Clerk
npm run sync:convex:roles      # Sync user roles to Convex
npm run seed:university        # Create university and assign users
npm run set:subscription       # Set subscription status in Convex
```

## Environment Setup

Copy `.env.example` to `.env.local` and configure:

**Required:**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_JWT_ISSUER_DOMAIN` (Clerk Dashboard)
- `NEXT_PUBLIC_CONVEX_URL` (Convex deployment)

**Optional:**
- `OPENAI_API_KEY` (AI features)
- `CLERK_WEBHOOK_SECRET` (Clerk webhooks for subscription sync)
- `SENDGRID_API_KEY`, `MAILGUN_SENDING_API_KEY` (email)

⚠️ **Do not add Supabase or Stripe Payment Link variables** - project uses Clerk Billing.

## Clerk Billing Configuration

The app uses **Clerk Billing** for premium subscriptions (Stripe integration managed by Clerk).

### Setup in Clerk Dashboard

1. **Enable Billing:**
   - Go to Clerk Dashboard → Billing Settings
   - Click "Finish setup" and connect your Stripe account

2. **Create Plan:**
   - Go to Plans → "Plans for Users"
   - Create plan with key: `premium_monthly`
   - Name: "Premium Monthly" (or any display name)
   - Enable both monthly and annual billing options:
     - Monthly: $30.00/month
     - Annual: $240.00/year (billed as $20/month)

3. **Configure Webhook:**
   - Go to Webhooks → Add Endpoint
   - URL: `https://yourdomain.com/api/clerk/webhook`
   - Subscribe to events: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret and set `CLERK_WEBHOOK_SECRET` in environment

### How It Works

1. **Pricing Page**: `/pricing` shows Clerk's `<PricingTable />` component
2. **Payment**: Clerk handles checkout, processes payment via Stripe
3. **Webhook**: Clerk sends `user.updated` event with subscription data in `publicMetadata`
4. **Sync**: Webhook handler syncs subscription to Convex (cached display data)
5. **Feature Gating**: Uses Clerk `publicMetadata` as source of truth via `useSubscription()` hook
6. **Admin Display**: Shows cached Convex fields for fast loading

### Subscription Data Architecture

```
Clerk Billing (Source of Truth - user.publicMetadata)
  ↓ user.updated webhook
Convex (Cached Display: subscription_plan, subscription_status)
  ↑ query for admin UIs
Admin Pages (Display Only)

Clerk publicMetadata
  ↓ useSubscription() hook
Feature Gating (Access Control)
```

## Architecture

### Authentication & Authorization
- **Clerk** handles authentication via JWT tokens
- **Clerk `publicMetadata.role`** is the source of truth for all authorization (see [Roles & Permissions](#roles--permissions) for details)
- Middleware (`src/middleware.ts`) protects routes and enforces role-based redirects:
  - Regular users → `/dashboard`
  - `super_admin`/`admin` → `/admin`
  - `university_admin` → `/university`
- Auth config: `convex/auth.config.ts` integrates Clerk JWT with Convex

### Database (Convex)
- Schema: `convex/schema.ts` defines all tables with typed validators
- Functions organized by domain: `convex/users.ts`, `convex/applications.ts`, etc.
- Use `useQuery()` for reads, `useMutation()` for writes
- All data access goes through Convex - **no direct database calls**

### Key Tables
- `users`: Core user profiles with roles, subscription status, university affiliation
- `universities`: Institutional licensing with seat limits
- `applications`: Job application tracking with status workflow
- `resumes`, `cover_letters`: Career documents
- `goals`, `projects`, `networking_contacts`: Career development tools
- `support_tickets`: Help desk system
- `ai_coach_conversations`, `ai_coach_messages`: AI coaching chat history

### Advisor-Student Relationships (TECH DEBT)

**WARNING**: There are currently TWO tables for advisor-student relationships. See `docs/TECH_DEBT_ADVISOR_STUDENT_TABLES.md` for full details.

| Table | Used By | When to Use |
|-------|---------|-------------|
| `student_advisors` | Advisor module | New advisor features, caseload, sessions |
| `advisorStudents` | University admin | Bulk roster management (until consolidated) |

**Guidelines until consolidation**:
- New advisor features should use `student_advisors`
- University admin bulk operations use `advisorStudents`
- When querying "all advisors for a student", check both tables

### App Structure (Next.js App Router)
- `src/app/(auth)/`: Sign-in/sign-up flows
- `src/app/(dashboard)/`: Protected routes for regular users
  - `dashboard/`: Main dashboard
  - `applications/`, `resumes/`, `cover-letters/`: Career tools
  - `goals/`, `projects/`, `contacts/`: Professional development
  - `account/`: User settings
- `src/app/(dashboard)/admin/`: Super admin panel
- `src/app/(dashboard)/university/`: University admin panel
- `src/app/api/`: API routes (Stripe webhooks, file uploads, etc.)

### Roles & Permissions

**IMPORTANT: Clerk `publicMetadata.role` is the source of truth for all authorization.**

#### Available Roles

- **`super_admin`**: Full platform access - manage all users, universities, system settings, audit logs
- **`university_admin`**: University-scoped admin - manage students and settings for assigned university only
- **`advisor`**: University advisor - view and assist students within assigned university
- **`student`**: University-affiliated user with career tools access (auto university subscription)
- **`individual`**: Non-university user with free or premium subscription
- **`staff`**: Internal staff member with support access
- **`user`**: Legacy role (being migrated to `individual`)

#### Role Management Architecture

```
Role Change Flow:
Admin Action → Clerk publicMetadata.role (Source of Truth)
                    ↓ webhook (user.updated)
              Convex users.role (Cached for Display)

Authorization Checks:
Page Component → Reads clerkUser.publicMetadata.role ✅
Admin UI Display → Reads convexUser.role (display only) 📊
```

**Key Principles:**
- ✅ Set roles in Clerk Dashboard or via Clerk API
- ✅ Authorization checks use `clerkUser.publicMetadata.role`
- ✅ Convex `users.role` is cached for display and queries only
- ❌ Never manually update Convex role without updating Clerk
- ❌ Never use Convex role for authorization decisions

#### Managing Roles

**Option 1: Via Admin UI (Recommended)**
1. Go to `/admin/settings` → "User Roles" tab
2. Find user in role management table
3. Click "Change Role" and select new role
4. System updates Clerk and syncs to Convex automatically

**Option 2: Via Clerk Dashboard**
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Users → Find user → Public Metadata
3. Add/update: `{"role": "super_admin"}`
4. Webhook automatically syncs to Convex

**Option 3: Programmatically**
```typescript
import { clerkClient } from '@clerk/nextjs/server'

const client = await clerkClient()
await client.users.updateUserMetadata(userId, {
  publicMetadata: { role: 'super_admin' }
})
// Webhook will automatically sync to Convex
```

#### Making Someone Super Admin

To grant super admin access:
1. Update Clerk `publicMetadata.role` to `"super_admin"` (via Dashboard or API)
2. Webhook syncs to Convex automatically
3. User must log out and back in for changes to take effect
4. Verify access at `/admin`

#### Role Validation Rules

- `student`, `university_admin`, `advisor`: Require `university_id`
- `individual`: Should NOT have `university_id`
- Cannot remove last super admin
- Role changes logged in audit trail

#### Troubleshooting Role Issues

**User can't access admin pages:**
→ Check Clerk `publicMetadata.role` (not Convex role)
→ Go to `/admin/settings` → "User Roles" → "Role Diagnostics"
→ Enter user email to check role sync status

**Role mismatch between Clerk and Convex:**
→ Use "Role Diagnostics" tool to detect and fix
→ Recommended: Sync from Convex to Clerk
→ Webhook will automatically sync back to Convex

**Bulk role sync needed:**
→ Run: `npx convex run admin/syncRolesToClerk:syncAllRolesToClerk --clerkId YOUR_CLERK_ID --dryRun true`
→ Review changes, then run without `--dryRun` flag

#### Role Features & Access

| Feature | super_admin | university_admin | advisor | student | individual |
|---------|-------------|------------------|---------|---------|------------|
| Platform Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| All Users Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| University Management | ✅ | ✅ (own) | ❌ | ❌ | ❌ |
| Student Management | ✅ | ✅ (own) | ✅ (assigned) | ❌ | ❌ |
| Platform Analytics | ✅ | ❌ | ❌ | ❌ | ❌ |
| University Analytics | ✅ | ✅ (own) | ✅ (own) | ❌ | ❌ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |
| Career Tools | ✅ | ✅ | ✅ | ✅ | ✅ |

#### Protected Routes

- `/admin/*` → `super_admin` only
- `/university/*` → `university_admin`, `advisor`
- `/dashboard/*` → All authenticated users
- `/applications/*`, `/resumes/*`, `/goals/*` → All authenticated users

### TypeScript Paths
```typescript
@/*           → ./src/*
@/components  → ./src/components/*
@/lib         → ./src/lib/*
@/utils       → ./src/utils/*
@/types       → ./src/types/*
@/styles      → ./src/styles/*
convex/*      → ./convex/*
```

### Styling & Design System

**Modern Rounded Dashboard Shell:**
The app uses a floating rounded shell design with clean, modern SaaS styling:
- Light neutral background (`bg-neutral-100`) for entire viewport
- Content and sidebar inside one large rounded white shell (`rounded-shell`, `shadow-card`)
- Inner content area with slightly tinted surface (`bg-neutral-100/60`)
- All cards use `rounded-card` with `shadow-card`

**Brand Colors:**
- Primary brand: `#5371FF` (use `bg-primary-500`, `text-primary-500`)
- Primary hover: `bg-primary-700`
- Neutral grays: `neutral-100/300/500/700/900` for UI elements
- Semantic colors: `success-500`, `warning-500`, `danger-500`

**Border Radius Tokens:**
- `rounded-shell`: 24px (outer app shell, main containers)
- `rounded-card`: 18px (inner cards, panels)
- `rounded-control`: 999px (pills, buttons, inputs)

**Component Library:**
- Radix UI primitives in `src/components/ui/`
- AppShell: `src/components/AppShell.tsx` - wraps all authenticated pages
- PageHeader: `src/components/ui/page-header.tsx` - standardized page headers
- Card: Updated with default padding and rounded corners
- Button: Uses `rounded-control` and new primary colors

**Navigation:**
- Active nav items: `bg-neutral-900 text-white`
- Inactive nav items: `text-neutral-700 hover:bg-neutral-100`
- Responsive design: Mobile-first with drawer navigation on mobile

## Common Patterns

### Convex Queries/Mutations
```typescript
// In component
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";

const data = useQuery(api.moduleName.functionName, { args });
const mutation = useMutation(api.moduleName.mutationName);
```

### Auth in Components
```typescript
import { useUser } from "@clerk/nextjs";

const { user, isLoaded } = useUser();
const userRole = user?.publicMetadata?.role;
```

### Auth in API Routes
```typescript
import { auth } from "@clerk/nextjs/server";

const { userId } = await auth();
if (!userId) return new Response("Unauthorized", { status: 401 });
```

## University Lifecycle Management

### University Statuses
Universities can have the following statuses:
- `trial`: University in trial period
- `active`: Fully active university with paid license
- `expired`: License has expired
- `suspended`: Temporarily suspended by admin
- `archived`: Non-destructively disabled (preferred for real universities)
- `deleted`: Hard deleted (only for test universities)

### Safe Lifecycle Operations

**Archive (Preferred for Real Universities):**
```typescript
await archiveUniversity({ universityId })
```
- **Non-destructive**: Preserves all data (users, applications, goals, metrics)
- University becomes inactive and stops appearing in active lists
- Can be restored if needed
- Counts toward "total universities all time" metric but not "active"

**Hard Delete (Test Universities Only):**
```typescript
await hardDeleteUniversity({ universityId })
```
- **Destructive**: Permanently removes university and related data
- Only allowed for universities marked as `is_test: true`
- Deletes: university record, memberships, student profiles, invitations, departments, courses
- Unlinks users (sets `university_id` to null, marks as test users)
- Clears `university_id` from applications/goals but preserves records
- Real universities are protected by guard - will throw error directing to use archive

**Toggle Test Status:**
```typescript
await toggleTestUniversity({ universityId, isTest: boolean })
```
- Marks university as test or production
- Test universities are automatically excluded from investor metrics
- Use this before hard deleting a university for cleanup

### Investor-Facing Metrics

Centralized metrics in `convex/metrics.ts`:

```typescript
// Single query for all metrics
const metrics = await getAllMetrics({})

// Or individual queries
const totalUniversities = await getTotalUniversitiesAllTime({})
const activeUniversities = await getActiveUniversitiesCurrent({})
const archivedUniversities = await getArchivedUniversities({})
const totalUsers = await getTotalUsersAllTime({})
const activeUsers = await getActiveUsers30d({})
```

**Metric Definitions:**
- `totalUniversitiesAllTime`: Real universities with status in (trial, active, archived)
- `activeUniversitiesCurrent`: Real universities with status in (trial, active)
- `archivedUniversities`: Real universities with status = archived
- `totalUsersAllTime`: All non-test, non-internal users ever created
- `activeUsers30d`: Non-test users who logged in within 30 days, on active/trial universities

**Automatic Exclusions:**
- Test universities (`is_test = true`) never appear in metrics
- Test users (`is_test_user = true`) never appear in metrics
- Internal users (`role = "super_admin"`) never appear in metrics

### Dev Sanity Check

Verify lifecycle and metrics are working correctly:
```bash
npx convex run dev/checkMetrics:runSanityCheck --clerkId YOUR_CLERK_ID
```

This creates test data, performs operations, and validates that:
- Test universities are excluded from metrics
- Real universities count correctly
- Archive removes from active but keeps in total
- Hard delete is blocked for real universities
- Hard delete works for test universities

## Testing

- Jest configured (`jest.config.js`, `jest.setup.js`)
- Convex tests disabled (see `convex/__tests_disabled__/` - compatibility issues documented)
- Run single test: `npx jest path/to/test.spec.ts`

## Important Notes

- **No Supabase**: All legacy Supabase code is archived in `docs/legacy/supabase/`
- **Documentation**: Keep new docs in `docs/`, archive deprecated content in `docs/legacy/`
- **Scripts**: Utility scripts in `scripts/` for seeding, syncing roles, etc.
- **Protected Routes**: Always check middleware config when adding new protected routes
- **University Features**: University admins can only manage users within their `university_id`

## Deployment

- Vercel recommended (configured via `vercel.json`)
- Set all env vars in hosting provider
- Configure Stripe webhook endpoint: `/api/stripe/webhook`
- Convex deployment: Use `CONVEX_DEPLOYMENT` env var or deploy via `npx convex deploy`

---

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
