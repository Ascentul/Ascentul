'use client'

import { Compass, FileText, Search, Users, ChevronRight, Check } from 'lucide-react'
import Link from 'next/link'

interface JourneyStep {
  id: string
  label: string
  description: string
  icon: React.ElementType
  href: string
  isComplete: boolean
}

interface JourneyProgress {
  careerExploration: { isComplete: boolean; count: number }
  resumeBuilding: { isComplete: boolean; count: number }
  jobSearch: { isComplete: boolean; count: number }
  advising: { isComplete: boolean; count: number; completedCount?: number }
  completedSteps: number
  totalSteps: number
}

interface StudentJourneyCardProps {
  journeyProgress?: JourneyProgress
}

export function StudentJourneyCard({ journeyProgress }: StudentJourneyCardProps) {
  const steps: JourneyStep[] = [
    {
      id: 'career-exploration',
      label: 'Career Exploration',
      description: 'Discover career paths that match your interests and skills',
      icon: Compass,
      href: '/career-exploration',
      isComplete: journeyProgress?.careerExploration?.isComplete ?? false,
    },
    {
      id: 'resume-building',
      label: 'Resume Building',
      description: 'Create a standout resume that gets you noticed',
      icon: FileText,
      href: '/resumes',
      isComplete: journeyProgress?.resumeBuilding?.isComplete ?? false,
    },
    {
      id: 'job-search',
      label: 'Job Search',
      description: 'Track applications and land your dream role',
      icon: Search,
      href: '/applications',
      isComplete: journeyProgress?.jobSearch?.isComplete ?? false,
    },
    {
      id: 'advising',
      label: 'Advising',
      description: 'Get personalized guidance from career advisors',
      icon: Users,
      href: '/advising',
      isComplete: journeyProgress?.advising?.isComplete ?? false,
    },
  ]

  const completedSteps = journeyProgress?.completedSteps ?? 0
  const totalSteps = journeyProgress?.totalSteps ?? 4

  // Find the current step (first incomplete) or last step if all complete
  const currentStepIndex = steps.findIndex(step => !step.isComplete)
  const activeStep = currentStepIndex === -1 ? steps[steps.length - 1] : steps[currentStepIndex]
  const allComplete = completedSteps === totalSteps

  return (
    <Link
      href={activeStep.href}
      className="block relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-white to-primary-50/50 p-5 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-300 group"
    >
      {/* Isometric background illustration */}
      <div className="absolute right-0 top-0 bottom-0 w-32 opacity-[0.15] pointer-events-none">
        <svg viewBox="0 0 120 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full">
          {/* Isometric stacked blocks representing progress */}
          <path d="M60 130L20 105V75L60 100V130Z" fill="#5371FF"/>
          <path d="M60 130L100 105V75L60 100V130Z" fill="#3B5BDB"/>
          <path d="M20 75L60 50L100 75L60 100L20 75Z" fill="#748FFC"/>

          <path d="M60 95L20 70V40L60 65V95Z" fill="#5371FF"/>
          <path d="M60 95L100 70V40L60 65V95Z" fill="#3B5BDB"/>
          <path d="M20 40L60 15L100 40L60 65L20 40Z" fill="#748FFC"/>

          {/* Top block - highlighted for current step */}
          <path d="M60 60L30 42V22L60 40V60Z" fill="#5371FF" fillOpacity="0.8"/>
          <path d="M60 60L90 42V22L60 40V60Z" fill="#3B5BDB" fillOpacity="0.8"/>
          <path d="M30 22L60 4L90 22L60 40L30 22Z" fill="#748FFC" fillOpacity="0.9"/>

          {/* Floating particle effects */}
          <circle cx="45" cy="30" r="2" fill="#5371FF" fillOpacity="0.6"/>
          <circle cx="75" cy="55" r="1.5" fill="#5371FF" fillOpacity="0.4"/>
          <circle cx="35" cy="70" r="1" fill="#5371FF" fillOpacity="0.5"/>
        </svg>
      </div>

      <div className="relative flex items-start gap-4">
        {/* Icon */}
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-all flex-shrink-0 ${
          allComplete
            ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
            : "bg-primary-500 text-white shadow-lg shadow-primary-500/30 group-hover:scale-105"
        }`}>
          {allComplete ? (
            <Check className="h-7 w-7" />
          ) : (
            <activeStep.icon className="h-7 w-7" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-primary-600 bg-primary-50 px-2.5 py-0.5 rounded-full">
              Step {allComplete ? totalSteps : currentStepIndex + 1} of {totalSteps}
            </span>
          </div>
          <h3 className="text-base font-semibold text-slate-900 group-hover:text-primary-700 transition-colors mb-1">
            {allComplete ? "Journey Complete!" : activeStep.label}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            {allComplete ? "You've explored all career areas. Keep building your future!" : activeStep.description}
          </p>

          {/* Progress indicator */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`h-2 w-6 rounded-full transition-all ${
                    step.isComplete
                      ? "bg-primary-500"
                      : index === currentStepIndex
                        ? "bg-primary-300"
                        : "bg-slate-200"
                  }`}
                />
              ))}
            </div>
            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      </div>
    </Link>
  )
}
