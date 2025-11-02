# Proactive Nudge System - Rollout Guide

## Overview

The proactive AI agent nudge system is now fully implemented and ready for deployment. This guide covers the rollout process, testing checklist, and monitoring plan.

## Architecture Summary

```
Cron Jobs → Sweep Jobs → Rule Engine → Scoring → Dispatch → Channels → User Actions → Metrics
```

**10 Nudge Rules Implemented:**
1. `interviewSoon` - Interview preparation reminders (24-48 hours before)
2. `appRescue` - Application follow-up (>2 weeks stale)
3. `resumeWeak` - Resume improvement (score <70)
4. `goalStalled` - Goal progress reminder (>30 days at 0%)
5. `networkingIdle` - Networking activity (>60 days inactive)
6. `jobSearchStale` - Job search engagement (>14 days no activity)
7. `profileIncomplete` - Profile completion prompts
8. `dailyCheck` - Daily engagement nudge
9. `weeklyReview` - Weekly progress summary
10. `skillGap` - Skill development suggestions (placeholder)

## Pre-Rollout Checklist

### 1. Environment Variables
Ensure these are set in production:

```bash
# Required for email nudges
MAILGUN_SENDING_API_KEY=your_key_here
# OR
SENDGRID_API_KEY=your_key_here

# Required for internal API calls
NEXT_PUBLIC_APP_URL=https://app.ascentful.io
CONVEX_INTERNAL_KEY=generate_random_secure_key

# Already configured
NEXT_PUBLIC_CONVEX_URL=your_convex_url
CLERK_SECRET_KEY=your_clerk_key
```

### 2. Database Verification
Verify schema deployment to production:
- ✅ Tables: `agent_preferences`, `agent_cooldowns`, `agent_nudges`
- ✅ Tables: `feature_flags`, `agent_profile_fields`, `agent_audit_logs`
- ✅ Tables: `resume_analyses`, `cover_letter_analyses`
- ✅ Tables: `networking_contacts`, `contact_notes`, `contact_interactions`, `contact_follow_ups`
- ✅ Tables: `interview_stages`, `application_follow_ups`, `career_paths`

### 3. Cron Jobs Verification
Check that cron jobs are registered in Convex:
```bash
npx convex dev  # or production dashboard
# Verify 3 new crons:
# - nudge-hourly-sweep (every hour at :30)
# - nudge-daily-sweep (daily at 9 AM UTC)
# - nudge-weekly-sweep (Mondays at 9 AM UTC)
```

### 4. Feature Flag Setup
Create feature flags in production database (see Phase 1 below).

## Rollout Phases

### Phase 1: Internal Testing (Week 1)
**Goal:** Validate system functionality with team members

1. **Create Feature Flags** (run in Convex dashboard or via mutation):
```typescript
// Enable for super_admin and admin only
await ctx.runMutation(api.config.featureFlags.setFeatureFlag, {
  flagKey: 'agent',
  enabled: true,
  allowedPlans: ['free', 'premium', 'university'],
  rolloutPercentage: 100,
  whitelistedUserIds: [], // Will use role-based check instead
})

await ctx.runMutation(api.config.featureFlags.setFeatureFlag, {
  flagKey: 'proactive_nudges',
  enabled: true,
  allowedPlans: ['free', 'premium', 'university'],
  rolloutPercentage: 100,
  whitelistedUserIds: [],
})
```

2. **Test Checklist:**
   - [ ] Admin can access `/admin/nudges` dashboard
   - [ ] Metrics display correctly (may be zero initially)
   - [ ] User can access `/account/agent-preferences`
   - [ ] Toggling agent on/off works
   - [ ] Toggling proactive nudges works
   - [ ] Quiet hours can be set
   - [ ] Notification channels can be configured
   - [ ] Playbook toggles work

3. **Manual Nudge Testing:**
   - [ ] Create test data (applications >2 weeks old, interviews scheduled)
   - [ ] Manually trigger daily sweep (via Convex dashboard)
   - [ ] Verify nudges appear in dashboard
   - [ ] Test accept action (navigates to correct URL)
   - [ ] Test snooze action (1h, 4h, 24h, 1 week)
   - [ ] Test dismiss action
   - [ ] Verify cooldowns prevent duplicate nudges
   - [ ] Verify quiet hours work
   - [ ] Verify daily limits work (2 for free, 5 for premium)

4. **Email Testing:**
   - [ ] Verify email service configured (Mailgun or SendGrid)
   - [ ] Enable email channel in preferences
   - [ ] Trigger a nudge
   - [ ] Verify email received with correct formatting
   - [ ] Verify action link works
   - [ ] Verify preferences link works

### Phase 2: Beta Users (Week 2)
**Goal:** 10% rollout to active premium users

1. **Update Feature Flags:**
```typescript
await ctx.runMutation(api.config.featureFlags.updateRolloutPercentage, {
  flagKey: 'proactive_nudges',
  rolloutPercentage: 10,
})
```

2. **Or Whitelist Specific Users:**
```typescript
await ctx.runMutation(api.config.featureFlags.addWhitelistedUsers, {
  flagKey: 'proactive_nudges',
  userIds: ['user_id_1', 'user_id_2', 'user_id_3'],
})
```

3. **Monitor Metrics:**
   - Daily acceptance rate (target: >30%)
   - Snooze rate (acceptable: <40%)
   - Dismissal rate (watch if >50%)
   - Engagement rate (target: >60%)
   - Check `/admin/nudges` daily

4. **Gather Feedback:**
   - Check support tickets for nudge-related issues
   - Monitor user preferences (are people disabling?)
   - Track rule performance (which rules perform best?)

### Phase 3: Gradual Rollout (Week 3-4)
**Goal:** Scale to 50% then 100% of users

1. **Week 3: 50% Rollout**
```typescript
await ctx.runMutation(api.config.featureFlags.updateRolloutPercentage, {
  flagKey: 'proactive_nudges',
  rolloutPercentage: 50,
})
```

2. **Week 4: 100% Rollout** (if metrics look good)
```typescript
await ctx.runMutation(api.config.featureFlags.updateRolloutPercentage, {
  flagKey: 'proactive_nudges',
  rolloutPercentage: 100,
})
```

3. **Monitor at Scale:**
   - Daily volume trends (should stabilize)
   - Server load (cron jobs running efficiently?)
   - Email delivery rates
   - Database growth (nudge table size)

## Monitoring & Alerts

### Key Metrics to Watch

**Success Indicators:**
- ✅ Acceptance rate >30%
- ✅ Engagement rate >50%
- ✅ Avg time to action <24 hours
- ✅ Dismissal rate <40%

**Warning Signs:**
- ⚠️ Acceptance rate <20%
- ⚠️ Dismissal rate >60%
- ⚠️ Many users disabling proactive nudges
- ⚠️ High snooze rate (>50%)

**Critical Issues:**
- 🚨 Cron jobs failing
- 🚨 Email delivery errors
- 🚨 Database errors in nudge creation
- 🚨 User complaints about spam

### Daily Monitoring Routine

1. **Check Admin Dashboard** (`/admin/nudges`):
   - Review yesterday's metrics
   - Check rule performance
   - Review recent activity

2. **Check Support Tickets**:
   - Any nudge-related complaints?
   - Feature requests for new rules?

3. **Check Error Logs**:
   - Cron job failures
   - Email send failures
   - Rule evaluation errors

## Optimization Tips

### If Acceptance Rate is Low:
- Review rule triggers (too aggressive?)
- Adjust cooldown periods (too frequent?)
- Improve suggested actions (too vague?)
- Check quiet hours (reaching users at wrong time?)

### If Dismissal Rate is High:
- Increase daily limits (too many nudges?)
- Review rule relevance (not helpful?)
- Add more playbook toggles (too broad?)
- Improve nudge copy (not compelling?)

### If Email Deliverability Issues:
- Check email service status
- Verify sender domain configuration
- Review spam reports
- Consider reducing email frequency

## Emergency Procedures

### Disable All Nudges Immediately:
```typescript
// Option 1: Feature flag
await ctx.runMutation(api.config.featureFlags.setFeatureFlag, {
  flagKey: 'proactive_nudges',
  enabled: false,
})

// Option 2: University kill switch (for specific institution)
await ctx.db.patch(universityId, {
  agent_disabled: true,
})
```

### Pause Specific Rule:
Edit `convex/nudges/ruleEngine.ts` and make the rule always return `shouldTrigger: false`.

### Adjust Cron Schedule:
Edit `convex/crons.ts` and redeploy.

## Post-Rollout Tasks

### Week 1 After Full Rollout:
- [ ] Review all metrics and create baseline
- [ ] Document any issues encountered
- [ ] Plan rule improvements based on data
- [ ] Consider new rules to add

### Month 1:
- [ ] A/B test different nudge copy
- [ ] Experiment with new rules
- [ ] Add personalization based on user behavior
- [ ] Optimize cooldown periods based on engagement

### Ongoing:
- [ ] Monthly review of rule performance
- [ ] Quarterly user feedback surveys
- [ ] Continuous rule optimization
- [ ] Add new rules based on product features

## Success Criteria

The nudge system rollout is considered successful when:

✅ **Engagement**: >50% of users with nudges interact with them
✅ **Acceptance**: >30% acceptance rate across all rules
✅ **Retention**: <10% of users disable proactive nudges
✅ **Performance**: Cron jobs run reliably without errors
✅ **Feedback**: Positive user feedback outweighs negative

## Support Resources

- **Admin Dashboard**: `/admin/nudges`
- **User Preferences**: `/account/agent-preferences`
- **Codebase Docs**: `/docs/NUDGE_SYSTEM_ROLLOUT.md` (this file)
- **Feature Flags**: `convex/config/featureFlags.ts`
- **Rule Engine**: `convex/nudges/ruleEngine.ts`
- **Metrics**: `convex/nudges/metrics.ts`

## Contact

For issues during rollout, contact:
- Engineering: [Your team]
- Product: [Product manager]
- Support: support@ascentful.io

---

**Last Updated**: 2025-11-02
**Version**: 1.0
**Status**: Ready for Phase 1 (Internal Testing)
