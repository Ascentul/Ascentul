# Convex Authorization Patterns

This document describes the authorization patterns used in Ascentul's Convex backend and provides guidance on when to use each module.

## Overview

Ascentul uses three distinct authorization patterns in Convex functions:

| Pattern | Module | Use Case |
|---------|--------|----------|
| Role-Based Access Control | `lib/roles.ts` | General user authorization, role checks |
| Advisor-Student Ownership | `advisor_auth.ts` | Advisor access to student data |
| Service Token Auth | `lib/roles.ts` | Server-to-server webhook calls |

## 1. Role-Based Access Control (`lib/roles.ts`)

### When to Use

Use `lib/roles.ts` for:
- Verifying user authentication
- Checking user roles (super_admin, university_admin, advisor, student, individual)
- Enforcing tenant isolation via `university_id`
- Ensuring account is active (not deleted/suspended)

### Available Functions

```typescript
import {
  getAuthenticatedUser,
  requireSuperAdmin,
  requireUniversityAdmin,
  requireAdvisor,
  requireMembership,
  requireUserAccess,
  checkAccountActive,
  assertUniversityAccess,
  isServiceRequest
} from "./lib/roles";
```

### Function Reference

#### `getAuthenticatedUser(ctx)`
Returns the authenticated user from Convex database.

**Security features:**
- Validates Clerk JWT token
- Looks up user in database
- Automatically checks account status (blocks deleted/suspended users)

```typescript
export const myQuery = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    // user is authenticated and account is active
    return { userId: user._id };
  },
});
```

#### `requireSuperAdmin(ctx)`
Ensures user is a super_admin. Use for platform-wide administrative functions.

```typescript
export const dangerousAdminAction = mutation({
  args: {},
  handler: async (ctx) => {
    const admin = await requireSuperAdmin(ctx);
    // Only super_admin can reach this code
  },
});
```

#### `requireUniversityAdmin(ctx)`
Ensures user is a university_admin WITH a valid `university_id`.

```typescript
export const manageUniversitySettings = mutation({
  args: { universityId: v.id("universities") },
  handler: async (ctx, args) => {
    const admin = await requireUniversityAdmin(ctx);
    // Verify admin manages this specific university
    assertUniversityAccess(admin, args.universityId);
  },
});
```

#### `requireAdvisor(ctx)`
Ensures user is an advisor WITH a valid `university_id`.

```typescript
export const getAdvisorDashboard = query({
  args: {},
  handler: async (ctx) => {
    const advisor = await requireAdvisor(ctx);
    // advisor.university_id is guaranteed to exist
    return await getStudentsForUniversity(ctx, advisor.university_id);
  },
});
```

#### `requireMembership(ctx, { role? })`
Checks user has an active membership, optionally with a specific role.

```typescript
export const studentAction = mutation({
  args: {},
  handler: async (ctx) => {
    const { user, membership } = await requireMembership(ctx, { role: "student" });
    // user has active student membership
  },
});
```

#### `assertUniversityAccess(actingUser, targetUniversityId)`
Verifies the acting user can access data for a target university.

**Rules:**
- `super_admin`: Can access any university
- Others: Must match `university_id`

```typescript
export const getUniversityData = query({
  args: { universityId: v.id("universities") },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    assertUniversityAccess(user, args.universityId);
    // Safe to return university-scoped data
  },
});
```

### Common Patterns

#### Pattern 1: Tenant-Scoped Query

```typescript
export const getApplications = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);

    if (user.role === "super_admin") {
      // Super admin sees all
      return await ctx.db.query("applications").collect();
    }

    if (user.university_id) {
      // University users see their tenant's data
      return await ctx.db
        .query("applications")
        .withIndex("by_university", (q) => q.eq("university_id", user.university_id))
        .collect();
    }

    // Individual users see only their own
    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
  },
});
```

#### Pattern 2: Role-Based Action

```typescript
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    newRole: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireSuperAdmin(ctx);
    // Only super_admin can change roles
    await ctx.db.patch(args.userId, { role: args.newRole });
  },
});
```

---

## 2. Advisor-Student Ownership (`advisor_auth.ts`)

### When to Use

Use `advisor_auth.ts` for:
- Advisor endpoints that access student data
- Determining which advisors can see which students
- Enforcing the "owner" advisor relationship

### Available Functions

```typescript
import {
  requireAdvisorOrStudent,
  requireAdvisorOwnership,
  getStudentsForAdvisor,
  isStudentAccessible,
} from "./advisor_auth";
```

### Key Concept: Student Ownership

The `student_advisors` table links advisors to students with an `is_owner` flag:

```typescript
student_advisors: defineTable({
  student_id: v.id("users"),
  advisor_id: v.id("users"),
  university_id: v.optional(v.id("universities")),
  is_owner: v.optional(v.boolean()), // Primary advisor flag
  assigned_at: v.number(),
  status: v.string(),
})
```

- **Owner advisors** have full access to student data
- **Non-owner advisors** may have limited read access (configurable)
- Students can only be viewed by advisors in the same university

### Function Reference

#### `requireAdvisorOrStudent(ctx, studentId)`
Allows access if caller is the student themselves OR an advisor for that student.

```typescript
export const getStudentProfile = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdvisorOrStudent(ctx, args.studentId);
    // Either the student or their advisor can view this
    return await ctx.db.get(args.studentId);
  },
});
```

#### `requireAdvisorOwnership(ctx, studentId)`
Ensures caller is the **owner** advisor for a student.

```typescript
export const updateStudentGoals = mutation({
  args: { studentId: v.id("users"), goals: v.array(v.string()) },
  handler: async (ctx, args) => {
    await requireAdvisorOwnership(ctx, args.studentId);
    // Only the owner advisor can modify goals
  },
});
```

### Common Patterns

#### Pattern 1: Advisor Viewing Student List

```typescript
export const getMyStudents = query({
  args: {},
  handler: async (ctx) => {
    const advisor = await requireAdvisor(ctx);

    const relationships = await ctx.db
      .query("student_advisors")
      .withIndex("by_advisor", (q) => q.eq("advisor_id", advisor._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    const students = await Promise.all(
      relationships.map((r) => ctx.db.get(r.student_id))
    );

    return students.filter(Boolean);
  },
});
```

#### Pattern 2: Owner-Only Action

```typescript
export const scheduleStudentSession = mutation({
  args: {
    studentId: v.id("users"),
    sessionTime: v.number(),
  },
  handler: async (ctx, args) => {
    // Only owner advisors can schedule sessions
    await requireAdvisorOwnership(ctx, args.studentId);

    // Create the session
    await ctx.db.insert("advisor_sessions", {
      student_id: args.studentId,
      scheduled_at: args.sessionTime,
      // ...
    });
  },
});
```

---

## 3. Service Token Auth (Webhooks)

### When to Use

Use `isServiceRequest()` for:
- Clerk webhooks that don't have a user context
- Server-to-server API calls
- Internal scheduled functions

### Function Reference

#### `isServiceRequest(token)`
Validates internal service token for server-to-server calls.

```typescript
export const webhookHandler = mutation({
  args: {
    serviceToken: v.optional(v.string()),
    eventType: v.string(),
    payload: v.any(),
  },
  handler: async (ctx, args) => {
    // For webhooks, there's no user - validate service token
    if (!isServiceRequest(args.serviceToken)) {
      throw new Error("Unauthorized: Invalid service token");
    }

    // Process webhook
    if (args.eventType === "user.created") {
      await createUserFromClerk(ctx, args.payload);
    }
  },
});
```

### Security Note

The service token is stored in `CONVEX_INTERNAL_SERVICE_TOKEN` environment variable. Never expose this token to the frontend.

---

## Decision Tree: Which Module to Use?

```
Is this a webhook/server-to-server call?
├── YES → Use isServiceRequest() from lib/roles.ts
└── NO → Does this involve advisor-student relationships?
    ├── YES → Does it require owner-level access?
    │   ├── YES → Use requireAdvisorOwnership() from advisor_auth.ts
    │   └── NO → Use requireAdvisorOrStudent() from advisor_auth.ts
    └── NO → Use lib/roles.ts
        ├── Platform admin action? → requireSuperAdmin()
        ├── University admin action? → requireUniversityAdmin() + assertUniversityAccess()
        ├── Advisor action? → requireAdvisor()
        ├── Student action? → requireMembership({ role: "student" })
        └── General authenticated action? → getAuthenticatedUser()
```

---

## Security Checklist

When writing a new Convex function, verify:

- [ ] **Authentication**: Does the function call an auth helper at the start?
- [ ] **Role check**: Is the appropriate role verified for the action?
- [ ] **Tenant isolation**: For university-scoped data, is `university_id` checked?
- [ ] **Owner check**: For sensitive student data, is advisor ownership verified?
- [ ] **Account status**: Will deleted/suspended users be blocked? (automatic with `getAuthenticatedUser`)
- [ ] **Index usage**: Are queries using indexes to avoid full table scans?

---

## Examples by Domain

### Applications Module

```typescript
// User's own applications
export const getMyApplications = query({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
  },
});

// Advisor viewing student's applications
export const getStudentApplications = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdvisorOrStudent(ctx, args.studentId);
    return await ctx.db
      .query("applications")
      .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
      .collect();
  },
});

// University admin viewing all university applications
export const getUniversityApplications = query({
  handler: async (ctx) => {
    const admin = await requireUniversityAdmin(ctx);
    return await ctx.db
      .query("applications")
      .withIndex("by_university", (q) => q.eq("university_id", admin.university_id))
      .collect();
  },
});
```

### Resumes Module

```typescript
// User's own resumes
export const getMyResumes = query({
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    return await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", user._id))
      .collect();
  },
});

// Advisor viewing student's resume (owner only for sensitive career data)
export const getStudentResumes = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdvisorOwnership(ctx, args.studentId);
    return await ctx.db
      .query("resumes")
      .withIndex("by_user", (q) => q.eq("user_id", args.studentId))
      .collect();
  },
});
```

---

## Troubleshooting

### "Unauthorized: User not authenticated"
- User's Clerk session has expired
- Missing or invalid JWT token
- Check that the frontend is passing authentication correctly

### "Forbidden: Only advisors can perform this action"
- User doesn't have the `advisor` role
- User is an advisor but `university_id` is null

### "Unauthorized: Tenant access denied"
- User is trying to access data from a different university
- Verify `university_id` matches on both user and target resource

### "Forbidden: User account has been deleted/suspended"
- The user's `account_status` is not `active` or `pending_activation`
- Admin action required to restore access

---

## Related Documentation

- [Security: Subscription Enforcement](./SECURITY_SUBSCRIPTION_ENFORCEMENT.md)
- [Role Validation Business Logic](../convex/lib/roleValidation.ts)
- [Advisor-Student Tech Debt](./TECH_DEBT_ADVISOR_STUDENT_TABLES.md)
