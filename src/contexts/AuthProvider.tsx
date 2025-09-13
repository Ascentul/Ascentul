'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useToast } from '@/hooks/use-toast'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  name: string
  role: string
  subscription_plan: string
  subscription_status: string
  created_at: string
  updated_at: string
  // Optional avatar fields used by UI components
  profileImage?: string | null
  profile_image?: string | null
}

interface AuthContextType {
  user: UserProfile | null
  session: Session | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        
        if (initialSession) {
          setSession(initialSession)
          await fetchUserProfile(initialSession.user.id)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change:', event, currentSession)
        setSession(currentSession)
        
        if (currentSession?.user) {
          await fetchUserProfile(currentSession.user.id)
        } else {
          setUser(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        // If user profile doesn't exist, create a basic one
        if (error.code === 'PGRST116') {
          console.log('User profile not found, creating one...')
          const { data: authUser } = await supabase.auth.getUser()
          if (authUser.user) {
            const newProfile = {
              id: authUser.user.id,
              email: authUser.user.email,
              name: authUser.user.user_metadata?.name || authUser.user.email?.split('@')[0] || 'User',
              role: 'user',
              subscription_plan: 'free',
              subscription_status: 'active',
              username: `user_${Date.now()}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }
            
            console.log('Creating profile:', newProfile)
            const { data: createdProfile, error: createError } = await supabase
              .from('users')
              .insert(newProfile)
              .select()
              .single()
              
            console.log('Profile creation result:', { createdProfile, createError })
            
            if (!createError && createdProfile) {
              setUser(createdProfile)
              return
            } else {
              console.error('Failed to create profile:', createError)
            }
          }
        }
        return
      }

      setUser(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      // Use Supabase client directly for authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        throw new Error(error.message)
      }

      // Session will be set automatically by onAuthStateChange
      toast({
        title: 'Login successful',
        description: `Welcome back!`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed'
      toast({
        title: 'Login failed',
        description: message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const signUp = async (name: string, email: string, password: string) => {
    try {
      // Use Supabase client directly for registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          }
        }
      })

      if (error) {
        throw new Error(error.message)
      }

      if (data.user) {
        // Create user profile in database
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: name,
            role: 'user',
            subscription_plan: 'free',
            subscription_status: 'active',
            username: `user_${Date.now()}`,
          })

        if (profileError) {
          console.error('Error creating user profile:', profileError)
        }
      }

      toast({
        title: 'Registration successful',
        description: `Welcome to Ascentul, ${name}!`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed'
      toast({
        title: 'Registration failed',
        description: message,
        variant: 'destructive',
      })
      throw error
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })

      await supabase.auth.signOut()

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
  const isAdmin = user?.role === 'super_admin' || user?.role === 'university_admin' || user?.role === 'admin'

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
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
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}