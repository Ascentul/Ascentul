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

}

export default AppWithLoading
