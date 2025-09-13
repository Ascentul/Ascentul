import { ReactNode, useEffect } from "react"
import { useLocation } from "wouter"
import {
  useUser,
  useIsAdminUser,
  useIsSystemAdmin,
  useIsUniversityUser,
  useIsStaffUser,
  useIsRegularUser
} from "@/lib/useUserData"
import { Loader2 } from "lucide-react"

interface RouteGuardProps {
  children: ReactNode
  requiresAuth?: boolean
}

export function RouteGuard({ children, requiresAuth = true }: RouteGuardProps) {
  const { user, isLoading } = useUser()
  const [, setLocation] = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If auth is required and user isn't logged in
  if (requiresAuth && !user) {
    // Redirect to login
    setLocation("/sign-in")
    return null
  }

  return <>{children}</>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiresAuth>{children}</RouteGuard>
}

export function PublicRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiresAuth={false}>{children}</RouteGuard>
}

// Career app-specific route guard
export function CareerRouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser()
  const [, setLocation] = useLocation()
  const isRegularUser = useIsRegularUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If user isn't logged in
  if (!user) {
    // Redirect to login
    setLocation("/sign-in")
    return null
  }

  useEffect(() => {
    // Check if the user needs to complete onboarding
    if (user.needsUsername || !user.onboardingCompleted) {

  return <>{children}</>
}

export function UniversityAdminRoute({ children }: { children: ReactNode }) {
  // We now have a separate UniversityAdminRouteGuard component
  // Make sure this route is actually guarded
  return <UniversityAdminRouteGuard>{children}</UniversityAdminRouteGuard>
}
