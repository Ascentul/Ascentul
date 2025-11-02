# Proactive AI Agent Nudge System - Complete Documentation

## Executive Summary

The Proactive AI Agent Nudge System is a comprehensive career assistance feature that automatically identifies opportunities to help users progress in their job search. The system evaluates 10 different rules, respects user preferences, and delivers personalized suggestions through multiple channels.

**Key Capabilities:**
- ✅ 10 intelligent nudge rules covering job search, applications, networking, goals, and profile
- ✅ Multi-channel delivery (in-app, email, push-ready)
- ✅ User preference controls (quiet hours, channels, playbook toggles)
- ✅ Automated hourly, daily, and weekly sweeps
- ✅ Comprehensive metrics and admin monitoring
- ✅ University kill switch for institutional control
- ✅ Plan-based limits (2/day free, 5/day premium)

## System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                     NUDGE SYSTEM FLOW                        │
└─────────────────────────────────────────────────────────────┘

    Cron Jobs (Scheduled)
         ↓
    Sweep Jobs (sweepJobs.ts)
    - Hourly: Urgent rules
    - Daily: All rules
    - Weekly: Weekly reviews
         ↓
    Eligible Users Query
    - Check feature flags
    - Check user preferences
    - Check quiet hours
    - Check university kill switch
         ↓
    Rule Engine (ruleEngine.ts)
    - Evaluate 10 rules
    - Return triggered rules with scores
         ↓
    Scoring & Prioritization (scoring.ts)
    - Check cooldowns (prevent spam)
    - Check daily limits (2 free, 5 premium)
    - Sort by score
    - Return top nudges
         ↓
    Nudge Creation (dispatch.ts)
    - Create nudge records in DB
    - Set cooldown for rule
         ↓
    Channel Dispatch (dispatch.ts)
    - In-App: Store in DB
    - Email: Call API route → sendEmail
    - Push: Placeholder for future
         ↓
    User Actions
    - Accept: Mark as accepted, navigate to action URL
    - Snooze: Hide for 1h/4h/24h/1week
    - Dismiss: Mark as dismissed, remove from feed
         ↓
    Metrics Tracking (metrics.ts)
    - Acceptance rate
    - Snooze patterns
    - Rule effectiveness
    - User engagement
         ↓
    Admin Dashboard (/admin/nudges)
    - View global metrics
    - Monitor rule performance
    - Track recent activity
```

## File Structure

### Backend (Convex)

**Core Nudge System:**
- `convex/nudges/ruleEngine.ts` - 10 nudge rule definitions with evaluation logic
- `convex/nudges/scoring.ts` - Rule evaluation, cooldowns, quiet hours, daily limits
- `convex/nudges/dispatch.ts` - Nudge creation, channel routing, user actions
- `convex/nudges/preferences.ts` - User preference CRUD operations
- `convex/nudges/sweepJobs.ts` - Automated cron job logic (hourly/daily/weekly)
- `convex/nudges/metrics.ts` - Analytics and performance tracking

**Infrastructure:**
- `convex/config/featureFlags.ts` - Feature flag system (gradual rollout)
- `convex/config/agentConstants.ts` - Rate limits, cooldowns, scoring weights
- `convex/crons.ts` - Cron job registration (3 new jobs added)
- `convex/schema.ts` - Database schema (14 new tables)

### Frontend (Next.js)

**User Interface:**
- `src/app/(dashboard)/account/agent-preferences/page.tsx` - User preferences page
- `src/components/dashboard/NudgeCard.tsx` - Individual nudge display
- `src/components/dashboard/NudgeList.tsx` - Nudge list container
- `src/hooks/useNudges.ts` - React hook for nudge state management

**Admin Interface:**
- `src/app/(dashboard)/admin/nudges/page.tsx` - Admin monitoring dashboard

**Email & API:**
- `src/lib/email.ts` - Email template for nudge notifications (line 814-917)
- `src/app/api/nudges/send-email/route.ts` - API route for email sending

**Validation:**
- `src/lib/validation/agent.ts` - Zod schemas for nudge data

### Scripts & Documentation

**Deployment:**
- `scripts/init-nudge-feature-flags.ts` - Initialize feature flags
- `scripts/test-nudge-system.ts` - Test nudge generation for a user

**Documentation:**
- `docs/NUDGE_SYSTEM_OVERVIEW.md` - This file (complete documentation)
- `docs/NUDGE_SYSTEM_ROLLOUT.md` - Rollout plan and monitoring guide

## The 10 Nudge Rules

### 1. Interview Soon (Urgent)
- **Trigger**: Interview scheduled in next 24-48 hours
- **Purpose**: Ensure users prepare for upcoming interviews
- **Cooldown**: 24 hours
- **Score**: 85-95 (higher if within 24 hours)
- **Action**: Links to interview details in applications

### 2. Application Rescue (Helpful)
- **Trigger**: Application submitted >2 weeks ago with no follow-up
- **Purpose**: Prevent applications from going stale
- **Cooldown**: 7 days
- **Score**: 70-90 (increases with application age)
- **Action**: Suggests following up with employer

### 3. Resume Weak (Helpful)
- **Trigger**: Resume analysis score <70/100
- **Purpose**: Encourage resume improvement
- **Cooldown**: 7 days
- **Score**: 65+ (lower resume score = higher nudge score)
- **Action**: Links to resume editor with improvement suggestions

### 4. Goal Stalled (Engagement)
- **Trigger**: Active goal with 0% progress for >30 days
- **Purpose**: Re-engage users with career goals
- **Cooldown**: 7 days
- **Score**: 60-80 (increases with time stalled)
- **Action**: Links to goals page

### 5. Networking Idle (Engagement, Premium)
- **Trigger**: No contact interactions in >60 days
- **Purpose**: Encourage professional networking
- **Cooldown**: 14 days
- **Score**: 55
- **Action**: Links to contacts/CRM page
- **Requirement**: Premium plan only

### 6. Job Search Stale (Engagement)
- **Trigger**: No applications submitted in >14 days
- **Purpose**: Keep job search momentum
- **Cooldown**: 7 days
- **Score**: 50
- **Action**: Links to dashboard/job search

### 7. Profile Incomplete (Maintenance)
- **Trigger**: Missing critical profile fields (position, company, location, bio, skills)
- **Purpose**: Complete user profile for better job matching
- **Cooldown**: 7 days
- **Score**: 45-65 (more gaps = higher score)
- **Action**: Links to account settings

### 8. Daily Check (Engagement)
- **Trigger**: Always triggers (catch-all rule)
- **Purpose**: Daily engagement reminder
- **Cooldown**: 24 hours
- **Score**: 30 (lowest priority)
- **Action**: Links to dashboard

### 9. Weekly Review (Engagement)
- **Trigger**: Weekly summary (Mondays only)
- **Purpose**: Encourage weekly reflection on progress
- **Cooldown**: 7 days
- **Score**: 35
- **Action**: Links to dashboard with weekly stats

### 10. Skill Gap (Helpful, Premium)
- **Trigger**: Placeholder (not yet implemented)
- **Purpose**: Suggest skill development based on job requirements
- **Cooldown**: 14 days
- **Score**: 55
- **Requirement**: Premium plan only

## User Preferences

Users can customize the nudge system through `/account/agent-preferences`:

### Global Toggles
- **Agent Enabled**: Master switch for entire AI agent
- **Proactive Nudges**: Enable/disable proactive suggestions (keep reactive chat)

### Quiet Hours
- **Start/End Time**: 24-hour format (e.g., 22:00 - 8:00)
- **Timezone**: User timezone for accurate quiet hour enforcement

### Notification Channels
- **In-App**: Show nudges in dashboard (default: ON)
- **Email**: Send nudge emails (default: OFF)
- **Push**: Mobile push notifications (placeholder, default: OFF)

### Playbook Toggles
Users can disable specific types of career assistance:
- Job Search Assistance
- Resume Optimization
- Interview Preparation
- Networking Suggestions
- Career Path Planning
- Application Follow-ups

## Rate Limiting & Safety

### Daily Limits
- **Free Users**: 2 nudges per day
- **Premium Users**: 5 nudges per day
- **University Users**: 5 nudges per day

### Cooldowns (Per Rule)
- **interviewSoon**: 24 hours
- **appRescue**: 7 days
- **resumeWeak**: 7 days
- **goalStalled**: 7 days
- **networkingIdle**: 14 days
- **jobSearchStale**: 7 days
- **profileIncomplete**: 7 days
- **dailyCheck**: 24 hours
- **weeklyReview**: 7 days
- **skillGap**: 14 days

### Quiet Hours
- Nudges are NOT created during user's quiet hours
- Default: 22:00 - 8:00 (user configurable)
- Timezone-aware based on user preference

### University Kill Switch
- Universities can disable the agent for all students
- Field: `universities.agent_disabled`
- Overrides all user preferences

## Metrics & Analytics

### Global Metrics
- Total nudges sent
- Acceptance rate (%)
- Snooze rate (%)
- Dismissal rate (%)
- Average time to action

### Engagement Metrics
- Total active users (with agent enabled)
- Users who received nudges
- Users who interacted with nudges
- Engagement rate (%)
- Average nudges per user

### Rule Performance
- Total nudges by rule type
- Acceptance rate by rule
- Identify most/least effective rules

### Volume Trends
- Daily nudge volume (7-day chart)
- Breakdown by status (accepted/snoozed/dismissed)

### Recent Activity
- Live feed of latest nudge interactions
- User info, rule type, status, timestamp

## API Endpoints

### Internal (Convex Queries/Mutations)

**Preferences:**
- `api.nudges.preferences.getUserPreferences`
- `api.nudges.preferences.upsertPreferences`
- `api.nudges.preferences.toggleAgent`
- `api.nudges.preferences.toggleProactiveNudges`
- `api.nudges.preferences.updateQuietHours`
- `api.nudges.preferences.updateChannels`
- `api.nudges.preferences.updatePlaybookToggles`
- `api.nudges.preferences.resetPreferences`

**Nudge Actions:**
- `api.nudges.dispatch.getPendingNudges`
- `api.nudges.dispatch.acceptNudge`
- `api.nudges.dispatch.snoozeNudge`
- `api.nudges.dispatch.dismissNudge`

**Metrics:**
- `api.nudges.scoring.getNudgeStats`
- `api.nudges.metrics.getGlobalMetrics`
- `api.nudges.metrics.getMetricsByRuleType`
- `api.nudges.metrics.getEngagementMetrics`
- `api.nudges.metrics.getRecentActivity`
- `api.nudges.metrics.getDailyVolumeTrend`

**Evaluation (Testing):**
- `api.nudges.scoring.evaluateNudgesForUser`
- `api.nudges.scoring.evaluateSingleRule`

### External (Next.js API Routes)

**Email:**
- `POST /api/nudges/send-email` - Send nudge email notification
  - Headers: `X-Convex-Internal-Key` (for security)
  - Body: `{ email, name, nudge }`

## Cron Jobs

### Hourly Sweep
- **Schedule**: Every hour at :30 (e.g., 1:30, 2:30, 3:30)
- **Function**: `internal.nudges.sweepJobs.hourlySweep`
- **Purpose**: Process urgent and time-sensitive nudges
- **Rules Evaluated**: `interviewSoon`, `dailyCheck`, engagement rules

### Daily Sweep
- **Schedule**: Daily at 9:00 AM UTC
- **Function**: `internal.nudges.sweepJobs.dailySweep`
- **Purpose**: Comprehensive evaluation of all rules
- **Rules Evaluated**: All 10 rules
- **Actions**: Creates and dispatches nudges to all channels

### Weekly Sweep
- **Schedule**: Every Monday at 9:00 AM UTC
- **Function**: `internal.nudges.sweepJobs.weeklySweep`
- **Purpose**: Send weekly progress summaries
- **Rules Evaluated**: `weeklyReview` only

## Database Schema

### New Tables (14 total)

**Agent Core:**
1. `agent_preferences` - User nudge preferences
2. `agent_cooldowns` - Rule cooldown tracking
3. `agent_nudges` - Nudge records with status
4. `feature_flags` - Feature flag configuration
5. `agent_profile_fields` - Profile completion tracking
6. `agent_audit_logs` - Audit trail for agent actions
7. `agent_request_logs` - Rate limiting

**Analytics:**
8. `resume_analyses` - Resume quality scores
9. `cover_letter_analyses` - Cover letter feedback

**CRM:**
10. `networking_contacts` - Professional contacts
11. `contact_notes` - Contact notes
12. `contact_interactions` - Interaction history
13. `contact_follow_ups` - Follow-up reminders

**Applications:**
14. `interview_stages` - Interview tracking
15. `application_follow_ups` - Application follow-up tracking

**Career Planning:**
16. `career_paths` - AI-generated career roadmaps

## Testing

### Manual Testing Checklist

**Setup:**
- [ ] Feature flags created and enabled
- [ ] Test user has agent enabled
- [ ] Test user has proactive nudges enabled

**Rule Testing:**
- [ ] Create test data for each rule (see rollout doc)
- [ ] Trigger daily sweep manually
- [ ] Verify nudges appear in dashboard
- [ ] Verify nudge details are correct
- [ ] Test accept action
- [ ] Test snooze action (1h, 4h, 24h, 1 week)
- [ ] Test dismiss action

**Preferences Testing:**
- [ ] Toggle agent on/off
- [ ] Toggle proactive nudges on/off
- [ ] Set quiet hours
- [ ] Enable/disable channels
- [ ] Toggle individual playbooks
- [ ] Reset to defaults

**Email Testing:**
- [ ] Enable email channel
- [ ] Trigger nudge
- [ ] Verify email received
- [ ] Check email formatting
- [ ] Test action link
- [ ] Test preferences link

**Metrics Testing:**
- [ ] View admin dashboard
- [ ] Verify metrics calculate correctly
- [ ] Check rule performance table
- [ ] Review volume trends
- [ ] Check recent activity

### Automated Testing Scripts

**Initialize Feature Flags:**
```bash
npx ts-node scripts/init-nudge-feature-flags.ts
```

**Test Nudge Generation:**
```bash
npx ts-node scripts/test-nudge-system.ts <userId>
```

## Deployment Checklist

### Pre-Deployment
- [ ] All code merged to main branch
- [ ] Schema deployed to production Convex
- [ ] Environment variables set (see rollout doc)
- [ ] Feature flags script ready
- [ ] Test data prepared

### Deployment
- [ ] Deploy Next.js app to production
- [ ] Deploy Convex functions
- [ ] Run feature flag initialization script
- [ ] Verify cron jobs registered
- [ ] Test email delivery

### Post-Deployment
- [ ] Run test script with admin user
- [ ] Verify admin dashboard loads
- [ ] Check metrics (should be zero initially)
- [ ] Monitor error logs
- [ ] Gradual rollout (see rollout doc)

## Troubleshooting

### Nudges Not Appearing
1. Check user preferences (agent enabled? proactive enabled?)
2. Check feature flags (enabled? rollout % high enough?)
3. Check quiet hours (in quiet period?)
4. Check daily limits (reached limit?)
5. Check cooldowns (rule on cooldown?)
6. Check rule criteria (does user match trigger conditions?)

### Emails Not Sending
1. Check email service configured (Mailgun/SendGrid)
2. Check API key in environment variables
3. Check user has email channel enabled
4. Check email logs in dashboard
5. Check spam folder
6. Verify API route `/api/nudges/send-email` works

### Cron Jobs Not Running
1. Check Convex dashboard for cron status
2. Verify cron jobs registered in `crons.ts`
3. Check error logs for failures
4. Verify `internal` functions exported correctly

### Metrics Not Updating
1. Check nudges are being created
2. Verify status changes are recorded
3. Check timestamp fields populated
4. Clear cache and refresh admin dashboard

## Performance Considerations

### Database
- Nudges table will grow over time (consider archiving old nudges)
- Index on `user_id` and `created_at` for efficient queries
- Cooldowns table cleanup (periodically remove expired cooldowns)

### Cron Jobs
- Hourly sweep processes only urgent rules (lightweight)
- Daily sweep can be heavy with many users (monitor execution time)

**Performance Bottleneck #1: Loading All Users into Memory**
- `getEligibleUsers()` loads entire users table with `.collect()`
- **Current capacity**: Acceptable for <1000 total users (~1MB memory, ~100ms query)
- **Critical threshold**: Performance degrades beyond 2000 users
- **Optimization needed when**:
  - Total user count exceeds 2000
  - Query time exceeds 500ms
  - Memory pressure warnings appear in Convex logs
- **Optimization approach**:
  - Query `agent_preferences` table instead (smaller, filtered dataset)
  - Use index-based filtering to push logic to database layer
  - Implement cursor-based pagination for very large datasets

**Performance Bottleneck #2: Serial User Processing**
- Each eligible user is processed one-by-one in a for loop
- **Current capacity**: Acceptable for <500 active users (~100 seconds)
- **Convex action timeout**: 10 minutes (plenty of headroom)
- **Scaling threshold**: Optimize when >1000 active users or execution >2 minutes
- **Optimization approach**:
  - Batch users into groups of 50-100
  - Process batches with Promise.all() for parallelization
  - Monitor execution time via admin dashboard or Convex logs

### Email Delivery
- Rate limit email sending to avoid spam flags
- Use email service's batch API if available
- Monitor bounce rates

### Frontend
- Nudge list pagination if >20 nudges
- Metrics dashboard caching (refresh every 5-10 minutes)
- Lazy load admin dashboard components

## Future Enhancements

### Short Term
- [ ] Push notification integration (when mobile app ready)
- [ ] More playbook-specific rules
- [ ] A/B test different nudge copy
- [ ] Personalization based on user behavior

### Medium Term
- [ ] Machine learning for optimal send times
- [ ] Nudge effectiveness prediction
- [ ] Smart snooze (suggest best time to revisit)
- [ ] Batch nudges (combine multiple into digest)
- [ ] **Performance Optimization #1**: Query optimization for eligible users (PRIORITY)
  - **Trigger**: Total user count >2000 OR query time >500ms
  - Query `agent_preferences` table instead of loading all users
  - Use database indexes to filter at query layer
  - Implement cursor-based pagination if needed
  - **Impact**: Reduces memory usage by 70-90%, improves query speed
- [ ] **Performance Optimization #2**: Parallel processing for sweep jobs
  - **Trigger**: Active user count >1000 OR execution time >2 minutes
  - Batch users into groups of 50-100
  - Process batches with Promise.all() for parallelization
  - Add execution time monitoring to admin dashboard
  - **Impact**: 5-10x faster processing for large user bases

### Long Term
- [ ] Multi-language support
- [ ] Voice nudges (integration with voice assistants)
- [ ] Contextual nudges (based on browsing behavior)
- [ ] Integration with calendar for interview prep

## Support & Maintenance

### Monitoring
- Daily review of admin dashboard
- Weekly review of rule performance
- Monthly user feedback review
- Quarterly system optimization

### Support Tickets
- Tag nudge-related tickets for analysis
- Common issues documented in FAQ
- Escalation path for critical issues

### Code Maintenance
- Keep rule logic updated as product evolves
- Deprecate ineffective rules
- Add new rules based on user feedback
- Optimize performance based on usage patterns

---

**System Version**: 1.0.0
**Last Updated**: 2025-11-02
**Status**: ✅ Production Ready
**Team**: Engineering, Product, Design
**Contact**: <support@ascentful.io>
