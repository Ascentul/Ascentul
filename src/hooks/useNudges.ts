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
  const clerkId = user?.id

  // Query pending nudges
  const pendingNudges = useQuery(
    api.nudges.dispatch.getPendingNudges,
    clerkId ? { clerkId } : 'skip'
  )

  // Mutations
  const acceptNudge = useMutation(api.nudges.dispatch.acceptNudge)
  const snoozeNudge = useMutation(api.nudges.dispatch.snoozeNudge)
  const dismissNudge = useMutation(api.nudges.dispatch.dismissNudge)

  const handleAccept = async (nudgeId: string) => {
    if (!clerkId) {
      toast({
        title: 'Error',
        description: 'Authentication required to accept nudge',
        variant: 'destructive',
      })
      return
    }

    try {
      const result = await acceptNudge({ nudgeId, clerkId })

      console.log('[useNudges] Accept result:', result)

      // Navigate to action URL if provided
      if (result?.actionUrl) {
        console.log('[useNudges] Navigating to:', result.actionUrl)

        // Check if we're already on the target page
        // Normalize both paths by removing trailing slashes
        const currentPath = window.location.pathname.replace(/\/$/, '')
        const targetPath = result.actionUrl.replace(/\/$/, '')

        if (currentPath === targetPath) {
          toast({
            title: 'Great!',
            description: 'You\'re already on this page. Check your progress summary above!',
          })
          // Scroll to top to show any updates
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } else {
          toast({
            title: 'Great!',
            description: 'Opening suggested action...',
          })
          router.push(result.actionUrl)
        }
      } else {
        toast({
          title: 'Done!',
          description: 'Nudge accepted',
        })
      }
    } catch (error) {
      console.error('[useNudges] Accept error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to accept nudge',
        variant: 'destructive',
      })
    }
  }

  const handleSnooze = async (nudgeId: string, hours: number = 4) => {
    if (!clerkId) {
      toast({
        title: 'Error',
        description: 'Authentication required to snooze nudge',
        variant: 'destructive',
      })
      return
    }

    try {
      const snoozeUntil = Date.now() + hours * 60 * 60 * 1000
      await snoozeNudge({ nudgeId, clerkId, snoozeUntil })

      toast({
        title: 'Snoozed',
        description: `I'll remind you again in ${hours} hour${hours !== 1 ? 's' : ''}`,
      })
    } catch (error) {
      console.error('[useNudges] Snooze error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to snooze nudge',
        variant: 'destructive',
      })
    }
  }

  const handleDismiss = async (nudgeId: string) => {
    if (!clerkId) {
      toast({
        title: 'Error',
        description: 'Authentication required to dismiss nudge',
        variant: 'destructive',
      })
      return
    }

    try {
      await dismissNudge({ nudgeId, clerkId })

      toast({
        title: 'Dismissed',
        description: 'Nudge removed from your feed',
      })
    } catch (error) {
      console.error('[useNudges] Dismiss error:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to dismiss nudge',
        variant: 'destructive',
      })
    }
  }

  return {
    nudges: pendingNudges ?? [],
    isLoading: pendingNudges === undefined,
    actions: {
      accept: handleAccept,
      snooze: handleSnooze,
      dismiss: handleDismiss,
    },
  }
}
