# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Stack

- **Framework**: Next.js 14 (App Router, TypeScript)
- **Auth**: Clerk (JWT-based authentication)
- **Database**: Convex (realtime, typed queries/mutations)
- **UI**: Tailwind CSS + Radix UI components
- **Payments**: Stripe (Payment Links + Webhooks)
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
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` (payments)
- `SENDGRID_API_KEY`, `MAILGUN_SENDING_API_KEY` (email)

⚠️ **Do not add Supabase variables** - project has migrated to Clerk + Convex.

## Stripe Payment Links Configuration

The app uses Stripe Payment Links for premium subscriptions during onboarding. To configure:

1. **Create Payment Links in Stripe Dashboard:**
   - Go to Stripe Dashboard → Payment Links
   - Create a Monthly payment link ($9.99/month)
   - Create an Annual payment link ($99/year)

2. **Configure Success URL:**
   - For each payment link, set the success URL to: `https://yourdomain.com/onboarding`
   - This ensures users are redirected back to complete onboarding after payment

3. **Set Environment Variables:**
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY` = Monthly payment link URL
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ANNUAL` = Annual payment link URL

4. **How it works:**
   - New users select a plan during onboarding → redirected to Stripe Payment Link
   - After successful payment → Stripe webhook updates subscription status
   - Webhook automatically sets `onboarding_completed: true` for premium users
   - Success URL redirects user back to `/onboarding`
   - OnboardingFlow detects active premium subscription and skips plan selection
   - User completes remaining onboarding steps (education, dream job)

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

### Styling
- Tailwind with custom brand colors: `bg-primary` (base: `#0C29AB`), `bg-primary-700` for hover
- Component library: Radix UI primitives in `src/components/ui/`
- Responsive design: Mobile-first approach

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
