import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import supabaseClient from "@/lib/supabase-auth"

export interface User {
  id: number | string
  username: string
  name: string
  email: string
  userType:
    | "regular"
    | "university_student"
    | "university_admin"
    | "admin"
    | "staff"
  role?:
    | "user"
    | "staff"
    | "admin"
    | "super_admin"
    | "university_user"
    | "university_admin" // Role field from database schema
  universityId?: number
  universityName?: string // Added to match database schema
  departmentId?: number
  studentId?: string
  graduationYear?: number
  isUniversityStudent: boolean
  needsUsername?: boolean
  onboardingCompleted?: boolean // Added for onboarding flow tracking
  xp: number
  level: number
  rank: string
  profileImage?: string
  subscriptionPlan: "free" | "premium" | "university"
  subscriptionStatus: "active" | "inactive" | "cancelled" | "past_due"
  subscriptionCycle?: "monthly" | "quarterly" | "annual"
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  subscriptionExpiresAt?: Date
  emailVerified: boolean
  pendingEmail?: string // Added for email change verification workflow
  passwordLastChanged?: Date // Added for password change tracking
  passwordLength?: number // Added for password display purposes
  redirectPath?: string // Added for role-based redirection after login
  theme?: {
    primary: string
    appearance: "light" | "dark" | "system"
    variant: "professional" | "tint" | "vibrant"
    radius: number
  }
}

interface UserContextType {
  user: User | null
  isLoading: boolean
  error: Error | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  forceLogout: () => Promise<void>
  refetchUser: () => Promise<User | null>
  updateProfile: (data: {
    name?: string
    email?: string
    username?: string
    profileImage?: string
  }) => void
  uploadProfileImage: (imageDataUrl: string) => Promise<User>
  clearUserCache: () => void
  isAuthenticated: boolean
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check Supabase auth session on load
  useEffect(() => {
    const checkAuthSession = async () => {
      const { data } = await supabaseClient.auth.getSession()
      setIsAuthenticated(!!data.session)
    }

    checkAuthSession()

    // Set up auth state change listener
    const {
      data: { subscription }
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Custom query function for fetching user data - tries both API and Supabase
  const fetchUserData = async (): Promise<User | null> => {
    try {
      // First check if we have a Supabase session
      const { data: authSession } = await supabaseClient.auth.getSession()

      if (!authSession.session) {

  }

  // Make debug functions available globally for development
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      process.env.NODE_ENV === "development"
    ) {
      ;(window as any).debugAuth = {
        forceLogout,
        clearCache: clearUserCache,
        currentUser: user,
        isAuthenticated
      }
    }
  }, [user, isAuthenticated])

  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name?: string
      email?: string
      username?: string
      profileImage?: string
    }) => {
      // Try updating via Supabase first
      try {
        // Get current auth user
        const { data: authUser } = await supabaseClient.auth.getUser()

        if (!authUser.user) {
          throw new Error("Not authenticated")
        }

        // Update auth metadata if name is provided
        if (data.name) {
          await supabaseClient.auth.updateUser({
            data: { name: data.name }
          })
        }

        // Update email if provided
        if (data.email) {
          await supabaseClient.auth.updateUser({
            email: data.email
          })
        }

        // Update user profile in database
        const { data: updatedData, error } = await supabaseClient
          .from("users")
          .update({
            name: data.name,
            username: data.username,
            profile_image: data.profileImage
          })
          .eq("id", authUser.user.id)
          .select()
          .single()

        if (error) {
          throw error
        }

        // Map to our User type
        const mappedUser: User = {
          id: updatedData.id,
          username: updatedData.username,
          name: updatedData.name,
          email: updatedData.email,
          userType: updatedData.user_type as any,
          role: updatedData.role as any,
          universityId: updatedData.university_id,
          universityName: updatedData.university_name,
          isUniversityStudent: updatedData.user_type === "university_student",
          needsUsername: updatedData.needs_username,
          onboardingCompleted: updatedData.onboarding_completed,
          xp: updatedData.xp || 0,
          level: updatedData.level || 1,
          rank: updatedData.rank || "Beginner",
          profileImage: updatedData.profile_image,
          subscriptionPlan: (updatedData.subscription_plan || "free") as any,
          subscriptionStatus: (updatedData.subscription_status ||
            "inactive") as any,
          subscriptionCycle: updatedData.subscription_cycle as any,
          stripeCustomerId: updatedData.stripe_customer_id,
          stripeSubscriptionId: updatedData.stripe_subscription_id,
          emailVerified: updatedData.email_verified || false
        }

        return mappedUser
      } catch (supabaseError) {
        console.error(
          "Supabase update failed, falling back to API:",
          supabaseError
        )

        // Fall back to API endpoint if Supabase update fails
        const res = await apiRequest("PUT", "/api/users/profile", data)
        const responseData = await res.json()
        // Response data is the user object directly
        return responseData as User
      }
    },
    onSuccess: (updatedUser) => {
      // Update the cache with the new user data
      queryClient.setQueryData(["/api/users/me"], updatedUser)

      // Also invalidate the cache to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] })
    }
  })

  const updateProfile = async (data: {
    name?: string
    email?: string
    username?: string
    profileImage?: string
  }) => {
    // Add a timestamp to force cache refresh if this is a profile image update
    if (data.profileImage) {
      data.profileImage = `${data.profileImage}?t=${new Date().getTime()}`

        const byteArrays = []

        for (let i = 0; i < byteCharacters.length; i++) {
          byteArrays.push(byteCharacters.charCodeAt(i))
        }

        const byteArray = new Uint8Array(byteArrays)
        const blob = new Blob([byteArray], { type: "image/png" })
        const fileName = `profile-${authUser.user.id}-${Date.now()}.png`

        // Upload to Supabase storage
        const { data: storageData, error: storageError } =
          await supabaseClient.storage
            .from("profile-images")
            .upload(fileName, blob)

        if (storageError) {
          throw storageError
        }

        // Get public URL
        const { data: publicUrlData } = supabaseClient.storage
          .from("profile-images")
          .getPublicUrl(fileName)

        const profileImage = publicUrlData.publicUrl

        // Update user profile
        const { data: updatedUserData, error: updateError } =
          await supabaseClient
            .from("users")
            .update({ profile_image: profileImage })
            .eq("id", authUser.user.id)
            .select()
            .single()

        if (updateError) {
          throw updateError
        }

        // Map to User type and return
        const updatedUser: User = {
          id: updatedUserData.id,
          username: updatedUserData.username,
          name: updatedUserData.name,
          email: updatedUserData.email,
          userType: updatedUserData.user_type as any,
          role: updatedUserData.role as any,
          universityId: updatedUserData.university_id,
          universityName: updatedUserData.university_name,
          isUniversityStudent:
            updatedUserData.user_type === "university_student",
          needsUsername: updatedUserData.needs_username,
          onboardingCompleted: updatedUserData.onboarding_completed,
          xp: updatedUserData.xp || 0,
          level: updatedUserData.level || 1,
          rank: updatedUserData.rank || "Beginner",
          profileImage: `${profileImage}?t=${Date.now()}`, // Add timestamp
          subscriptionPlan: (updatedUserData.subscription_plan ||
            "free") as any,
          subscriptionStatus: (updatedUserData.subscription_status ||
            "inactive") as any,
          subscriptionCycle: updatedUserData.subscription_cycle as any,
          stripeCustomerId: updatedUserData.stripe_customer_id,
          stripeSubscriptionId: updatedUserData.stripe_subscription_id,
          emailVerified: updatedUserData.email_verified || false
        }

        // Update query cache
        queryClient.setQueryData(["/api/users/me"], updatedUser)

        return updatedUser
      } catch (supabaseError) {
        console.error(
          "Supabase upload failed, falling back to API:",
          supabaseError
        )
        // Fall back to legacy API
      }

      // Step 1: Upload image to server (include Supabase auth token via apiRequest)
      const uploadData = await apiRequest<{ profileImage: string }>({
        url: "/api/users/profile-image",
        method: "POST",
        data: { imageDataUrl }
      })

      if (!uploadData.profileImage) {
        throw new Error("Profile image URL not returned from server")
      }

      // Step 2: Update user profile with the new image URL
      const updatedUserData = await apiRequest<User>({
        url: "/api/users/profile",
        method: "PUT",
        data: { profileImage: uploadData.profileImage }
      })

      // Step 3: Update the local user state with the image URL plus cache-busting timestamp
      const timestamp = Date.now()
      const profileImageWithTimestamp = `${uploadData.profileImage}?t=${timestamp}`

      const updatedUser = {
        ...updatedUserData,
        profileImage: profileImageWithTimestamp // Add timestamp to prevent browser caching
      }

      // Update query cache with the timestamped URL
      queryClient.setQueryData(["/api/users/me"], updatedUser)

      // Step 4: Manually trigger refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] })

      // Log success

  return changePasswordMutation
}
