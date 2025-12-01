# Ascentful Coding Standards

*Last updated: December 2025*

## 0. Review Council and Ownership

**Purpose:** Ensure coding standards and linting rules are consistent, secure, and aligned with product needs.

**Council Members:**
- Head of Engineering (chair, final sign-off)
- Lead Backend Engineer
- Lead Frontend Engineer
- Head of Security and Privacy
- Head of AI and Prompt Quality (for AI and evaluation related code)
- Data and Analytics Lead

**Change Process:**
- Minor changes (typos, clarifications): Can be made by any council member after a second member reviews
- Substantive changes (new rules, relaxed security, changed testing expectations): Require approval from Head of Engineering AND Head of Security and Privacy

---

## 1. Tech Stack

These standards assume:
- **Framework:** Next.js 14 with React and TypeScript
- **Backend:** Convex for data access and real-time queries
- **Auth:** Clerk (JWT-based authentication)
- **Styling:** Tailwind CSS + Radix UI components
- **Hosting:** Vercel

---

## 2. Core Principles

1. **Prefer clarity over cleverness** - Code should be readable by any team member
2. **Strong typing everywhere** - No `any` types without explicit justification
3. **Single source of truth** - Domain logic lives in one place
4. **Accessible by default** - UI components must be keyboard and screen-reader friendly
5. **Safe deployments** - Every change should be easy to deploy and roll back

---

## 3. TypeScript Standards

### Configuration
- `strict` mode is **always enabled** in `tsconfig.json`
- Do not disable TypeScript checks at the project level

### Type Usage
```typescript
// ❌ Avoid any
const data: any = fetchData();

// ✅ Use unknown and narrow
const data: unknown = fetchData();
if (isUserData(data)) {
  // data is now typed as UserData
}
```

### Non-null Assertions
- Do not use `!` non-null assertions unless absolutely necessary
- If used, add a comment explaining why

### Types vs Interfaces
```typescript
// ✅ Prefer types for most cases
type UserRole = 'student' | 'advisor' | 'admin';

type UserProps = {
  name: string;
  role: UserRole;
};

// ✅ Use interface for contracts that must be extended
interface BaseEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}
```

### Shared Types
- Export shared types from central modules:
  - `convex/schema.ts` for database types
  - `src/types/` for domain types

---

## 4. React and Next.js Standards

### Components
- Use **functional components and hooks only**
- All components must be typed:

```typescript
type PageTitleProps = {
  title: string;
  subtitle?: string;
};

export function PageTitle({ title, subtitle }: PageTitleProps) {
  return (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
```

### Hooks
- Custom hooks live in `src/hooks/`
- Names must start with `use`
- Return simple, predictable values

### Side Effects
```typescript
// ❌ Don't use useEffect for data transforms
useEffect(() => {
  setFilteredData(data.filter(item => item.active));
}, [data]);

// ✅ Use useMemo for derived state
const filteredData = useMemo(
  () => data.filter(item => item.active),
  [data]
);
```

### Data Fetching
- Use server components for server-side data fetching where possible
- Keep Convex queries and mutations in clearly named hooks, not inline in JSX

---

## 5. Convex Backend Standards

### File Organization
All Convex functions live under `convex/` grouped by domain:
- `convex/users.ts`
- `convex/applications.ts`
- `convex/goals.ts`

### Function Structure
```typescript
import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser, requireRole } from './lib/auth';

export const getUserById = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Validate auth at the top
    const currentUser = await requireUser(ctx);

    // Business logic
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
});
```

### Error Handling
- Throw typed errors with consistent messages for expected failures
- Never leak internal details or stack traces to the client

### Security
- **All authenticated functions must validate identity and role at the top**
- Use helper utilities: `requireUser`, `requireRole('advisor')`, `requireSuperAdmin`

---

## 6. Styling and Tailwind

### Utility-First
- Use Tailwind utility classes, not custom CSS
- Exceptions: global resets, very reusable layout primitives

### Design Tokens
- Never inline arbitrary values when a token exists
- Use design tokens for brand colors: `bg-primary-500`, `text-primary-500`

### Class Organization
Keep class strings readable and sorted by category:
```tsx
<div className={cn(
  // Layout
  'flex flex-col gap-4 p-6',
  // Typography
  'text-sm font-medium',
  // Colors
  'bg-white text-slate-900',
  // Borders
  'rounded-xl border border-slate-200',
  // Effects
  'shadow-sm hover:shadow-md',
)}>
```

### Shared Components
- Extract reusable UI into `src/components/ui/`
- Don't duplicate patterns across components

---

## 7. File and Folder Naming

### Folders
- Use `kebab-case` for frontend folders
- Use `snake_case` only where required by tooling

### Components
- One component per file
- File name matches component name:
  - `src/components/advisor/AdvisorDashboard.tsx` → `AdvisorDashboard`

### Tests
- Place tests next to the file under test
- Use `.test.ts` or `.test.tsx` extension

---

## 8. Testing Standards

### Required Unit Tests
- Core domain logic
- Critical Convex functions
- Utility functions (parsers, formatters, calculators)

### React Component Tests
- Cover important interaction paths
- Test edge cases and regressions

### Mocking
- Mock network and Convex calls
- Never hit real services in unit tests

---

## 9. Import Ordering

Imports are automatically sorted by `eslint-plugin-simple-import-sort`:

```typescript
// 1. React/Next.js
import { useState, useEffect } from 'react';
import Link from 'next/link';

// 2. Third-party packages
import { format } from 'date-fns';
import { motion } from 'framer-motion';

// 3. Absolute imports (aliases)
import { api } from 'convex/_generated/api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// 4. Relative imports
import { useLocalState } from './hooks';
import type { Props } from './types';
```

---

## 10. Linting and Formatting

### ESLint
Configuration in `.eslintrc.json` enforces:
- TypeScript best practices
- React hooks rules
- Accessibility requirements
- Import ordering
- Security patterns

### Prettier
Configuration in `.prettierrc`:
- Single quotes
- Trailing commas
- 100 character line width
- 2 space indentation

### Scripts
```bash
npm run lint          # Quick lint check
npm run lint:strict   # Strict lint (zero warnings allowed)
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format all files
npm run format:check  # Check formatting
npm run validate      # Full validation (types + lint + format)
```

### Pre-commit Hooks
Husky + lint-staged automatically runs on every commit:
- ESLint with auto-fix
- Prettier formatting

---

## 11. CI/CD Integration

Every PR must pass:
```bash
npm run validate  # Type-check + strict lint + format check
npm run test      # Unit tests
```

Builds fail on any ESLint errors or type errors.

---

## 12. Accessibility (a11y)

### Requirements
- All interactive elements must be keyboard accessible
- Images require alt text
- Form inputs require labels
- Color contrast must meet WCAG AA

### Enforcement
- `eslint-plugin-jsx-a11y` enforces common a11y patterns
- Use semantic HTML elements
- Test with keyboard navigation

---

## Quick Reference

| Topic | Rule |
|-------|------|
| TypeScript | `strict: true`, no `any` |
| Components | Functional only, typed props |
| Hooks | `use` prefix, in `hooks/` folder |
| Styling | Tailwind utilities, no inline CSS |
| Naming | kebab-case folders, PascalCase components |
| Tests | `.test.ts` next to source file |
| Imports | Auto-sorted by plugin |
| Commits | Pre-commit hook runs lint + format |
