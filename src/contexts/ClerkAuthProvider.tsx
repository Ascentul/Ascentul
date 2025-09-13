'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { useToast } from '@/hooks/use-toast'

interface UserProfile {
  _id: string
  clerkId: string
  email: string
  name: string
  username?: string
  role: string
  subscription_plan: string
  subscription_status: string
  university_id?: string
  profile_image?: string
  onboarding_completed?: boolean
  created_at: number
  updated_at: number
}

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isSignedIn: boolean
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser()
  const { signOut: clerkSignOut } = useClerkAuth()
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  // Get user profile from Convex
  const userProfile = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip"
  )

  // Create user mutation
  const createUser = useMutation(api.users.createUser)

  useEffect(() => {
    const initializeUser = async () => {
      if (!clerkLoaded) return

      if (clerkUser && !userProfile) {
        // Create user profile in Convex if it doesn't exist
        try {
          await createUser({
            clerkId: clerkUser.id,
            email: clerkUser.emailAddresses[0]?.emailAddress || '',
            name: clerkUser.fullName || clerkUser.firstName || 'User',
            username: clerkUser.username || undefined,
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

  const signOut = async () => {
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
  }

  // Check if user is admin
  const isAdmin = userProfile?.role === 'super_admin' || 
                  userProfile?.role === 'university_admin' || 
                  userProfile?.role === 'admin'

  const value = {
    user: userProfile || null,
    isLoading: isLoading || !clerkLoaded,
    isSignedIn: !!clerkUser,
    signOut,
    isAdmin,
  }

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
