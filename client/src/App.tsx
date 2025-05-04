import React, { useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Goals from "@/pages/Goals";
import Resume from "@/pages/Resume";

import CoverLetter from "@/pages/CoverLetter";
import Interview from "@/pages/Interview";
import WorkHistory from "@/pages/WorkHistory";
import EducationHistory from "@/pages/EducationHistory";
import Achievements from "@/pages/Achievements";
import AICoach from "@/pages/AICoach";
import LinkedInOptimizer from "@/pages/LinkedInOptimizer";
import CareerPathExplorer from "@/pages/CareerPathExplorer";
import Projects from "@/pages/Projects";
import CanvaEditor from "@/pages/CanvaEditor";
import Profile from "@/pages/Profile";
import AccountSettings from "@/pages/AccountSettings";
// SkillStacker removed
import Apply from "@/pages/Apply";
import CareerProfile from "@/pages/CareerProfile";
import Contacts from "@/pages/Contacts";
import VoicePractice from "@/pages/VoicePractice";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import AdminLogin from "@/pages/admin-login";
import StaffLogin from "@/pages/staff-login";
import StaffSignup from "@/pages/staff-signup";
import NotFound from "@/pages/not-found";
import AuthTest from "@/pages/AuthTest";
import { LoadingProvider } from "@/contexts/loading-context";
import { ScrollToTop } from "@/components/ScrollToTop";

// Admin Pages
import AdminDashboard from "@/pages/admin/Dashboard";
import SupportPage from "@/pages/admin/SupportPage";
import AdminModelsPage from "@/pages/admin/ModelsPage";
import AdminOpenAILogsPage from "@/pages/admin/OpenAILogsPage";
import EmailAdmin from "@/pages/admin/EmailAdmin";
import UniversitiesPage from "@/pages/admin/Universities";

// Staff Pages
import StaffDashboard from "@/pages/staff/Dashboard";
import StaffLayout from "@/components/StaffLayout";
// We'll directly use the Layout component already imported below

// Public Pages
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Solutions from "@/pages/Solutions";
import WhoWeServe from "@/pages/WhoWeServe";
import PaymentPortal from "@/pages/PaymentPortal";
import Checkout from "@/pages/Checkout";
import SubscriptionSuccess from "@/pages/SubscriptionSuccess";
import PlanSelection from "@/pages/PlanSelection";
import BillingCycle from "@/pages/BillingCycle";
import OnboardingFlow from "@/components/OnboardingFlow";

// Public Layout
import { PublicLayout } from "@/components/PublicLayout";

// Route Protection Components
import { 
  ProtectedRoute, 
  PublicRoute,
  AdminRoute,
  UniversityRoute,
  UniversityAdminRoute,
  StaffRoute,
  CareerRoute
} from "@/components/RouteProtection";

// Import the university admin route guard
import UniversityAdminRouteGuard from "@/components/UniversityAdminRouteGuard";

// User data hooks
import { useUser, useIsUniversityAdmin } from "@/lib/useUserData";

// University Edition Components
import UniversityAdminDashboard from "@/pages/university/AdminDashboard";
import StudyPlan from "@/pages/university/StudyPlan";
import LearningModules from "@/pages/university/LearningModules";

// University Admin Components
import UniversityAdminLayout from "@/layouts/UniversityAdminLayout";
import { 
  Dashboard as UniAdminDashboard,
  Students as UniAdminStudents,
  Invite as UniAdminInvite,
  Usage as UniAdminUsage,
  Settings as UniAdminSettings
} from "@/pages/university-admin";

// University Edition Layout
// Redirect component for /interviews → /application_tracker
function InterviewsRedirect() {
  const [, navigate] = useLocation();
  const queryParams = window.location.search;
  
  useEffect(() => {
    navigate(`/application_tracker${queryParams}`);
  }, [navigate, queryParams]);
  
  return <div className="p-8 text-center">Redirecting to Application Tracker...</div>;
}

function UniversityLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const isAdmin = user?.userType === 'university_admin';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center">
            <Link href="/university" className="mr-6 flex items-center space-x-2">
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
                      location === "/university/admin" ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    Admin Dashboard
                  </Link>
                  <Link
                    href="/university-admin"
                    className={`transition-colors hover:text-foreground/80 ${
                      location.startsWith("/university-admin") ? "text-foreground" : "text-foreground/60"
                    }`}
                  >
                    Admin Portal
                  </Link>
                </>
              )}
              <Link
                href="/university/study-plan"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/study-plan" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Study Plan
              </Link>
              <Link
                href="/university/learning"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/learning" ? "text-foreground" : "text-foreground/60"
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
              <div className="flex items-center space-x-1">
                <span className="text-sm text-foreground/60">{user.name}</span>
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="w-8 h-8 rounded-full" />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto py-6 px-4">{children}</main>
    </div>
  );
}

function App() {
  const [location, navigate] = useLocation();
  const isUniversityRoute = location.startsWith("/university") || location === "/university-dashboard";
  const isSignInRoute = location === "/sign-in";
  const isSignUpRoute = location === "/sign-up";
  const isAuthRoute = location === "/auth" || location.startsWith("/auth?");
  
  // Load the html2pdf.js library for PDF exports
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.defer = true;
    document.body.appendChild(script);
    
    return () => {
      // Clean up the script when component unmounts
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Always show public pages at public routes, regardless of authentication
  const isPublicRoute = ["/home", "/pricing", "/solutions", "/who-we-serve", "/sign-in", "/sign-up", "/admin-login", "/staff-login", "/staff-signup", "/auth-test"].includes(location);

  // Payment portal routes
  const isPaymentPortalRoute = location.startsWith("/payment-portal");
  const isCheckoutRoute = location.startsWith("/checkout");
  const isSubscriptionSuccessRoute = location === "/subscription-success";

  // Onboarding and plan selection routes
  const isOnboardingRoute = location === "/onboarding";
  const isPlanSelectionRoute = location === "/plan-selection";
  const isBillingCycleRoute = location.startsWith("/billing-cycle");

  // Authentication routes always take precedence
  if (isSignInRoute || isSignUpRoute || location === "/admin-login" || location === "/staff-login" || location === "/staff-signup") {
    return (
      <Switch>
        <Route path="/sign-in" component={SignIn} />
        <Route path="/sign-up" component={SignUp} />
        <Route path="/admin-login" component={AdminLogin} />
        <Route path="/staff-login" component={StaffLogin} />
        <Route path="/staff-signup" component={StaffSignup} />
      </Switch>
    );
  }

  // Only redirect root path to home if not trying to access an auth page
  if (location === "/" || location === "") {
    navigate("/home");
    return null;
  }

  // Payment Portal Routes with layout
  if (isPaymentPortalRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/payment-portal/:planType" component={PaymentPortal} />
        </Switch>
      </PublicLayout>
    );
  }

  // Checkout Route
  if (isCheckoutRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/checkout" component={Checkout} />
        </Switch>
      </PublicLayout>
    );
  }

  // Subscription Success Route
  if (isSubscriptionSuccessRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/subscription-success" component={SubscriptionSuccess} />
        </Switch>
      </PublicLayout>
    );
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
    );
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
    );
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
    );
  }

  // Use PublicLayout for public routes (excluding auth routes which are handled above)
  if (isPublicRoute) {
    return (
      <PublicLayout>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/home" component={Home} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/solutions" component={Solutions} />
          <Route path="/who-we-serve" component={WhoWeServe} />
          <Route path="/auth-test" component={AuthTest} />
        </Switch>
      </PublicLayout>
    );
  }

  const isAdminRoute = (location.startsWith("/admin") && location !== "/admin-login") || location === "/admin-dashboard";
  
  // University Admin routes check
  const isUniversityAdminRoute = location.startsWith("/university-admin");

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
      </Switch>
    );
  }

  // Admin Dashboard has its own layout
  if (isAdminRoute) {
    return (
      <Switch>
        <Route path="/admin-dashboard">
          <AdminRoute>
            <AdminDashboard />
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
        <Route path="/admin/universities">
          <AdminRoute>
            <UniversitiesPage />
          </AdminRoute>
        </Route>
        <Route path="/admin">
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        </Route>
      </Switch>
    );
  }

  const isStaffRoute = (location.startsWith("/staff") && location !== "/staff-login") || location === "/staff-dashboard";

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
    );
  }

  // Choose layout based on route
  const LayoutComponent = isUniversityRoute ? UniversityLayout : Layout;

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
        <Route path="/application_tracker">
          <CareerRoute>
            <Interview />
          </CareerRoute>
        </Route>
        
        {/* Redirect old /interviews path to the new /application_tracker path */}
        <Route path="/interviews">
          <CareerRoute>
            <InterviewsRedirect />
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
        <Route path="/linkedin-optimizer">
          <CareerRoute>
            <LinkedInOptimizer />
          </CareerRoute>
        </Route>
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
        <Route path="/voice-practice">
          <CareerRoute>
            <VoicePractice />
          </CareerRoute>
        </Route>
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
  );
}

// Import Providers
import { PendingTasksProvider } from '@/context/PendingTasksContext';
import { UpcomingInterviewsProvider } from '@/context/UpcomingInterviewsContext';
import { AuthProvider } from '@/hooks/use-auth';

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
  );
};

export default AppWithLoading;