import React, { createContext, useContext, useEffect, useState } from "react"
import { Session, User } from "@supabase/supabase-js"
import supabaseClient from "@/lib/supabase-auth"

interface SupabaseAuthContextProps {
  session: Session | null
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData?: object) => Promise<any>
  signOut: () => Promise<void>
}

const SupabaseAuthContext = createContext<SupabaseAuthContextProps | undefined>(
  undefined
)

export function SupabaseAuthProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true)
      try {
        // Check active session
        const {
          data: { session: activeSession }
        } = await supabaseClient.auth.getSession()
        setSession(activeSession)
        setUser(activeSession?.user || null)
      } catch (error) {
        console.error("Error fetching session:", error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((event, currentSession) => {

  }
  return context
}
