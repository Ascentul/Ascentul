/**
 * Journey Stage Types and Helper Functions
 *
 * Maps user data to their current stage in the career journey.
 */

// Journey stage enum
export enum JourneyStage {
  EXPLORE_OPTIONS = 1,
  BUILD_RESUME = 2,
  APPLY_TO_ROLES = 3,
  TRACK_INTERVIEWS = 4,
  GROW_NETWORK = 5,
}

// Stage metadata for UI rendering
export const JOURNEY_STAGES = [
  {
    id: JourneyStage.EXPLORE_OPTIONS,
    label: 'Explore options',
    title: 'Explore career paths that fit you',
    subtitle: 'Discover roles that match your skills and interests',
    primaryCta: { text: 'Start career exploration', href: '/career-explorer' },
    secondaryCta: { text: 'View recommendations', href: '#recommendations' },
  },
  {
    id: JourneyStage.BUILD_RESUME,
    label: 'Build your resume',
    title: 'Build a resume for your next step',
    subtitle: 'Create a compelling resume that showcases your experience',
    primaryCta: { text: 'Create your first resume', href: '/resumes/new' },
    secondaryCta: { text: 'View recommendations', href: '#recommendations' },
  },
  {
    id: JourneyStage.APPLY_TO_ROLES,
    label: 'Apply to roles',
    title: 'Start applying to roles you care about',
    subtitle: 'Track your applications and stay organized',
    primaryCta: { text: 'Add an application', href: '/applications/new' },
    secondaryCta: { text: 'View recommendations', href: '#recommendations' },
  },
  {
    id: JourneyStage.TRACK_INTERVIEWS,
    label: 'Track interviews',
    title: 'Stay on top of your interviews',
    subtitle: 'Prepare and follow up on your interview opportunities',
    primaryCta: { text: 'Log an interview', href: '/applications' },
    secondaryCta: { text: 'View recommendations', href: '#recommendations' },
  },
  {
    id: JourneyStage.GROW_NETWORK,
    label: 'Grow your network',
    title: 'Grow your career network',
    subtitle: 'Build connections that accelerate your career',
    primaryCta: { text: 'Add a networking contact', href: '/contacts/new' },
    secondaryCta: { text: 'View recommendations', href: '#recommendations' },
  },
] as const

export type JourneyStageInfo = typeof JOURNEY_STAGES[number]

// Input data for stage calculation
export interface JourneyData {
  hasCareerPath: boolean
  hasGoal: boolean
  hasResume: boolean
  hasApplications: boolean
  hasInterviews: boolean
  hasContacts: boolean
  applicationsCount: number
  interviewsCount: number
}

/**
 * Determines the current journey stage based on user data.
 *
 * Stage progression:
 * 1. Explore options - No career path, no primary goal, minimal usage
 * 2. Build your resume - Career path or goal exists, but no resume
 * 3. Apply to roles - At least one resume exists, tracking applications
 * 4. Track interviews - At least one interview exists or app in interview stage
 * 5. Grow your network - Has connections or networking contacts
 */
export function getCurrentStage(data: JourneyData): JourneyStage {
  const {
    hasCareerPath,
    hasGoal,
    hasResume,
    hasApplications,
    hasInterviews,
    hasContacts,
  } = data

  // Stage 5: Grow network - user has contacts and is actively interviewing
  if (hasContacts && hasInterviews) {
    return JourneyStage.GROW_NETWORK
  }

  // Stage 4: Track interviews - has interviews scheduled or in progress
  if (hasInterviews) {
    return JourneyStage.TRACK_INTERVIEWS
  }

  // Stage 3: Apply to roles - has applications
  if (hasApplications) {
    return JourneyStage.APPLY_TO_ROLES
  }

  // Stage 2: Build resume - has career direction but no resume yet
  if ((hasCareerPath || hasGoal) && !hasResume) {
    return JourneyStage.BUILD_RESUME
  }

  // Stage 2 alternative: Has resume, encourage applying
  if (hasResume) {
    return JourneyStage.APPLY_TO_ROLES
  }

  // Stage 1: Explore options - starting out
  return JourneyStage.EXPLORE_OPTIONS
}

/**
 * Get stage info by stage enum
 */
export function getStageInfo(stage: JourneyStage): JourneyStageInfo {
  return JOURNEY_STAGES[stage - 1]
}

/**
 * Get completed stages (all stages before current)
 */
export function getCompletedStages(currentStage: JourneyStage): JourneyStage[] {
  const completed: JourneyStage[] = []
  for (let i = 1; i < currentStage; i++) {
    completed.push(i as JourneyStage)
  }
  return completed
}

/**
 * Get upcoming stages (all stages after current)
 */
export function getUpcomingStages(currentStage: JourneyStage): JourneyStage[] {
  const upcoming: JourneyStage[] = []
  for (let i = currentStage + 1; i <= 5; i++) {
    upcoming.push(i as JourneyStage)
  }
  return upcoming
}

// Application funnel types
export interface FunnelStats {
  saved: number
  applied: number
  interview: number
  offer: number
  total: number
}

/**
 * Calculate funnel stats from applications data
 */
export function calculateFunnelStats(applications: Array<{ stage?: string; status?: string }>): FunnelStats {
  const stats: FunnelStats = {
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    total: 0,
  }

  for (const app of applications) {
    const stage = app.stage || app.status
    stats.total++

    if (stage === 'Prospect' || stage === 'saved') {
      stats.saved++
    } else if (stage === 'Applied' || stage === 'applied') {
      stats.applied++
    } else if (stage === 'Interview' || stage === 'interview') {
      stats.interview++
    } else if (stage === 'Offer' || stage === 'Accepted' || stage === 'offer') {
      stats.offer++
    }
  }

  return stats
}

// Mission types
export interface Mission {
  id: string
  text: string
  type: 'application' | 'goal' | 'resume' | 'interview' | 'contact'
  href: string
  isCompleted: boolean
}

/**
 * Generate daily missions based on current stage and data
 */
export function generateMissions(
  stage: JourneyStage,
  data: {
    applicationsThisWeek: number
    goalsUpdatedToday: boolean
    hasContacts: boolean
    didActionToday: boolean
    hasResume: boolean
  }
): Mission[] {
  const missions: Mission[] = []

  switch (stage) {
    case JourneyStage.EXPLORE_OPTIONS:
      missions.push({
        id: 'explore-path',
        text: 'Explore a career path',
        type: 'goal',
        href: '/career-explorer',
        isCompleted: false,
      })
      missions.push({
        id: 'create-goal',
        text: 'Create your first goal',
        type: 'goal',
        href: '/goals/new',
        isCompleted: data.goalsUpdatedToday,
      })
      break

    case JourneyStage.BUILD_RESUME:
      missions.push({
        id: 'create-resume',
        text: data.hasResume ? 'Update your resume' : 'Create your first resume',
        type: 'resume',
        href: '/resumes/new',
        isCompleted: false,
      })
      missions.push({
        id: 'update-goal',
        text: 'Update a goal step',
        type: 'goal',
        href: '/goals',
        isCompleted: data.goalsUpdatedToday,
      })
      break

    case JourneyStage.APPLY_TO_ROLES:
    case JourneyStage.TRACK_INTERVIEWS:
      missions.push({
        id: 'add-application',
        text: 'Add 1 new application',
        type: 'application',
        href: '/applications/new',
        isCompleted: data.applicationsThisWeek >= 1 && data.didActionToday,
      })
      missions.push({
        id: 'update-goal',
        text: 'Update 1 goal step',
        type: 'goal',
        href: '/goals',
        isCompleted: data.goalsUpdatedToday,
      })
      missions.push({
        id: 'networking',
        text: data.hasContacts ? 'Reach out to a contact' : 'Add a networking contact',
        type: 'contact',
        href: '/contacts',
        isCompleted: false,
      })
      break

    case JourneyStage.GROW_NETWORK:
      missions.push({
        id: 'networking',
        text: 'Message a contact',
        type: 'contact',
        href: '/contacts',
        isCompleted: false,
      })
      missions.push({
        id: 'add-contact',
        text: 'Add a new connection',
        type: 'contact',
        href: '/contacts/new',
        isCompleted: false,
      })
      missions.push({
        id: 'update-goal',
        text: 'Update 1 goal step',
        type: 'goal',
        href: '/goals',
        isCompleted: data.goalsUpdatedToday,
      })
      break
  }

  return missions.slice(0, 3)
}

// Activity types for timeline
export type ActivityType =
  | 'application'
  | 'application_update'
  | 'interview'
  | 'followup'
  | 'followup_completed'
  | 'goal'
  | 'goal_completed'
  | 'resume'
  | 'cover_letter'
  | 'project'
  | 'contact'

export interface TimelineActivity {
  id: string
  type: ActivityType
  description: string
  timestamp: number
}

/**
 * Group activities by time period
 */
export function groupActivitiesByPeriod(activities: TimelineActivity[]): {
  today: TimelineActivity[]
  yesterday: TimelineActivity[]
  earlierThisWeek: TimelineActivity[]
  older: TimelineActivity[]
} {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000
  const weekStart = todayStart - 7 * 24 * 60 * 60 * 1000

  const groups = {
    today: [] as TimelineActivity[],
    yesterday: [] as TimelineActivity[],
    earlierThisWeek: [] as TimelineActivity[],
    older: [] as TimelineActivity[],
  }

  for (const activity of activities) {
    if (activity.timestamp >= todayStart) {
      groups.today.push(activity)
    } else if (activity.timestamp >= yesterdayStart) {
      groups.yesterday.push(activity)
    } else if (activity.timestamp >= weekStart) {
      groups.earlierThisWeek.push(activity)
    } else {
      groups.older.push(activity)
    }
  }

  return groups
}
