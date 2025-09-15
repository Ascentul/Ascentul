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

## Deployment

- Vercel recommended
- Set env vars for Clerk, Convex, and Stripe in the hosting provider
- Configure Stripe webhook to `/api/stripe/webhook` if using billing

## License

Proprietary — All rights reserved.
