/**
 * useNudges Hook
 *
 * Custom React hook for managing nudge state and actions
 */

import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { toast } from '@/hooks/use-toast'

export function useNudges() {
  const { user } = useUser()
  const router = useRouter()
  const userId = user?.publicMetadata?.convexUserId as string | undefined

  // Query pending nudges
  const pendingNudges = useQuery(
    api.nudges.dispatch.getPendingNudges,
    userId ? { userId } : 'skip'
  )

  // Query nudge stats
  const stats = useQuery(
    api.nudges.scoring.getNudgeStats,
    userId ? { userId } : 'skip'
  )

  // Mutations
  const acceptNudge = useMutation(api.nudges.dispatch.acceptNudge)
  const snoozeNudge = useMutation(api.nudges.dispatch.snoozeNudge)
  const dismissNudge = useMutation(api.nudges.dispatch.dismissNudge)

  const handleAccept = async (nudgeId: string) => {
    if (!userId) return

    try {
      const result = await acceptNudge({ nudgeId, userId })

      toast({
        title: 'Great!',
        description: 'Opening suggested action...',
      })

      // Navigate to action URL if provided
      if (result.actionUrl) {
        router.push(result.actionUrl)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept nudge',
        variant: 'destructive',
      })
    }
  }

  const handleSnooze = async (nudgeId: string, hours: number = 4) => {
    if (!userId) return

    try {
      const snoozeUntil = Date.now() + hours * 60 * 60 * 1000
      await snoozeNudge({ nudgeId, userId, snoozeUntil })

      toast({
        title: 'Snoozed',
        description: `I'll remind you again in ${hours} hours`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to snooze nudge',
        variant: 'destructive',
      })
    }
  }

  const handleDismiss = async (nudgeId: string) => {
    if (!userId) return

    try {
      await dismissNudge({ nudgeId, userId })

      toast({
        title: 'Dismissed',
        description: 'Nudge removed from your feed',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss nudge',
        variant: 'destructive',
      })
    }
  }

  return {
    nudges: pendingNudges || [],
    stats,
    isLoading: pendingNudges === undefined || stats === undefined,
    actions: {
      accept: handleAccept,
      snooze: handleSnooze,
      dismiss: handleDismiss,
    },
  }
}
