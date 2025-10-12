# Repository Guidelines

## Project Structure & Module Organization
Source lives under `src/`, with App Router pages in `src/app` and shared UI in `src/components`. Reusable state logic stays in `src/providers`, `src/contexts`, and `src/hooks`. Convex backend modules sit in `convex/`, while documentation belongs in `docs/` (legacy material in `docs/legacy/`). Place tests in `src/__tests__`, automation in `scripts/`, and static assets in `public/`.

## Build, Test, and Development Commands
Use `npm run dev` for local development, `npm run build` to compile the Next.js bundle, and `npm run start` to verify the production build. Quality gates include `npm run lint`, `npm run type-check`, and `npm run test` (CI mode: `npm run test:ci`, coverage: `npm run test:coverage`). Seed mock data with `npm run seed:clerk`, `npm run seed:university`, and sync Convex roles via `npm run sync:convex:roles` after `.env.local` is configured.

## Coding Style & Naming Conventions
Follow the default Next.js + ESLint rules: 2-space indentation, single quotes, and trailing commas. Write React components in PascalCase, hooks prefixed with `use`, and utilities in camelCase. Prefer Tailwind utility classes inline; reserve `src/styles` for global styles. Reuse `zod` validators from `src/utils` and colocate Convex modules beside their schemas.

## Testing Guidelines
Tests rely on Jest with `@testing-library/react`. Mirror feature paths under `src/__tests__/*.test.tsx` for UI and `*.test.ts` for helpers. Keep suites deterministic, seed mocks via `__mocks__/`, and ensure new behavior ships with assertions. Run `npm run test` locally before submitting; add coverage checks when logic expands.

## Commit & Pull Request Guidelines
Write commits in imperative mood (e.g., `Fix Convex auth config`) under 70 characters, adding bodies only for extra context. Reference tickets with `Fixes #123`. Pull requests should include what changed and why, list manual or automated test evidence, flag environment or migration steps, and attach screenshots for UI updates. Mention any documentation edits in `docs/` so reviewers track knowledge updates.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` and provide Clerk, Convex, and Stripe secrets locally only. Never commit keys or seeded production data. Use Convex/Clerk mocks when testing email or upload flows instead of adding artifacts to `public/`, and inject API keys via runtime configuration rather than hardcoding.
