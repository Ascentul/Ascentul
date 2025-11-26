'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'

/**
 * Valid roles that can be impersonated
 */
export type ImpersonatableRole =
  | 'student'
  | 'individual'
  | 'advisor'
  | 'staff'
  | 'university_admin'

/**
 * Subscription plan types for impersonation
 */
export type ImpersonatedPlan = 'free' | 'premium' | 'university'

/**
 * Impersonation state
 */
export interface ImpersonationState {
  isImpersonating: boolean
  role: ImpersonatableRole | null
  universityId: Id<"universities"> | null
  universityName: string | null
  plan: ImpersonatedPlan | null
}

/**
 * Context value type
 */
interface ImpersonationContextType {
  // State
  impersonation: ImpersonationState

  // Actions
  startImpersonating: (
    role: ImpersonatableRole,
    options?: {
      universityId?: Id<"universities">
      plan?: ImpersonatedPlan
    }
  ) => void
  stopImpersonating: () => void

  // Helpers
  getEffectiveRole: () => string
  getEffectiveUniversityId: () => Id<"universities"> | null | undefined
  getEffectivePlan: () => ImpersonatedPlan | null
  canImpersonate: boolean
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined)

const STORAGE_KEY = 'ascentul_impersonation'

/**
 * Load impersonation state from sessionStorage
 */
function loadFromStorage(): ImpersonationState | null {
  if (typeof window === 'undefined') return null

  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.warn('[Impersonation] Failed to load from storage:', e)
  }
  return null
}

/**
 * Save impersonation state to sessionStorage
 */
function saveToStorage(state: ImpersonationState): void {
  if (typeof window === 'undefined') return

  try {
    if (state.isImpersonating) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch (e) {
    console.warn('[Impersonation] Failed to save to storage:', e)
  }
}

/**
 * Default impersonation state
 */
const defaultState: ImpersonationState = {
  isImpersonating: false,
  role: null,
  universityId: null,
  universityName: null,
  plan: null,
}

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()

  // Get user profile from Convex to check if super_admin
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  // Only super_admin can impersonate
  const canImpersonate = userProfile?.role === 'super_admin'

  // Initialize state from storage or default
  const [impersonation, setImpersonation] = useState<ImpersonationState>(() => {
    const stored = loadFromStorage()
    return stored || defaultState
  })

  // Fetch universities for the dropdown (only if super_admin)
  const universities = useQuery(
    api.universities.getAllUniversities,
    canImpersonate && clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  // Sync state to storage when it changes
  useEffect(() => {
    saveToStorage(impersonation)
  }, [impersonation])

  // Clear impersonation if user is not super_admin
  useEffect(() => {
    if (clerkLoaded && userProfile && !canImpersonate && impersonation.isImpersonating) {
      setImpersonation(defaultState)
    }
  }, [clerkLoaded, userProfile, canImpersonate, impersonation.isImpersonating])

  const startImpersonating = useCallback((
    role: ImpersonatableRole,
    options?: {
      universityId?: Id<"universities">
      plan?: ImpersonatedPlan
    }
  ) => {
    if (!canImpersonate) {
      console.warn('[Impersonation] Only super_admin can impersonate')
      return
    }

    // Find university name if universityId provided
    let universityName: string | null = null
    if (options?.universityId && universities) {
      const uni = universities.find(u => u._id === options.universityId)
      universityName = uni?.name || null
    }

    // Determine default plan based on role
    let plan = options?.plan || null
    if (!plan) {
      if (role === 'student' || role === 'university_admin' || role === 'advisor') {
        plan = 'university'
      } else if (role === 'individual') {
        plan = 'free' // Can be changed to 'premium' via UI
      }
    }

    setImpersonation({
      isImpersonating: true,
      role,
      universityId: options?.universityId || null,
      universityName,
      plan,
    })

    console.log('[Impersonation] Started impersonating:', { role, ...options })
  }, [canImpersonate, universities])

  const stopImpersonating = useCallback(() => {
    setImpersonation(defaultState)
    console.log('[Impersonation] Stopped impersonating')
  }, [])

  const getEffectiveRole = useCallback(() => {
    if (impersonation.isImpersonating && impersonation.role) {
      return impersonation.role
    }
    return userProfile?.role || 'individual'
  }, [impersonation, userProfile?.role])

  const getEffectiveUniversityId = useCallback(() => {
    if (impersonation.isImpersonating) {
      return impersonation.universityId
    }
    return userProfile?.university_id as Id<"universities"> | undefined
  }, [impersonation, userProfile?.university_id])

  const getEffectivePlan = useCallback(() => {
    if (impersonation.isImpersonating) {
      return impersonation.plan
    }
    return null // Real plan comes from useSubscription
  }, [impersonation])

  const value = useMemo(() => ({
    impersonation,
    startImpersonating,
    stopImpersonating,
    getEffectiveRole,
    getEffectiveUniversityId,
    getEffectivePlan,
    canImpersonate,
  }), [
    impersonation,
    startImpersonating,
    stopImpersonating,
    getEffectiveRole,
    getEffectiveUniversityId,
    getEffectivePlan,
    canImpersonate,
  ])

  return (
    <ImpersonationContext.Provider value={value}>
      {children}
    </ImpersonationContext.Provider>
  )
}

/**
 * Hook to access impersonation context
 */
export function useImpersonation() {
  const context = useContext(ImpersonationContext)
  if (context === undefined) {
    throw new Error('useImpersonation must be used within an ImpersonationProvider')
  }
  return context
}
