import React, { useEffect } from "react"
import { Switch, Route, useLocation, Link } from "wouter"
import { Loader2 } from "lucide-react"
import Layout from "@/components/Layout"
import Dashboard from "@/pages/Dashboard"
import Goals from "@/pages/Goals"
import Resume from "@/pages/Resume"
import PdfTestPage from "@/pages/PdfTestPage"

import CoverLetter from "@/pages/CoverLetter"
import Interview from "@/pages/Interview"
import WorkHistory from "@/pages/WorkHistory"
import EducationHistory from "@/pages/EducationHistory"
import Achievements from "@/pages/Achievements"
import AICoach from "@/pages/AICoach"
// LinkedIn Optimizer removed
import CareerPathExplorer from "@/pages/CareerPathExplorer"
import Projects from "@/pages/Projects"
import CanvaEditor from "@/pages/CanvaEditor"
import Profile from "@/pages/Profile"
import AccountSettings from "@/pages/AccountSettings"
// SkillStacker removed
import Apply from "@/pages/Apply"
import CareerProfile from "@/pages/CareerProfile"
import Contacts from "@/pages/Contacts"
// Voice Interview Practice removed
import SignIn from "@/pages/sign-in"
import SignUp from "@/pages/sign-up"
import ForgotPassword from "@/pages/forgot-password"
import ResetPassword from "@/pages/reset-password"
import AuthCallback from "@/pages/auth/callback"
import AdminLogin from "@/pages/admin-login"
import StaffLogin from "@/pages/staff-login"
import StaffSignup from "@/pages/staff-signup"
import NotFound from "@/pages/not-found"
import AuthTest from "@/pages/AuthTest"
import { LoadingProvider } from "@/contexts/loading-context"
import { ScrollToTop } from "@/components/ScrollToTop"

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard"
import SupportPage from "@/pages/admin/SupportPage"
import AdminModelsPage from "@/pages/admin/ModelsPage"
import AdminOpenAILogsPage from "@/pages/admin/OpenAILogsPage"
import EmailAdmin from "@/pages/admin/EmailAdmin"
import UniversitiesPage from "@/pages/admin/universities"
import TestEmailPage from "@/pages/admin/test-email"
import UserManagement from "@/pages/admin/UserManagement"
import AnalyticsPage from "@/pages/admin/AnalyticsPage"
import BillingPage from "@/pages/admin/BillingPage"
import ReviewsPage from "@/pages/admin/ReviewsPage"
import AdminSettingsTab from "@/pages/admin/AdminSettingsTab"
import SystemSecurity from "@/pages/admin/SystemSecurity"

// Staff Pages
import StaffDashboard from "@/pages/staff/Dashboard"
import StaffLayout from "@/components/StaffLayout"
// We'll directly use the Layout component already imported below

// Public Pages
import Home from "@/pages/Home"
import Pricing from "@/pages/Pricing"
import Solutions from "@/pages/Solutions"
import WhoWeServe from "@/pages/WhoWeServe"
import PaymentPortal from "@/pages/PaymentPortal"
import Checkout from "@/pages/Checkout"
import SubscriptionSuccess from "@/pages/SubscriptionSuccess"
import PlanSelection from "@/pages/PlanSelection"
import BillingCycle from "@/pages/BillingCycle"
import OnboardingFlow from "@/components/OnboardingFlow"

// Public Layout
import { PublicLayout } from "@/components/PublicLayout"

// Route Protection Components
import {
  ProtectedRoute,
  PublicRoute,
  AdminRoute,
  UniversityRoute,
  UniversityAdminRoute,
  StaffRoute,
  CareerRoute
} from "@/components/RouteProtection"

// Import the university admin route guard
import UniversityAdminRouteGuard from "@/components/UniversityAdminRouteGuard"

// User data hooks
import {
  useUser,
  useIsUniversityAdmin,
  useIsAdminUser
} from "@/lib/useUserData"

// University Edition Components
import UniversityAdminDashboard from "@/pages/university/AdminDashboard"
import StudyPlan from "@/pages/university/StudyPlan"
import LearningModules from "@/pages/university/LearningModules"

// University Admin Components
import UniversityAdminLayout from "@/layouts/UniversityAdminLayout"
import {
  Dashboard as UniAdminDashboard,
  Students as UniAdminStudents,
  Invite as UniAdminInvite,
  Usage as UniAdminUsage,
  Settings as UniAdminSettings,
  Support as UniAdminSupport
} from "@/pages/university-admin"

// University Edition Layout
function UniversityLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation()
  const { user, logout } = useUser()
  const isAdmin = user?.userType === "university_admin"

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link
              href="/university"
              className="mr-6 flex items-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
              </svg>
              <span className="font-bold">University Edition</span>
            </Link>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {isAdmin && (
                <>
                  <Link
                    href="/university/admin"
                    className={`transition-colors hover:text-foreground/80 ${
                      location === "/university/admin"
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/university-admin"
                    className={`transition-colors hover:text-foreground/80 ${
                      location.startsWith("/university-admin")
                        ? "text-foreground"
                        : "text-foreground/60"
                    }`}
                  >
                    Admin Portal
                  </Link>
                </>
              )}
              <Link
                href="/university/study-plan"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/study-plan"
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                Study Plan
              </Link>
              <Link
                href="/university/learning"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/learning"
                    ? "text-foreground"
                    : "text-foreground/60"
                }`}
              >
                Learning Modules
              </Link>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/career-dashboard"
              className="flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-md border border-foreground/20 bg-background hover:bg-background/80 transition-colors cursor-pointer"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Career App</span>
            </Link>

            {user && (
              <div className="relative group">
                <button className="flex items-center space-x-2 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-foreground/5 transition-colors">
                  <span className="text-foreground/80">{user.name}</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt={user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4 text-foreground/60"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border mb-1">
                      {user.email}
                    </div>

                    <Link
                      href="/profile"
                      className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-foreground/5 rounded-sm transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      Profile
                    </Link>

                    <Link
                      href="/account"
                      className="flex items-center px-3 py-2 text-sm text-foreground hover:bg-foreground/5 rounded-sm transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l11 11z"></path>
                      </svg>
                      Settings
                    </Link>

                    <hr className="my-1 border-border" />

                    <button
                      onClick={() => logout()}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-sm transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4 mr-2"
                      >
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16,17 21,12 16,7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  )
}

// Import Admin Layout
import AdminLayout from "@/layouts/AdminLayout"

function App() {
  const [location, navigate] = useLocation()
  const isUniversityRoute =
    location.startsWith("/university") || location === "/university-dashboard"
  const isSignInRoute = location === "/sign-in"
  const isSignUpRoute = location === "/sign-up"
  // Remove auth route check since this route doesn't exist (using sign-in instead)
  // const isAuthRoute = location === "/auth" || location.startsWith("/auth?");

  // Load the html2pdf.js library for PDF exports
  useEffect(() => {
    const script = document.createElement("script")
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
    script.defer = true
    document.body.appendChild(script)

    return () => {
      // Clean up the script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Always show public pages at public routes, regardless of authentication
  const isPublicRoute = [
    "/home",
    "/pricing",
    "/solutions",
    "/who-we-serve",
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
    "/admin-login",
    "/staff-login",
    "/staff-signup",
    "/auth-test"
  ].includes(location)

  // Payment portal routes
  const isPaymentPortalRoute = location.startsWith("/payment-portal")
  const isCheckoutRoute = location.startsWith("/checkout")
  const isSubscriptionSuccessRoute = location === "/subscription-success"

  // Onboarding and plan selection routes
  const isOnboardingRoute = location === "/onboarding"
  const isPlanSelectionRoute = location === "/plan-selection"
  const isBillingCycleRoute = location.startsWith("/billing-cycle")

  // Root path redirects to sign-in using useEffect to avoid render loop
  useEffect(() => {
    if (location === "/") {
      navigate("/sign-in")
    }
  }, [location, navigate])

  // Special fix for super admin redirect issue - always ensure super_admin users go to /admin
  const { user } = useUser()

  useEffect(() => {
    // If a user with super_admin role is detected on a non-admin route, redirect them
    if (
      user &&
      user.role === "super_admin" &&
      location === "/career-dashboard"
    ) {
      console.log(
        "SUPER ADMIN FIX: Detected super_admin at incorrect route, redirecting to /admin"
      )
      navigate("/admin")
    }
  }, [user, location, navigate])

  // Authentication routes always take precedence
  if (
    isSignInRoute ||
    isSignUpRoute ||
    location === "/forgot-password" ||
    location === "/reset-password" ||
    location === "/auth/callback" ||
    location === "/admin-login" ||
    location === "/staff-login" ||
    location === "/staff-signup"
  ) {
    return (
      <Switch>
        <Route path="/sign-in" component={SignIn} />
        <Route path="/sign-up" component={SignUp} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/auth/callback" component={AuthCallback} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/staff-login" component={StaffLogin} />
        <Route path="/staff-signup" component={StaffSignup} />
      </Switch>
    )
  }

  // Root redirect is handled above

  // Payment Portal Routes with layout
  if (isPaymentPortalRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/payment-portal/:planType" component={PaymentPortal} />
        </Switch>
      </PublicLayout>
    )
  }

  // Checkout Route
  if (isCheckoutRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/checkout" component={Checkout} />
        </Switch>
      </PublicLayout>
    )
  }

  // Subscription Success Route
  if (isSubscriptionSuccessRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/subscription-success" component={SubscriptionSuccess} />
        </Switch>
      </PublicLayout>
    )
  }

  // Onboarding Flow Route
  if (isOnboardingRoute) {
    return (
      <Switch>
        <Route path="/onboarding">
          <ProtectedRoute>
            <OnboardingFlow />
          </ProtectedRoute>
        </Route>
      </Switch>
    )
  }

  // Plan Selection Route
  if (isPlanSelectionRoute) {
    return (
      <Switch>
        <Route path="/plan-selection">
          <ProtectedRoute>
            <PlanSelection />
          </ProtectedRoute>
        </Route>
      </Switch>
    )
  }

  // Billing Cycle Route
  if (isBillingCycleRoute) {
    return (
      <Switch>
        <Route path="/billing-cycle">
          <ProtectedRoute>
            <BillingCycle />
          </ProtectedRoute>
        </Route>
      </Switch>
    )
  }

  // Use PublicLayout for public routes (excluding auth routes which are handled above)
  if (isPublicRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/" component={SignIn} />
          <Route path="/home" component={Home} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/solutions" component={Solutions} />
          <Route path="/who-we-serve" component={WhoWeServe} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/auth/callback" component={AuthCallback} />
          <Route path="/auth-test" component={AuthTest} />
        </Switch>
      </PublicLayout>
    )
  }

  // Define admin routes with the canonical /admin path
  const isAdminRoute =
    location.startsWith("/admin") && location !== "/admin-login"

  // University Admin routes check
  const isUniversityAdminRoute = location.startsWith("/university-admin")

  // University Admin Dashboard has its own layout
  if (isUniversityAdminRoute) {
    return (
      <Switch>
        <UniversityAdminRouteGuard
          path="/university-admin/dashboard"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminDashboard />
            </UniversityAdminLayout>
          )}
        />
        <UniversityAdminRouteGuard
          path="/university-admin"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminDashboard />
            </UniversityAdminLayout>
          )}
        />
        <UniversityAdminRouteGuard
          path="/university-admin/students"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminStudents />
            </UniversityAdminLayout>
          )}
        />
        <UniversityAdminRouteGuard
          path="/university-admin/invite"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminInvite />
            </UniversityAdminLayout>
          )}
        />
        <UniversityAdminRouteGuard
          path="/university-admin/usage"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminUsage />
            </UniversityAdminLayout>
          )}
        />
        <UniversityAdminRouteGuard
          path="/university-admin/settings"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminSettings />
            </UniversityAdminLayout>
          )}
        />
        <UniversityAdminRouteGuard
          path="/university-admin/support"
          component={() => (
            <UniversityAdminLayout>
              <UniAdminSupport />
            </UniversityAdminLayout>
          )}
        />
      </Switch>
    )
  }

  // Admin Dashboard has its own layout
  if (isAdminRoute) {
    return (
      <AdminLayout>
        <Switch>
          {/* Redirect /admin-dashboard to /admin for backward compatibility */}
          <Route path="/admin-dashboard">
            {() => {
              // Use useEffect to perform the redirect
              React.useEffect(() => {
                navigate("/admin")
              }, [])
              return null
            }}
          </Route>
          <Route path="/admin/universities">
            <AdminRoute>
              <UniversitiesPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/users">
            <AdminRoute>
              <UserManagement />
            </AdminRoute>
          </Route>
          <Route path="/admin/analytics">
            <AdminRoute>
              <AnalyticsPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/reviews">
            <AdminRoute>
              <ReviewsPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/support">
            <AdminRoute>
              <SupportPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/support/:id">
            <AdminRoute>
              <SupportPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/models">
            <AdminRoute>
              <AdminModelsPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/openai-logs">
            <AdminRoute>
              <AdminOpenAILogsPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/email">
            <AdminRoute>
              <EmailAdmin />
            </AdminRoute>
          </Route>
          <Route path="/admin/test-email">
            <AdminRoute>
              <TestEmailPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/billing">
            <AdminRoute>
              <BillingPage />
            </AdminRoute>
          </Route>
          <Route path="/admin/settings">
            <AdminRoute>
              <AdminSettingsTab />
            </AdminRoute>
          </Route>
          <Route path="/admin/system-security">
            <AdminRoute>
              <SystemSecurity />
            </AdminRoute>
          </Route>
          {/* This is the catch-all route for /admin which must come AFTER more specific routes */}
          <Route path="/admin">
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          </Route>
        </Switch>
      </AdminLayout>
    )
  }

  const isStaffRoute =
    (location.startsWith("/staff") && location !== "/staff-login") ||
    location === "/staff-dashboard"

  // Staff Dashboard has its own layout
  if (isStaffRoute) {
    return (
      <Switch>
        <Route path="/staff-dashboard">
          <StaffRoute>
            <StaffDashboard />
          </StaffRoute>
        </Route>
        <Route path="/staff">
          <StaffRoute>
            <StaffDashboard />
          </StaffRoute>
        </Route>
      </Switch>
    )
  }

  // Choose layout based on route
  const LayoutComponent = isUniversityRoute ? UniversityLayout : Layout

  return (
    <LayoutComponent>
      <Switch>
        {/* Career App Routes - Protected for regular users */}
        <Route path="/career-dashboard">
          <CareerRoute>
            <Dashboard />
          </CareerRoute>
        </Route>
        <Route path="/dashboard">
          <CareerRoute>
            <Dashboard />
          </CareerRoute>
        </Route>
        <Route path="/goals">
          <CareerRoute>
            <Goals />
          </CareerRoute>
        </Route>
        <Route path="/resume">
          <CareerRoute>
            <Resume />
          </CareerRoute>
        </Route>
        <Route path="/pdf-test">
          <CareerRoute>
            <PdfTestPage />
          </CareerRoute>
        </Route>

        <Route path="/cover-letter">
          <CareerRoute>
            <CoverLetter />
          </CareerRoute>
        </Route>
        <Route path="/cover-letters">
          <CareerRoute>
            <CoverLetter />
          </CareerRoute>
        </Route>
        <Route path="/apply">
          <CareerRoute>
            <Apply />
          </CareerRoute>
        </Route>
        <Route path="/application-tracker">
          <CareerRoute>
            <Interview />
          </CareerRoute>
        </Route>
        <Route path="/work-history">
          <CareerRoute>
            <WorkHistory />
          </CareerRoute>
        </Route>
        <Route path="/education-history">
          <CareerRoute>
            <EducationHistory />
          </CareerRoute>
        </Route>
        <Route path="/achievements">
          <CareerRoute>
            <Achievements />
          </CareerRoute>
        </Route>
        <Route path="/ai-coach">
          <CareerRoute>
            <AICoach />
          </CareerRoute>
        </Route>
        {/* LinkedIn Optimizer route removed */}
        <Route path="/career-path-explorer">
          <CareerRoute>
            <CareerPathExplorer />
          </CareerRoute>
        </Route>
        {/* Skill Stacker route removed */}
        <Route path="/projects">
          <CareerRoute>
            <Projects />
          </CareerRoute>
        </Route>
        <Route path="/career-profile">
          <CareerRoute>
            <CareerProfile />
          </CareerRoute>
        </Route>
        <Route path="/contacts">
          <CareerRoute>
            <Contacts />
          </CareerRoute>
        </Route>
        {/* Voice Interview Practice route removed */}
        <Route path="/canva-editor">
          <CareerRoute>
            <CanvaEditor />
          </CareerRoute>
        </Route>
        <Route path="/profile">
          <CareerRoute>
            <Profile />
          </CareerRoute>
        </Route>
        <Route path="/account">
          <CareerRoute>
            <AccountSettings />
          </CareerRoute>
        </Route>

        {/* University Edition Routes - Protected for university users */}
        <Route path="/university-dashboard">
          <UniversityRoute>
            <LearningModules />
          </UniversityRoute>
        </Route>
        <Route path="/university">
          <UniversityRoute>
            <LearningModules />
          </UniversityRoute>
        </Route>
        <Route path="/university/admin">
          <UniversityAdminRoute>
            <UniversityAdminDashboard />
          </UniversityAdminRoute>
        </Route>
        <Route path="/university/study-plan">
          <UniversityRoute>
            <StudyPlan />
          </UniversityRoute>
        </Route>
        <Route path="/university/learning">
          <UniversityRoute>
            <LearningModules />
          </UniversityRoute>
        </Route>

        {/* 404 Route */}
        <Route component={NotFound} />
      </Switch>
    </LayoutComponent>
  )
}

// Import Providers
import { PendingTasksProvider } from "@/context/PendingTasksContext"
import { UpcomingInterviewsProvider } from "@/context/UpcomingInterviewsContext"
import { AuthProvider } from "@/hooks/use-auth"

// Wrap the app with all providers
const AppWithLoading = () => {
  return (
    <LoadingProvider>
      <AuthProvider>
        <PendingTasksProvider>
          <UpcomingInterviewsProvider>
            <ScrollToTop />
            <App />
          </UpcomingInterviewsProvider>
        </PendingTasksProvider>
      </AuthProvider>
    </LoadingProvider>
  )
}

export default AppWithLoading
