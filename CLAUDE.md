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
- `user`: Regular free/premium users
- `university_admin`: Manages students within their university
- `admin`/`super_admin`: Platform-wide administration

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
- Light neutral background (`bg-app-bg` / `#F1F3F9`) for entire viewport
- Content and sidebar inside one large rounded white shell (`rounded-shell`, `shadow-card`)
- Inner content area with slightly tinted surface (`bg-neutral-100/60`)
- All cards use `rounded-card` with `shadow-card`

**Brand Colors:**
- Primary brand: `#4257FF` (use `bg-primary-500`, `text-primary-500`) - WCAG AA compliant (4.51:1 contrast)
- Primary hover: `bg-primary-700`
- Neutral grays: `neutral-100/300/500/700/900` for UI elements
- Semantic colors: `success-500`, `warning-500`, `danger-500`

**Border Radius Tokens:**
- `rounded-shell`: 24px (outer app shell, main containers)
- `rounded-card`: 18px (inner cards, panels)
- `rounded-control`: 999px (pills, buttons, inputs)

**Component Library:**
- Radix UI primitives in `src/components/ui/`
- Layout: `src/components/Layout.tsx` - wraps all authenticated pages with mobile-responsive navigation
- Sidebar: `src/components/Sidebar.tsx` - collapsible navigation with mobile drawer support
- PageHeader: `src/components/ui/page-header.tsx` - standardized page headers
- Card: Base component with rounded corners and default `p-6` padding (override with `p-0` if needed)
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
