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
- Template Previews (optional): `NEXT_PUBLIC_PREVIEW_BASE_URL` (for remote CDN hosting)

### Debug & Development

- `NEXT_PUBLIC_DEBUG_UI='1'` - Enable debug panel and verbose logging
  - **Debug Panel**: Press `Cmd/Ctrl + Backtick` to toggle the debug overlay
  - Shows resume state (document ID, page count, selected block, template, theme, last AI action, last save time)
  - **Telemetry**: Events logged to browser console with `[telemetry]` prefix
  - **Error Details**: Shows detailed error messages and stack traces when errors occur
  - See `docs/editor.md` for complete debug feature documentation

### Resume Builder V2 Rollout

- `NEXT_PUBLIC_RESUME_V2_STORE='true'` - Enable Resume Builder V2 features
- `NEXT_PUBLIC_V2_ROLLOUT_PERCENT='25'` - Percentage of users to enable (0-100)

**Rollout schedule:**
1. Week 1: 5% (internal team + early adopters)
2. Week 2: 25% (monitor error rates and metrics)
3. Week 3: 50% (if metrics look good)
4. Week 4: 100% (GA)

**Monitoring:**
- Error rates: <1% of sessions
- Export success rate: >95%
- Layout switch completion: >80%
- AI suggestion apply rate: >40%

See `CHANGELOG.md` and `docs/QA_CHECKLIST.md` for full details.

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

## Template Preview System

The resume builder uses preview images for template selection. Two options are available:

### Local Previews (Default)

Place PNG files in `public/previews/`:
- `modern-clean.png` (340x440px)
- `modern-two-col.png`
- `grid-compact.png`
- `timeline.png`
- `minimal-serif.png`
- `product-designer.png`

See `public/previews/README.md` for image specifications and creation guide.

### Remote Previews (CDN/Storage)

Configure environment variable:
```bash
NEXT_PUBLIC_PREVIEW_BASE_URL=https://your-cdn.com/previews
```

The system will automatically construct URLs: `{base}/{template-slug}.png`

**Setup for remote hosting:**
1. Upload preview PNGs to your storage (S3, Supabase Storage, Cloudflare R2, etc.)
2. Add domain to `next.config.js` if needed:
   ```js
   images: {
     remotePatterns: [
       {
         protocol: 'https',
         hostname: 'your-cdn.com',
         pathname: '/previews/**',
       },
     ],
   }
   ```
3. Ensure bucket is publicly accessible (CORS configuration is only required for client-side fetch operations or canvas manipulation)

**Troubleshooting:**
- Images not showing? Check `public/previews/` exists and files match template slugs exactly
- Test direct URL: `http://localhost:3000/previews/modern-clean.png` should return 200
- For remote images: Verify remotePatterns in next.config.js and public bucket access
- Run tests: `npm test TemplatePicker`

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
