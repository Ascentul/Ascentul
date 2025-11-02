import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

/**
 * Custom hook to sync goal data when agent performs mutations
 *
 * Listens for agent goal mutation events (create, update, delete) and
 * automatically refetches the goals query to keep the UI in sync.
 *
 * Uses debouncing to prevent excessive refetches when multiple events
 * fire in quick succession (e.g., batch operations).
 *
 * Usage:
 * ```tsx
 * function MyComponent() {
 *   useAgentGoalSync()
 *   const { data: goals } = useQuery({ queryKey: ['/api/goals'], ... })
 *   // ...
 * }
 * ```
 */
export function useAgentGoalSync() {
  const queryClient = useQueryClient()
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const handleAgentGoalMutation = () => {
      // Clear existing timeout to debounce rapid events
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // Debounce refetch by 100ms to batch rapid consecutive events
      timeoutRef.current = setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ['/api/goals'] })
      }, 100)
    }

    const events = ['agent:goal:created', 'agent:goal:updated', 'agent:goal:deleted']
    events.forEach((event) => window.addEventListener(event, handleAgentGoalMutation))

    return () => {
      // Clear timeout on unmount to prevent memory leaks
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      events.forEach((event) => window.removeEventListener(event, handleAgentGoalMutation))
    }
  }, [queryClient])
}
