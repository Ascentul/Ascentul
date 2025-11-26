'use client'

import { useMemo } from 'react'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useImpersonation } from '@/contexts/ImpersonationContext'
import { Id } from 'convex/_generated/dataModel'

export interface EffectiveRoleInfo {
  role: string
  universityId: Id<"universities"> | null | undefined
  isImpersonated: boolean
  actualRole: string
  actualUniversityId: Id<"universities"> | null | undefined
}

/**
 * Hook that returns effective role, respecting impersonation mode.
 *
 * When a super_admin is impersonating:
 * - Returns the impersonated role and university
 * - Sets isImpersonated to true
 * - Provides actual role for reference
 *
 * Usage:
 * ```tsx
 * const { role, universityId, isImpersonated } = useEffectiveRole()
 * if (role === 'student') {
 *   // Show student UI (works for both real and impersonated roles)
 * }
 * ```
 */
export function useEffectiveRole(): EffectiveRoleInfo {
  const { user } = useAuth()
  const impersonationContext = useImpersonation()

  return useMemo(() => {
    const actualRole = user?.role || 'individual'
    const actualUniversityId = user?.university_id as Id<"universities"> | undefined

    // If not impersonating, return real role
    if (!impersonationContext.impersonation.isImpersonating) {
      return {
        role: actualRole,
        universityId: actualUniversityId,
        isImpersonated: false,
        actualRole,
        actualUniversityId,
      }
    }

    return {
      role: impersonationContext.impersonation.role || actualRole,
      universityId: impersonationContext.impersonation.universityId,
      isImpersonated: true,
      actualRole,
      actualUniversityId,
    }
  }, [user?.role, user?.university_id, impersonationContext])
}
