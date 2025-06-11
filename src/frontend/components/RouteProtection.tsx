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
      console.log(
        "User needs to complete onboarding. Redirecting to onboarding flow."
      )
      console.log("User details:", {
        needsUsername: user.needsUsername,
        onboardingCompleted: user.onboardingCompleted,
        role: user.role,
        userType: user.userType
      })
      setLocation("/onboarding")
      return
    }

    // Staff and super_admin users should be redirected to their dashboard
    // Check both role and userType fields
    if (
      user.role === "staff" ||
      user.userType === "staff" ||
      user.role === "super_admin"
    ) {
      console.log(
        "Career route check - redirecting staff/admin user to admin dashboard. Role:",
        user.role,
        "Type:",
        user.userType
      )
      setLocation("/admin")
      return
    }
  }, [user, setLocation])

  // Show loading state while redirecting
  if (user.needsUsername || !user.onboardingCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show loading state while redirecting staff/admin users
  if (
    user.role === "staff" ||
    user.userType === "staff" ||
    user.role === "super_admin"
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Admins, university users, and regular users should have access to career features
  console.log(
    "Career route access granted for user with role:",
    user.role,
    "type:",
    user.userType
  )
  return <>{children}</>
}

export function CareerRoute({ children }: { children: ReactNode }) {
  return <CareerRouteGuard>{children}</CareerRouteGuard>
}

interface AdminRouteGuardProps {
  children: ReactNode
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoading } = useUser()
  const isSystemAdmin = useIsSystemAdmin()
  const [, setLocation] = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Explicit check for super_admin role directly, then use helper function
  if (
    !user ||
    !(
      user.role === "super_admin" ||
      user.role === "admin" ||
      user.userType === "admin"
    )
  ) {
    console.log("Admin route check failed - redirecting to appropriate page.")
    console.log("User details:", {
      role: user?.role,
      userType: user?.userType,
      isLoggedIn: !!user,
      currentPath: window.location.pathname
    })

    // Redirect based on user type
    if (!user) {
      console.log("No user found - redirecting to /sign-in")
      setLocation("/sign-in")
    } else if (user.userType === "staff") {
      console.log("Staff user - redirecting to /admin")
      setLocation("/admin")
    } else if (
      user.userType === "university_admin" ||
      user.userType === "university_student"
    ) {
      console.log(
        "University user - redirecting to /university-admin/dashboard"
      )
      setLocation("/university-admin/dashboard")
    } else {
      console.log("Regular user - redirecting to /career-dashboard")
      setLocation("/career-dashboard")
    }
    return null
  }

  // If we got here, the user is an admin
  console.log("Admin route access granted for path:", window.location.pathname)
  console.log("User details:", {
    role: user?.role,
    userType: user?.userType
  })

  return <>{children}</>
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>
}

interface UniversityRouteGuardProps {
  children: ReactNode
}

export function UniversityRouteGuard({ children }: UniversityRouteGuardProps) {
  const { user, isLoading } = useUser()
  const [, setLocation] = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Allow university students and university admins to access university features
  // Check both role and userType fields
  if (
    !user ||
    (user.role !== "university_user" &&
      user.role !== "university_admin" &&
      user.userType !== "university_student" &&
      user.userType !== "university_admin")
  ) {
    console.log(
      "University route check failed - redirecting. User role:",
      user?.role,
      "User type:",
      user?.userType
    )

    // Redirect based on user type and role
    if (!user) {
      setLocation("/sign-in")
    } else if (
      user.role === "super_admin" ||
      user.role === "admin" ||
      user.userType === "admin"
    ) {
      setLocation("/admin")
    } else if (user.role === "staff" || user.userType === "staff") {
      setLocation("/admin")
    } else {
      setLocation("/career-dashboard")
    }
    return null
  }

  console.log(
    "University route access granted for user with role:",
    user?.role,
    "type:",
    user?.userType
  )

  return <>{children}</>
}

export function UniversityRoute({ children }: { children: ReactNode }) {
  return <UniversityRouteGuard>{children}</UniversityRouteGuard>
}

interface StaffRouteGuardProps {
  children: ReactNode
}

export function StaffRouteGuard({ children }: StaffRouteGuardProps) {
  const { user, isLoading } = useUser()
  const [, setLocation] = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check both role and userType fields for staff and admin permissions
  if (
    !user ||
    !(
      user.role === "staff" ||
      user.role === "admin" ||
      user.role === "super_admin" ||
      user.userType === "staff" ||
      user.userType === "admin"
    )
  ) {
    console.log(
      "Staff route check failed - redirecting. User role:",
      user?.role,
      "User type:",
      user?.userType
    )

    // Redirect based on user type
    if (!user) {
      setLocation("/sign-in")
    } else if (
      user.userType === "university_admin" ||
      user.userType === "university_student"
    ) {
      setLocation("/university-dashboard")
    } else {
      setLocation("/career-dashboard")
    }
    return null
  }

  // If we got here, the user has staff access
  console.log(
    "Staff route access granted for user with role:",
    user?.role,
    "type:",
    user?.userType
  )

  return <>{children}</>
}

export function StaffRoute({ children }: { children: ReactNode }) {
  return <StaffRouteGuard>{children}</StaffRouteGuard>
}

interface UniversityAdminRouteGuardProps {
  children: ReactNode
}

export function UniversityAdminRouteGuard({
  children
}: UniversityAdminRouteGuardProps) {
  const { user, isLoading } = useUser()
  // Remove the isUniversityAdmin variable as we'll check both role and userType directly
  const [, setLocation] = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Check both role and userType fields for university admin permissions
  if (
    !user ||
    !(user.role === "university_admin" || user.userType === "university_admin")
  ) {
    console.log(
      "University admin route check failed - redirecting. User role:",
      user?.role,
      "User type:",
      user?.userType
    )

    // Redirect based on user type
    if (!user) {
      setLocation("/sign-in")
    } else if (user.userType === "university_student") {
      setLocation("/university-dashboard")
      // Show access denied message
      alert(
        "You need university administrator privileges to access this section"
      )
    } else if (
      user.role === "super_admin" ||
      user.role === "admin" ||
      user.userType === "admin"
    ) {
      setLocation("/admin")
    } else if (user.role === "staff" || user.userType === "staff") {
      setLocation("/admin")
    } else {
      setLocation("/career-dashboard")
    }
    return null
  }

  // If we got here, the user has university admin access
  console.log(
    "University admin route access granted for user with role:",
    user?.role,
    "type:",
    user?.userType
  )

  return <>{children}</>
}

export function UniversityAdminRoute({ children }: { children: ReactNode }) {
  // We now have a separate UniversityAdminRouteGuard component
  // Make sure this route is actually guarded
  return <UniversityAdminRouteGuard>{children}</UniversityAdminRouteGuard>
}
