# Agent System Deployment Plan

## Phase 1: Deploy Nudge System ✅ (Ready Now)

### Pre-Deployment Checklist

**Environment Variables** (Check `.env.local` and production):
```bash
# Required for nudge emails
MAILGUN_SENDING_API_KEY=your_key_here
# OR
SENDGRID_API_KEY=your_key_here

# Required for email API route
NEXT_PUBLIC_APP_URL=https://app.ascentful.io
CONVEX_INTERNAL_KEY=generate_random_secure_key

# Already configured
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CLERK_SECRET_KEY=your_clerk_key
```

**Deployment Steps:**

1. **Deploy Convex Functions**
   ```bash
   npx convex deploy --prod
   ```

   This deploys:
   - ✅ 10 nudge rules in `convex/nudges/ruleEngine.ts`
   - ✅ Scoring system in `convex/nudges/scoring.ts`
   - ✅ Dispatch system in `convex/nudges/dispatch.ts`
   - ✅ Preferences CRUD in `convex/nudges/preferences.ts`
   - ✅ Sweep jobs in `convex/nudges/sweepJobs.ts`
   - ✅ Metrics in `convex/nudges/metrics.ts`
   - ✅ 3 cron jobs in `convex/crons.ts`

2. **Deploy Next.js App**
   ```bash
   npm run build
   # Deploy to Vercel/your hosting provider
   ```

   This deploys:
   - ✅ User preferences UI at `/account/agent-preferences`
   - ✅ Dashboard nudge display
   - ✅ Admin monitoring at `/admin/nudges`
   - ✅ Email API route at `/api/nudges/send-email`

3. **Initialize Feature Flags**
   ```bash
   npx ts-node scripts/init-nudge-feature-flags.ts
   ```

   Creates:
   - `agent` feature flag (enabled, 100% rollout)
   - `proactive_nudges` feature flag (enabled, 0% rollout initially)

4. **Verify Deployment**
   - [ ] Check Convex dashboard → Cron jobs registered (3 new jobs)
   - [ ] Visit `/admin/nudges` → Metrics dashboard loads
   - [ ] Visit `/account/agent-preferences` → Preferences UI loads
   - [ ] Check schema → All 14+ new tables exist

5. **Test with Admin User**
   ```bash
   npx ts-node scripts/test-nudge-system.ts <your-admin-userId>
   ```

6. **Gradual Rollout**
   - Week 1: Whitelist 5-10 internal users
   - Week 2: 10% rollout (update feature flag)
   - Week 3: 50% rollout
   - Week 4: 100% rollout

**What Works Immediately:**
- ✅ All 10 nudge rules (9 functional, 1 returns false)
- ✅ In-app notifications
- ✅ Email notifications (if email service configured)
- ✅ User preferences and quiet hours
- ✅ Admin monitoring dashboard
- ✅ Automated cron sweeps

**What Needs Work:**
- ⚠️ Rule #10 (Skill Gap) - Returns false, not implemented
- ⚠️ Resume analysis - Uses placeholder scores (still works, just not AI-powered)

---

## Phase 2: Add AI-Powered Tools (After Phase 1)

**Note**: Resume and cover letter AI features are already implemented in the UI at `/resumes` and `/cover-letters` (Generate with AI and Upload & Analyze tabs). These features already use OpenAI via API routes at `/api/resumes/generate`, `/api/resumes/analyze`, `/api/cover-letters/generate`, and `/api/cover-letters/analyze`.

### Tools to Implement

**1. Contact Management (Easy - Just Wrappers)**

Add to `convex/agent.ts`:

```typescript
/**
 * Create a new networking contact
 */
export const createContact = mutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getUserByClerkId(ctx, args.clerkId)

    return await ctx.runMutation(api.contacts.createContact, {
      clerkId: args.clerkId,
      name: args.name,
      email: args.email,
      company: args.company,
      position: args.position,
      linkedin_url: args.linkedinUrl,
      notes: args.notes,
    })
  },
})

/**
 * Update an existing contact
 */
export const updateContact = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id('networking_contacts'),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    linkedinUrl: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await getUserByClerkId(ctx, args.clerkId)

    const { clerkId, contactId, ...updates } = args

    return await ctx.runMutation(api.contacts.updateContact, {
      contactId,
      name: updates.name,
      email: updates.email,
      company: updates.company,
      position: updates.position,
      linkedin_url: updates.linkedinUrl,
      notes: updates.notes,
    })
  },
})

/**
 * Delete a contact
 */
export const deleteContact = mutation({
  args: {
    clerkId: v.string(),
    contactId: v.id('networking_contacts'),
  },
  handler: async (ctx, args) => {
    await getUserByClerkId(ctx, args.clerkId)

    return await ctx.runMutation(api.contacts.deleteContact, {
      contactId: args.contactId,
    })
  },
})
```

Then update `src/app/api/agent/route.ts` to handle these tools (lines 193-357).

**Estimated Time**: 30 minutes

---

**2. Career Path Generation (OpenAI Integration)**

Add to `convex/agent.ts`:

```typescript
/**
 * Generate a personalized career path
 */
export const generateCareerPath = action({
  args: {
    clerkId: v.string(),
    targetRole: v.string(),
    currentRole: v.optional(v.string()),
    yearsOfExperience: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(api.agent.getUserSnapshot, {
      userId: args.clerkId,
    })

    // Call OpenAI to generate career path
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a career coach. Generate a detailed career path from current role to target role with specific steps, skills to learn, and timeline.',
        },
        {
          role: 'user',
          content: `Current: ${args.currentRole || user.current_position || 'Entry level'}, Target: ${args.targetRole}, Experience: ${args.yearsOfExperience || user.experience_level || 0} years. User skills: ${user.skills?.join(', ')}`,
        },
      ],
      response_format: { type: 'json_object' },
    })

    const careerPath = JSON.parse(completion.choices[0].message.content)

    // Save to database
    return await ctx.runMutation(api.career_paths.createCareerPath, {
      clerkId: args.clerkId,
      target_role: args.targetRole,
      current_level: args.currentRole || user.current_position,
      steps: careerPath,
      status: 'planning',
    })
  },
})
```

**Estimated Time**: 1 hour (including prompt engineering)

---

**3. ~~Cover Letter Generation (OpenAI Integration)~~ ✅ ALREADY IMPLEMENTED**

Already working at `/cover-letters` → "Generate with AI" tab. Uses `/api/cover-letters/generate` endpoint.

---

**4. ~~Resume Analysis (OpenAI Integration)~~ ✅ ALREADY IMPLEMENTED**

Already working at `/resumes` → "Upload & Analyze" tab. Uses `/api/resumes/analyze` endpoint.

---

**5. ~~Cover Letter Analysis (OpenAI Integration)~~ ✅ ALREADY IMPLEMENTED**

Already working at `/cover-letters` → "Upload & Analyze" tab. Uses `/api/cover-letters/analyze` endpoint.

---

**3. Skill Gap Analysis (Nudge Rule #10)**

Update `convex/nudges/ruleEngine.ts` (lines 645-666):

```typescript
skillGap: {
  type: 'skillGap',
  name: 'Skill Development Suggestion',
  description: 'User is missing skills for target jobs',
  category: 'helpful',
  baseScore: 55,
  cooldownMs: 14 * 24 * 60 * 60 * 1000,
  requiredPlan: 'premium',

  evaluate: async (ctx, userId) => {
    // Get user skills
    const user = await ctx.db.get(userId)
    const userSkills = user?.skills || []

    // Get recent job searches or saved jobs
    const recentApps = await ctx.db
      .query('applications')
      .withIndex('by_user', (q) => q.eq('user_id', userId))
      .order('desc')
      .take(5)

    // Extract common skills from job descriptions
    // (This could use OpenAI to analyze JDs and find skill gaps)

    // For now, simple implementation:
    if (userSkills.length === 0) {
      return {
        ruleType: 'skillGap',
        shouldTrigger: true,
        score: 55,
        reason: 'Add skills to your profile to get better job matches',
        metadata: {},
        suggestedAction: 'Add your professional skills',
        actionUrl: '/profile',
      }
    }

    return {
      ruleType: 'skillGap',
      shouldTrigger: false,
      score: 0,
      reason: 'User has skills listed',
      metadata: {},
    }
  },
}
```

**Estimated Time**: 30 minutes (basic) or 2 hours (with OpenAI JD analysis)

---

### Phase 2 Summary

**Total Estimated Time**: 2-3 hours (reduced from original 4-6 hours)

**What's Already Done**: ✅
- Resume generation with AI (working)
- Resume analysis with AI (working)
- Cover letter generation with AI (working)
- Cover letter analysis with AI (working)

**What Still Needs Implementation**:
1. Contact management wrappers (30 min) ✅ Easy win
2. Skill gap basic implementation (30 min) ✅ Completes nudge system
3. Career path generation OpenAI (1 hour) 🚀 Major feature

**Environment Setup**:
```bash
# Add to .env.local
OPENAI_API_KEY=sk-...your-key-here
```

---

## Deployment Checklist

### Phase 1 (Now)
- [ ] Verify environment variables
- [ ] Deploy Convex (`npx convex deploy --prod`)
- [ ] Deploy Next.js app (`npm run build`)
- [ ] Initialize feature flags
- [ ] Verify cron jobs registered
- [ ] Test with admin user
- [ ] Start gradual rollout (0% → 10% → 50% → 100%)

### Phase 2 (After Phase 1 Stable)
- [x] ~~Add `OPENAI_API_KEY` to environment~~ (Already configured)
- [x] ~~Add OpenAI to resume analysis~~ (Already implemented at `/resumes`)
- [x] ~~Add OpenAI to resume generation~~ (Already implemented at `/resumes`)
- [x] ~~Add OpenAI to cover letter generation~~ (Already implemented at `/cover-letters`)
- [x] ~~Add OpenAI to cover letter analysis~~ (Already implemented at `/cover-letters`)
- [ ] Implement contact management wrappers
- [ ] Implement skill gap analysis (basic)
- [ ] Add OpenAI to career path generation
- [ ] Deploy updates
- [ ] Test AI-powered tools
- [ ] Update documentation

---

**Last Updated**: 2025-11-02
**Status**: Phase 1 Ready for Deployment
