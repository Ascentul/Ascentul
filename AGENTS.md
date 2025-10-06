# Repository Guidelines

## Project Structure & Module Organization
Next.js App Router code lives in `src/app`, with shared UI in `src/components` and state helpers in `src/providers`, `src/contexts`, and `src/hooks`. Convex data logic stays under `convex/`, while project docs belong in `docs/` (legacy material in `docs/legacy/`). Tests go in `src/__tests__`, automation scripts in `scripts/`, and static assets in `public/`.

## Build, Test, and Development Commands
Run `npm run dev` for local development, `npm run build` to compile, and `npm run start` to smoke-test the build. Guard quality with `npm run lint`, `npm run type-check`, and the Jest suite via `npm run test` or `npm run test:ci` (coverage: `npm run test:coverage`). Seed data through `npm run seed:clerk`, `npm run seed:university`, or `npm run sync:convex:roles` once `.env.local` is populated.

## Coding Style & Naming Conventions
Rely on the default Next.js + ESLint formatting: 2-space indentation, single quotes, and trailing commas. Use `PascalCase` for React components, `useCamelCase` for hooks, and `camelCase` for utilities. Favor Tailwind utilities directly in components, reserving `src/styles` for globals, and colocate Convex modules with their schema files while reusing `zod` validators from `src/utils`.

## Testing Guidelines
Jest with `@testing-library` covers UI and API flows; mirror features with `src/__tests__/*.test.tsx` and backend helpers with `*.test.ts`. Prefer RTL queries, reuse fixtures in `__mocks__/`, and keep suites deterministic so `npm run test:ci` passes clean. Add assertions for every behavioral change and track coverage with `npm run test:coverage`.

## Commit & Pull Request Guidelines
Write commits as short, imperative summaries (e.g., `Fix Convex auth config`), keeping subjects under ~70 characters and adding bodies only when extra context helps. Reference issues with `Fixes #123`. PRs should state what changed and why, list manual or automated test evidence, flag env or migration steps, attach screenshots for UI updates, and mention any documentation edits in `docs/`.

## Environment & Security
Copy `.env.example` to `.env.local` and fill Clerk, Convex, and Stripe secrets—never commit real keys or production data. Use the existing Convex/Clerk mocks when exercising email or upload flows instead of dropping artifacts in `public/`. Inject API keys through runtime config rather than literals.
