# Agent-Feature Parity Gaps Analysis

**Generated**: 2025-11-02
**Test Suite**: `src/__tests__/agent-parity-analysis.test.ts`
**Status**: All 26 parity tests passing ✅

## Executive Summary

This document catalogs implementation differences between the AI Agent tool layer (`convex/agent.ts`, `src/app/api/agent/route.ts`) and the existing feature modules (`convex/goals.ts`, `convex/applications.ts`, etc.).

**Total Documented Gaps**: 13

- **Missing Parameters**: 5 (Agent tools missing fields that Convex supports)
- **Naming Inconsistencies**: 5 (camelCase ↔ snake_case, parameter name mismatches)
- **Unimplemented Features**: 1 (Tool defined but not functional)
- **Unused Parameters**: 2 (Tool schema accepts params that aren't used)

---

## 1. Missing Parameters

### 1.1 Goals: `checklist` Field

**Impact**: Medium
**Status**: Not implemented in Agent

**Details**:
- **Feature Module**: `convex/goals.ts` supports `goal.checklist` (array of subtasks)
- **Agent Tool**: `create_goal` does not expose `checklist` parameter
- **User Impact**: Users cannot create goals with sub-tasks via Agent conversation. Must use UI.

**Example**:
```typescript
// UI can do this:
createGoal({
  title: "Launch MVP",
  checklist: [
    "Design mockups",
    "Build backend",
    "Deploy to production"
  ]
})

// Agent cannot do this - checklist parameter missing from tool schema
```

**Recommendation**: Add `checklist` parameter to `create_goal` tool schema (Priority: Medium)

---

### 1.2 Applications: `resume_id` Field

**Impact**: Low
**Status**: Not implemented in Agent

**Details**:
- **Feature Module**: `convex/applications.ts` supports linking a resume to an application
- **Agent Tool**: `create_application` does not expose `resume_id` parameter
- **User Impact**: Users cannot link resume when Agent creates application. Must link manually in UI.

**Example**:
```typescript
// UI can do this:
createApplication({
  company: "Google",
  job_title: "SWE",
  resume_id: "resume_123"
})

// Agent creates without resume link
```

**Recommendation**: Add `resume_id` optional parameter (Priority: Low)

---

### 1.3 Contacts: Missing Fields (`phone`, `relationship`, `last_contact`)

**Impact**: Low
**Status**: Not implemented in Agent

**Details**:
- **Feature Module**: `convex/contacts.ts` supports these additional fields
- **Agent Tool**: `create_contact` only exposes: name, email, company, role, linkedinUrl, notes
- **User Impact**: Users cannot set phone/relationship/last_contact via Agent

**Recommendation**: Add missing fields to tool schema (Priority: Low)

---

## 2. Naming Inconsistencies

### 2.1 Contacts: `role` → `position`

**Impact**: None (handled by mapping layer)
**Status**: Working, but adds complexity

**Details**:
- **Agent Tool Schema**: Uses parameter name `role`
- **Convex Function**: Expects parameter name `position`
- **Mapping**: `src/app/api/agent/route.ts:329` maps `input.role → position`

**Code**:
```typescript
// Tool schema (TOOL_SCHEMAS)
role: {
  type: 'string',
  description: 'Contact job title or role (optional)',
}

// Route mapping (route.ts:329)
position: input.role as string | undefined,
```

**Recommendation**: Standardize on `position` everywhere (Priority: Medium)

---

### 2.2 Contacts: `linkedinUrl` → `linkedin_url`

**Impact**: None (handled by mapping layer)
**Status**: Working, but inconsistent naming convention

**Details**:
- **Agent Tool Schema**: camelCase `linkedinUrl`
- **Convex Function**: snake_case `linkedin_url`
- **Mapping**: `route.ts:330` converts naming convention

**Recommendation**: Standardize on snake_case for all Convex parameters (Priority: Low)

---

### 2.3 Career Paths: `targetRole` → `target_role`, `currentRole` → `current_level`

**Impact**: None (handled by mapping layer)
**Status**: Working, but parameter name differs

**Details**:
- **Tool Schema**: `targetRole`, `currentRole`
- **Convex Function**: `target_role`, `current_level`
- **Mapping**: `route.ts:298-299`

**Note**: `currentRole` maps to `current_level` (not just snake_case, but different name)

**Recommendation**: Align parameter names (Priority: Low)

---

### 2.4 Cover Letters: `jobTitle` → `job_title`, `jobDescription` → `job_description`

**Impact**: None (handled by mapping layer)
**Status**: Working

**Details**:
- Standard camelCase → snake_case conversion
- **Mapping**: `route.ts:309-310`

**Recommendation**: Part of broader snake_case standardization

---

### 2.5 Goals & Applications: `target_date`, `applied_at`

**Impact**: None (handled by mapping layer)
**Status**: Working

**Details**:
- Tool schema uses camelCase: `targetDate`, `appliedAt`
- Convex uses snake_case: `target_date`, `applied_at`
- **Mapping**: `route.ts:242, 254, 272`

---

## 3. Unimplemented Features

### 3.1 Cover Letter Analysis (`analyze_cover_letter`)

**Impact**: Low
**Status**: Tool defined but not functional

**Details**:
- **Tool Schema**: `analyze_cover_letter` is defined in `TOOL_SCHEMAS`
- **Implementation**: Returns "not yet available" message (`route.ts:319`)
- **User Impact**: Agent accepts requests for cover letter analysis but cannot fulfill them

**Code**:
```typescript
case 'analyze_cover_letter':
  return {
    success: true,
    message: 'Cover letter analysis is not yet available. This feature is coming soon.',
    coverLetterId: input.coverLetterId,
  }
```

**Recommendation**: Either implement feature or remove from tool schema (Priority: Low)

---

## 4. Unused Parameters

### 4.1 Career Path: `yearsOfExperience`

**Impact**: None
**Status**: Accepted but ignored

**Details**:
- **Tool Schema**: Includes `yearsOfExperience` parameter
- **Implementation**: Not passed to Convex function (`route.ts:300`)
- **Reason**: Convex function derives experience from user profile

**Code**:
```typescript
return await convex.mutation(api.career_paths.createCareerPath, {
  clerkId,
  target_role: input.targetRole as string,
  current_level: input.currentRole as string | undefined,
  estimated_timeframe: undefined,  // Calculated by function
  status: 'planning',
  // yearsOfExperience is NOT passed
})
```

**Recommendation**: Remove from tool schema to avoid confusion (Priority: Low)

---

### 4.2 Cover Letter: `resumeId`

**Impact**: None
**Status**: Accepted but not yet used

**Details**:
- **Tool Schema**: Includes optional `resumeId` parameter
- **Implementation**: Not passed to Convex (`route.ts:385`)
- **Reason**: Reserved for future use

**Recommendation**: Either implement or remove (Priority: Low)

---

## 5. ID Type Handling

### 5.1 Mixed ID Types

**Status**: Working correctly

**Details**:
The codebase uses two different ID types:
- **Agent Functions** (`convex/agent.ts`): `userId: Id<'users'>`
- **Feature Functions** (`convex/contacts.ts`, etc.): `clerkId: string`

**Resolution**: API route converts IDs (`route.ts:93-95`)

```typescript
// Route resolves clerkId → userId
const convexUser = await convex.query(api.users.getUserByClerkId, {
  clerkId: clerkUserId,
})
const userId = convexUser._id  // Type: Id<'users'>
```

**Functions Using userId**:
- `getUserSnapshot`, `createGoal`, `updateGoal`, `deleteGoal`
- `createApplication`, `updateApplication`, `deleteApplication`

**Functions Using clerkId**:
- `createCareerPath`, `generateCoverLetterContent`
- `createContact`, `updateContact`, `deleteContact`

**Recommendation**: Standardize on one ID type across all functions (Priority: High)

---

## 6. Dual Implementation Architecture

### 6.1 Agent vs. Feature Modules

**Impact**: High - Maintenance burden
**Status**: Working, but creates code duplication

**Details**:
- **Agent Layer**: `convex/agent.ts` contains create/update/delete functions for goals, applications
- **Feature Modules**: `convex/goals.ts`, `convex/applications.ts` contain similar functions
- **Problem**: Two implementations of same logic = 2x maintenance, risk of divergence

**Example**:
```typescript
// convex/agent.ts - Agent version
export const createGoal = mutation({
  args: {
    userId: v.id('users'),
    title: v.string(),
    description: v.optional(v.string()),
    // ...
  },
  handler: async (ctx, args) => {
    // Agent-specific implementation
  }
})

// convex/goals.ts - Feature version
export const createGoal = mutation({
  args: {
    clerkId: v.string(),  // Different ID type!
    title: v.string(),
    // Potentially different logic
  }
})
```

**Recommendation**: Refactor agent.ts to call feature modules directly (Priority: High, Est. 2-3 weeks)

---

## 7. Refactoring Recommendations

### Priority Matrix

| Issue | Priority | Effort | Impact | Status |
|-------|----------|--------|--------|--------|
| Dual implementations (agent.ts) | **High** | 2-3 weeks | Reduces code duplication, single source of truth | Not started |
| ID type standardization | **High** | 1 week | Simplifies routing logic | Not started |
| Naming inconsistencies | Medium | 1-2 weeks | Cleaner codebase, less mapping logic | Not started |
| Missing parameters (checklist, etc.) | Medium | 3-5 days | Feature parity with UI | Not started |
| Unimplemented features (analyze) | Low | 1 week | Fulfill tool promises | Not started |
| Unused parameters cleanup | Low | 1 day | Reduce confusion | Not started |

---

### Proposed Refactoring Plan

**Phase 1: ID Standardization (1 week)**
1. Choose standard: Either `Id<'users'>` or `clerkId`
2. Update all Convex functions to use chosen standard
3. Update route.ts to remove ID conversion logic
4. Update all tool schemas to document ID requirements

**Phase 2: Naming Convention (1-2 weeks)**
1. Standardize on snake_case for all Convex parameters
2. Keep camelCase in tool schemas (OpenAI convention)
3. Document mapping layer in route.ts
4. Add TypeScript types to enforce consistency

**Phase 3: Dual Implementation Removal (2-3 weeks)**
1. Refactor `convex/agent.ts` to become thin wrapper
2. All business logic moves to feature modules
3. Agent functions call feature functions with parameter mapping
4. Remove duplicate code

**Example**:
```typescript
// convex/agent.ts - After refactoring
export const createGoal = mutation({
  args: { userId: v.id('users'), title: v.string(), /* ... */ },
  handler: async (ctx, args) => {
    // Get clerkId from userId
    const user = await ctx.db.get(args.userId)
    if (!user) throw new Error('User not found')

    // Call feature module
    return await ctx.runMutation(api.goals.createGoal, {
      clerkId: user.clerkId,
      title: args.title,
      // Map all parameters
    })
  }
})
```

**Phase 4: Feature Completion (1-2 weeks)**
1. Add missing parameters (checklist, resume_id, contact fields)
2. Implement cover letter analysis feature
3. Remove unused parameters
4. Update tool schemas

---

## 8. Test Coverage

All gaps documented above are covered by automated tests:

- **Phase 1 Tests** (`agent-tool-execution.test.ts`): 21 tests validating tool routing
- **Phase 2 Tests** (`agent-workflow-validation.test.ts`): 15 tests validating multi-step workflows
- **Phase 3 Tests** (`agent-parity-analysis.test.ts`): 26 tests documenting all gaps

**Total**: 62 tests, all passing ✅

---

## 9. Impact on Users

### Current User Experience

**What Works Well**:
- ✅ Agent can create, update, and delete goals
- ✅ Agent can create, update, and delete applications
- ✅ Agent can manage contacts
- ✅ Agent can generate cover letters (draft mode)
- ✅ Agent can create career paths
- ✅ All basic CRUD operations functional
- ✅ Parameter mapping transparent to users

**Limitations**:
- ❌ Cannot create goals with checklists via Agent
- ❌ Cannot link resume when Agent creates application
- ❌ Cannot set contact phone/relationship via Agent
- ❌ Cover letter analysis returns "coming soon" message
- ⚠️ Naming inconsistencies create maintenance burden

### After Refactoring

All limitations above would be resolved, and maintenance burden significantly reduced.

---

## 10. Appendix: Code Locations

### Tool Schemas
- **File**: `src/lib/agent/tools/index.ts`
- **Lines**: 10-511 (all tool definitions)

### Agent Routing
- **File**: `src/app/api/agent/route.ts`
- **Function**: `executeTool` (lines 194-365)
- **ID Resolution**: lines 93-95

### Agent Functions
- **File**: `convex/agent.ts`
- **Functions**: All create/update/delete operations for goals, applications

### Feature Modules
- **Goals**: `convex/goals.ts`
- **Applications**: `convex/applications.ts`
- **Contacts**: `convex/contacts.ts`
- **Career Paths**: `convex/career_paths.ts`
- **Cover Letters**: `convex/cover_letters.ts`

### Parameter Mapping Examples
- Goals `target_date`: `route.ts:242, 254`
- Applications `applied_at`: `route.ts:272`
- Contacts `position`: `route.ts:329`
- Contacts `linkedin_url`: `route.ts:330`
- Career Paths `target_role`: `route.ts:298`
- Cover Letters `job_title`: `route.ts:309-310`

---

**Last Updated**: 2025-11-02
**Maintained By**: Automated test suite `agent-parity-analysis.test.ts`
