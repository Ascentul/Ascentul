'use client'

import { ArrowRight, Briefcase, Target, Calendar, Sparkles, Compass, FileText, Search, Users } from 'lucide-react'
import Link from 'next/link'

const focusChips = [
  { label: 'Career Exploration', icon: Compass, href: '/career-exploration' },
  { label: 'Resume Building', icon: FileText, href: '/resumes' },
  { label: 'Job Search', icon: Search, href: '/applications' },
  { label: 'Advising', icon: Users, href: '/advising' },
]

interface NextInterviewDetails {
  date?: number
  company: string
  title?: string
}

interface NextBestStepHeroProps {
  hasApplications: boolean
  hasGoals: boolean
  nextInterviewDetails?: NextInterviewDetails | null
  userName?: string
}

type HeroState = 'no-applications' | 'no-goals' | 'has-interview' | 'default'

function getHeroState(props: NextBestStepHeroProps): HeroState {
  if (!props.hasApplications) return 'no-applications'
  if (!props.hasGoals) return 'no-goals'
  if (props.nextInterviewDetails?.date) return 'has-interview'
  return 'default'
}

function formatInterviewDate(timestamp: number): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  } else if (diffDays === 1) {
    return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
  } else {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }
}

const heroContent: Record<HeroState, {
  icon: React.ElementType
  title: string
  description: string
  ctaText: string
  ctaHref: string
  secondaryText: string
  secondaryHref: string
  gradient: string
}> = {
  'no-applications': {
    icon: Briefcase,
    title: 'Track your first job application',
    description: 'Start building your career momentum by adding an application you\'re working on.',
    ctaText: 'Add Application',
    ctaHref: '/applications/new',
    secondaryText: 'or browse job search tips',
    secondaryHref: '/career-exploration',
    gradient: 'from-blue-500/10 via-transparent to-purple-500/10',
  },
  'no-goals': {
    icon: Target,
    title: 'Set your first career goal',
    description: 'Define what success looks like for you. Goals help you stay focused and motivated.',
    ctaText: 'Create Goal',
    ctaHref: '/goals/new',
    secondaryText: 'or explore career paths',
    secondaryHref: '/career-exploration',
    gradient: 'from-green-500/10 via-transparent to-emerald-500/10',
  },
  'has-interview': {
    icon: Calendar,
    title: 'Prepare for your upcoming interview',
    description: '', // Will be dynamically set
    ctaText: 'Prepare Now',
    ctaHref: '/applications',
    secondaryText: 'or review company insights',
    secondaryHref: '/career-exploration',
    gradient: 'from-amber-500/10 via-transparent to-orange-500/10',
  },
  'default': {
    icon: Sparkles,
    title: 'Continue your career journey',
    description: 'Check your recommendations and take the next step toward your goals.',
    ctaText: 'View Recommendations',
    ctaHref: '#recommendations',
    secondaryText: 'or add a new application',
    secondaryHref: '/applications/new',
    gradient: 'from-primary-500/10 via-transparent to-indigo-500/10',
  },
}

export function NextBestStepHero({
  hasApplications,
  hasGoals,
  nextInterviewDetails,
  userName
}: NextBestStepHeroProps) {
  const state = getHeroState({ hasApplications, hasGoals, nextInterviewDetails })
  const content = heroContent[state]
  const Icon = content.icon

  // Dynamic description for interview state
  const description = state === 'has-interview' && nextInterviewDetails
    ? `Your interview with ${nextInterviewDetails.company} is ${formatInterviewDate(nextInterviewDetails.date!)}.`
    : content.description

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br ${content.gradient} p-6 shadow-sm`}>
      {/* Decorative background elements */}
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary-500/5 to-transparent blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-gradient-to-tr from-primary-500/5 to-transparent blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Icon */}
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white shadow-lg shadow-primary-500/25">
          <Icon className="h-7 w-7" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary-600 mb-1">Your Next Best Step</p>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            {content.title}
          </h2>
          <p className="text-sm text-slate-600">
            {description}
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
          <Link
            href={content.ctaHref}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-colors"
          >
            {content.ctaText}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={content.secondaryHref}
            className="text-sm text-slate-500 hover:text-primary-600 transition-colors text-center sm:text-left"
          >
            {content.secondaryText}
          </Link>
        </div>
      </div>

      {/* Quick Action Chips */}
      <div className="relative mt-5 pt-5 border-t border-slate-200/60">
        <div className="flex flex-wrap gap-2.5">
          {focusChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-sm font-medium text-slate-600 hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700 transition-all duration-200"
            >
              <chip.icon className="h-4 w-4" />
              {chip.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
