# Proactive AI Agent Nudge System

> **Status**: ✅ Production Ready | **Version**: 1.0.0 | **Last Updated**: 2025-11-02

## Quick Links

- 📖 **[Complete Documentation](../NUDGE_SYSTEM_OVERVIEW.md)** - Full system architecture, rules, and API reference
- 🚀 **[Rollout Plan](../NUDGE_SYSTEM_ROLLOUT.md)** - Step-by-step deployment and monitoring guide
- 🎯 **[Admin Dashboard](/admin/nudges)** - Monitor nudge performance (admin only)
- ⚙️ **[User Preferences](/account/agent-preferences)** - Configure nudge settings (all users)

## What is the Nudge System?

The Proactive AI Agent Nudge System automatically identifies opportunities to help users progress in their job search and sends timely, personalized suggestions through in-app notifications, emails, and (soon) push notifications.

**Example Nudges:**
- "You have an interview with Google tomorrow at 2 PM - let's review your prep materials"
- "Your application to Microsoft has been pending for 2 weeks - consider following up"
- "Your resume scored 65/100 - here are 3 quick improvements to make"
- "You haven't updated your career goals in 30 days - let's check your progress"

## Quick Start

### For Developers

1. **Initialize Feature Flags** (first time only):
   ```bash
   npx ts-node scripts/init-nudge-feature-flags.ts
   ```

2. **Test with a User**:
   ```bash
   npx ts-node scripts/test-nudge-system.ts <userId>
   ```

3. **Monitor System**:
   - Visit `/admin/nudges` in production
   - Check cron job status in Convex dashboard
   - Review error logs

### For Product/Admin

1. **Enable for Testing**:
   - Start with 0% rollout (whitelist specific users)
   - Monitor metrics daily
   - Gradually increase to 10%, 50%, 100%

2. **Monitor Performance**:
   - Acceptance rate (target: >30%)
   - Engagement rate (target: >50%)
   - Dismissal rate (watch if >40%)

3. **Adjust as Needed**:
   - Disable ineffective rules
   - Adjust cooldowns based on feedback
   - Add new rules based on user needs

## The 10 Nudge Rules

| Rule | Trigger | Purpose | Cooldown | Score |
|------|---------|---------|----------|-------|
| **interviewSoon** | Interview in 24-48h | Interview prep reminder | 24h | 85-95 |
| **appRescue** | Application >2 weeks old | Follow-up suggestion | 7d | 70-90 |
| **resumeWeak** | Resume score <70 | Resume improvement | 7d | 65+ |
| **goalStalled** | Goal 0% for >30 days | Re-engage with goals | 7d | 60-80 |
| **networkingIdle** | No contacts in 60d | Networking reminder | 14d | 55 |
| **jobSearchStale** | No apps in 14d | Job search momentum | 7d | 50 |
| **profileIncomplete** | Missing profile fields | Profile completion | 7d | 45-65 |
| **dailyCheck** | Always | Daily engagement | 24h | 30 |
| **weeklyReview** | Mondays | Weekly summary | 7d | 35 |
| **skillGap** | TBD | Skill development | 14d | 55 |

## File Structure

```
convex/
  nudges/
    ruleEngine.ts       # 10 rule definitions
    scoring.ts          # Evaluation & prioritization
    dispatch.ts         # Creation & channel routing
    preferences.ts      # User settings CRUD
    sweepJobs.ts        # Automated cron logic
    metrics.ts          # Analytics
  config/
    featureFlags.ts     # Gradual rollout system
    agentConstants.ts   # Rate limits, cooldowns
  crons.ts              # 3 new cron jobs registered

src/
  app/(dashboard)/
    account/
      agent-preferences/
        page.tsx        # User preferences UI
    admin/
      nudges/
        page.tsx        # Admin monitoring dashboard
  components/dashboard/
    NudgeCard.tsx       # Individual nudge display
    NudgeList.tsx       # Nudge list container
  hooks/
    useNudges.ts        # React hook for state
  lib/
    email.ts            # Email template (lines 814-917)
  app/api/nudges/
    send-email/
      route.ts          # Email API endpoint

scripts/
  init-nudge-feature-flags.ts   # Setup script
  test-nudge-system.ts          # Testing script

docs/
  NUDGE_SYSTEM_OVERVIEW.md      # Complete documentation
  NUDGE_SYSTEM_ROLLOUT.md       # Deployment guide
```

## Key Features

✅ **Smart Triggers** - 10 rules cover job search, applications, networking, goals
✅ **User Control** - Full preferences UI with quiet hours, channels, toggles
✅ **Rate Limiting** - Daily limits (2 free, 5 premium) and per-rule cooldowns
✅ **Multi-Channel** - In-app notifications, emails, push (ready)
✅ **Analytics** - Comprehensive metrics and admin dashboard
✅ **Gradual Rollout** - Feature flags for safe deployment
✅ **Kill Switches** - University-level and user-level disable
✅ **Automated** - Hourly/daily/weekly cron jobs

## User Preferences

Users can customize their experience at `/account/agent-preferences`:

- **Agent Toggle**: Enable/disable entire AI agent
- **Proactive Toggle**: Enable/disable proactive nudges (keep reactive chat)
- **Quiet Hours**: Set do-not-disturb times (e.g., 22:00 - 8:00)
- **Channels**: Choose in-app, email, and/or push notifications
- **Playbook Toggles**: Disable specific categories (job search, resume, interview, networking, career path, applications)

## Rate Limits & Safety

- **Daily Limits**: 2 nudges/day (free), 5 nudges/day (premium)
- **Cooldowns**: 24h to 14 days per rule (prevents spam)
- **Quiet Hours**: Respects user's do-not-disturb times
- **Kill Switch**: Universities can disable for all students

## Cron Schedule

| Job | Schedule | Purpose |
|-----|----------|---------|
| Hourly Sweep | Every hour at :30 | Urgent rules (interviewSoon, dailyCheck) |
| Daily Sweep | 9:00 AM UTC | All rules, comprehensive evaluation |
| Weekly Sweep | Mondays 9:00 AM UTC | Weekly progress summaries |

## Metrics Dashboard

Access at `/admin/nudges` (admin only):

- **Global Metrics**: Total nudges, acceptance rate, engagement, avg time to action
- **Status Distribution**: Accepted, snoozed, dismissed, pending counts
- **Rule Performance**: Which rules are most effective?
- **Volume Trends**: 7-day chart of daily nudge activity
- **Recent Activity**: Live feed of latest interactions

## Common Commands

```bash
# Initialize feature flags (first time only)
npx ts-node scripts/init-nudge-feature-flags.ts

# Test nudge generation for a user
npx ts-node scripts/test-nudge-system.ts <userId>

# Deploy to production
npm run build
npx convex deploy --prod

# Monitor cron jobs
# Visit Convex dashboard → Cron Jobs

# View metrics
# Visit https://app.ascentful.io/admin/nudges
```

## Troubleshooting

**Nudges not appearing?**
- Check user preferences (agent enabled? proactive enabled?)
- Check feature flags (enabled? rollout % > 0?)
- Check quiet hours (not in quiet period?)
- Check daily limits (not exceeded?)

**Emails not sending?**
- Check email service configured (Mailgun or SendGrid)
- Check user has email channel enabled
- Check API logs at `/api/nudges/send-email`

**Metrics not updating?**
- Check nudges are being created in DB
- Clear cache and refresh dashboard
- Check timestamp fields populated

**Cron jobs not running?**
- Check Convex dashboard for cron status
- Verify crons.ts properly exports jobs
- Check error logs in Convex

## Support

- **Documentation**: See `docs/NUDGE_SYSTEM_OVERVIEW.md`
- **Rollout Guide**: See `docs/NUDGE_SYSTEM_ROLLOUT.md`
- **Admin Dashboard**: `/admin/nudges`
- **User Support**: <support@ascentful.io>

---

**Built with**: Convex, Next.js, TypeScript, React, OpenAI
**Team**: Engineering, Product, Design
**Version**: 1.0.0
**Status**: ✅ Production Ready
