'use client'

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { useToast } from '@/hooks/use-toast'
import { useSubscription, type SubscriptionInfo } from '@/hooks/useSubscription'

interface UserProfile {
  _id: string
  clerkId: string
  email: string
  name: string
  username?: string
  role: string
  // Subscription fields removed - now managed by Clerk Billing via useSubscription hook
  university_id?: string
  profile_image?: string
  cover_image?: string
  linkedin_url?: string
  github_url?: string
  bio?: string
  job_title?: string
  company?: string
  location?: string
  city?: string
  phone_number?: string
  website?: string
  skills?: string
  current_position?: string
  current_company?: string
  education?: string
  education_history?: {
    id: string
    school?: string
    degree?: string
    field_of_study?: string
    start_year?: string
    end_year?: string
    is_current?: boolean
    description?: string
  }[]
  work_history?: {
    id: string
    role?: string
    company?: string
    start_date?: string
    end_date?: string
    is_current?: boolean
    location?: string
    summary?: string
  }[]
  university_name?: string
  major?: string
  graduation_year?: string
  dream_job?: string
  career_goals?: string
  experience_level?: string
  industry?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
  onboarding_completed?: boolean
  completed_tasks?: string[]
  account_status?: string
  activation_token?: string
  activation_expires_at?: number
  temp_password?: string
  created_by_admin?: boolean
  password_reset_token?: string
  password_reset_expires_at?: number
  created_at: number
  updated_at: number
}

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
  subscription: SubscriptionInfo // Subscription info from Clerk Billing
  hasPremium: boolean // Helper for quick premium access check
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerkAuth()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Get subscription info from Clerk Billing
  const subscription = useSubscription()

  // Get user profile from Convex (for profile data, not subscription)
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  // Create & update user mutations
  const createUser = useMutation(api.users.createUser)
  const updateUser = useMutation(api.users.updateUser)

  useEffect(() => {
    const initializeUser = async () => {
      if (!clerkLoaded) return

      if (clerkUser && !userProfile) {
        // Create user profile in Convex if it doesn't exist
        try {
          // Derive initial role from Clerk public metadata if present and valid
          const allowedRoles = ['user', 'admin', 'super_admin', 'university_admin', 'staff'] as const
          const metaRole = (clerkUser.publicMetadata as any)?.role as string | undefined
          const initialRole = (metaRole && (allowedRoles as readonly string[]).includes(metaRole)) ? (metaRole as any) : undefined

          await createUser({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || 'User',
            username: clerkUser.username || undefined,
            role: initialRole,
          })
        } catch (error) {
          console.error('Error creating user profile:', error)
          toast({
            title: 'Error',
            description: 'Failed to create user profile',
            variant: 'destructive',
          })
        }
      }

      setIsLoading(false)
    }

    initializeUser()
  }, [clerkUser, clerkLoaded, userProfile, createUser, toast])

  // Keep Convex role in sync with Clerk publicMetadata.role for existing profiles
  useEffect(() => {
    const syncRole = async () => {
      if (!clerkLoaded || !clerkUser || !userProfile) return
      const allowedRoles = ['user', 'admin', 'super_admin', 'university_admin', 'staff'] as const
      const metaRole = (clerkUser.publicMetadata as any)?.role as string | undefined

      console.log('[ClerkAuthProvider] Role sync check:', {
        clerkRole: metaRole,
        convexRole: userProfile.role,
        needsSync: metaRole && userProfile.role !== metaRole
      })

      if (!metaRole || !(allowedRoles as readonly string[]).includes(metaRole)) return
      if (userProfile.role !== metaRole) {
        console.log('[ClerkAuthProvider] Syncing role from Clerk to Convex:', metaRole)
        try {
          await updateUser({
            clerkId: clerkUser.id,
            updates: { role: metaRole as any },
          })
          console.log('[ClerkAuthProvider] Role sync successful')
          toast({
            title: 'Role Updated',
            description: `Your role has been updated to ${metaRole}. Refreshing...`,
          })
          // Force a page refresh to reload with new role
          setTimeout(() => window.location.reload(), 1000)
        } catch (e) {
          console.error('Failed to sync role from Clerk to Convex:', e)
          toast({
            title: 'Role Sync Failed',
            description: 'Failed to sync your role. Please try signing out and back in.',
            variant: 'destructive',
          })
        }
      }
    }
    void syncRole()
  }, [clerkLoaded, clerkUser, userProfile, updateUser, toast])

  const signOut = useCallback(async () => {
    try {
      await clerkSignOut()
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Logout failed'
      toast({
        title: 'Logout failed',
        description: message,
        variant: 'destructive',
      })
      throw error
    }
  }, [clerkSignOut, toast])

  // Check if user is admin (memoized)
  const isAdmin = useMemo(
    () => userProfile?.role === 'super_admin' ||
          userProfile?.role === 'university_admin' ||
          userProfile?.role === 'advisor',
    [userProfile?.role]
  )

  // Helper for quick premium access check
  const hasPremium = useMemo(
    () => subscription.isPremium,
    [subscription.isPremium]
  )

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({
      user: userProfile || null,
      isLoading: isLoading || !clerkLoaded,
      isSignedIn: !!clerkUser,
      signOut,
      isAdmin,
      subscription, // Subscription info from Clerk Billing
      hasPremium,   // Quick access helper
    }),
    [userProfile, isLoading, clerkLoaded, clerkUser, signOut, isAdmin, subscription, hasPremium]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a ClerkAuthProvider')
  }
  return context
}
