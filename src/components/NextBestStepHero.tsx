'use client'

import { useState, useEffect } from 'react'
import { ArrowRight, Compass, FileText, Briefcase, Calendar, Check } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Career journey stages in order
const journeyStages = [
  {
    id: 'career-exploration',
    label: 'Career Exploration',
    icon: Compass,
    href: '/career-exploration',
    description: 'Discover career paths that align with your interests and skills.',
    ctaText: 'Explore Careers',
  },
  {
    id: 'resume-building',
    label: 'Resume Building',
    icon: FileText,
    href: '/resumes',
    description: 'Create a professional resume that showcases your experience.',
    ctaText: 'Build Resume',
  },
  {
    id: 'apply-to-jobs',
    label: 'Apply to Jobs',
    icon: Briefcase,
    href: '/applications',
    description: 'Start applying to positions that match your career goals.',
    ctaText: 'Track Applications',
  },
  {
    id: 'track-interviews',
    label: 'Track Interviews',
    icon: Calendar,
    href: '/applications',
    description: 'Prepare for interviews and track your progress.',
    ctaText: 'View Interviews',
  },
]

interface JourneyProgress {
  careerExploration: { isComplete: boolean; count: number }
  resumeBuilding: { isComplete: boolean; count: number }
  jobSearch: { isComplete: boolean; count: number }
  advising: { isComplete: boolean; count: number; completedCount?: number }
  completedSteps: number
  totalSteps: number
}

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
  journeyProgress?: JourneyProgress
}

// Map journey stages to progress data
function getStageCompletion(stageId: string, progress?: JourneyProgress): boolean {
  if (!progress) return false

  switch (stageId) {
    case 'career-exploration':
      return progress.careerExploration.isComplete
    case 'resume-building':
      return progress.resumeBuilding.isComplete
    case 'apply-to-jobs':
      return progress.jobSearch.isComplete
    case 'track-interviews':
      return progress.jobSearch.count > 0 && progress.advising?.completedCount ? progress.advising.completedCount > 0 : false
    default:
      return false
  }
}

// Calculate which stage the user should focus on
function getCurrentStageIndex(progress?: JourneyProgress): number {
  if (!progress) return 0

  if (!progress.careerExploration.isComplete) return 0
  if (!progress.resumeBuilding.isComplete) return 1
  if (!progress.jobSearch.isComplete) return 2
  return 3
}

// Simple arrow connector
function StageConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <div className="hidden sm:flex items-center px-1">
      <div className={cn(
        "w-4 h-0.5 transition-colors duration-300",
        isComplete ? "bg-green-400" : "bg-slate-200"
      )} />
      <div className={cn(
        "w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] transition-colors duration-300",
        isComplete ? "border-l-green-400" : "border-l-slate-200"
      )} />
    </div>
  )
}

export function NextBestStepHero({
  journeyProgress
}: NextBestStepHeroProps) {
  const currentStageIndex = getCurrentStageIndex(journeyProgress)
  const [selectedStage, setSelectedStage] = useState(currentStageIndex)
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (!hasInteracted) {
      setSelectedStage(currentStageIndex)
    }
  }, [currentStageIndex, hasInteracted])

  const stage = journeyStages[selectedStage]
  const Icon = stage.icon
  const isStageComplete = getStageCompletion(stage.id, journeyProgress)

  const getStageContent = () => {
    if (isStageComplete) {
      const nextIncompleteIndex = journeyStages.findIndex(
        (s, i) => i > selectedStage && !getStageCompletion(s.id, journeyProgress)
      )

      if (nextIncompleteIndex >= 0) {
        return {
          title: `${stage.label} complete!`,
          description: `Ready for ${journeyStages[nextIncompleteIndex].label}?`,
          ctaText: journeyStages[nextIncompleteIndex].ctaText,
          ctaHref: journeyStages[nextIncompleteIndex].href,
        }
      }

      return {
        title: "All stages complete!",
        description: "Keep tracking your progress.",
        ctaText: "View Dashboard",
        ctaHref: "/dashboard",
      }
    }

    return {
      title: stage.label,
      description: stage.description,
      ctaText: stage.ctaText,
      ctaHref: stage.href,
    }
  }

  const content = getStageContent()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-primary-50/30 shadow-sm">
      {/* Background decorations */}
      <div className="absolute right-0 top-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary-500/5 to-transparent blur-2xl" />
      <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-32 w-32 rounded-full bg-gradient-to-tr from-primary-500/5 to-transparent blur-2xl" />

      <div className="relative px-5 py-4">
        {/* Main Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedStage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-4"
          >
            {/* Icon */}
            <div className={cn(
              "flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl text-white transition-colors duration-300",
              isStageComplete
                ? "bg-green-500"
                : "bg-primary-500"
            )}>
              {isStageComplete ? (
                <Check className="h-5 w-5" />
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900">
                {content.title}
              </h2>
              <p className="text-sm text-slate-500">
                {content.description}
              </p>
            </div>

            {/* CTA */}
            <Link
              href={content.ctaHref}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors flex-shrink-0",
                isStageComplete
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-slate-900 hover:bg-slate-800"
              )}
            >
              {content.ctaText}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        </AnimatePresence>

        {/* Journey Stage Pills - below content */}
        <div className="flex items-center gap-0.5 flex-wrap mt-4 pt-4 border-t border-slate-100">
          {journeyStages.map((s, index) => {
            const isComplete = getStageCompletion(s.id, journeyProgress)
            const isSelected = selectedStage === index
            const StageIcon = s.icon

            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => {
                    setSelectedStage(index)
                    setHasInteracted(true)
                  }}
                  className={cn(
                    "relative flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200",
                    isSelected
                      ? "bg-primary-500 text-white shadow-sm"
                      : isComplete
                        ? "bg-green-50 text-green-600 hover:bg-green-100"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {isComplete && !isSelected ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <StageIcon className="h-3 w-3" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>

                {index < journeyStages.length - 1 && (
                  <StageConnector isComplete={isComplete} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
