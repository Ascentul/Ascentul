'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import {
  Bookmark,
  Send,
  MessageSquare,
  Trophy,
  Plus,
  ArrowRight,
  Briefcase
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Funnel stage configuration
const FUNNEL_STAGES = [
  {
    id: 'saved',
    label: 'Saved',
    icon: Bookmark,
    color: 'bg-slate-100 text-slate-600',
    activeColor: 'bg-slate-500 text-white',
    statuses: ['saved']
  },
  {
    id: 'applied',
    label: 'Applied',
    icon: Send,
    color: 'bg-blue-50 text-blue-600',
    activeColor: 'bg-blue-500 text-white',
    statuses: ['applied']
  },
  {
    id: 'interview',
    label: 'Interviews',
    icon: MessageSquare,
    color: 'bg-purple-50 text-purple-600',
    activeColor: 'bg-purple-500 text-white',
    statuses: ['interview']
  },
  {
    id: 'offer',
    label: 'Offers',
    icon: Trophy,
    color: 'bg-green-50 text-green-600',
    activeColor: 'bg-green-500 text-white',
    statuses: ['offer']
  },
]

interface FunnelStageProps {
  stage: typeof FUNNEL_STAGES[number]
  count: number
  isFirst: boolean
  isLast: boolean
  recentApps: Array<{ company: string; job_title: string }>
}

function FunnelStage({ stage, count, isFirst, isLast, recentApps }: FunnelStageProps) {
  const Icon = stage.icon
  const hasItems = count > 0

  return (
    <div className="flex-1 flex flex-col items-center relative group">
      {/* Connector line */}
      {!isFirst && (
        <div className="absolute left-0 top-5 w-1/2 h-0.5 bg-slate-200 -translate-y-1/2" />
      )}
      {!isLast && (
        <div className="absolute right-0 top-5 w-1/2 h-0.5 bg-slate-200 -translate-y-1/2" />
      )}

      {/* Stage circle */}
      <div
        className={cn(
          "relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
          hasItems ? stage.activeColor : stage.color
        )}
      >
        <Icon className="h-4 w-4" />
      </div>

      {/* Count and label */}
      <div className="mt-2 text-center">
        <p className={cn(
          "text-lg font-semibold",
          hasItems ? "text-slate-900" : "text-slate-400"
        )}>
          {count}
        </p>
        <p className="text-xs text-slate-500">{stage.label}</p>
      </div>

      {/* Recent apps tooltip on hover - only show if there are items */}
      {recentApps.length > 0 && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20">
          <div className="bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-lg whitespace-nowrap">
            {recentApps.slice(0, 2).map((app, idx) => (
              <div key={idx} className="py-0.5">
                {app.company} – {app.job_title.length > 20 ? app.job_title.slice(0, 20) + '...' : app.job_title}
              </div>
            ))}
            {recentApps.length > 2 && (
              <div className="text-slate-400 pt-1">+{recentApps.length - 2} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Helper to generate coaching copy based on funnel state
function getCoachingCopy(funnelData: Record<string, number>): { text: string; ctaText: string; ctaHref: string } {
  const { saved, applied, interview, offer } = funnelData

  // No applications at all
  if (saved === 0 && applied === 0 && interview === 0 && offer === 0) {
    return {
      text: "Start your job search journey by tracking your first application.",
      ctaText: "Add application",
      ctaHref: "/applications/new"
    }
  }

  // Has offers - celebrate!
  if (offer > 0) {
    return {
      text: `Congratulations! You have ${offer} offer${offer > 1 ? 's' : ''}. Review and make your decision.`,
      ctaText: "View offers",
      ctaHref: "/applications?stage=Offer"
    }
  }

  // Has interviews - focus on preparation
  if (interview > 0) {
    return {
      text: `You have ${interview} active interview${interview > 1 ? 's' : ''}. Prepare and follow up.`,
      ctaText: "View interviews",
      ctaHref: "/applications?stage=Interview"
    }
  }

  // Has saved but few applied
  if (saved > 0 && applied < 3) {
    return {
      text: `You have ${saved} saved role${saved > 1 ? 's' : ''} you haven't applied to yet. Move one forward today.`,
      ctaText: "View saved roles",
      ctaHref: "/applications?stage=Prospect"
    }
  }

  // Has applications but no interviews
  if (applied > 0 && interview === 0) {
    return {
      text: `You have ${applied} active application${applied > 1 ? 's' : ''}. Follow up on one today.`,
      ctaText: "View applications",
      ctaHref: "/applications?stage=Applied"
    }
  }

  // Default - encourage more applications
  return {
    text: "Keep the momentum going. Add more applications to increase your chances.",
    ctaText: "Add application",
    ctaHref: "/applications/new"
  }
}

export function ApplicationsJourney() {
  const { user: clerkUser } = useUser()
  const clerkId = clerkUser?.id

  // Fetch applications
  const applications = useQuery(
    api.applications.getUserApplications,
    clerkId ? { clerkId } : 'skip'
  )

  const isLoading = applications === undefined

  // Calculate funnel data
  const funnelData = useMemo(() => {
    if (!applications) {
      return { saved: 0, applied: 0, interview: 0, offer: 0 }
    }

    const counts: Record<string, number> = {
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0
    }

    // Group applications by stage/status
    // Using stage with status fallback (per TECH_DEBT docs)
    for (const app of applications) {
      const stage = app.stage || app.status

      if (stage === 'Prospect' || stage === 'saved') {
        counts.saved++
      } else if (stage === 'Applied' || stage === 'applied') {
        counts.applied++
      } else if (stage === 'Interview' || stage === 'interview') {
        counts.interview++
      } else if (stage === 'Offer' || stage === 'Accepted' || stage === 'offer') {
        counts.offer++
      }
      // Note: rejected/withdrawn/archived are not counted in the funnel
    }

    return counts
  }, [applications])

  // Get recent apps per stage for tooltips
  const recentAppsByStage = useMemo(() => {
    if (!applications) return {}

    const grouped: Record<string, Array<{ company: string; job_title: string }>> = {
      saved: [],
      applied: [],
      interview: [],
      offer: []
    }

    for (const app of applications) {
      const stage = app.stage || app.status
      let key = ''

      if (stage === 'Prospect' || stage === 'saved') key = 'saved'
      else if (stage === 'Applied' || stage === 'applied') key = 'applied'
      else if (stage === 'Interview' || stage === 'interview') key = 'interview'
      else if (stage === 'Offer' || stage === 'Accepted' || stage === 'offer') key = 'offer'

      if (key && grouped[key].length < 3) {
        grouped[key].push({ company: app.company, job_title: app.job_title })
      }
    }

    return grouped
  }, [applications])

  const coaching = getCoachingCopy(funnelData)
  const totalApplications = (funnelData.saved || 0) + (funnelData.applied || 0) + (funnelData.interview || 0) + (funnelData.offer || 0)

  return (
    <section className="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col">
      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Briefcase className="h-4 w-4 text-[#5371FF]" />
            Applications Journey
          </h3>
          <p className="text-xs text-slate-500">
            Track your progress through the hiring funnel
          </p>
        </div>
        <Link href="/applications">
          <Button
            variant="outline"
            size="sm"
            className="h-8 rounded-xl px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View All
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </Link>
      </div>

      <div className="border-t border-slate-100" />

      <div className="flex-1 px-5 pb-4 pt-4">
        {isLoading ? (
          <div className="space-y-4">
            <div className="flex justify-between">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                  <div className="mt-2 h-4 w-8 bg-slate-100 rounded animate-pulse" />
                  <div className="mt-1 h-3 w-12 bg-slate-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
            <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
          </div>
        ) : totalApplications === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
              <Briefcase className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-sm text-slate-600 mb-1">No applications yet</p>
            <p className="text-xs text-slate-500 mb-4 max-w-[200px]">
              Start tracking your job search to see your progress here
            </p>
            <Link href="/applications/new">
              <Button size="sm" className="bg-[#5371FF] hover:bg-[#4260e6] text-white rounded-xl">
                <Plus className="h-4 w-4 mr-1" />
                Add your first application
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Funnel visualization */}
            <div className="flex items-start justify-between mb-4">
              {FUNNEL_STAGES.map((stage, idx) => (
                <FunnelStage
                  key={stage.id}
                  stage={stage}
                  count={funnelData[stage.id] || 0}
                  isFirst={idx === 0}
                  isLast={idx === FUNNEL_STAGES.length - 1}
                  recentApps={recentAppsByStage[stage.id] || []}
                />
              ))}
            </div>

            {/* Coaching copy */}
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-600 mb-3">
                {coaching.text}
              </p>
              <Link href={coaching.ctaHref}>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-[#5371FF] border-[#5371FF]/30 hover:bg-[#5371FF]/5 rounded-xl text-xs"
                >
                  {coaching.ctaText}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}
