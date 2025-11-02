'use client'

import React from 'react'
import { useUser } from '@clerk/nextjs'
import { AgentProvider as AgentContextProvider } from '@/contexts/AgentContext'
import { AgentDock } from '@/components/agent/AgentDock'

/**
 * AgentProvider wrapper with feature flag and role-based gating
 *
 * Only renders AgentDock for:
 * - Students and regular users (not admins/advisors)
 * - When NEXT_PUBLIC_AGENT_ENABLED=true
 */
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
  return (
    <AgentContextProvider>
      <AgentDock />
    </AgentContextProvider>
  )
}
