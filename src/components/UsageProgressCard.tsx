'use client'

import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, Sparkles, Loader2 } from 'lucide-react'
import Link from 'next/link'

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

  // Use prop data if available (from dashboard), otherwise fetch independently
  const fetchedUsageData = useQuery(
    api.usage.getUserUsage,
    !dashboardData && user?.clerkId ? { clerkId: user.clerkId } : 'skip'
  )

  const usageData = dashboardData?.usageData || fetchedUsageData

  if (!user || !usageData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
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

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Free Plan Progress</CardTitle>
          <span className="text-sm font-medium text-muted-foreground">
            {stepsCompleted} of {totalSteps} steps completed
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar */}
        <div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Feature checklist */}
        <div className="space-y-3">
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

        {/* Unlimited features note */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            ✓ Resume Studio (unlimited)
          </p>
          <p className="text-xs text-muted-foreground">
            ✓ Cover Letter Studio (unlimited)
          </p>
        </div>

        {/* Upgrade CTA */}
        {stepsCompleted >= totalSteps && (
          <div className="pt-2">
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm mb-1">
                    Ready for unlimited access?
                  </h4>
                  <p className="text-xs text-muted-foreground mb-3">
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
          used ? 'text-green-500' : 'text-muted-foreground'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${used ? 'text-foreground' : 'text-muted-foreground'}`}>
          {label}
        </p>
      </div>
      <span className="text-xs text-muted-foreground">
        {count}/{limit}
      </span>
    </div>
  )
}
