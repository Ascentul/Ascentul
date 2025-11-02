'use client'

import React, { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { AgentProvider as AgentContextProvider } from '@/contexts/AgentContext'
import { AgentDock } from '@/components/agent/AgentDock'
import { AgentErrorBoundary } from '@/components/agent/AgentErrorBoundary'

/**
 * AgentProvider wrapper with feature flag and role-based gating
 *
 * Only renders AgentDock for:
 * - Students and regular users (not admins/advisors)
 * - When NEXT_PUBLIC_AGENT_ENABLED=true
 */
/**
 * Inner component that uses the agent context
 * Only renders after client-side mount to avoid hydration issues
 */
function AgentDockWrapper() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return <AgentDock />
}

export function AgentProvider() {
  const { user, isLoaded } = useUser()

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

  // Render agent for eligible users
  // The AgentDockWrapper handles client-side mounting to avoid hydration issues
  return (
    <AgentErrorBoundary>
      <AgentContextProvider>
        <AgentDockWrapper />
      </AgentContextProvider>
    </AgentErrorBoundary>
  )
}
