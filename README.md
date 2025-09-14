# Ascentul Next.js Migration

This is the Next.js version of the Ascentul career development platform, migrated from Express + Vite + React to solve framework issues while preserving the exact UI.

## Migration Benefits

- **Eliminates port conflicts** - Single server for dev and production
- **Fixes API routing issues** - Built-in Next.js API routes replace custom Express routing
- **Solves deployment problems** - Seamless Vercel deployment
- **Better authentication** - NextAuth.js with Supabase integration
- **Type-safe APIs** - End-to-end type safety
- **Improved developer experience** - Hot reload that actually works

## Quick Start

1. **Copy environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Fill in your actual values from the original project.

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Open [http://localhost:3000](http://localhost:3000)**

## Migration Status

### ✅ Completed
- [x] Next.js 14 project setup with app directory
- [x] Tailwind CSS configuration (exact same styling)
- [x] Package.json with all dependencies
- [x] NextAuth.js with Supabase integration
- [x] Basic project structure

### 🚧 In Progress
- [ ] React components migration (preserving exact UI)
- [ ] Express API routes → Next.js API routes
- [ ] Database operations migration

### 📋 Todo
- [ ] UI component testing (must match exactly)
- [ ] Vercel deployment setup
- [ ] Migration documentation

## Key Files

- `src/app/layout.tsx` - Root layout with global styles
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth configuration
- `src/lib/supabase.ts` - Supabase client setup
- `tailwind.config.ts` - Exact same Tailwind config as original

## Environment Variables

Copy all environment variables from your original `.env` file to `.env.local` in this directory.

## Deployment

This project is configured for seamless Vercel deployment:

```bash
npm run build
```

## UI Preservation

The migration preserves the exact same UI by:
- Using identical Tailwind configuration
- Copying CSS variables and theme settings
- Maintaining component structure and styling
- Preserving all animations and interactions

## Test Billing Webhooks (Stripe CLI)

Use these commands to test Stripe Payment Links and subscription webhooks locally. The webhook endpoint in this project is `src/app/api/stripe/webhook/route.ts`.

1. Login to Stripe CLI

```bash
stripe login
```

2. Start the dev server and forward events to your local webhook

```bash
# In another terminal, forward key subscription events to your local endpoint
stripe listen \
  --events checkout.session.completed,customer.subscription.created,customer.subscription.updated,customer.subscription.deleted \
  --forward-to http://localhost:3000/api/stripe/webhook

# Optional: export the signing secret for local signature verification
export STRIPE_WEBHOOK_SECRET=$(stripe listen --print-secret)
# Restart your dev server to pick up the env var
```

3. Trigger a test checkout.session.completed

Replace the email with a known user in Convex, and the Clerk ID with that user’s Clerk ID (to help the webhook match the user):

```bash
export TEST_EMAIL="user@example.com"
export TEST_CLERK_ID="user_2abc123def456"

stripe trigger checkout.session.completed \
  --override 'data.object.customer_details.email='"$TEST_EMAIL" \
  --override 'data.object.client_reference_id='"$TEST_CLERK_ID" \
  --override 'data.object.mode="subscription"' \
  --override 'data.object.subscription="sub_test_123"'
```

4. Simulate subscription status changes

```bash
stripe trigger customer.subscription.updated \
  --override 'data.object.status="past_due"'

stripe trigger customer.subscription.deleted
```

Production setup:
- Create a webhook endpoint in Stripe to `https://YOUR_DOMAIN/api/stripe/webhook`.
- Subscribe to: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.
- Set `STRIPE_WEBHOOK_SECRET` in production environment.