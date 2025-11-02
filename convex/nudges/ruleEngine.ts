/**
 * Rule Engine for Proactive Nudges
 *
 * Defines all nudge rules with conditions, scoring, and metadata
 * Each rule checks user state and returns whether a nudge should be triggered
 */

import { Doc, Id } from '../_generated/dataModel'
import { QueryCtx } from '../_generated/server'

/**
 * Nudge rule type definition
 */
export type NudgeRuleType =
  | 'interviewSoon'
  | 'appRescue'
  | 'resumeWeak'
  | 'goalStalled'
  | 'networkingIdle'
  | 'jobSearchStale'
  | 'profileIncomplete'
  | 'dailyCheck'
  | 'weeklyReview'
  | 'skillGap'

/**
 * Rule evaluation result
 */
export interface RuleEvaluation {
  ruleType: NudgeRuleType
  shouldTrigger: boolean
  score: number
  reason: string
  metadata: Record<string, unknown>
  suggestedAction?: string
  actionUrl?: string
}

/**
 * Rule definition interface
 */
export interface NudgeRule {
  type: NudgeRuleType
  name: string
  description: string
  category: 'urgent' | 'helpful' | 'maintenance' | 'engagement'
  baseScore: number
  cooldownMs: number
  requiredPlan?: 'free' | 'premium' | 'university'

  /**
   * Evaluate if rule should trigger for user
   */
  evaluate: (ctx: QueryCtx, userId: Id<'users'>) => Promise<RuleEvaluation>
}

/**
 * All nudge rules registry
 */
export const NUDGE_RULES: Record<NudgeRuleType, NudgeRule> = {
  /**
   * Interview Soon - Upcoming interview needs prep
   * Triggers: 24-48 hours before interview
   */
  interviewSoon: {
    type: 'interviewSoon',
    name: 'Interview Preparation Reminder',
    description: 'User has an interview in the next 24-48 hours',
    category: 'urgent',
    baseScore: 95,
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours

    evaluate: async (ctx, userId) => {
      const now = Date.now()
      const next48Hours = now + 48 * 60 * 60 * 1000
      const next24Hours = now + 24 * 60 * 60 * 1000

      // Find applications with upcoming interviews
      const applications = await ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) => q.eq(q.field('status'), 'interview'))
        .collect()

      // Early return if no applications
      if (applications.length === 0) {
        return {
          ruleType: 'interviewSoon',
          shouldTrigger: false,
          score: 0,
          reason: 'No applications in interview stage',
          metadata: {},
        }
      }

      // Fetch all scheduled interview stages for this user's applications at once
      // This avoids N+1 queries by getting all stages in a single query
      const applicationIds = applications.map(app => app._id)
      const allStages = await ctx.db
        .query('interview_stages')
        .filter((q) => q.eq(q.field('outcome'), 'scheduled'))
        .collect()

      // Filter stages to only those belonging to this user's applications
      // and within the time window
      const relevantStages = allStages.filter(stage =>
        applicationIds.includes(stage.application_id) &&
        stage.scheduled_at &&
        stage.scheduled_at >= now &&
        stage.scheduled_at <= next48Hours
      )

      // Build upcomingInterviews by matching stages with applications
      const upcomingInterviews = relevantStages.map(stage => {
        const app = applications.find(a => a._id === stage.application_id)!
        return { app, stage }
      })

      if (upcomingInterviews.length === 0) {
        return {
          ruleType: 'interviewSoon',
          shouldTrigger: false,
          score: 0,
          reason: 'No interviews in next 48 hours',
          metadata: {},
        }
      }

      // Get earliest interview
      const earliest = upcomingInterviews.sort((a, b) =>
        (a.stage.scheduled_at || 0) - (b.stage.scheduled_at || 0)
      )[0]

      const hoursUntil = Math.round(((earliest.stage.scheduled_at || 0) - now) / (1000 * 60 * 60))
      const isWithin24Hours = (earliest.stage.scheduled_at || 0) <= next24Hours

      return {
        ruleType: 'interviewSoon',
        shouldTrigger: true,
        score: isWithin24Hours ? 95 : 85, // Higher score if within 24 hours
        reason: `Interview with ${earliest.app.company} in ${hoursUntil} hours`,
        metadata: {
          company: earliest.app.company,
          jobTitle: earliest.app.job_title,
          stageTitle: earliest.stage.title,
          scheduledAt: earliest.stage.scheduled_at,
          hoursUntil,
        },
        suggestedAction: `Review your prep materials for ${earliest.app.company}`,
        actionUrl: `/applications/${earliest.app._id}`,
      }
    },
  },

  /**
   * Application Rescue - Stale applications need follow-up
   * Triggers: Applied >2 weeks ago, no response
   */
  appRescue: {
    type: 'appRescue',
    name: 'Application Follow-Up Reminder',
    description: 'User has stale applications that need follow-up',
    category: 'helpful',
    baseScore: 70,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    evaluate: async (ctx, userId) => {
      const now = Date.now()
      const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000

      // Find applications that are stale
      const staleApps = await ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) =>
          q.and(
            q.eq(q.field('status'), 'applied'),
            q.lt(q.field('applied_at'), twoWeeksAgo)
          )
        )
        .collect()

      // Early return if no stale apps
      if (staleApps.length === 0) {
        return {
          ruleType: 'appRescue',
          shouldTrigger: false,
          score: 0,
          reason: 'No stale applications',
          metadata: {},
        }
      }

      // Fetch all follow-ups at once to avoid N+1 queries
      const staleAppIds = staleApps.map(app => app._id)
      const allFollowUps = await ctx.db
        .query('followup_actions')
        .collect()

      // Create a set of application IDs that have follow-ups
      const appsWithFollowUps = new Set(
        allFollowUps
          .filter(fu => fu.application_id && staleAppIds.includes(fu.application_id))
          .map(fu => fu.application_id!)
      )

      // Filter out apps that already have follow-ups
      const appsNeedingFollowUp = staleApps.filter(app => !appsWithFollowUps.has(app._id))

      if (appsNeedingFollowUp.length === 0) {
        return {
          ruleType: 'appRescue',
          shouldTrigger: false,
          score: 0,
          reason: 'No stale applications without follow-ups',
          metadata: {},
        }
      }

      const oldestApp = appsNeedingFollowUp.sort((a, b) =>
        (a.applied_at || 0) - (b.applied_at || 0)
      )[0]

      const daysAgo = Math.round((now - (oldestApp.applied_at || 0)) / (1000 * 60 * 60 * 24))

      return {
        ruleType: 'appRescue',
        shouldTrigger: true,
        score: Math.min(70 + (daysAgo - 14) * 2, 90), // Score increases with age
        reason: `${appsNeedingFollowUp.length} applications need follow-up`,
        metadata: {
          staleCount: appsNeedingFollowUp.length,
          oldestCompany: oldestApp.company,
          oldestDaysAgo: daysAgo,
        },
        suggestedAction: `Follow up on your application to ${oldestApp.company}`,
        actionUrl: `/applications/${oldestApp._id}`,
      }
    },
  },

  /**
   * Resume Weak - Resume score below threshold
   * Triggers: Resume analyzed with score < 70
   */
  resumeWeak: {
    type: 'resumeWeak',
    name: 'Resume Improvement Suggestion',
    description: 'User resume has low quality score',
    category: 'helpful',
    baseScore: 65,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    evaluate: async (ctx, userId) => {
      // Get user's most recent resume
      const resumes = await ctx.db
        .query('resumes')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .order('desc')
        .take(1)

      if (resumes.length === 0) {
        return {
          ruleType: 'resumeWeak',
          shouldTrigger: false,
          score: 0,
          reason: 'No resume found',
          metadata: {},
        }
      }

      const resume = resumes[0]

      // Get most recent analysis
      const analyses = await ctx.db
        .query('resume_analyses')
        .withIndex('by_resume', (q) => q.eq('resume_id', resume._id))
        .order('desc')
        .take(1)

      if (analyses.length === 0) {
        return {
          ruleType: 'resumeWeak',
          shouldTrigger: false,
          score: 0,
          reason: 'Resume not yet analyzed',
          metadata: {},
        }
      }

      const analysis = analyses[0]

      if (analysis.score >= 70) {
        return {
          ruleType: 'resumeWeak',
          shouldTrigger: false,
          score: 0,
          reason: 'Resume score is acceptable',
          metadata: { currentScore: analysis.score },
        }
      }

      return {
        ruleType: 'resumeWeak',
        shouldTrigger: true,
        score: 65 + (70 - analysis.score) / 2, // Lower resume score = higher nudge score
        reason: `Resume scored ${analysis.score}/100`,
        metadata: {
          resumeId: resume._id,
          resumeTitle: resume.title,
          currentScore: analysis.score,
          topGaps: analysis.gaps.slice(0, 3),
        },
        suggestedAction: `Improve your resume (current score: ${analysis.score}/100)`,
        actionUrl: `/resumes/${resume._id}`,
      }
    },
  },

  /**
   * Goal Stalled - Career goals not progressing
   * Triggers: Active goal with 0% progress for >30 days
   */
  goalStalled: {
    type: 'goalStalled',
    name: 'Goal Progress Reminder',
    description: 'User has stalled career goals',
    category: 'engagement',
    baseScore: 60,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    evaluate: async (ctx, userId) => {
      const now = Date.now()
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000

      // Find active goals with no progress
      const stalledGoals = await ctx.db
        .query('goals')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) =>
          q.and(
            q.or(
              q.eq(q.field('status'), 'active'),
              q.eq(q.field('status'), 'in_progress')
            ),
            q.eq(q.field('progress'), 0),
            q.lt(q.field('created_at'), thirtyDaysAgo)
          )
        )
        .collect()

      if (stalledGoals.length === 0) {
        return {
          ruleType: 'goalStalled',
          shouldTrigger: false,
          score: 0,
          reason: 'No stalled goals',
          metadata: {},
        }
      }

      const oldestGoal = stalledGoals.sort((a, b) => a.created_at - b.created_at)[0]
      const daysStalled = Math.round((now - oldestGoal.created_at) / (1000 * 60 * 60 * 24))

      return {
        ruleType: 'goalStalled',
        shouldTrigger: true,
        score: Math.min(60 + Math.floor(daysStalled / 10), 80), // Score increases with time
        reason: `${stalledGoals.length} goals haven't been updated`,
        metadata: {
          stalledCount: stalledGoals.length,
          oldestGoalTitle: oldestGoal.title,
          daysStalled,
        },
        suggestedAction: `Make progress on "${oldestGoal.title}"`,
        actionUrl: `/goals`,
      }
    },
  },

  /**
   * Networking Idle - No contact activity in 60 days
   * Triggers: User has contacts but no interactions recently
   */
  networkingIdle: {
    type: 'networkingIdle',
    name: 'Networking Activity Reminder',
    description: 'User networking activity has gone quiet',
    category: 'engagement',
    baseScore: 55,
    cooldownMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    requiredPlan: 'premium',

    evaluate: async (ctx, userId) => {
      const now = Date.now()
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000

      // Check if user has contacts
      const contacts = await ctx.db
        .query('networking_contacts')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .collect()

      if (contacts.length === 0) {
        return {
          ruleType: 'networkingIdle',
          shouldTrigger: false,
          score: 0,
          reason: 'No contacts to network with',
          metadata: {},
        }
      }

      // Check for recent interactions
      const recentInteractions = await ctx.db
        .query('contact_interactions')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) => q.gt(q.field('interaction_date'), sixtyDaysAgo))
        .collect()

      if (recentInteractions.length > 0) {
        return {
          ruleType: 'networkingIdle',
          shouldTrigger: false,
          score: 0,
          reason: 'Recent networking activity found',
          metadata: { recentCount: recentInteractions.length },
        }
      }

      // Fetch all contact interactions at once to avoid N+1 queries
      const contactIds = contacts.map(c => c._id)
      const allInteractions = await ctx.db
        .query('contact_interactions')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .collect()

      // Group interactions by contact_id and find the most recent for each
      const latestInteractionByContact = new Map<string, number>()
      for (const interaction of allInteractions) {
        if (!contactIds.includes(interaction.contact_id)) continue

        const current = latestInteractionByContact.get(interaction.contact_id)
        if (!current || interaction.interaction_date > current) {
          latestInteractionByContact.set(interaction.contact_id, interaction.interaction_date)
        }
      }

      // Find contacts that need follow-up
      const contactsNeedingFollowUp = contacts.filter(contact => {
        const lastInteractionDate = latestInteractionByContact.get(contact._id)
        return !lastInteractionDate || lastInteractionDate < sixtyDaysAgo
      })

      return {
        ruleType: 'networkingIdle',
        shouldTrigger: true,
        score: 55,
        reason: `${contactsNeedingFollowUp.length} contacts need follow-up`,
        metadata: {
          totalContacts: contacts.length,
          needFollowUp: contactsNeedingFollowUp.length,
        },
        suggestedAction: 'Reach out to your professional network',
        actionUrl: '/contacts',
      }
    },
  },

  /**
   * Job Search Stale - No job search activity in 14 days
   * Triggers: No saved jobs, applications, or searches recently
   */
  jobSearchStale: {
    type: 'jobSearchStale',
    name: 'Job Search Activity Reminder',
    description: 'User job search activity has slowed down',
    category: 'engagement',
    baseScore: 50,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    evaluate: async (ctx, userId) => {
      const now = Date.now()
      const fourteenDaysAgo = now - 14 * 24 * 60 * 60 * 1000

      // Check for recent applications
      const recentApps = await ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) => q.gt(q.field('created_at'), fourteenDaysAgo))
        .collect()

      if (recentApps.length > 0) {
        return {
          ruleType: 'jobSearchStale',
          shouldTrigger: false,
          score: 0,
          reason: 'Recent job search activity found',
          metadata: {},
        }
      }

      // Check if user has any applications at all (to avoid nudging inactive users)
      const totalApps = await ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .take(1)

      if (totalApps.length === 0) {
        return {
          ruleType: 'jobSearchStale',
          shouldTrigger: false,
          score: 0,
          reason: 'User has never searched for jobs',
          metadata: {},
        }
      }

      return {
        ruleType: 'jobSearchStale',
        shouldTrigger: true,
        score: 50,
        reason: 'No job search activity in 14 days',
        metadata: {
          daysSinceActivity: 14,
        },
        suggestedAction: 'Continue your job search',
        actionUrl: '/dashboard',
      }
    },
  },

  /**
   * Profile Incomplete - User profile missing critical fields
   * Triggers: Profile gaps with high severity
   */
  profileIncomplete: {
    type: 'profileIncomplete',
    name: 'Complete Your Profile',
    description: 'User profile has critical missing fields',
    category: 'maintenance',
    baseScore: 45,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    evaluate: async (ctx, userId) => {
      const user = await ctx.db.get(userId)
      if (!user) {
        return {
          ruleType: 'profileIncomplete',
          shouldTrigger: false,
          score: 0,
          reason: 'User not found',
          metadata: {},
        }
      }

      // Check for missing critical fields
      const gaps = []
      if (!user.current_position) gaps.push('current_position')
      if (!user.current_company) gaps.push('current_company')
      if (!user.location) gaps.push('location')
      if (!user.bio) gaps.push('bio')
      if (!user.skills || user.skills.length === 0) gaps.push('skills')

      if (gaps.length === 0) {
        return {
          ruleType: 'profileIncomplete',
          shouldTrigger: false,
          score: 0,
          reason: 'Profile is complete',
          metadata: {},
        }
      }

      return {
        ruleType: 'profileIncomplete',
        shouldTrigger: true,
        score: 45 + gaps.length * 5, // More gaps = higher score
        reason: `${gaps.length} profile fields are missing`,
        metadata: {
          missingFields: gaps,
        },
        suggestedAction: 'Complete your profile to improve job matches',
        actionUrl: '/account',
      }
    },
  },

  /**
   * Daily Check - General engagement nudge
   * Triggers: Once per day if no other high-priority nudges
   */
  dailyCheck: {
    type: 'dailyCheck',
    name: 'Daily Career Check-In',
    description: 'Daily engagement reminder',
    category: 'engagement',
    baseScore: 30,
    cooldownMs: 24 * 60 * 60 * 1000, // 24 hours

    evaluate: async (ctx, userId) => {
      // This is a catch-all rule that always triggers
      // Will be filtered out by higher-priority nudges in scoring phase

      const user = await ctx.db.get(userId)
      if (!user) {
        return {
          ruleType: 'dailyCheck',
          shouldTrigger: false,
          score: 0,
          reason: 'User not found',
          metadata: {},
        }
      }

      return {
        ruleType: 'dailyCheck',
        shouldTrigger: true,
        score: 30,
        reason: 'Daily check-in',
        metadata: {},
        suggestedAction: 'Check your career dashboard',
        actionUrl: '/dashboard',
      }
    },
  },

  /**
   * Weekly Review - Weekly summary nudge
   * Triggers: Once per week on user's preferred day
   */
  weeklyReview: {
    type: 'weeklyReview',
    name: 'Weekly Progress Review',
    description: 'Weekly career progress summary',
    category: 'engagement',
    baseScore: 35,
    cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days

    evaluate: async (ctx, userId) => {
      const now = Date.now()
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000

      // Gather weekly stats
      const applications = await ctx.db
        .query('applications')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) => q.gt(q.field('created_at'), sevenDaysAgo))
        .collect()

      const goals = await ctx.db
        .query('goals')
        .withIndex('by_user', (q) => q.eq('user_id', userId))
        .filter((q) => q.gt(q.field('updated_at'), sevenDaysAgo))
        .collect()

      return {
        ruleType: 'weeklyReview',
        shouldTrigger: true,
        score: 35,
        reason: 'Weekly progress summary available',
        metadata: {
          applicationsThisWeek: applications.length,
          goalsUpdated: goals.length,
        },
        suggestedAction: 'Review your weekly progress',
        actionUrl: '/dashboard',
      }
    },
  },

  /**
   * Skill Gap - Job requirements vs user skills mismatch
   * Triggers: User viewing jobs with missing skills
   */
  skillGap: {
    type: 'skillGap',
    name: 'Skill Development Suggestion',
    description: 'User is missing skills for target jobs',
    category: 'helpful',
    baseScore: 55,
    cooldownMs: 14 * 24 * 60 * 60 * 1000, // 14 days
    requiredPlan: 'premium',

    evaluate: async (ctx, userId) => {
      // This would require job search history tracking
      // For now, return false - can be enhanced later
      return {
        ruleType: 'skillGap',
        shouldTrigger: false,
        score: 0,
        reason: 'Skill gap analysis not yet implemented',
        metadata: {},
      }
    },
  },
}

/**
 * Get all rules that apply to a user's plan
 */
export function getApplicableRules(userPlan: 'free' | 'premium' | 'university'): NudgeRule[] {
  return Object.values(NUDGE_RULES).filter(rule => {
    if (!rule.requiredPlan) return true
    return rule.requiredPlan === userPlan
  })
}
