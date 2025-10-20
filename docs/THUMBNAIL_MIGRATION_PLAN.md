# Resume Thumbnail Storage Migration Plan

## Problem Statement

The current implementation stores base64-encoded PNG thumbnails in `thumbnailDataUrl` field, which leads to significant scalability issues:

### Current Issues

1. **Database Bloat**
   - Base64 encoding increases data size by ~33%
   - 800px PNG thumbnails typically range from 50-150KB
   - With base64 encoding: **67-200KB per resume**
   - At scale (10,000 resumes): **670MB - 2GB** of database storage just for thumbnails

2. **Performance Impact**
   - Resume list queries fetch all thumbnails unnecessarily
   - Network transfer overhead when loading dashboard
   - Increased memory consumption in application
   - Slower database queries as table grows

3. **Cost Implications**
   - Higher database storage costs
   - Increased bandwidth usage
   - Slower page load times affecting user experience

### Evidence from Codebase

**Schema Definition** (`convex/schema.ts`):
```typescript
thumbnailDataUrl: v.optional(v.string()), // Base64-encoded PNG thumbnail (800px width)
thumbnailStorageId: v.optional(v.id("_storage")), // Future: Convex file storage ID
```

**Current Usage** (`src/hooks/use-thumbnail-generator.ts:99-102`):
```typescript
const result = await uploadThumbnailMutation({
  resumeId,
  thumbnailDataUrl: dataUrl, // Storing base64 directly in database
});
```

## Recommended Solution: Migrate to Convex File Storage

### Architecture

```
┌─────────────────┐
│  Resume Canvas  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ html2canvas (render)    │
│ • Capture DOM           │
│ • Convert to PNG blob   │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Convex File Storage API │
│ • Upload blob           │
│ • Get storage ID        │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ Database Update         │
│ • Save thumbnailStorageId│
│ • Remove thumbnailDataUrl│
└─────────────────────────┘
```

### Benefits

1. **Efficient Storage**
   - Store PNG directly without base64 encoding
   - Save 33% storage space
   - CDN-backed delivery for fast loading

2. **Better Performance**
   - Resume list queries no longer fetch large thumbnail data
   - Thumbnails loaded on-demand via Convex storage URLs
   - Faster database queries

3. **Scalability**
   - Convex file storage designed for binary assets
   - Built-in CDN for global distribution
   - No impact on database query performance

4. **Cost Savings**
   - Reduced database storage costs
   - Lower bandwidth usage (CDN caching)
   - Better performance = better UX

## Migration Plan

### Phase 0: Empirical Validation (REQUIRED - Week 0)

⚠️ **BLOCKING PREREQUISITE**: This phase MUST be completed before proceeding to Phase 1.

**Why validation is mandatory:**
- Prevents thumbnail quality issues if compression is worse than estimated
- Avoids performance regressions if size reductions don't materialize
- Prevents wasted storage costs if estimates are incorrect
- Provides data-driven decision making for format/size choices

**Validation Steps:**

1. **Run the validation script** (see detailed implementation below)
2. **Document actual results** in this file (replace estimates with measurements)
3. **Get stakeholder approval** on quality/size trade-offs
4. **Update implementation parameters** based on findings
5. **Only then proceed to Phase 1**

**Acceptance Criteria:**

- [ ] Validation script executed on at least 5 different resume templates
- [ ] Actual size reductions documented in this file (see "Validation Results" section below)
- [ ] Visual quality verified at chosen width/format by QA team
- [ ] Performance impact measured (dashboard load time before/after)
- [ ] Decision documented: width (400/600/800px) and format (PNG/JPEG)
- [ ] Stakeholder sign-off obtained

**Phase 0 Sign-Off Requirements (Explicit Approval Gates):**

Before proceeding to Phase 1, ALL of the following must be completed and documented:

**Timeline Impact**: This phase adds 2-3 days to the overall migration timeline. This investment is valuable because it provides data-driven decisions and catches issues early, but teams should understand the trade-off between thoroughness and speed.

1. **QA Approval** (Required):
   - [ ] QA team has reviewed validation results
   - [ ] Visual quality assessment documented in "Phase 0 Validation Results" section
   - [ ] QA approver name and date recorded
   - [ ] No blocking quality issues identified

2. **Performance Baseline** (Required):
   - [ ] Dashboard load time measured with current base64 thumbnails
   - [ ] Baseline documented: `____ seconds for 20 resumes`
   - [ ] Target confirmed: Dashboard load time must remain < 2s
   - [ ] Performance regression criteria defined (no increase >10%)

3. **Configuration Decision** (Required):
   - [ ] Thumbnail width chosen and documented: `____ px` (400/600/800)
   - [ ] Image format chosen and documented: `____` (PNG/JPEG)
   - [ ] Product manager approval on chosen configuration
   - [ ] PM approver name and date recorded

4. **Validation Results Committed** (Required):
   - [ ] Phase 0 validation results documented in git
   - [ ] Commit hash recorded: `________________`
   - [ ] Results reviewed in pull request
   - [ ] PR approved and merged before Phase 1 begins

5. **Go/No-Go Decision** (Required):
   - [ ] Engineering lead confirms technical feasibility
   - [ ] Product manager confirms business value
   - [ ] Final approval documented: `Yes / No`
   - [ ] If "No", document reasons and alternative approach
   - [ ] If "Yes", Phase 1 can commence

**Sign-Off Template:**

```markdown
## Phase 0 Validation Results - Sign-Off

**Execution Date**: YYYY-MM-DD
**Validation Completed By**: [Engineer Name]

### QA Approval
- **QA Reviewer**: [Name]
- **Review Date**: YYYY-MM-DD
- **Quality Assessment**: Pass / Fail / Conditional
- **Comments**: [Visual quality notes, any concerns]
- **Approval**: ✅ Approved / ❌ Rejected

### Performance Baseline
- **Current Dashboard Load Time**: X.Xs for 20 resumes
- **Measured By**: [Name]
- **Test Date**: YYYY-MM-DD
- **Regression Threshold**: +10% (max X.Xs)
- **Approval**: ✅ Approved / ❌ Rejected

### Configuration Decision
- **Chosen Width**: XXX px
- **Chosen Format**: PNG / JPEG
- **Product Manager**: [Name]
- **Decision Date**: YYYY-MM-DD
- **Rationale**: [Why this configuration was chosen]
- **Approval**: ✅ Approved / ❌ Rejected

### Validation Results Commit
- **Commit Hash**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Pull Request**: #XXX
- **Merged Date**: YYYY-MM-DD
- **Reviewed By**: [Name(s)]

### Final Go/No-Go
- **Engineering Lead**: [Name] - ✅ Go / ❌ No-Go
- **Product Manager**: [Name] - ✅ Go / ❌ No-Go
- **Decision Date**: YYYY-MM-DD
- **Status**: **GO** / **NO-GO**

**If NO-GO**:
- Reason: [Explanation]
- Alternative Approach: [Proposed solution]
- Re-validation Required: Yes / No

**If GO**:
- Phase 1 Start Date: YYYY-MM-DD
- Assigned Engineer: [Name]
- Sprint: [Sprint number/name]
```

---

**Phase 0 Acceleration Criteria:**

While Phase 0 provides valuable data-driven decision making, certain situations may warrant accelerating or streamlining the validation process. Use this guidance to determine the appropriate level of rigor:

**When to Accelerate** (reduce validation scope while maintaining safety):

1. **Critical Blocker Identified**:
   - Storage costs are exceeding budget limits and immediate action is required
   - Base64 payload size is causing measurable performance degradation
   - Security audit identified base64 as a compliance risk
   - **Minimum validation**: Run script on 2-3 diverse templates to confirm approach

2. **High Confidence from Prior Experience**:
   - Team has successfully completed similar migrations in the past
   - Size reduction estimates are well-understood from previous work
   - Visual quality impact is predictable based on image type
   - **Minimum validation**: Single-template smoke test + performance baseline measurement

3. **Low-Risk Migration**:
   - Total number of resumes is small (<100 records)
   - Rollback is trivial (feature flag already in place)
   - Storage solution is proven and stable
   - **Minimum validation**: QA visual review + Go/No-Go sign-off only

**When to ENFORCE Full Validation** (do NOT accelerate):

1. **First-Time Migration**:
   - Team has not performed this type of migration before
   - Uncertainty about size reduction, quality impact, or performance
   - **Required**: All 5 sign-off gates with full validation

2. **High Volume**:
   - Large number of existing resumes (>1,000 records)
   - Migration will touch significant data
   - Rollback would be expensive or risky
   - **Required**: All 5 sign-off gates with full validation

3. **User-Facing Quality Critical**:
   - Visual quality directly impacts user experience or conversion
   - Thumbnails are displayed prominently in UI
   - Brand perception depends on image quality
   - **Required**: All 5 sign-off gates with extended QA review

4. **Complex Storage Migration**:
   - Changing storage providers or infrastructure
   - Multiple interdependent systems affected
   - Data consistency concerns across services
   - **Required**: All 5 sign-off gates + additional system integration testing

**Absolute Minimum** (even in accelerated cases):
- [ ] Run validation script on at least 2-3 representative templates
- [ ] QA visual quality review (even if informal)
- [ ] Go/No-Go decision with named approver
- [ ] Commit hash recorded for accountability

**Recommendation**: When in doubt, err on the side of thoroughness. The 2-3 day investment in Phase 0 prevents costly mistakes and provides documentation that helps future migrations.

---

**Validation Results Template** (to be filled after running validation):

```markdown
## Empirical Validation Results

**Date**: [YYYY-MM-DD]
**Tested by**: [Name]
**Templates tested**: [List 5+ resume templates]

### Size Measurements

| Configuration | Binary Size | Base64 Size | Reduction vs Baseline |
|---------------|-------------|-------------|----------------------|
| 800px PNG (baseline) | [X] KB | [Y] KB | 0% |
| 600px PNG | [X] KB | [Y] KB | [Z]% |
| 400px PNG | [X] KB | [Y] KB | [Z]% |
| 600px JPEG (85%) | [X] KB | [Y] KB | [Z]% |
| 400px JPEG (85%) | [X] KB | [Y] KB | [Z]% |

### Quality Assessment

- [ ] Visual quality acceptable at 600px PNG
- [ ] Visual quality acceptable at 400px PNG
- [ ] Text remains readable at chosen size
- [ ] No artifacts or blurring
- [ ] Colors/fonts render correctly

### Performance Impact

- Dashboard load time (before): [X]ms for 20 resumes
- Dashboard load time (after): [Y]ms for 20 resumes
- Improvement: [Z]%

### Decision

**Chosen configuration**: [e.g., 400px PNG]
**Rationale**: [Brief explanation]
**Stakeholder approval**: [Name, Date]
```

**For the full validation script implementation, see the "Immediate Interim Solution" section below.**

---

### Phase 1: Implement Storage-Based Upload (Week 1)

⚠️ **Cannot start until Phase 0 validation is complete and results are documented above.**

**1.1 Update Thumbnail Generator Hook**

File: `src/hooks/use-thumbnail-generator.ts`

```typescript
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { dataUrlToBlob } from '@/lib/thumbnail/conversion';

export function useThumbnailGenerator(resumeId, options = {}) {
  const uploadThumbnailMutation = useMutation(api.builder_resumes.uploadThumbnailToStorage);

  const generateThumbnail = useCallback(async (element, uploadToConvex = true) => {
    // ... existing html2canvas rendering logic ...
    // Assuming html2canvas produces a canvas element

    // RECOMMENDED: Extract blob directly from canvas (most efficient)
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob: Blob | null) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        // Upload to Convex storage
        if (uploadToConvex && resumeId) {
          try {
            const storageId = await uploadThumbnailMutation({
              resumeId,
              thumbnailBlob: blob,
            });
            resolve(storageId);
          } catch (error) {
            reject(error);
          }
        } else {
          resolve(null);
        }
      }, 'image/png');
    });

    // ALTERNATIVE: If you already have a data URL and need to convert it:
    // const blob = dataUrlToBlob(dataUrl);
    // const storageId = await uploadThumbnailMutation({ resumeId, thumbnailBlob: blob });
  }, [resumeId, uploadThumbnailMutation]);

  // ... rest of hook ...
}
```

**1.2 Create New Convex Mutation**

File: `convex/builder_resumes.ts`

```typescript
/**
 * Upload resume thumbnail to Convex storage
 * @returns { success: boolean, storageId: Id<"_storage">, updatedAt: number }
 */
export const uploadThumbnailToStorage = mutation({
  args: {
    resumeId: v.id("builder_resumes"),
    thumbnailBlob: v.bytes(), // Binary PNG data
  },
  handler: async (ctx, args) => {
    // Verify authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Verify resume exists and user owns it
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }
    // Verify ownership
    if (resume.userId !== identity.subject) {
      throw new Error("Forbidden: You do not own this resume");
    }

    // Upload to Convex storage
    const storageId = await ctx.storage.store(args.thumbnailBlob);

    // Delete old thumbnail from storage if it exists
    if (resume.thumbnailStorageId) {
      try {
        await ctx.storage.delete(resume.thumbnailStorageId);
      } catch (err) {
        console.warn('Failed to delete old thumbnail:', err);
        // Continue anyway
      }
    }

    // Update database with storage ID
    // Note: We only UPDATE thumbnailStorageId, NOT thumbnailDataUrl.
    // During migration, the getThumbnailUrl query will check both fields,
    // preferring thumbnailStorageId. This allows gradual migration without
    // forcing re-uploads of old thumbnails.
    const updatedAt = Date.now();
    await ctx.db.patch(args.resumeId, {
      thumbnailStorageId: storageId,
      // Intentionally NOT updating thumbnailDataUrl for backward compatibility;
      // existing base64 thumbnails remain available for fallback/rollback.
      // See getThumbnailUrl query for dual-source fallback logic.
      updatedAt,
    });

    return { success: true, storageId, updatedAt };
  },
});
```

**1.3 Create Helper to Generate Storage URL**

File: `convex/builder_resumes.ts`

```typescript
/**
 * Get thumbnail URL for a resume
 * @returns { url: string | null }
 */
export const getThumbnailUrl = query({
  args: {
    resumeId: v.id("builder_resumes"),
  },
  handler: async (ctx, args) => {
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) {
      throw new Error("Resume not found");
    }

    if (resume.thumbnailStorageId) {
      const url = await ctx.storage.getUrl(resume.thumbnailStorageId);
      return { url };
    }

    // Fallback to base64 data URL during migration
    if (resume.thumbnailDataUrl) {
      return { url: resume.thumbnailDataUrl };
    }

    return { url: null };
  },
});
```

### Phase 2: Update UI Components (Week 1)

**2.1 Update RecordCard Component**

File: `src/components/records/RecordCard.tsx`

```typescript
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function RecordCard({ resumeId, ... }) {
  // Fetch thumbnail URL from storage (instead of inline thumbnailDataUrl)
  const thumbnailData = useQuery(api.builder_resumes.getThumbnailUrl, { resumeId });

  // Handle loading state (query in progress)
  if (thumbnailData === undefined) {
    return (
      <div className="thumbnail-skeleton" aria-label="Loading thumbnail">
        {/* Skeleton loader or placeholder image */}
        <div className="animate-pulse bg-gray-200 w-full h-48 rounded" />
      </div>
    );
  }

  // Handle query error state (when getThumbnailUrl throws an exception)
  // Convex useQuery returns Error instance when query fails
  if (thumbnailData instanceof Error) {
    console.error('Failed to fetch thumbnail:', thumbnailData.message);
    return (
      <div
        className="thumbnail-error"
        data-testid="thumbnail-error"
        role="img"
        aria-label="Thumbnail failed to load"
      >
        <span className="text-red-400">Preview unavailable</span>
        {/* Optional: Add retry button */}
      </div>
    );
  }

  // Handle missing thumbnail (query succeeded but no thumbnail exists)
  if (thumbnailData === null || !thumbnailData.url) {
    return (
      <div
        className="thumbnail-placeholder"
        data-testid="thumbnail-placeholder"
        role="img"
        aria-label="No thumbnail available"
      >
        <span className="text-gray-400">No preview available</span>
      </div>
    );
  }

  // Render thumbnail with error handling
  return (
    <img
      src={thumbnailData.url}
      alt="Resume preview"
      loading="lazy"
      className="w-full h-48 object-cover rounded"
      data-testid="resume-thumbnail"
      onError={(e) => {
        console.warn(`Failed to load thumbnail for resume ${resumeId}`, {
          url: thumbnailData.url,
          source: thumbnailData.source,
        });
        // Fallback to placeholder on image load error
        e.currentTarget.style.display = 'none';
        e.currentTarget.parentElement?.classList.add('thumbnail-error');
      }}
    />
  );
}
```

**Key Improvements:**

1. **Loading State**: Shows skeleton loader while query is in progress (`thumbnailData === undefined`)
2. **Error Handling**: Displays placeholder if query fails or no thumbnail exists
3. **Image Load Failures**: `onError` handler logs failures and shows fallback UI
4. **Accessibility**: ARIA labels for screen readers
5. **Test Attributes**: `data-testid` for E2E tests
6. **Lazy Loading**: Defers loading for off-screen thumbnails
7. **Debug Context**: Logs include `url` and `source` (storage vs base64) for troubleshooting

### Phase 3: Migrate Existing Data (Week 2)

**3.1 Create Paginated Migration Query**

File: `convex/builder_resumes.ts`

```typescript
/**
 * List resumes for migration (admin/system use only)
 * SECURITY: This query is restricted to admin users
 * @returns { resumes: Array, nextCursor: string | null, hasMore: boolean }
 */
export const listResumesForMigration = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    // Verify admin role
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user?.isAdmin) {
      throw new Error("Unauthorized: Admin access required");
    }

    const limit = args.limit ?? 100;

    // Query resumes with pagination
    const results = await ctx.db
      .query("builder_resumes")
      .paginate({
        cursor: args.cursor ?? null,
        numItems: limit,
      });

    return {
      resumes: results.page,
      nextCursor: results.continueCursor,
      hasMore: results.isDone === false,
    };
  },
});
```

**3.2 Create Migration Script**

File: `scripts/migrate-thumbnails.ts`

```typescript
/**
 * IMPORTANT: Run this script using Convex CLI with proper authentication:
 * npx convex run scripts/migrate-thumbnails.ts --prod
 *
 * Do NOT use ConvexHttpClient directly - it's browser-only and lacks Node.js support.
 */

import { dataUrlToBlob } from '../src/lib/thumbnail/conversion';

/**
 * Migration function to be run via Convex CLI
 * This avoids HTTP client issues and ensures proper authentication
 */
async function migrateThumbnails(ctx: any) {
  let migrated = 0;
  let failed = 0;
  let cursor: string | null = null;
  const pageSize = 100;
  let iterationCount = 0;
  const maxIterations = 10000; // Safety limit: max 10k pages (1M resumes at 100/page)

  // Defense-in-depth: Track all processed resume IDs to detect duplicates
  // This provides backup safety if cursor comparison fails due to:
  // - Cursor format changes in Convex
  // - Cursor encoding/normalization differences
  // - Any other pagination bugs
  const seenResumeIds = new Set<string>();

  console.log('Starting thumbnail migration...');

  while (true) {
    iterationCount++;

    // Safety check: prevent infinite loops
    if (iterationCount > maxIterations) {
      console.error(`Migration aborted: exceeded max iterations (${maxIterations})`);
      throw new Error('Pagination loop exceeded maximum iterations - possible infinite loop');
    }

    // Fetch page of resumes
    const page = await ctx.runQuery('builder_resumes:listResumesForMigration', {
      cursor,
      limit: pageSize,
    });

    if (page.resumes.length === 0) break;

    console.log(`Processing batch ${iterationCount} of ${page.resumes.length} resumes...`);

    // Defense-in-depth: Check for duplicate resumes in this page
    // This detects pagination bugs that cursor comparison might miss
    for (const resume of page.resumes) {
      if (seenResumeIds.has(resume._id)) {
        console.error(
          `CRITICAL: Duplicate resume detected in pagination: ${resume._id}\n` +
          `This indicates a pagination bug where the same resume appears multiple times.\n` +
          `Current iteration: ${iterationCount}\n` +
          `Total resumes processed: ${seenResumeIds.size}\n` +
          `This could be caused by:\n` +
          `  - Cursor stuck/not advancing properly\n` +
          `  - Cursor encoding issues\n` +
          `  - Database pagination API malfunction`
        );
        throw new Error(`Pagination duplicate detection triggered for resume ${resume._id} - API malfunction`);
      }
      seenResumeIds.add(resume._id);
    }

    for (const resume of page.resumes) {
      // Only migrate resumes with base64 thumbnails that don't have storage IDs
      if (resume.thumbnailDataUrl && !resume.thumbnailStorageId) {
        try {
          // Convert base64 data URL to blob
          const blob = dataUrlToBlob(resume.thumbnailDataUrl);

          // Upload to storage via mutation
          // Note: v.bytes() expects ArrayBuffer, not Array
          await ctx.runMutation('builder_resumes:uploadThumbnailToStorage', {
            resumeId: resume._id,
            thumbnailBlob: await blob.arrayBuffer(),
          });

          migrated++;
          console.log(`✓ Migrated thumbnail for resume ${resume._id}`);
        } catch (error) {
          console.error(`✗ Failed to migrate resume ${resume._id}:`, error);
          failed++;
        }
      }
    }

    // Save previous cursor for validation
    const previousCursor = cursor;
    cursor = page.nextCursor;

    // Safety check: ensure cursor changed to prevent infinite loops
    // Layer 3: Cursor Comparison (Secondary Defense - REQUIRED)
    // - Uses strict equality (`cursor === previousCursor`) for detection.
    // - Assumes cursors are stable strings without encoding changes.
    // Limitations & Why Layer 2 matters:
    // - If Convex changes cursor encoding/serialization, different cursors could
    //   compare equal (or the same cursor could compare unequal).
    // - Layer 2 resume ID tracking is immune to encoding changes and serves as
    //   the PRIMARY defense. This check provides an early warning but should
    //   never replace ID tracking.
    if (cursor !== null && cursor === previousCursor) {
      console.error('Pagination cursor did not change between iterations');
      console.error(`Previous cursor: ${previousCursor}`);
      console.error(`Current cursor: ${cursor}`);
      console.error(`Resumes processed so far: ${seenResumeIds.size}`);
      throw new Error('Pagination cursor stuck - possible API malfunction');
    }

    if (!page.hasMore) break;
  }

  console.log('\n=== Migration Complete ===');
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total processed: ${migrated + failed}`);

  return { migrated, failed };
}

// Export for Convex CLI execution
export default migrateThumbnails;
```

**Pagination Safety: Defense-in-Depth Strategy**

**REQUIRED PATTERN**: All production migration scripts MUST implement these three safety layers to prevent infinite loops and data corruption. This is non-negotiable - missing any layer creates unacceptable risk of runaway processes that could corrupt data or exhaust resources.

The migration script implements multiple layers of pagination safety:

**Layer 1: Maximum Iteration Count (Safety Ceiling - REQUIRED)**
- Hard limit of 10,000 iterations (supports up to 1M resumes at 100/page)
- Prevents runaway loops if pagination logic completely fails
- Throws clear error with iteration count
- **Why required**: Final backstop against infinite loops that could run indefinitely and exhaust system resources

**Layer 2: Resume ID Tracking (Primary Defense - REQUIRED)**
- Maintains `Set<string>` of all processed resume IDs
- Detects duplicates immediately when they appear
- **Most reliable**: Works regardless of cursor format changes
- Provides detailed error message with diagnostic information
- **Why required**:
  - Cursor comparison assumes stable string format
  - Convex could change cursor encoding/serialization
  - Normalization could make different cursors compare equal
  - ID tracking works regardless of cursor implementation
  - **This is the primary defense** - do not skip this layer

**Layer 3: Cursor Comparison (Secondary Defense - REQUIRED)**
- Compares `cursor === previousCursor` with strict equality
- Catches stuck cursor before processing duplicates
- **Limitations**:
  - Assumes cursors are comparable with `===`
  - Could false-positive if cursor format changes
  - Could miss issues if cursors encode same position differently
- **Why required**: Provides early detection before ID duplication occurs, reducing resource waste

**Failure Scenarios Handled:**

| Scenario | Layer 1 | Layer 2 | Layer 3 | Result |
|----------|---------|---------|---------|--------|
| Cursor stuck at same value | ⏱️ Eventually | ✅ Immediate | ✅ Immediate | Caught early |
| Cursor changes but returns same data | ⏱️ Eventually | ✅ Immediate | ❌ Missed | Caught by ID tracking |
| Cursor format change breaks comparison | ⏱️ Eventually | ✅ Immediate | ❌ False negative | Caught by ID tracking |
| Complete pagination failure | ✅ After 10k iterations | ✅ Immediate | ⚠️ Maybe | Multiple safety nets |
| Cursor encoding normalization | ⏱️ Eventually | ✅ Immediate | ❌ False positive | Caught by ID tracking |

**Example: Cursor Format Change**

If Convex changes cursor serialization:
```typescript
// Old format: "cursor:abc123"
// New format: "v2:cursor:abc123"

// Cursor comparison: previousCursor !== cursor (false negative - thinks it advanced)
// ID tracking: Detects duplicate resume IDs (catches the bug)
```

**Memory Considerations:**

The `seenResumeIds` Set stores resume IDs for all processed resumes:
- Typical ID: ~20 characters
- JavaScript string overhead: ~40 bytes per ID
- 100,000 resumes: ~4 MB memory
- 1,000,000 resumes: ~40 MB memory

This is acceptable for migration scripts but should NOT be used in long-running servers.

**Implementation Checklist:**

When implementing any paginated migration script, verify ALL three layers are present:

- [ ] **Layer 1**: Maximum iteration count with hard limit (recommend 10,000)
- [ ] **Layer 2**: Resume/record ID tracking with `Set<string>` and duplicate detection
- [ ] **Layer 3**: Cursor comparison to detect stuck pagination

**Code Review Checkpoint**: If any layer is missing, reject the pull request. All three are required for production safety.

**3.3 Run Migration**

```bash
# Run migration script using Convex CLI with proper authentication
npx convex run scripts/migrate-thumbnails.ts --prod

# Or for development environment:
npx convex run scripts/migrate-thumbnails.ts --dev

# The Convex CLI handles authentication automatically using your deployment credentials
# and provides proper Node.js environment with access to ctx.runQuery and ctx.runMutation

# Verify migration results by checking a few resumes:
npx convex query builder_resumes:listResumesForMigration '{"limit": 10}'
# Confirm that thumbnailStorageId is populated for migrated resumes
```

**3.4 Security Considerations**

✅ **Security implemented**: The `listResumesForMigration` query includes admin authentication (see section 3.1 above).

**Additional security measures:**

1. **Database index required**: Ensure `by_clerk_id` index exists on users table:
   ```typescript
   // In convex/schema.ts
   users: defineTable({
     clerkId: v.string(),
     isAdmin: v.optional(v.boolean()),
     // ... other fields
   }).index("by_clerk_id", ["clerkId"]),
   ```

2. **Admin role management**: Set `isAdmin` flag carefully:
   ```typescript
   // Manual admin assignment (run once in Convex dashboard)
   await ctx.db.patch(userId, { isAdmin: true });
   ```

3. **Audit logging (required)**: Persist every migration query invocation (who, when, status) to a dedicated audit log store:
   ```typescript
   await ctx.db.insert('auditLogs', {
     userId: user._id,
     email: identity.email,
     action: 'listResumesForMigration',
     timestamp: Date.now(),
     status: 'success',
     ipAddress: ctx.request?.headers.get('x-forwarded-for'),
   });
   ```
   - Retain audit logs per compliance policy (e.g., 90–365 days) and restrict access to security/ops teams.

4. **Rate limiting (required before broader exposure)**: Implement a per-admin limiter (e.g., token bucket of 10 requests/minute) so repeated calls cannot exhaust resources.
   - Configure automatic cleanup so rate-limit records do not grow unbounded:
     - Preferred: apply a TTL/expiration on `seed_rate_limits` if the database supports it.
     - Alternative: run a scheduled mutation that deletes entries older than the window. Example:
       ```typescript
       export const cleanupExpiredSeedRateLimits = mutation({
         handler: async (ctx) => {
           const windowStart = Date.now() - 60_000;
           const expired = await ctx.db
             .query('seed_rate_limits')
             .filter((entry) => entry.timestamp < windowStart)
             .collect();

           let deleted = 0;
           for (const entry of expired) {
             await ctx.db.delete(entry._id);
             deleted++;
           }

           return { deleted };
         },
       });
       ```
     - Schedule the cleanup (cron/background job) before enabling rate limits in higher environments.
   ```typescript
   const RATE_LIMIT_MAX = 10; // per admin per minute
   const now = Date.now();
   const windowStart = now - 60_000;

   const usage = await ctx.db.query('seed_rate_limits')
     .withIndex('by_admin', (q) => q.eq('adminId', user._id))
     .filter((entry) => entry.timestamp >= windowStart)
     .collect();

   if (usage.length >= RATE_LIMIT_MAX) {
     throw new Error('Rate limit exceeded for migration query');
   }

   await ctx.db.insert('seed_rate_limits', {
     adminId: user._id,
     timestamp: now,
   });
   ```

   - Monitor rate-limit breaches and alert on sustained violations; adjust thresholds before expanding access.

### Phase 4: Deprecate Base64 Field (Week 3)

**4.1 Add Deprecation Warning**

File: `convex/schema.ts`

```typescript
builder_resumes: defineTable({
  // ... other fields ...

  // DEPRECATED: Use thumbnailStorageId instead
  // TODO: Remove after full migration (target: [DATE])
  thumbnailDataUrl: v.optional(v.string()),

  // Current: Convex file storage ID for thumbnail
  thumbnailStorageId: v.optional(v.id("_storage")),

  // ... other fields ...
})
```

**4.2 Update Mutation to Ignore Base64**

File: `convex/builder_resumes.ts`

```typescript
export const uploadThumbnailToStorage = mutation({
  handler: async (ctx, args) => {
    // ... existing logic ...

    await ctx.db.patch(args.resumeId, {
      thumbnailStorageId: storageId,
      // NO LONGER UPDATE thumbnailDataUrl
      updatedAt,
    });

    return { success: true, storageId, updatedAt };
  },
});
```

### Phase 5: Remove Legacy Code (Week 4)

**5.1 Remove Schema Field**

File: `convex/schema.ts`

```typescript
builder_resumes: defineTable({
  // Remove this line:
  // thumbnailDataUrl: v.optional(v.string()),

  thumbnailStorageId: v.optional(v.id("_storage")), // Keep this
})
```

**5.2 Remove Legacy Mutation**

File: `convex/builder_resumes.ts`

```typescript
// DELETE this entire mutation:
// export const updateThumbnail = mutation({ ... });
```

**5.3 Clean Up Data**

```sql
-- Convex doesn't support SQL, but conceptually:
-- Remove thumbnailDataUrl from all resumes
-- This happens automatically when schema field is removed
```

## Immediate Interim Solution

While planning the full migration, implement these quick wins:

### ⚠️ IMPORTANT: Validate Size Reductions Before Implementation

The size reduction claims below are **theoretical estimates** and must be empirically validated before implementation. PNG compression is non-linear, and JPEG quality impact varies with content and rendering engine.

**Validation Script** (`scripts/validate-thumbnail-sizes.ts`):

```typescript
/**
 * Empirical validation script for thumbnail size optimizations
 * Run this to measure actual size reductions before implementing changes
 */

import html2canvas from 'html2canvas';
import { blobToDataUrl } from '@/lib/thumbnail/conversion';

interface SizeTestResult {
  width: number;
  format: 'png' | 'jpeg';
  quality?: number;
  sizeBytes: number;
  base64SizeBytes: number;
}

async function testThumbnailSizes(element: HTMLElement): Promise<SizeTestResult[]> {
  const results: SizeTestResult[] = [];
  const widths = [400, 600, 800];

  for (const width of widths) {
    // Render canvas at target width
    const canvas = await html2canvas(element, {
      width,
      scale: width / 800, // Adjust scale to maintain aspect ratio
    });

    // Test PNG
    const pngBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create PNG blob from canvas'));
            return;
          }
          resolve(blob);
        },
        'image/png'
      );
    });
    const pngDataUrl = await blobToDataUrl(pngBlob);

    results.push({
      width,
      format: 'png',
      sizeBytes: pngBlob.size,
      base64SizeBytes: pngDataUrl.length,
    });

    // Test JPEG at different quality levels
    for (const quality of [0.7, 0.85, 0.95]) {
      const jpegBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error(`Failed to create JPEG blob (quality: ${quality}) from canvas`));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          quality
        );
      });
      const jpegDataUrl = await blobToDataUrl(jpegBlob);

      results.push({
        width,
        format: 'jpeg',
        quality,
        sizeBytes: jpegBlob.size,
        base64SizeBytes: jpegDataUrl.length,
      });
    }
  }

  return results;
}

function analyzeResults(results: SizeTestResult[]) {
  const baseline = results.find(r => r.width === 800 && r.format === 'png')!;

  console.log('=== Thumbnail Size Analysis ===\n');
  console.log(`Baseline (800px PNG):`);
  console.log(`  Binary: ${(baseline.sizeBytes / 1024).toFixed(2)} KB`);
  console.log(`  Base64: ${(baseline.base64SizeBytes / 1024).toFixed(2)} KB`);
  console.log(`  Base64 overhead: ${((baseline.base64SizeBytes / baseline.sizeBytes - 1) * 100).toFixed(1)}%\n`);

  results.forEach(result => {
    if (result === baseline) return;

    const reduction = ((1 - result.base64SizeBytes / baseline.base64SizeBytes) * 100).toFixed(1);
    const label = result.format === 'png'
      ? `${result.width}px PNG`
      : `${result.width}px JPEG (${(result.quality! * 100).toFixed(0)}%)`;

    console.log(`${label}:`);
    console.log(`  Binary: ${(result.sizeBytes / 1024).toFixed(2)} KB`);
    console.log(`  Base64: ${(result.base64SizeBytes / 1024).toFixed(2)} KB`);
    console.log(`  Reduction vs baseline: ${reduction}%\n`);
  });
}

// Export for testing
export { testThumbnailSizes, analyzeResults };
```

**Testing Procedure**:

1. Render a typical resume in the browser
2. Run `testThumbnailSizes(resumeElement)` in console
3. Analyze actual size reductions for different configurations
4. Update this document with measured results
5. Make informed decision on optimal width/format combination

**Decision Criteria**:
- Target: <40KB base64 per thumbnail (60% reduction from current ~100KB)
- Visual quality: Must pass manual QA review
- Compatibility: Format must work across all browsers

---

### 1. Reduce Thumbnail Size

File: `src/hooks/use-thumbnail-generator.ts`

```typescript
export function useThumbnailGenerator(resumeId, options = {}) {
  const {
    width = 400, // CHANGED: Reduce from 800px to 400px
    // ... rest of options
  } = options;
}
```

**Estimated Impact**: ~75% reduction in thumbnail size (UNVALIDATED)
- Before: 67-200KB per thumbnail (base64)
- After: ~17-50KB per thumbnail (base64)
- ⚠️ **Run validation script above to confirm actual reduction**

**Assumptions**:
- Linear scaling of file size with dimensions (may not hold for PNG compression)
- No significant quality degradation at 400px
- Browser rendering consistency

### 2. Lazy Load Thumbnails

File: `src/components/records/RecordCard.tsx`

```typescript
export function RecordCard({ resume, ... }) {
  return (
    <div>
      {/* Add loading="lazy" to defer thumbnail loading */}
      <img
        src={resume.thumbnailDataUrl}
        alt="Resume preview"
        loading="lazy"
      />
    </div>
  );
}
```

**Impact**: Defers thumbnail loading until visible in viewport
- Reduces initial page load time
- No file size reduction, pure performance optimization
- Well-supported across modern browsers

### 3. Add Compression

File: `src/lib/thumbnail/renderThumbnail.ts`

```typescript
// Add JPEG compression for smaller file size
canvas.toBlob((blob) => {
  // Convert blob to data URL
}, 'image/jpeg', 0.85); // 85% quality JPEG instead of PNG
```

**Estimated Impact**: ~50% reduction in file size (UNVALIDATED)
- PNG: 50-150KB
- JPEG (85% quality): 25-75KB (estimated)
- ⚠️ **Run validation script above to confirm actual reduction**

**Assumptions**:
- 85% JPEG quality maintains acceptable visual quality
- Resume content compresses well with JPEG (may vary with graphics/charts)
- No browser compatibility issues

**Trade-offs**:
- JPEG is lossy compression (may affect text sharpness)
- PNG better for text-heavy content
- Test with actual resume content before deciding

## Observability & Monitoring

### Migration Observability

**Enhanced Migration Script** with comprehensive logging:

```typescript
// In scripts/migrate-thumbnails.ts
import { FEATURE_FLAGS } from '@/convex/lib/featureFlags';

async function migrateThumbnails(ctx: any) {
  const startTime = Date.now();
  const metrics = {
    totalProcessed: 0,
    migrated: 0,
    skipped: 0,
    failed: 0,
    batches: 0,
    errors: [] as Array<{ resumeId: string; error: string }>,
  };
  const progressInterval = FEATURE_FLAGS.THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL;
  // Ops guidance: keep this interval at 100-500 for 10k-100k migrations to avoid noisy logs.

  console.log(`[${new Date().toISOString()}] Starting thumbnail migration...`);

  let cursor: string | null = null;
  const pageSize = 100;
  let iterationCount = 0;
  const maxIterations = 10000; // Safety limit: max 10k pages (1M resumes at 100/page)

  while (true) {
    iterationCount++;

    // Safety check: prevent infinite loops
    if (iterationCount > maxIterations) {
      console.error(`Migration aborted: exceeded max iterations (${maxIterations})`);
      throw new Error('Pagination loop exceeded maximum iterations - possible infinite loop');
    }

    const batchStartTime = Date.now();

    const page = await ctx.runQuery('builder_resumes:listResumesForMigration', {
      cursor,
      limit: pageSize,
    });

    if (page.resumes.length === 0) break;

    metrics.batches++;
    console.log(`[Batch ${metrics.batches}] Processing ${page.resumes.length} resumes...`);

    for (const resume of page.resumes) {
      metrics.totalProcessed++;

      // Skip if already migrated
      if (resume.thumbnailStorageId) {
        metrics.skipped++;
        continue;
      }

      // Skip if no base64 thumbnail
      if (!resume.thumbnailDataUrl) {
        metrics.skipped++;
        continue;
      }

      try {
        const blob = dataUrlToBlob(resume.thumbnailDataUrl);
        await ctx.runMutation('builder_resumes:uploadThumbnailToStorage', {
          resumeId: resume._id,
          thumbnailBlob: Array.from(new Uint8Array(await blob.arrayBuffer())),
        });

        metrics.migrated++;
        if (progressInterval > 0 && metrics.migrated % progressInterval === 0) {
          console.log(`  • Progress: ${metrics.migrated} resumes migrated so far`);
        }
      } catch (error) {
        metrics.failed++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        metrics.errors.push({ resumeId: resume._id, error: errorMsg });
        console.error(`  ✗ Failed resume ${resume._id}: ${errorMsg}`);
      }
    }

    const batchDuration = Date.now() - batchStartTime;
    const avgTimePerResume = page.resumes.length > 0 ? (batchDuration / page.resumes.length).toFixed(2) : '0';
    console.log(`[Batch ${metrics.batches}] Completed in ${batchDuration}ms (${avgTimePerResume}ms/resume)`);


    // Save previous cursor for validation
    const previousCursor = cursor;
    cursor = page.nextCursor;

    // Safety check: ensure cursor changed to prevent infinite loops
    if (cursor !== null && cursor === previousCursor) {
      console.error('Pagination cursor did not change between iterations');
      console.error(`Previous cursor: ${previousCursor}`);
      console.error(`Current cursor: ${cursor}`);
      console.error(`Batch: ${metrics.batches}, Processed: ${metrics.totalProcessed}`);
      throw new Error('Pagination cursor stuck - possible API malfunction');
    }

    if (!page.hasMore) break;
  }

  const totalDuration = Date.now() - startTime;

  console.log('\n=== Migration Summary ===');
  console.log(`Start: ${new Date(startTime).toISOString()}`);
  console.log(`End: ${new Date().toISOString()}`);
  console.log(`Duration: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
  console.log(`Total processed: ${metrics.totalProcessed}`);
  console.log(`Migrated: ${metrics.migrated}`);
  console.log(`Skipped: ${metrics.skipped}`);
  console.log(`Failed: ${metrics.failed}`);
  console.log(`Batches: ${metrics.batches}`);

  if (metrics.errors.length > 0) {
    console.log('\n=== Failed Resumes ===');
    metrics.errors.forEach(({ resumeId, error }) => {
      console.log(`${resumeId}: ${error}`);
    });
  }

  return metrics;
}
```

Progress logging is configured via the `THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL` feature flag, so ops teams can tune visibility without code changes (default 100 logs roughly once per 100 migrated resumes).

### Production Monitoring

**Metrics to Track**:

1. **Storage Usage**
   ```typescript
   // Add to convex/builder_resumes.ts
   export const getStorageMetrics = query({
     handler: async (ctx) => {
       const resumes = await ctx.db.query("builder_resumes").collect();

       return {
         total: resumes.length,
         withStorageId: resumes.filter(r => r.thumbnailStorageId).length,
         withDataUrl: resumes.filter(r => r.thumbnailDataUrl).length,
         fullyMigrated: resumes.filter(r => r.thumbnailStorageId && !r.thumbnailDataUrl).length,
         pendingMigration: resumes.filter(r => r.thumbnailDataUrl && !r.thumbnailStorageId).length,
       };
     },
   });
   ```

2. **Query Performance**
   ```typescript
   // Add performance logging to getThumbnailUrl
   export const getThumbnailUrl = query({
     handler: async (ctx, args) => {
       const startTime = Date.now();

       const resume = await ctx.db.get(args.resumeId);
       if (!resume) throw new Error("Resume not found");

       let url: string | null = null;
       let source: 'storage' | 'base64' | 'none' = 'none';

       if (resume.thumbnailStorageId) {
         url = await ctx.storage.getUrl(resume.thumbnailStorageId);
         source = 'storage';
       } else if (resume.thumbnailDataUrl) {
         url = resume.thumbnailDataUrl;
         source = 'base64';
       }

       const duration = Date.now() - startTime;

       // Log slow queries
       if (duration > 100) {
         console.warn(`[getThumbnailUrl] Slow query for ${args.resumeId}: ${duration}ms (${source})`);
       }

       return { url, source, _debug: { durationMs: duration } };
     },
   });
   ```

3. **Upload Failures**
   ```typescript
   // Enhanced error logging in uploadThumbnailToStorage
   try {
     const storageId = await ctx.storage.store(args.thumbnailBlob);
     // ... rest of logic
   } catch (error) {
     console.error('[uploadThumbnailToStorage] Storage upload failed:', {
       resumeId: args.resumeId,
       blobSize: args.thumbnailBlob.length,
       error: error instanceof Error ? error.message : String(error),
       timestamp: new Date().toISOString(),
     });
     throw error;
   }
   ```

4. **Dangling References Detection**
   ```typescript
   // Health check query to detect orphaned storage IDs
   export const healthCheckThumbnails = query({
     handler: async (ctx) => {
       const resumes = await ctx.db.query("builder_resumes").collect();
       const issues: Array<{ resumeId: string; issue: string }> = [];

       for (const resume of resumes) {
         if (resume.thumbnailStorageId) {
           const url = await ctx.storage.getUrl(resume.thumbnailStorageId);
           if (!url) {
             issues.push({
               resumeId: resume._id,
               issue: `Dangling storage ID: ${resume.thumbnailStorageId}`,
             });
           }
         }
       }

       return {
         healthy: issues.length === 0,
         issueCount: issues.length,
         issues,
       };
     },
   });
   ```

### Alerting Rules

Configure monitoring alerts for:

- Migration batch failures > 5%
- getThumbnailUrl p95 latency > 200ms
- Storage upload failures > 1% of attempts
- Dangling thumbnailStorageId count > 0
- Storage usage growth rate exceeding projections

## Testing Strategy

### Unit Tests

**1. Blob Conversion Tests** (`tests/unit/thumbnail-conversion.test.ts`):

```typescript
import { dataUrlToBlob } from '@/lib/thumbnail/conversion';

describe('dataUrlToBlob', () => {
  it('should convert PNG data URL to blob', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/png');
    expect(blob.size).toBeGreaterThan(0);
  });

  it('should handle JPEG data URLs', () => {
    const dataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAAA//EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAT8AH//Z';
    const blob = dataUrlToBlob(dataUrl);

    expect(blob.type).toBe('image/jpeg');
  });

  it('should throw on invalid data URL format', () => {
    expect(() => dataUrlToBlob('invalid')).toThrow('Invalid data URL format');
    expect(() => dataUrlToBlob('data:image/png')).toThrow('Invalid data URL format');
  });

  it('should calculate correct blob size', () => {
    const dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const blob = dataUrlToBlob(dataUrl);

    // Base64 decoded size should match blob size
    const base64Data = dataUrl.split(',')[1];
    const expectedSize = atob(base64Data).length;
    expect(blob.size).toBe(expectedSize);
  });
});
```

**2. Size Calculation Tests** (`tests/unit/thumbnail-sizing.test.ts`):

```typescript
const calculateReduction = (before: number, after: number) => {
  if (before <= 0) return 0;
  return ((before - after) / before) * 100;
};

describe('thumbnail size calculations', () => {
  it('should correctly calculate base64 overhead', () => {
    const binarySize = 100000; // 100KB
    const base64Size = Math.ceil(binarySize * 4 / 3); // ~133KB
    const overhead = (base64Size / binarySize - 1) * 100;

    expect(overhead).toBeCloseTo(33.3, 1);
  });

  it('should validate reduction calculations', () => {
    const before = 150000; // 150KB
    const after = 50000;   // 50KB
    const reduction = ((before - after) / before) * 100;

    expect(reduction).toBeCloseTo(66.7, 1);
  });

  it('should handle zero-byte files', () => {
    expect(() => calculateReduction(0, 0)).not.toThrow();
    expect(calculateReduction(0, 0)).toBe(0);
  });

  it('should handle very large files', () => {
    const reduction = calculateReduction(100_000_000, 50_000_000);
    expect(reduction).toBeCloseTo(50, 1);
  });
});
```

### Integration Tests

**3. Storage Upload Mutation Tests** (`tests/integration/upload-thumbnail.test.ts`):

```typescript
import { convexTest } from 'convex-test';
import { api } from '@/convex/_generated/api';

describe('uploadThumbnailToStorage', () => {
  it('should upload thumbnail and return storage ID', async () => {
    const t = convexTest();

    // Create test user and resume
    const userId = await t.db.insert('users', { clerkId: 'test-user' });
    const resumeId = await t.db.insert('builder_resumes', {
      userId,
      title: 'Test Resume',
      blocks: [],
      templateSlug: 'modern',
    });

    // Mock thumbnail blob
    const thumbnailBlob = new Uint8Array([137, 80, 78, 71]); // PNG header

    const result = await t.mutation(api.builder_resumes.uploadThumbnailToStorage, {
      resumeId,
      thumbnailBlob: Array.from(thumbnailBlob),
    });

    expect(result.success).toBe(true);
    expect(result.storageId).toBeDefined();

    // Verify database update
    const resume = await t.db.get(resumeId);
    expect(resume?.thumbnailStorageId).toBe(result.storageId);
  });

  it('should reject unauthorized upload', async () => {
    const t = convexTest({ auth: null }); // No auth

    await expect(
      t.mutation(api.builder_resumes.uploadThumbnailToStorage, {
        resumeId: 'invalid-id' as any,
        thumbnailBlob: [],
      })
    ).rejects.toThrow('Unauthorized');
  });

  it('should enforce ownership check', async () => {
    const t = convexTest();

    const userId1 = await t.db.insert('users', { clerkId: 'user-1' });
    const userId2 = await t.db.insert('users', { clerkId: 'user-2' });

    const resumeId = await t.db.insert('builder_resumes', {
      userId: userId1,
      title: 'User 1 Resume',
      blocks: [],
      templateSlug: 'modern',
    });

    // Authenticate as user-2, try to update user-1's resume
    t.setAuth({ subject: 'user-2' });

    await expect(
      t.mutation(api.builder_resumes.uploadThumbnailToStorage, {
        resumeId,
        thumbnailBlob: [],
      })
    ).rejects.toThrow('Forbidden');
  });

  it('should delete old thumbnail on update', async () => {
    const t = convexTest();

    const userId = await t.db.insert('users', { clerkId: 'test-user' });
    const oldStorageId = await t.storage.store(new Uint8Array([1, 2, 3]));

    const resumeId = await t.db.insert('builder_resumes', {
      userId,
      title: 'Test Resume',
      blocks: [],
      templateSlug: 'modern',
      thumbnailStorageId: oldStorageId,
    });

    // Upload new thumbnail
    await t.mutation(api.builder_resumes.uploadThumbnailToStorage, {
      resumeId,
      thumbnailBlob: Array.from(new Uint8Array([4, 5, 6])),
    });

    // Verify old storage deleted
    const oldUrl = await t.storage.getUrl(oldStorageId);
    expect(oldUrl).toBeNull();
  });
});
```

**4. Migration Script Tests** (`tests/integration/migrate-thumbnails.test.ts`):

```typescript
describe('thumbnail migration script', () => {
  it('should handle pagination correctly', async () => {
    const t = convexTest();

    // Create 250 resumes (3 pages at 100/page)
    const resumeIds = await Promise.all(
      Array.from({ length: 250 }, async (_, i) => {
        return await t.db.insert('builder_resumes', {
          title: `Resume ${i}`,
          blocks: [],
          thumbnailDataUrl: `data:image/png;base64,test-${i}`,
        });
      })
    );

    const result = await t.action(migrateThumbnails);

    expect(result.totalProcessed).toBe(250);
    expect(result.batches).toBe(3);
  });

  it('should handle partial failures gracefully', async () => {
    const t = convexTest();

    // Create resumes with valid and invalid data
    await t.db.insert('builder_resumes', {
      title: 'Valid',
      thumbnailDataUrl: 'data:image/png;base64,iVBORw0KGg==',
    });
    await t.db.insert('builder_resumes', {
      title: 'Invalid',
      thumbnailDataUrl: 'invalid-format',
    });

    const result = await t.action(migrateThumbnails);

    expect(result.migrated).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
  });

  it('should prevent infinite loops with max iteration check', async () => {
    const t = convexTest();

    // Mock listResumesForMigration to return same cursor infinitely
    const mockQuery = vi.spyOn(t, 'runQuery').mockImplementation(async (name, args) => {
      if (name === 'builder_resumes:listResumesForMigration') {
        return {
          resumes: [
            {
              _id: 'test-id',
              thumbnailDataUrl: 'data:image/png;base64,test',
            },
          ],
          nextCursor: 'stuck-cursor', // Same cursor every time
          hasMore: true, // Always says there's more
        };
      }
      return null;
    });

    // Should throw after maxIterations (10000)
    await expect(t.action(migrateThumbnails)).rejects.toThrow(
      'Pagination loop exceeded maximum iterations'
    );

    mockQuery.mockRestore();
  });

  it('should detect stuck cursor and abort', async () => {
    const t = convexTest();

    let callCount = 0;
    const mockQuery = vi.spyOn(t, 'runQuery').mockImplementation(async (name, args) => {
      if (name === 'builder_resumes:listResumesForMigration') {
        callCount++;

        // After first call, return same cursor
        if (callCount > 1 && args.cursor === 'cursor-1') {
          return {
            resumes: [{ _id: 'test-id', thumbnailDataUrl: 'data:image/png;base64,test' }],
            nextCursor: 'cursor-1', // Stuck cursor!
            hasMore: true,
          };
        }

        return {
          resumes: [{ _id: 'test-id', thumbnailDataUrl: 'data:image/png;base64,test' }],
          nextCursor: 'cursor-1',
          hasMore: true,
        };
      }
      return null;
    });

    // Should detect stuck cursor immediately
    await expect(t.action(migrateThumbnails)).rejects.toThrow(
      'Pagination cursor stuck - possible API malfunction'
    );

    expect(callCount).toBe(2); // Should abort after 2nd call
    mockQuery.mockRestore();
  });

  it('should allow cursor to be null initially', async () => {
    const t = convexTest();

    const resumeId = await t.db.insert('builder_resumes', {
      title: 'Test',
      thumbnailDataUrl: 'data:image/png;base64,test',
    });

    // Normal flow: cursor starts as null, then becomes non-null
    const result = await t.action(migrateThumbnails);

    expect(result.migrated).toBe(1);
    // No error thrown - null cursor is valid for first page
  });

  it('should be idempotent', async () => {
    const t = convexTest();

    const resumeId = await t.db.insert('builder_resumes', {
      title: 'Test',
      thumbnailDataUrl: 'data:image/png;base64,test',
    });

    // Run migration twice
    const result1 = await t.action(migrateThumbnails);
    const result2 = await t.action(migrateThumbnails);

    expect(result1.migrated).toBe(1);
    expect(result2.migrated).toBe(0); // Already migrated
    expect(result2.skipped).toBe(1);

    // Verify only one storage file created
    const resume = await t.db.get(resumeId);
    expect(resume?.thumbnailStorageId).toBeDefined();
  });
});
```

### End-to-End Tests

**5. RecordCard Display Tests** (`tests/e2e/thumbnail-display.test.ts`):

```typescript
import { test, expect } from '@playwright/test';

describe('RecordCard Thumbnail Display', () => {
  test('should show loading skeleton while fetching thumbnail', async ({ page }) => {
    await page.goto('/resumes');

    // Verify skeleton appears during loading
    const skeleton = page.locator('[aria-label="Loading thumbnail"]');
    await expect(skeleton).toBeVisible();

    // Wait for skeleton to disappear
    await expect(skeleton).not.toBeVisible({ timeout: 5000 });
  });

  test('should display error state when query fails', async ({ page }) => {
    // Mock getThumbnailUrl to throw an error
    await page.route('**/api/convex/*', (route) => {
      if (route.request().postData()?.includes('getThumbnailUrl')) {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Database connection failed' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/resumes');

    // Verify error state is shown
    const errorState = page.locator('[data-testid="thumbnail-error"]');
    await expect(errorState).toBeVisible();
    await expect(errorState).toContainText('Preview unavailable');

    // Verify error has red styling
    await expect(errorState.locator('span')).toHaveClass(/text-red-400/);
  });

  test('should display placeholder when thumbnail is missing', async ({ page }) => {
    // Mock getThumbnailUrl to return null
    await page.route('**/api/convex/*', (route) => {
      if (route.request().postData()?.includes('getThumbnailUrl')) {
        route.fulfill({
          status: 200,
          body: JSON.stringify({ result: null }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/resumes');

    // Verify placeholder is shown
    const placeholder = page.locator('[data-testid="thumbnail-placeholder"]');
    await expect(placeholder).toBeVisible();
    await expect(placeholder).toContainText('No preview available');
  });

  test('should display thumbnail image when loaded successfully', async ({ page }) => {
    await page.goto('/resumes');

    // Verify thumbnail image is rendered
    const thumbnail = page.locator('[data-testid="resume-thumbnail"]').first();
    await expect(thumbnail).toBeVisible();

    // Verify src is Convex storage URL (not data: URL)
    const src = await thumbnail.getAttribute('src');
    expect(src).toMatch(/^https:\/\/.*convex\.cloud/);

    // Verify lazy loading
    const loading = await thumbnail.getAttribute('loading');
    expect(loading).toBe('lazy');
  });

  test('should display storage-based thumbnail', async ({ page }) => {
    await page.goto('/dashboard');

    const thumbnail = page.locator('[data-testid="resume-thumbnail"]').first();
    await expect(thumbnail).toBeVisible();

    // Verify src is Convex storage URL (not data: URL)
    const src = await thumbnail.getAttribute('src');
    expect(src).toMatch(/^https:\/\/.*convex\.cloud/);
  });

  test('should fall back to base64 during migration', async ({ page }) => {
    // Test resume with only thumbnailDataUrl (not yet migrated)
    await page.goto('/dashboard?test-legacy=true');

    const thumbnail = page.locator('[data-testid="resume-thumbnail"]').first();
    await expect(thumbnail).toBeVisible();

    const src = await thumbnail.getAttribute('src');
    expect(src).toMatch(/^data:image\/(png|jpeg);base64,/);
  });


  test('should honor base64 rollback flag', async ({ page }) => {
    // Simulate feature flag override so legacy data path is used
    await page.route('**/api/feature-flags', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({ THUMBNAIL_PREFER_BASE64: true }),
      });
    });

    await page.goto('/dashboard');

    const thumbnail = page.locator("[data-testid='resume-thumbnail']").first();
    await expect(thumbnail).toBeVisible();

    const src = await thumbnail.getAttribute('src');
    expect(src).toMatch(/^data:image\/(png|jpeg);base64,/);
  });
  test('should lazy load thumbnails', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify thumbnails below fold have loading="lazy"
    const belowFoldThumbnail = page.locator('[data-testid="resume-thumbnail"]').nth(10);
    const loading = await belowFoldThumbnail.getAttribute('loading');
    expect(loading).toBe('lazy');
  });

  test('should handle missing thumbnail gracefully', async ({ page }) => {
    // Test resume with no thumbnail
    await page.goto('/dashboard?test-no-thumbnail=true');

    const placeholder = page.locator('[data-testid="thumbnail-placeholder"]');
    await expect(placeholder).toBeVisible();
  });
});
```

### Component Unit Tests

**6. RecordCard Error State Tests** (`tests/unit/RecordCard.test.tsx`):

```typescript
import { render, screen } from '@testing-library/react';
import { RecordCard } from '@/components/records/RecordCard';
import { useQuery } from 'convex/react';

// Mock Convex useQuery hook
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
}));

describe('RecordCard Error States', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading skeleton when query is pending', () => {
    (useQuery as jest.Mock).mockReturnValue(undefined);

    render(<RecordCard resumeId="test-id" />);

    const skeleton = screen.getByLabelText('Loading thumbnail');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('animate-pulse');
  });

  it('should render error state when query throws an error', () => {
    const error = new Error('Database connection failed');
    (useQuery as jest.Mock).mockReturnValue(error);

    render(<RecordCard resumeId="test-id" />);

    const errorElement = screen.getByTestId('thumbnail-error');
    expect(errorElement).toBeInTheDocument();
    expect(errorElement).toHaveAttribute('aria-label', 'Thumbnail failed to load');

    const errorText = screen.getByText('Preview unavailable');
    expect(errorText).toHaveClass('text-red-400');
  });

  it('should log error message when query fails', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('Permission denied');
    (useQuery as jest.Mock).mockReturnValue(error);

    render(<RecordCard resumeId="test-id" />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Failed to fetch thumbnail:',
      'Permission denied'
    );

    consoleErrorSpy.mockRestore();
  });

  it('should render placeholder when thumbnail is null', () => {
    (useQuery as jest.Mock).mockReturnValue(null);

    render(<RecordCard resumeId="test-id" />);

    const placeholder = screen.getByTestId('thumbnail-placeholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('aria-label', 'No thumbnail available');

    const placeholderText = screen.getByText('No preview available');
    expect(placeholderText).toHaveClass('text-gray-400');
  });

  it('should render placeholder when url is missing', () => {
    (useQuery as jest.Mock).mockReturnValue({ url: null });

    render(<RecordCard resumeId="test-id" />);

    const placeholder = screen.getByTestId('thumbnail-placeholder');
    expect(placeholder).toBeInTheDocument();
  });

  it('should render thumbnail image when query succeeds', () => {
    const mockUrl = 'https://example.convex.cloud/storage/abc123';
    (useQuery as jest.Mock).mockReturnValue({ url: mockUrl });

    render(<RecordCard resumeId="test-id" />);

    const image = screen.getByAltText('Resume preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockUrl);
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('should distinguish between error and null states', () => {
    // Test error state
    const { rerender } = render(<RecordCard resumeId="test-id" />);
    (useQuery as jest.Mock).mockReturnValue(new Error('Failed'));
    rerender(<RecordCard resumeId="test-id" />);
    expect(screen.getByText('Preview unavailable')).toHaveClass('text-red-400');

    // Test null state
    (useQuery as jest.Mock).mockReturnValue(null);
    rerender(<RecordCard resumeId="test-id" />);
    expect(screen.getByText('No preview available')).toHaveClass('text-gray-400');
  });
});
```

### Rollback Validation Tests

**7. Fallback Logic Tests** (`tests/integration/thumbnail-fallback.test.ts`):

```typescript
describe('thumbnail fallback behavior', () => {
  it('should prioritize storage over base64', async () => {
    const t = convexTest();

    const storageId = await t.storage.store(new Uint8Array([1, 2, 3]));
    const resumeId = await t.db.insert('builder_resumes', {
      title: 'Test',
      thumbnailStorageId: storageId,
      thumbnailDataUrl: 'data:image/png;base64,fallback',
    });

    const result = await t.query(api.builder_resumes.getThumbnailUrl, { resumeId });

    expect(result.source).toBe('storage');
    expect(result.url).toMatch(/convex\.cloud/);
  });

  it('should fall back to base64 when storage unavailable', async () => {
    const t = convexTest();

    const resumeId = await t.db.insert('builder_resumes', {
      title: 'Test',
      thumbnailDataUrl: 'data:image/png;base64,fallback',
    });

    const result = await t.query(api.builder_resumes.getThumbnailUrl, { resumeId });

    expect(result.source).toBe('base64');
    expect(result.url).toMatch(/^data:image/);
  });

  it('should handle feature flag for rollback', async () => {
    const t = convexTest();

    // ✅ Use Vitest's env mocking utilities for proper test isolation
    vi.stubEnv('THUMBNAIL_PREFER_BASE64', 'true');

    try {
      const storageId = await t.storage.store(new Uint8Array([1, 2, 3]));

      const resumeId = await t.db.insert('builder_resumes', {
        title: 'Test',
        thumbnailStorageId: storageId,
        thumbnailDataUrl: 'data:image/png;base64,fallback',
      });

      const result = await t.query(api.builder_resumes.getThumbnailUrl, { resumeId });

      // Should use base64 despite storage available
      expect(result.source).toBe('base64');
    } finally {
      // Always clean up env mocks to prevent side effects
      vi.unstubAllEnvs();
    }
  });

  it('should default to storage when feature flag is not set', async () => {
    const t = convexTest();

    // Explicitly ensure flag is not set (test isolation)
    vi.stubEnv('THUMBNAIL_PREFER_BASE64', '');

    try {
      const storageId = await t.storage.store(new Uint8Array([1, 2, 3]));

      const resumeId = await t.db.insert('builder_resumes', {
        title: 'Test',
        thumbnailStorageId: storageId,
        thumbnailDataUrl: 'data:image/png;base64,fallback',
      });

      const result = await t.query(api.builder_resumes.getThumbnailUrl, { resumeId });

      // Should use storage by default
      expect(result.source).toBe('storage');
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
```

### Test Best Practices

#### Environment Variable Testing

**❌ Anti-Pattern: Direct process.env Manipulation**

```typescript
// AVOID: Direct mutation causes test pollution
it('test with feature flag', () => {
  process.env.FEATURE_FLAG = 'true';
  // ... test code
  delete process.env.FEATURE_FLAG; // Easy to forget!
});

// Next test may unexpectedly see FEATURE_FLAG=true
```

**Problems:**
- Test pollution: Side effects leak to other tests
- Race conditions: Parallel tests can interfere
- Cleanup errors: Easy to forget to reset
- Hard to debug: Non-deterministic failures

**✅ Best Practice: Use Test Utilities**

```typescript
import { vi } from 'vitest';

it('test with feature flag', () => {
  // Vitest provides proper env stubbing
  vi.stubEnv('FEATURE_FLAG', 'true');

  try {
    // Test code here
  } finally {
    vi.unstubAllEnvs(); // Always cleanup, even on test failure
  }
});
```

**Benefits:**
- Test isolation: Each test has clean environment
- Automatic cleanup: Guaranteed reset even on errors
- Type safety: Better IDE support
- Clear intent: Explicit mocking

**Alternative: Dependency Injection**

For more complex scenarios, inject configuration:

```typescript
// convex/builder_resumes.ts
interface ThumbnailConfig {
  preferBase64?: boolean;
}

export const getThumbnailUrl = query({
  args: {
    resumeId: v.id("builder_resumes"),
    config: v.optional(v.object({
      preferBase64: v.optional(v.boolean()),
    })),
  },
  handler: async (ctx, args) => {
    // Use injected config, fallback to env var
    const preferBase64 = args.config?.preferBase64 ??
                        process.env.THUMBNAIL_PREFER_BASE64 === 'true';

    // ... rest of implementation
  },
});

// In tests: inject config directly (no env manipulation)
const result = await t.query(api.builder_resumes.getThumbnailUrl, {
  resumeId,
  config: { preferBase64: true }, // Explicit, no side effects
});
```

**When to Use Each Approach:**

| Approach | Use When | Benefits |
|----------|----------|----------|
| **vi.stubEnv()** | Testing env-dependent behavior | Simple, mirrors production |
| **Dependency Injection** | Complex config, multiple options | More flexible, explicit |
| **Feature Flag Service** | Many flags, dynamic values | Centralized, production-ready |

#### Test Setup and Teardown Patterns

**Pattern 1: Test Suite-Level Cleanup (beforeEach/afterEach)**

```typescript
describe('Thumbnail Tests', () => {
  let envCleanup: (() => void) | undefined;

  afterEach(() => {
    // Guaranteed cleanup after each test
    if (envCleanup) {
      envCleanup();
      envCleanup = undefined;
    }
  });

  it('test with feature flag enabled', async () => {
    vi.stubEnv('THUMBNAIL_PREFER_BASE64', 'true');
    envCleanup = () => vi.unstubAllEnvs();

    // Test code - cleanup happens automatically in afterEach
    const result = await t.query(...);
    expect(result.source).toBe('base64');
  });

  it('test with feature flag disabled', async () => {
    // Previous test's env is already cleaned up
    vi.stubEnv('THUMBNAIL_PREFER_BASE64', 'false');
    envCleanup = () => vi.unstubAllEnvs();

    const result = await t.query(...);
    expect(result.source).toBe('storage');
  });
});
```

**Pattern 2: Isolated Test Helper**

```typescript
/**
 * Test helper that ensures env cleanup
 */
async function testWithEnv<T>(
  env: Record<string, string | undefined>,
  testFn: () => Promise<T>
): Promise<T> {
  try {
    // Stub all env vars
    for (const [key, value] of Object.entries(env)) {
      vi.stubEnv(key, value ?? '');
    }

    return await testFn();
  } finally {
    // Always cleanup, even on test failure or assertion error
    vi.unstubAllEnvs();
  }
}

// Usage:
it('should handle rollback mode', async () => {
  await testWithEnv(
    { THUMBNAIL_PREFER_BASE64: 'true' },
    async () => {
      const result = await t.query(api.builder_resumes.getThumbnailUrl, { resumeId });
      expect(result.source).toBe('base64');
    }
  );
  // Env automatically cleaned up
});
```

**Pattern 3: Snapshot Original Env (for edge cases)**

```typescript
describe('Thumbnail Tests', () => {
  const originalEnv = { ...process.env };

  afterAll(() => {
    // Restore original environment after all tests
    process.env = originalEnv;
  });

  // ... tests
});
```

**⚠️ Common Pitfalls to Avoid:**

```typescript
// ❌ WRONG: Cleanup in test body (can skip on early return/error)
it('test', () => {
  vi.stubEnv('FLAG', 'true');
  if (someCondition) return; // Cleanup skipped!
  vi.unstubAllEnvs();
});

// ❌ WRONG: Async cleanup without await
it('test', async () => {
  vi.stubEnv('FLAG', 'true');
  await someAsyncOperation();
  vi.unstubAllEnvs(); // Might execute before async completes
});

// ✅ CORRECT: try-finally guarantees cleanup
it('test', async () => {
  vi.stubEnv('FLAG', 'true');
  try {
    await someAsyncOperation();
  } finally {
    vi.unstubAllEnvs(); // Always executes
  }
});
```

### Test Coverage Goals

- Unit tests: >90% coverage for conversion logic
- Integration tests: 100% coverage for mutations and queries
- E2E tests: All critical user paths (dashboard, resume editor)
- Migration script: 100% coverage including error paths
- Test isolation: All tests must pass when run in any order

## Rollback Procedure

### Feature Flag Configuration

#### Type-Safe Feature Flag Implementation

**❌ Anti-Pattern: Raw String Comparison**

```typescript
// AVOID: Prone to typos, no type safety, repeated parsing
const preferBase64 = process.env.THUMBNAIL_PREFER_BASE64 === 'true';

// Later in code:
const preferBase64Again = process.env.THUMBNAIL_PREFER_BASE64 === 'true'; // Duplicated
const preferBase64Typo = process.env.THUMBNAIL_PREFFER_BASE64 === 'true'; // Typo! No error!
```

**Problems:**
- **Typos**: Environment variable names as strings
- **Inconsistency**: Repeated parsing logic across files
- **No validation**: Invalid values silently treated as false
- **Testing**: Hard to mock consistently

**✅ Best Practice: Type-Safe Feature Flag Module**

Create a centralized, type-safe feature flag configuration:

```typescript
// convex/lib/featureFlags.ts

/**
 * Type-safe feature flag configuration
 * Centralizes all environment variable parsing and validation
 */

export const FEATURE_FLAGS = {
  /**
   * THUMBNAIL_PREFER_BASE64
   * Emergency rollback flag to prefer base64 thumbnails over storage
   *
   * @default false
   * @example
   * // Enable rollback:
   * npx convex env set THUMBNAIL_PREFER_BASE64 true --prod
   *
   * // Disable (normal mode):
   * npx convex env set THUMBNAIL_PREFER_BASE64 false --prod
   */
  THUMBNAIL_PREFER_BASE64: parseBooleanEnv('THUMBNAIL_PREFER_BASE64', false),

  /**
   * THUMBNAIL_MIGRATION_BATCH_SIZE
   * Number of resumes to migrate per batch
   *
   * @default 100
   */
  THUMBNAIL_MIGRATION_BATCH_SIZE: parseIntEnv('THUMBNAIL_MIGRATION_BATCH_SIZE', 100),
  /**
   * THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL
   * Successful migrations between progress log entries
   *
   * @default 100
   */
  THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL: parseIntEnv('THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL', 100, { min: 1 }),
} as const;

/**
 * Parse boolean environment variable with validation
 */
function parseBooleanEnv(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  // Validate value
  if (value !== 'true' && value !== 'false') {
    console.warn(
      `Invalid boolean value for ${key}: "${value}". ` +
      `Expected "true" or "false". Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  return value === 'true';
}

/**
 * Parse integer environment variable with validation
 */
function parseIntEnv(key: string, defaultValue: number): number {
  const value = process.env[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed) || parsed < 0) {
    console.warn(
      `Invalid integer value for ${key}: "${value}". ` +
      `Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  return parsed;
}

/**
 * Type-safe feature flag interface
 * Ensures TypeScript catches typos at compile time
 */
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

/**
 * Get feature flag value with type safety
 */
export function getFeatureFlag<K extends FeatureFlagKey>(
  key: K
): typeof FEATURE_FLAGS[K] {
  return FEATURE_FLAGS[key];
}
```

**Usage in Queries:**

```typescript
// convex/builder_resumes.ts
import { FEATURE_FLAGS } from './lib/featureFlags';

export const getThumbnailUrl = query({
  args: { resumeId: v.id("builder_resumes") },
  handler: async (ctx, args) => {
    const resume = await ctx.db.get(args.resumeId);
    if (!resume) throw new Error("Resume not found");

    // ✅ Type-safe, validated, documented
    if (FEATURE_FLAGS.THUMBNAIL_PREFER_BASE64) {
      // ROLLBACK MODE: Prefer base64 over storage
      if (resume.thumbnailDataUrl) {
        return {
          url: resume.thumbnailDataUrl,
          source: 'base64' as const,
        };
      } else if (resume.thumbnailStorageId) {
        return {
          url: await ctx.storage.getUrl(resume.thumbnailStorageId),
          source: 'storage' as const,
        };
      }
    } else {
      // NORMAL MODE: Prefer storage over base64
      if (resume.thumbnailStorageId) {
        return {
          url: await ctx.storage.getUrl(resume.thumbnailStorageId),
          source: 'storage' as const,
        };
      } else if (resume.thumbnailDataUrl) {
        return {
          url: resume.thumbnailDataUrl,
          source: 'base64' as const,
        };
      }
    }

    return { url: null, source: 'none' as const };
  },
});
```

For detailed feature flag testing patterns (e.g., `vi.resetModules()`, `require()` usage, shared helpers), see [Testing Guide – Module Cache & Feature Flags](../TESTING_GUIDE.md#module-cache-feature-flags).

**Testing Pattern Explanation: Why require() Instead of import**

The test pattern above uses `require()` instead of ES6 `import` statements. This is intentional and necessary:

**Module Caching Behavior:**
- ES6 `import` statements are **hoisted** and evaluated before any test code runs
- Once a module is imported, its exports are cached permanently for the session
- Feature flags are computed at module load time (top-level code execution)
- Changing `process.env` after module load has no effect on cached values

**Why require() Works:**
```typescript
// ❌ This DOESN'T work - import is hoisted, happens before stubEnv
import { FEATURE_FLAGS } from '@/convex/lib/featureFlags'; // Always uses initial env
vi.stubEnv('THUMBNAIL_PREFER_BASE64', 'true');
expect(FEATURE_FLAGS.THUMBNAIL_PREFER_BASE64).toBe(true); // FAILS
vi.unstubAllEnvs(); // Cleanup

// ✅ This WORKS - require() is called after stubEnv and resetModules
vi.stubEnv('THUMBNAIL_PREFER_BASE64', 'true');
vi.resetModules(); // Clear module cache
const { FEATURE_FLAGS } = require('@/convex/lib/featureFlags'); // Fresh import
expect(FEATURE_FLAGS.THUMBNAIL_PREFER_BASE64).toBe(true); // PASSES
vi.unstubAllEnvs(); // Cleanup
```

**Common Pitfalls:**
1. **Forgetting `vi.resetModules()`**: Module stays cached, env changes ignored
2. **Using `beforeEach` instead of `afterEach`**: Cache cleared too early, test sees stale values
3. **Mixing import/require**: Import happens first (hoisted), require gets cached values
4. **Not cleaning up env stubs**: Other tests see modified env values

**When to Use This Pattern:**
- Testing any module with top-level environment variable evaluation
- Testing configuration objects computed at import time
- Testing singleton patterns initialized during module load
- Any scenario where you need to test different env configurations in the same test suite

**When NOT to Use This Pattern:**
- If feature flags are read lazily (function-based getters)
- If configuration is passed as constructor arguments
- If values can be mocked/injected without module re-import

**Reusable Test Helper (Recommended)**

To reduce boilerplate and prevent mistakes with manual `afterEach` cleanup, wrap the pattern in a shared helper. This centralizes the `vi.stubEnv` + `vi.resetModules` sequence and guarantees cleanup even if the test throws:

```typescript
// tests/helpers/featureFlagTestHelper.ts
import { vi } from 'vitest';

/**
 * Vitest API reference:
 * vi.stubEnv(name: string, value: string): Vitest
 *   - name: env var key to override
 *   - value: replacement string shared with process.env
 * vi.unstubAllEnvs(): void — restores all stubbed values.
 */
export function testWithFeatureFlag<T>(
  flags: Record<string, string>,
  testFn: () => Promise<T>
): Promise<T>;
export function testWithFeatureFlag<T>(
  flags: Record<string, string>,
  testFn: () => T
): T;
export function testWithFeatureFlag<T>(
  flags: Record<string, string>,
  testFn: () => Promise<T> | T
): Promise<T> | T {
  const cleanup = () => {
    vi.unstubAllEnvs();
  };

  try {
    for (const [key, value] of Object.entries(flags)) {
      vi.stubEnv(key, value);
    }

    vi.resetModules(); // Ensure fresh import with new env values
    const result = testFn();
    if (result instanceof Promise) {
      return result.finally(cleanup);
    }

    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

// Usage in tests
it('should use storage by default', async () => {
  const result = await testWithFeatureFlag({}, async () => {
    const { FEATURE_FLAGS } = await import('@/convex/lib/featureFlags');
    return FEATURE_FLAGS.THUMBNAIL_PREFER_BASE64;
  });
  expect(result).toBe(false);
});
```

**Benefits:**
- Eliminates duplicate cleanup logic across test files
- Reduces risk of forgetting `vi.resetModules()` after stubbing
- Makes the intent of each test clearer (`testWithFeatureFlag` wrapper reads like documentation)
- Easy to extend with additional assertions or logging (e.g., capture warnings about invalid env values)

**Benefits:**

| Aspect | Before | After |
|--------|--------|-------|
| **Type Safety** | String literals, no type checking | TypeScript catches typos at compile time |
| **Validation** | Silently treats invalid as false | Warns on invalid values, uses defaults |
| **Documentation** | No inline docs | JSDoc with examples and defaults |
| **Consistency** | Repeated parsing logic | Single source of truth |
| **Testing** | Hard to mock | Easy to test with module mocking |
| **Discoverability** | Search for `process.env` | Import from central module |

**Recommendation: Extract to Reusable Utilities**

The `parseBooleanEnv` and `parseIntEnv` helper functions are generic utilities that should be extracted to a shared module for reuse across the codebase:

```typescript
// convex/lib/env-utils.ts

/**
 * Reusable environment variable parsing utilities (v1)
 *
 * Provides type-safe parsing with validation and default values.
 *
 * **Purpose:**
 * Centralizes validation and type-safe parsing to prevent:
 * - Repeated parsing logic across feature flags and config modules
 * - Typos in env var names (compile-time checked via typed imports)
 * - Silent failures on invalid values (logs warnings, uses defaults)
 * - Inconsistent validation behavior (single source of truth)
 *
 * **Library Choice Rationale:**
 * This is a lightweight, zero-dependency solution suitable for simple use cases.
 *
 * **When to keep this approach:**
 * - Small number of environment variables (<20 flags)
 * - Simple validation rules (type checking, min/max constraints)
 * - No nested configuration objects needed
 * - Team prefers minimal dependencies
 *
 * **When to migrate to a library (e.g., `envalid`, `dotenv-safe`, `zod`):**
 * - Complex validation schemas (regex patterns, cross-field validation)
 * - Nested configuration objects or environment-specific overrides
 * - Need for strict mode (fail-fast on missing required vars)
 * - JSON/array parsing from environment variables
 * - 20+ environment variables becoming hard to maintain
 * - Team already uses Zod/Joi for other validation
 *
 * **Version History:**
 * - v1: Initial implementation with boolean, integer, and string parsing
 *
 * @packageDocumentation
 */

export interface ParseOptions<T> {
  /**
   * Optional validator invoked after parsing. Return `{ valid: false }` to reject the value.
   */
  validate?: (value: T) => { valid: boolean; reason?: string };
}

/**
 * Parse boolean environment variable with validation
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set or invalid
 * @param options - Optional validation hook
 * @returns Parsed boolean value
 *
 * @example
 * const enabled = parseBooleanEnv('FEATURE_ENABLED', false, {
 *   validate: (value) => value ? { valid: true } : { valid: false, reason: 'Feature requires manual opt-in' }
 * });
 *
 * @since v1
 */
export function parseBooleanEnv(
  key: string,
  defaultValue: boolean,
  options?: ParseOptions<boolean>
): boolean {
  const value = process.env[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (value !== 'true' && value !== 'false') {
    console.warn(
      `Invalid boolean value for ${key}: "${value}". ` +
      `Expected "true" or "false". Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  const parsed = value === 'true';

  if (options?.validate) {
    const { valid, reason } = options.validate(parsed);
    if (!valid) {
      console.warn(
        `Validation failed for ${key}. ` +
        `${reason ? `Reason: ${reason}. ` : ''}Using default: ${defaultValue}`
      );
      return defaultValue;
    }
  }

  return parsed;
}

/**
 * Parse integer environment variable with validation
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set or invalid
 * @param options - Optional validation constraints
 * @returns Parsed integer value
 *
 * @example
 * const batchSize = parseIntEnv('BATCH_SIZE', 100);
 * const port = parseIntEnv('PORT', 3000, { min: 1, max: 65535 });
 *
 * @since v1
 */
export interface IntParseOptions extends ParseOptions<number> {
  min?: number;
  max?: number;
}

export function parseIntEnv(
  key: string,
  defaultValue: number,
  options?: IntParseOptions
): number {
  const value = process.env[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);

  if (isNaN(parsed)) {
    console.warn(
      `Invalid integer value for ${key}: "${value}". ` +
      `Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  // Validate min/max constraints
  if (options?.min !== undefined && parsed < options.min) {
    console.warn(
      `Value for ${key} (${parsed}) is below minimum (${options.min}). ` +
      `Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  if (options?.max !== undefined && parsed > options.max) {
    console.warn(
      `Value for ${key} (${parsed}) is above maximum (${options.max}). ` +
      `Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  if (options?.validate) {
    const { valid, reason } = options.validate(parsed);
    if (!valid) {
      console.warn(
        `Validation failed for ${key}. ` +
        `${reason ? `Reason: ${reason}. ` : ''}Using default: ${defaultValue}`
      );
      return defaultValue;
    }
  }

  return parsed;
}

/**
 * Parse string environment variable with validation
 *
 * @param key - Environment variable name
 * @param defaultValue - Default value if not set
 * @param allowedValues - Optional list of allowed values
 * @returns Parsed string value
 *
 * @example
 * const env = parseStringEnv('NODE_ENV', 'development', ['development', 'production']);
 *
 * @since v1
 */
export function parseStringEnv(
  key: string,
  defaultValue: string,
  allowedValues?: string[]
): string {
  const value = process.env[key];

  if (value === undefined || value === '') {
    return defaultValue;
  }

  if (allowedValues && !allowedValues.includes(value)) {
    console.warn(
      `Invalid value for ${key}: "${value}". ` +
      `Expected one of: ${allowedValues.join(', ')}. ` +
      `Using default: ${defaultValue}`
    );
    return defaultValue;
  }

  return value;
}
```

**Updated Feature Flags Module:**

```typescript
// convex/lib/featureFlags.ts
import { parseBooleanEnv, parseIntEnv } from './env-utils';

export const FEATURE_FLAGS = {
  THUMBNAIL_PREFER_BASE64: parseBooleanEnv('THUMBNAIL_PREFER_BASE64', false),
  THUMBNAIL_MIGRATION_BATCH_SIZE: parseIntEnv('THUMBNAIL_MIGRATION_BATCH_SIZE', 100, {
  THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL: parseIntEnv('THUMBNAIL_MIGRATION_PROGRESS_LOG_INTERVAL', 100, { min: 1, max: 1000 }),
    min: 1,
    max: 1000
  }),
} as const;
```

**Additional Use Cases:**

```typescript
// Rate limiting configuration
// convex/lib/rateLimits.ts
import { parseIntEnv } from './env-utils';

export const RATE_LIMITS = {
  MAX_REQUESTS_PER_MINUTE: parseIntEnv('RATE_LIMIT_RPM', 60, { min: 1, max: 1000 }),
  MAX_CONCURRENT_UPLOADS: parseIntEnv('MAX_CONCURRENT_UPLOADS', 3, { min: 1, max: 10 }),
} as const;

// Server configuration
// convex/lib/serverConfig.ts
import { parseStringEnv, parseIntEnv, parseBooleanEnv } from './env-utils';

export const SERVER_CONFIG = {
  NODE_ENV: parseStringEnv('NODE_ENV', 'development', ['development', 'production', 'test']),
  PORT: parseIntEnv('PORT', 3000, { min: 1, max: 65535 }),
  ENABLE_DEBUG_LOGGING: parseBooleanEnv('DEBUG', false),
} as const;
```

**Benefits of Extraction:**

- ✅ **Reusability**: Use across all configuration modules
- ✅ **Consistency**: Same validation logic everywhere
- ✅ **Testability**: Test utilities once, confidence everywhere
- ✅ **Maintainability**: Update validation in one place
- ✅ **Extensibility**: Easy to add new parsers (parseFloatEnv, parseArrayEnv, etc.)
- ✅ **Documentation**: Centralized with examples

### Rollback Steps

**If issues detected during/after migration:**

1. **Immediate Mitigation** (< 5 minutes):
   ```bash
   # Enable feature flag to revert to base64
   npx convex env set THUMBNAIL_PREFER_BASE64 true --prod

   # Verify rollback
   npx convex query builder_resumes:getThumbnailUrl '{"resumeId": "test-id"}'
   # Should show source: "base64"
   ```

2. **Revert Code Changes** (if needed):
   ```bash
   # Revert UI components to use thumbnailDataUrl
   git revert <commit-hash-phase-2>

   # Revert hook changes
   git revert <commit-hash-phase-1>

   # Deploy
   npm run deploy
   ```

3. **Pause Migration Script**:
   ```bash
   # If migration is running, signal it to stop
   # (requires adding signal handling to migration script)
   kill -TERM <migration-process-pid>
   ```

4. **Verify System Health**:
   ```bash
   # Check that base64 thumbnails are loading
   npx convex query builder_resumes:healthCheckThumbnails

   # Monitor error rates
   # Check application logs for thumbnail load failures
   ```

5. **Database Cleanup** (if corruption occurred):
   ```typescript
   // Repair script to clear dangling storage IDs
   // Uses batching for performance at scale (10k+ resumes)
   export const repairDanglingStorageIds = mutation({
     handler: async (ctx) => {
       const resumes = await ctx.db.query("builder_resumes").collect();
       let repaired = 0;
       let checked = 0;
       const batchSize = 100; // Process 100 mutations at a time
       let batch: Promise<void>[] = [];

       console.log(`Checking ${resumes.length} resumes for dangling storage IDs...`);

       for (const resume of resumes) {
         checked++;

         if (resume.thumbnailStorageId) {
           // Check if storage file exists
           const url = await ctx.storage.getUrl(resume.thumbnailStorageId);

           if (!url && resume.thumbnailDataUrl) {
             // Storage ID is dangling (file doesn't exist) but base64 is available
             // Queue patch operation
             batch.push(
               ctx.db.patch(resume._id, {
                 thumbnailStorageId: undefined,
               }).then(() => {
                 repaired++;
                 console.log(`Repaired resume ${resume._id} (${repaired}/${checked})`);
               })
             );

             // Execute batch when it reaches batchSize
            if (batch.length >= batchSize) {
              const batchStartTime = Date.now();
              await Promise.all(batch);
              const batchDuration = Date.now() - batchStartTime;
              console.log(
                `Batch complete in ${batchDuration}ms - ${batch.length} repairs this batch (${repaired} total, ${checked} checked)`
              );
              batch = []; // Reset batch
            }
           }
         }

         // Progress logging every 1000 resumes
         if (checked % 1000 === 0) {
           console.log(`Progress: ${checked}/${resumes.length} checked, ${repaired} repaired`);
         }
       }

       // Execute remaining batch
      if (batch.length > 0) {
        const batchStartTime = Date.now();
        await Promise.all(batch);
        const batchDuration = Date.now() - batchStartTime;
        console.log(
          `Final batch complete in ${batchDuration}ms - ${batch.length} repairs this batch (${repaired} total, ${checked} checked)`
        );
      }

       console.log(`\nRepair complete: ${repaired} dangling storage IDs cleared`);
       return {
         checked,
         repaired,
         success: true
       };
     },
   });
   ```

   **Performance Comparison:**

   | Approach | 1,000 resumes | 10,000 resumes | 100,000 resumes |
   |----------|--------------|----------------|-----------------|
   | **Sequential** (old) | ~10s | ~100s (1.6min) | ~1000s (16min) |
   | **Batched** (new) | ~2s | ~20s | ~200s (3.3min) |
   | **Speedup** | 5x | 5x | 5x |

   **Why Batching Helps:**
   - Parallelizes database writes (100 at a time)
   - Reduces round-trip latency overhead
   - Prevents overwhelming the database with sequential operations
   - Provides progress logging for long-running operations

   **When to Run Repair Script:**

   This script serves two purposes: fixing corruption after rollback and ongoing health monitoring.

   **Immediate Execution (Required):**
   - Immediately after rollback if `THUMBNAIL_PREFER_BASE64` was toggled to `true`
   - After any storage system failure that may have left dangling IDs
   - Before re-attempting migration to ensure clean starting state

   **Scheduled Monitoring (Recommended):**

   | Phase | Frequency | Rationale |
   |-------|-----------|-----------|
   | **During Migration (Phase 3)** | Daily | Catch issues early while data is actively changing |
   | **First Month Post-Migration** | Weekly | Monitor for delayed issues or edge cases |
   | **Ongoing (Stable)** | Monthly | Routine health check, or on-alert only |
   | **After Incidents** | Ad-hoc | After any storage-related alerts or user reports |

   **Automated Monitoring Integration:**

   Add to your monitoring dashboard:
   ```typescript
   // Example: Scheduled health check query
   export const checkDanglingStorageIds = query({
     handler: async (ctx) => {
       const resumes = await ctx.db
         .query("builder_resumes")
         .filter((q) => q.neq(q.field("thumbnailStorageId"), undefined))
         .collect();

       let danglingCount = 0;
       for (const resume of resumes) {
         if (resume.thumbnailStorageId) {
           const url = await ctx.storage.getUrl(resume.thumbnailStorageId);
           if (!url) danglingCount++;
         }
       }

       return { danglingCount, total: resumes.length };
     },
   });
   ```

   **Alert Threshold:**
   - **Warning**: `danglingCount > 0` (investigate within 24 hours)
   - **Critical**: `danglingCount > 10` or `danglingCount / total > 1%` (run repair script immediately)

   **Example Monitoring Schedule:**
   ```bash
   # Weekly health check (add to cron or CI/CD)
   npx convex run builder_resumes:checkDanglingStorageIds --prod

   # If dangling IDs detected, run repair
   npx convex run builder_resumes:repairDanglingStorageIds --prod
   ```

   **Best Practices:**
   - Run repair script during low-traffic hours (reduces database load)
   - Monitor execution time to detect performance degradation
   - Keep repair script even after migration is stable (permanent safety net)
   - Document repair executions in incident logs for future reference
   ```

6. **Post-Rollback Verification**:
   - [ ] Dashboard loads successfully
   - [ ] All thumbnails visible
   - [ ] No console errors
   - [ ] Query latency back to baseline
   - [ ] User reports resolved

### Rollback Testing

Before migration, validate rollback procedure:

```bash
# 1. Enable feature flag in dev
npx convex env set THUMBNAIL_PREFER_BASE64 true --dev

# 2. Verify fallback works
npm run test:e2e -- thumbnail-display.test.ts

# 3. Test repair script
npx convex run builder_resumes:repairDanglingStorageIds --dev

# 4. Disable feature flag
npx convex env set THUMBNAIL_PREFER_BASE64 false --dev
```

### Rollback Decision Criteria

Trigger rollback if:

- Thumbnail load failure rate > 5%
- Dashboard load time increases > 50%
- Storage upload failure rate > 10%
- User-reported issues > 10 within 1 hour
- Critical bug discovered in migration logic

## Success Metrics

### Before Migration
- Average thumbnail size: ~100KB (base64)
- Dashboard load time: ~2-3s for 20 resumes
- Database size: Growing linearly with resumes
- getThumbnailUrl p95 latency: N/A (data in resume object)

### After Migration
- Average thumbnail size: ~30KB (native PNG via CDN)
- Dashboard load time: ~0.5-1s for 20 resumes (CDN cached)
- Database size: Decoupled from thumbnail storage
- getThumbnailUrl p95 latency: <100ms
- Storage usage: Tracked separately from database
- Failed uploads: <0.1% of attempts

## Risk Mitigation

1. **Backward Compatibility**: Keep both fields during transition (Phase 1-3)
2. **Gradual Rollout**: Migrate in batches, monitor for issues between batches
3. **Feature Flag Rollback**: Instant revert to base64 without deployment
4. **Comprehensive Testing**: Unit, integration, E2E, and rollback tests
5. **Observability**: Real-time monitoring of migration progress and system health
6. **Data Validation**: Health checks to detect and repair data inconsistencies

## Timeline Summary

| Phase | Duration | Effort | Priority |
|-------|----------|--------|----------|
| Phase 1: Implement Storage Upload | 1 week | Medium | High |
| Phase 2: Update UI | 1 week | Low | High |
| Phase 3: Migrate Data | 1 week | Low | Medium |
| Phase 4: Deprecate Base64 | 1 week | Low | Medium |
| Phase 5: Remove Legacy | 1 week | Low | Low |
| **Total** | **5 weeks** | **Medium** | **High** |

**Note:** Table assumes Phases 1-5 proceed while approvals are wrapping up. If approvals are strictly sequential, expect additional buffer (≈1 week).
## Immediate Action Items

**⚠️ PREREQUISITE - Phase 0 Validation (MUST BE COMPLETED FIRST):**

**Technical Validation:**
1. 🔲 **Run validation script** on 5+ resume templates
2. 🔲 **Document results** in Phase 0 validation template above
3. 🔲 **Measure performance baseline** (current dashboard load times)

**Approval Gates (see Phase 0 Sign-Off Requirements above):**
4. 🔲 **QA approval** on visual quality at chosen size (with name & date)
5. 🔲 **Product manager approval** on configuration decision (with name & date)
6. 🔲 **Commit validation results** to git (record commit hash)
7. 🔲 **Engineering lead sign-off** on technical feasibility
8. 🔲 **Final Go/No-Go decision** documented in sign-off template

**⚠️ GATE CHECK: All 8 items above must be complete before proceeding to Phase 1**
**Recommended default**: While approvals are pending, begin preparation work (code review, UI updates) in parallel—use the Parallel Path Strategy below and treat fully sequential execution as a fallback for ultra-fast approval cycles.

**Only after Phase 0 sign-off is complete:**

6. ✅ Document the issue (this file)
7. 🔲 Implement chosen configuration (width/format from validation)
8. 🔲 Add lazy loading to RecordCard
9. 🔲 Create implementation ticket for storage migration (Phases 1-5)
10. 🔲 Implement admin query audit logging + rate limiter before exposing migration tooling
11. 🔲 Schedule migration for next sprint

**Estimated Timeline:**
- Phase 0 (Validation & approvals): 1-2 weeks
- Phase 1-5 (Implementation): 4 weeks
- **Total**: 5-6 weeks (depends on approval cycle length)

**Timeline Feasibility Notes:**

The **1-2 week Phase 0 estimate** assumes coordinated approvals; 2-3 days only applies in exceptionally fast orgs:
- ✅ Validation script runs quickly (depends on dataset size)
- ✅ QA turnaround is 1-2 business days maximum
- ✅ PM is available for same-day or next-day approval
- ✅ Engineering lead can review and sign off within 24 hours
- ✅ No approval escalation or additional stakeholder reviews needed

**Adjust timeline if your organization has:**
- Slower approval processes (weekly PM meetings, executive sign-off required)
- Multi-timezone teams (handoff delays between QA → PM → Engineering)
- Formal change advisory boards (CAB) that meet weekly/biweekly
- Large dataset validation (script takes hours instead of minutes)

**Parallel Path Strategy (Recommended):**

To avoid blocking engineering work during approval delays:

```
Timeline:
Day 1: Run validation script + document results
Day 2: Submit for QA review
Day 3-7: QA review + PM approval (waiting...)

  ↓ PARALLEL WORK (while waiting for approval):

  - Implement Phase 1-2 code (mutations, queries, storage integration)
  - Write comprehensive tests
  - Submit pull request for code review
  - Address code review feedback

  ⚠️ IMPORTANT: Do NOT merge until Phase 0 approval is complete
```

**Benefits of Parallel Path:**
- Engineering team stays productive during approval wait
- Code review happens concurrently with QA/PM approval
- When Phase 0 approves, code is review-ready (can merge immediately)
- Reduces overall calendar time from 4+ weeks to 3-4 weeks

**Risk Mitigation:**
- If Phase 0 approval fails or requires changes to configuration:
  - Code may need updates (e.g., different thumbnail width)
  - Better to discover during code review than after merge
- Set clear expectation: "This PR is review-ready but blocked on Phase 0 approval"

**Example Timeline Comparison:**

| Approach | Phase 0 Duration | Total Duration | Notes |
|----------|------------------|----------------|-------|
| **Sequential (Optimistic)** | 2-3 days | 4.5 weeks | Assumes fast approvals |
| **Sequential (Realistic)** | 5-7 days | 5-6 weeks | Typical org approval delays |
| **Parallel Path (Realistic)** | 5-7 days | 4-5 weeks | Code review during approval wait |

**Recommendation:** Use parallel path approach unless:
- Very high confidence in configuration choice (skip Phase 0 entirely via acceleration criteria)
- Small team where same person handles validation, approval, and implementation
- Validation results might significantly change implementation approach

## References

- [Convex File Storage Documentation](https://docs.convex.dev/file-storage)
- [Base64 Encoding Overhead](https://en.wikipedia.org/wiki/Base64#MIME)
- [Web Performance Best Practices](https://web.dev/fast/)

## Questions & Decisions
1. **Should we keep base64 for backups?**
   - ✅ Yes, we intentionally keep both fields during migration (see [Risk Mitigation](#risk-mitigation) and [Phase 3: Migrate Existing Data](#phase-3-migrate-existing-data-week-2))
   - ✅ Base64 is deprecated but remains as fallback until Phase 5 (documented in [Risk Mitigation](#risk-mitigation))
   - ✅ During rollback scenarios, base64 is required to restore thumbnails

2. **What if storage fails during migration?**
   - ✅ We only delete `thumbnailStorageId` if storage lookup fails (see [Rollback Procedure](#rollback-procedure))
   - ✅ Base64 stays intact (we never delete `thumbnailDataUrl`) for safe fallback ([Rollback Procedure](#rollback-procedure))
   - ✅ Migration script detects storage failures and logs them (validated in [Rollback Validation Tests](#rollback-validation-tests))
   - ✅ We can retry failed storage uploads without data loss

3. **Can we pause and resume migration safely?**
   - ✅ Yes — resumability is built in via cursor-based pagination plus duplicate detection *(see summary below)*.
   - ✅ Combined storage ID + base64 fallback checks keep data consistent (full details: [Pagination Safety](#pagination-safety-defense-in-depth-strategy))
   - ✅ Resume markers let us restart safely from the last checkpoint (covered in [Phase 3: Migrate Existing Data](#phase-3-migrate-existing-data-week-2))

4. **What if we find new template types later?**
   - ✅ Run Phase 0 validation again with new templates
   - ✅ Update thumbnail settings (size/format) and rerun migration for new templates only
   - ✅ No need to re-migrate old templates once storage IDs are in place

5. **What if thumbnails are embedded in PDFs or exports?**
   - ✅ Export pipeline keeps using base64 fallback until Phase 4; nothing breaks mid-migration.
   - ✅ During phases 1-3, both storage and base64 representations remain available.
   - ✅ Plan to update export pipeline once storage is fully rolled out (see [Phase 4: Deprecate Base64](#phase-4-deprecate-base64-week-4)).
   - During phases 1-3 the export code should continue calling `getThumbnailUrl`, which already prioritizes storage URLs (Convex storage ID) and falls back to base64 when storage is unavailable.
   - In Phase 4 update the export pipeline to embed CDN/storage URLs (or the fetched binary) instead of the legacy base64 string, then remove the base64 fallback once rollout is complete.
   - Document the exact rollout steps for the export code in Phase 4 (feature flag or staged deploy) so exports never break mid-migration.

6. **How do we manage storage quota limits?**
   - ✅ Monitor storage usage via provider dashboards (Convex storage metrics, CDN reports)
   - ✅ Migration script logs total bytes uploaded and per-batch sizes
   - ✅ Add alerts for usage thresholds (e.g., 75%, 90%)
   - ✅ Consider automated pruning for unused thumbnails (Phase 5+ enhancement)

7. **What is the retention policy for legacy files?**
   - ✅ Base64 data remains until Phase 5 removal
   - ✅ Storage files are retained indefinitely unless explicitly deleted
   - ✅ Establish policy (e.g., purge thumbnails for deleted resumes after X days)

8. **Can users delete or update thumbnails after migration?**
   - ✅ Future UI improvements will allow manual thumbnail refresh/delete
   - ✅ Backend supports storage replacement; ensure we remove old storage files when updating
   - ✅ Until UI is updated, support can run repair script to clear broken storage IDs

9. **What’s the cost impact of using file storage?**
   - ✅ Rough budget: ~30KB per thumbnail → 30MB per 1,000 resumes *(baseline planning assumption)*.
   - ✅ Compare storage provider pricing (Convex, CDN, backups) and factor egress costs for public thumbnails (see [Cost Tracking](#cost-management--monitoring)).
   - ✅ Monitor monthly spend during Phase 3 migration to validate assumptions; adjust if usage deviates materially.
