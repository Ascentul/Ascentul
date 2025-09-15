# Ascentul Next.js Migration Guide

## Overview

This migration moves Ascentul from Express + Vite + React to Next.js 14 to solve critical framework issues while preserving the exact UI.

## Problems Solved

### Current Issues
- **Port conflicts**: Express server conflicts on port 3002
- **Database schema errors**: Missing `needsUsername` column causing crashes
- **Complex routing**: Custom `[...all].js` catch-all routing is fragile
- **Authentication complexity**: Manual Supabase auth with session management issues
- **Deployment problems**: Complex Express + Vite deployment pipeline
- **API route errors**: Missing endpoints causing "API route not found" errors

### Next.js Solutions
- **Single server**: No more port conflicts
- **Built-in API routes**: Reliable `/api` routing
- **NextAuth.js**: Proper Supabase authentication
- **Vercel deployment**: Zero-config deployment
- **Type safety**: End-to-end TypeScript support

## Migration Steps

### 1. Setup (✅ Complete)
```bash
cd /Users/asvirts/dev/Ascentul/nextjs-migration
cp .env.example .env.local
# Copy your actual environment variables from the original project
npm install
```

### 2. Environment Variables
Copy these from your original `.env` file to `.env.local`:
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secret
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
```

### 3. Component Migration Strategy

#### UI Components (Preserve Exactly)
- Copy all components from `src/frontend/components/` 
- Replace `wouter` imports with Next.js `useRouter` and `Link`
- Update path aliases (`@/` already configured)
- Keep all Tailwind classes identical

#### Pages Migration
- `src/frontend/pages/` → `src/app/` (App Router)
- Convert page components to Next.js page structure
- Maintain exact same UI and functionality

### 4. API Routes Migration

#### Current Express Routes → Next.js API Routes
```
src/backend/routes.ts → src/app/api/*/route.ts
```

Key routes to migrate:
- `/api/auth/*` → NextAuth.js (✅ Done)
- `/api/jobs/*` → `src/app/api/jobs/route.ts`
- `/api/cover-letters/*` → `src/app/api/cover-letters/route.ts`
- `/api/projects/*` → `src/app/api/projects/route.ts`
- `/api/support/*` → `src/app/api/support/route.ts`

### 5. Database Schema Fix

The current error shows missing `needsUsername` column. In Next.js version:
- Use proper Supabase migrations
- Fix schema inconsistencies
- Implement proper RLS policies

### 6. Testing Checklist

Before switching to Next.js version:
- [ ] All pages render identically
- [ ] Authentication works (sign in/up/out)
- [ ] API routes respond correctly
- [ ] Database operations work
- [ ] UI components match exactly
- [ ] Mobile responsiveness preserved
- [ ] All animations work

## Running the Migration

### Development
```bash
npm run dev
# Opens on http://localhost:3000 (no port conflicts!)
```

### Production Build
```bash
npm run build
npm start
```

### Deployment
```bash
# Deploy to Vercel (zero config)
vercel --prod
```

## Key Differences

### Routing
- **Before**: Wouter with `useLocation`, `Link` from wouter
- **After**: Next.js with `useRouter`, `Link` from next/link

### Authentication  
- **Before**: Manual Supabase auth with custom session management
- **After**: NextAuth.js with Supabase adapter

### API Routes
- **Before**: Express routes in single file with complex routing
- **After**: Individual Next.js API route files

### File Structure
```
nextjs-migration/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   ├── sign-in/         # Auth pages
│   │   └── api/             # API routes
│   ├── components/          # React components (same as before)
│   ├── lib/                 # Utilities
│   └── styles/              # CSS (identical to original)
```

## Benefits After Migration

1. **Reliability**: No more port conflicts or routing issues
2. **Performance**: Better optimization and caching
3. **Developer Experience**: Hot reload that works, better debugging
4. **Deployment**: Seamless Vercel deployment
5. **Maintenance**: Simpler codebase, fewer moving parts
6. **Scalability**: Better handling of concurrent users

## Rollback Plan

If issues arise:
1. Keep original codebase intact
2. Can switch back immediately
3. Gradual migration possible (run both versions)

## Next Steps

1. Copy environment variables to `.env.local`
2. Run `npm install && npm run dev`
3. Test basic functionality
4. Migrate components one by one
5. Test UI matches exactly
6. Deploy to Vercel