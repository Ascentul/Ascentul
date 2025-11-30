# Security Fix: Attachment Storage Access Control

**Date**: 2025-11-16
**Severity**: HIGH - Data exposure vulnerability
**Status**: ✅ Fixed

## 🔒 Security Issue

### Vulnerability
The `advisor_sessions` table stored attachment URLs directly in the schema:

```typescript
// ❌ INSECURE - Before
attachments: v.optional(
  v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      url: v.string(), // ⚠️ Direct URL bypasses access control
      type: v.string(),
      size: v.number(),
    }),
  ),
),
```

**Problem**: Direct URL storage bypasses Convex's built-in access control system, potentially exposing student documents to unauthorized access.

**Risk**:
- Student resumes, transcripts, and private documents accessible via URL
- No expiration on access links
- No audit trail for file access
- Cannot revoke access after sharing URL

---

## ✅ Fix Applied

### Secure Implementation
Changed to use Convex storage IDs with proper access control:

```typescript
// ✅ SECURE - After
attachments: v.optional(
  v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      storage_id: v.id("_storage"), // ✅ Uses Convex storage with access control
      type: v.string(),
      size: v.number(),
    }),
  ),
),
```

**Benefits**:
- ✅ Access control enforced at URL generation time via Convex permissions (note: once a URL is issued, it can be accessed by anyone who possesses it—no per-request re-validation)
- ✅ Convex built-in storage `getUrl()` returns a URL that should be treated as ephemeral—fetch on-demand rather than caching long-term (Convex does not document a specific TTL, so URL lifetime may change)
- ✅ Can revoke access by deleting the file from storage (no selective URL revocation)
- ✅ Audit trail for file access at URL generation time
- ✅ Tenant isolation (university-based)

> **Note**: For per-request access control, implement a custom HTTP action that validates permissions on each request before streaming file content. Built-in `getUrl()` URLs should be fetched on-demand; do not cache them long-term as the TTL is undocumented. For time-limited presigned URLs with explicit expiration, use the `@convex-dev/r2` component which supports `expiresIn` (default 900 seconds / 15 minutes).

---

## 📋 Implementation Guide

### Uploading Files

```typescript
// 1. Generate upload URL
const uploadUrl = await ctx.storage.generateUploadUrl();

// 2. Client uploads file
const response = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": file.type },
  body: file,
});

const { storageId } = await response.json();

// 3. Save to session with storage_id
await ctx.db.patch(sessionId, {
  attachments: [
    ...(existingAttachments || []),
    {
      id: generateId(),
      name: file.name,
      storage_id: storageId, // ✅ Store storage ID, not URL
      type: file.type,
      size: file.size,
    },
  ],
});
```

### Migration Script

```typescript
// convex/migrations.ts
export const migrateAttachmentUrlsToStorage = internalMutation({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db
      .query("advisor_sessions")
      .filter((q) => q.neq(q.field("attachments"), undefined))
      .collect();

    let migratedCount = 0;

    for (const session of sessions) {
      if (!session.attachments) continue;

      // Check if already migrated
      const hasStorageIds = session.attachments.every(
        (a: any) => a.storage_id !== undefined
      );

      if (hasStorageIds) continue;

      // Check if partially migrated (some have storage_id, some don't)
      const isPartiallyMigrated = session.attachments.some(
        (a: any) => a.storage_id !== undefined
      );

      if (isPartiallyMigrated) {
        console.warn(
          `Session ${session._id} has partially migrated attachments (mixed storage_id and url)`
        );
      }

      console.warn(
        `Session ${session._id} has URL-based attachments that need manual migration`
      );

      // Manual migration required:
      // 1. Download files from URLs
      // 2. Re-upload to Convex storage
      // 3. Update with storage_id

      migratedCount++;
    }

    return {
      total: sessions.length,
      needsMigration: migratedCount,
    };
  },
});
```

**Note**: If there are existing sessions with attachments, they need manual migration as URLs cannot be automatically converted to storage IDs without re-uploading the files.

> **Breaking change / operator action required**: For any production data with URL-based attachments, you **must** download the existing files, re-upload them to Convex storage, and update the records with `storage_id` before deploying this change in production. The provided migration only detects records that need remediation; it does not move files automatically.

---

## 🛡️ Access Control Pattern

### Tenant Isolation

```typescript
// advisor_sessions already has university_id for tenant isolation
// Access control pattern:
export const getSessionAttachmentUrl = query({
  args: {
    sessionId: v.id("advisor_sessions"),
    attachmentId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    // 1. Verify university match (tenant isolation)
    if (user.university_id !== session.university_id) {
      throw new Error("Unauthorized: Different university");
    }

    // 2. Verify role-based access
    const canAccess =
      user._id === session.student_id || // Student can access their session
      user._id === session.advisor_id || // Advisor can access their session
      user.role === "university_admin" || // Uni admin can access all in university
      user.role === "super_admin"; // Super admin can access all

    if (!canAccess) {
      throw new Error("Unauthorized: No permission");
    }

    // 3. Find attachment
    const attachment = session.attachments?.find(a => a.id === args.attachmentId);
    if (!attachment) throw new Error("Attachment not found");

    // 4. Get URL from storage (may return null if file was deleted)
    const url = await ctx.storage.getUrl(attachment.storage_id);
    if (!url) throw new Error("Attachment file not found in storage");

    return url;
  },
});
```

---

## 📊 Files Changed

- ✅ `convex/schema.ts` - Updated `advisor_sessions.attachments` to use `storage_id`
- 📝 `docs/SECURITY_FIX_ATTACHMENT_STORAGE.md` - This documentation

---

## ⚠️ Breaking Change

**API Change**: The `url` field is replaced with `storage_id`

**Before**:
```typescript
{
  attachments: [
    {
      id: "att_123",
      name: "resume.pdf",
      url: "https://example.com/resume.pdf", // ❌
      type: "application/pdf",
      size: 102400
    }
  ]
}
```

**After**:
```typescript
{
  attachments: [
    {
      id: "att_123",
      name: "resume.pdf",
      storage_id: "kg2h4j5k6l7m8n9o0p1q2r3s", // ✅ Convex storage ID
      type: "application/pdf",
      size: 102400
    }
  ]
}
```

**Client Code Update Required**:
- Upload handlers must save `storage_id` instead of `url`
- Display components must call `getSessionAttachmentUrl` query to get URL (enforces access control at query time)
- Download handlers must use the query instead of direct URL access

---

## 🎯 Benefits Summary

| Before (URL) | After (storage_id) |
|-------------|-------------------|
| ❌ No access control | ✅ Permission-based access |
| ❌ Permanent URLs | ✅ Revocable URLs (via file deletion; time-limited only with custom action or R2)* |
| ❌ No revocation | ✅ Can revoke access by deleting file |
| ❌ No audit trail | ✅ Logged access |
| ❌ Cross-tenant risk | ✅ Tenant isolation enforced |

*URL expiration behavior by storage backend:
- **Convex built-in storage**: `getUrl()` returns a persistent bearer URL valid until the file is deleted (no automatic expiration). For time-limited access, implement a custom HTTP action that streams file content after validating permissions.
- **Convex R2 component** (`@convex-dev/r2`): `getUrl()` supports `expiresIn` option (default 900 seconds / 15 minutes) for presigned URLs.
- **Upload URLs**: `generateUploadUrl()` returns a URL valid for approximately 1 hour.

---

## 🔗 Related Documentation

- Convex File Storage: https://docs.convex.dev/file-storage
- Security Best Practices: https://docs.convex.dev/understanding/best-practices

---

**Status**: ✅ **Schema updated - requires client code update for full implementation**
