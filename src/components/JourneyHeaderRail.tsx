'use client'

import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  JourneyStage,
  JOURNEY_STAGES,
  getCompletedStages,
  getUpcomingStages,
  getStageInfo,
} from '@/lib/journey'

interface JourneyHeaderRailProps {
  currentStage: JourneyStage
  userName?: string
}

function StageChip({
  stage,
  state,
}: {
  stage: typeof JOURNEY_STAGES[number]
  state: 'completed' | 'current' | 'upcoming'
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all',
        state === 'completed' && 'bg-green-100 text-green-700',
        state === 'current' && 'bg-[#5371FF] text-white shadow-sm',
        state === 'upcoming' && 'bg-slate-100 text-slate-400'
      )}
    >
      {state === 'completed' ? (
        <Check className="h-3 w-3" />
      ) : (
        <span
          className={cn(
            'flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-semibold',
            state === 'current' && 'bg-white/20 text-white',
            state === 'upcoming' && 'bg-slate-200 text-slate-500'
          )}
        >
          {stage.id}
        </span>
      )}
      <span className="hidden sm:inline">{stage.label}</span>
    </div>
  )
}

export function JourneyHeaderRail({ currentStage, userName }: JourneyHeaderRailProps) {
  const stageInfo = getStageInfo(currentStage)
  const completedStages = getCompletedStages(currentStage)
  const upcomingStages = getUpcomingStages(currentStage)

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5371FF] via-[#6B5CFF] to-[#8B5CF6] p-6 text-white shadow-lg">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10" />
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

      <div className="relative">
        {/* Journey label and stage chips */}
        <div className="mb-5">
          <p className="text-xs font-medium uppercase tracking-wider text-white/70 mb-3">
            Career journey
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {JOURNEY_STAGES.map((stage) => {
              let state: 'completed' | 'current' | 'upcoming' = 'upcoming'
              if (completedStages.includes(stage.id)) {
                state = 'completed'
              } else if (stage.id === currentStage) {
                state = 'current'
              }
              return <StageChip key={stage.id} stage={stage} state={state} />
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight mb-1">
              {stageInfo.title}
            </h1>
            <p className="text-white/80 text-sm">
              {stageInfo.subtitle}
            </p>
          </div>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link href={stageInfo.secondaryCta.href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-white/90 hover:text-white hover:bg-white/10 rounded-xl"
              >
                {stageInfo.secondaryCta.text}
              </Button>
            </Link>
            <Link href={stageInfo.primaryCta.href}>
              <Button
                size="sm"
                className="bg-white text-[#5371FF] hover:bg-white/90 rounded-xl font-medium shadow-sm"
              >
                {stageInfo.primaryCta.text}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
