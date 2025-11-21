'use client'

import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Sparkles, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useToast } from '@/hooks/use-toast'

interface UsageProgressCardProps {
  dashboardData?: {
    usageData?: {
      usage: any
      stepsCompleted: number
      totalSteps: number
      subscriptionPlan: string
    }
  }
}

export function UsageProgressCard({ dashboardData }: UsageProgressCardProps = {}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isHiding, setIsHiding] = useState(false)
  const toggleHideProgressCard = useMutation(api.users.toggleHideProgressCard)

  // Use prop data if available (from dashboard), otherwise fetch independently
  const fetchedUsageData = useQuery(
    api.usage.getUserUsage,
    !dashboardData && user?.clerkId ? { clerkId: user.clerkId } : 'skip'
  )

  // Fetch user data to check hide preference
  const userData = useQuery(
    api.users.getUserByClerkId,
    user?.clerkId ? { clerkId: user.clerkId } : 'skip'
  )

  const usageData = dashboardData?.usageData || fetchedUsageData

  if (!user || !usageData || !userData) {
    return (
      <Card className="p-0 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-3">
          <CardTitle className="text-sm font-semibold text-slate-900">Your Progress</CardTitle>
          <p className="text-xs text-slate-500">Loading checklist</p>
        </CardHeader>
        <div className="border-t border-slate-100" />
        <CardContent className="flex items-center justify-center px-5 pb-4 pt-3">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  const { usage, stepsCompleted, totalSteps, subscriptionPlan } = usageData
  const progressPercentage = (stepsCompleted / totalSteps) * 100

  // Only show for free users
  if (subscriptionPlan !== 'free') {
    return null
  }

  // Check if user has hidden the progress card
  if (userData.hide_progress_card) {
    return null
  }

  // Optimistic UI: Hide immediately when dismissing
  if (isHiding) {
    return null
  }

  // Handle dismiss action
  const handleDismiss = async () => {
    if (!user?.clerkId) {
      return
    }

    setIsHiding(true)
    try {
      await toggleHideProgressCard({
        clerkId: user.clerkId,
        hide: true,
      })
    } catch (error) {
      console.error('Failed to hide progress card:', error)
      toast({
        title: 'Error',
        description: 'Failed to hide progress card. Please try again.',
        variant: 'destructive',
      })
      setIsHiding(false)
    }
  }

  return (
    <Card className="h-full p-0 shadow-sm flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 px-5 py-3">
        <div>
          <CardTitle className="text-sm font-semibold text-slate-900">Free Plan Progress</CardTitle>
          <p className="text-xs text-slate-500">
            {stepsCompleted} of {totalSteps} steps completed
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          disabled={isHiding}
          className="h-8 w-8 rounded-full p-0 text-slate-600 hover:bg-slate-100"
          title="Hide this checklist"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>

      <div className="border-t border-slate-100" />

      <CardContent className="flex-1 space-y-4 px-5 pb-4 pt-3">
        <div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        <div className="space-y-3 text-slate-700">
          <FeatureItem
            icon={usage.applications.used ? CheckCircle2 : Circle}
            label="Track one application"
            count={usage.applications.count}
            limit={usage.applications.limit}
            used={usage.applications.used}
          />
          <FeatureItem
            icon={usage.goals.used ? CheckCircle2 : Circle}
            label="Track one career goal"
            count={usage.goals.count}
            limit={usage.goals.limit}
            used={usage.goals.used}
          />
          <FeatureItem
            icon={usage.contacts.used ? CheckCircle2 : Circle}
            label="Add one network contact"
            count={usage.contacts.count}
            limit={usage.contacts.limit}
            used={usage.contacts.used}
          />
          <FeatureItem
            icon={usage.career_paths.used ? CheckCircle2 : Circle}
            label="Generate one career path"
            count={usage.career_paths.count}
            limit={usage.career_paths.limit}
            used={usage.career_paths.used}
          />
          <FeatureItem
            icon={usage.projects.used ? CheckCircle2 : Circle}
            label="Add one project"
            count={usage.projects.count}
            limit={usage.projects.limit}
            used={usage.projects.used}
          />
        </div>

        <div className="border-t border-slate-100 pt-2">
          <p className="mb-2 text-xs text-slate-500">
            ✓ Resume Studio (unlimited)
          </p>
          <p className="text-xs text-slate-500">
            ✓ Cover Letter Studio (unlimited)
          </p>
        </div>

        {stepsCompleted >= totalSteps && (
          <div className="pt-2">
            <div className="rounded-xl border border-[#5371FF]/20 bg-[#EEF1FF] p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 text-[#5371FF]" />
                <div className="flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-slate-900">
                    Ready for unlimited access?
                  </h4>
                  <p className="mb-3 text-xs text-slate-600">
                    Unlock unlimited applications, goals, contacts, career paths, and more with Premium.
                  </p>
                  <Button size="sm" asChild>
                    <Link href="/pricing">
                      Upgrade to Premium
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface FeatureItemProps {
  icon: React.ElementType
  label: string
  count: number
  limit: number
  used: boolean
}

function FeatureItem({ icon: Icon, label, count, limit, used }: FeatureItemProps) {
  return (
    <div className="flex items-center gap-3">
      <Icon
        className={`h-4 w-4 flex-shrink-0 ${
          used ? 'text-[#16A34A]' : 'text-slate-400'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${used ? 'text-slate-800' : 'text-slate-600'}`}>
          {label}
        </p>
      </div>
      <span className="text-xs text-slate-500">
        {count}/{limit}
      </span>
    </div>
  )
}
