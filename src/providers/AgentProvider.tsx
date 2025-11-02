'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { AgentProvider as AgentContextProvider } from '@/contexts/AgentContext'
import { AgentDock } from '@/components/agent/AgentDock'
import { AgentErrorBoundary } from '@/components/agent/AgentErrorBoundary'

/**
 * AgentProvider wrapper with feature flag and role-based gating
 *
 * Provides agent context to entire app, but only renders AgentDock for:
 * - Students and regular users (not admins/advisors)
 * - When NEXT_PUBLIC_AGENT_ENABLED=true
 */

/**
 * Inner component that conditionally renders AgentDock based on feature flags and user role
 * Only renders after client-side mount to avoid hydration issues
 */
function ConditionalAgentDock() {
  const [mounted, setMounted] = useState(false)
  const { user, isLoaded } = useUser()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted (avoid hydration issues)
  if (!mounted) {
    return null
  }

  // Check feature flag
  const agentEnabled = process.env.NEXT_PUBLIC_AGENT_ENABLED === 'true'
  if (!agentEnabled) {
    return null
  }

  // Wait for user to load
  if (!isLoaded) {
    return null
  }

  // Only render for authenticated users
  if (!user) {
    return null
  }

  // Get user role from Clerk public metadata
  const userRole = (user.publicMetadata?.role as string) || 'user'

  // Only enable for students and regular users (not admins, advisors, university_admin)
  const allowedRoles = ['user', 'student']
  const isStudentOrUser = allowedRoles.includes(userRole)

  if (!isStudentOrUser) {
    return null
  }

  // Render agent dock for eligible users
  return <AgentDock />
}

/**
 * Main AgentProvider that wraps children with agent context
 * This ensures useAgent hook works throughout the app, even if AgentDock is not visible
 */
export function AgentProvider({ children }: { children?: React.ReactNode }) {
  return (
    <AgentErrorBoundary>
      <AgentContextProvider>
        {children}
        <ConditionalAgentDock />
      </AgentContextProvider>
    </AgentErrorBoundary>
  )
}
