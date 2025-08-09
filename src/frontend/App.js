import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useEffect } from "react";
import { Switch, Route, useLocation, Link } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Goals from "@/pages/Goals";
import Resume from "@/pages/Resume";
import PdfTestPage from "@/pages/PdfTestPage";
import CoverLetter from "@/pages/CoverLetter";
import Interview from "@/pages/Interview";
import WorkHistory from "@/pages/WorkHistory";
import EducationHistory from "@/pages/EducationHistory";
import Achievements from "@/pages/Achievements";
import AICoach from "@/pages/AICoach";
// LinkedIn Optimizer removed
import CareerPathExplorer from "@/pages/CareerPathExplorer";
import Projects from "@/pages/Projects";
import CanvaEditor from "@/pages/CanvaEditor";
import Profile from "@/pages/Profile";
import AccountSettings from "@/pages/AccountSettings";
// SkillStacker removed
import Apply from "@/pages/Apply";
import CareerProfile from "@/pages/CareerProfile";
import Contacts from "@/pages/Contacts";
// Voice Interview Practice removed
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import ForgotPassword from "@/pages/forgot-password";
import ResetPassword from "@/pages/reset-password";
import AuthCallback from "@/pages/auth/callback";
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
import UniversitiesPage from "@/pages/admin/universities";
import TestEmailPage from "@/pages/admin/test-email";
import UserManagement from "@/pages/admin/UserManagement";
import AnalyticsPage from "@/pages/admin/AnalyticsPage";
import BillingPage from "@/pages/admin/BillingPage";
import ReviewsPage from "@/pages/admin/ReviewsPage";
import AdminSettingsTab from "@/pages/admin/AdminSettingsTab";
import SystemSecurity from "@/pages/admin/SystemSecurity";
// Staff Pages
import StaffDashboard from "@/pages/staff/Dashboard";
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
import { ProtectedRoute, AdminRoute, UniversityRoute, UniversityAdminRoute, StaffRoute, CareerRoute } from "@/components/RouteProtection";
// Import the university admin route guard
import UniversityAdminRouteGuard from "@/components/UniversityAdminRouteGuard";
// User data hooks
import { useUser } from "@/lib/useUserData";
// University Edition Components
import UniversityAdminDashboard from "@/pages/university/AdminDashboard";
import StudyPlan from "@/pages/university/StudyPlan";
import LearningModules from "@/pages/university/LearningModules";
// University Admin Components
import UniversityAdminLayout from "@/layouts/UniversityAdminLayout";
import { Dashboard as UniAdminDashboard, Students as UniAdminStudents, Invite as UniAdminInvite, Usage as UniAdminUsage, Settings as UniAdminSettings, Support as UniAdminSupport } from "@/pages/university-admin";
// University Edition Layout
function UniversityLayout({ children }) {
    const [location] = useLocation();
    const { user, logout } = useUser();
    const isAdmin = user?.userType === "university_admin";
    return (_jsxs("div", { className: "min-h-screen bg-background", children: [_jsx("header", { className: "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur", children: _jsxs("div", { className: "container flex h-14 items-center justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Link, { href: "/university", className: "mr-6 flex items-center space-x-2", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-6 w-6", children: [_jsx("path", { d: "M22 10v6M2 10l10-5 10 5-10 5z" }), _jsx("path", { d: "M6 12v5c3 3 9 3 12 0v-5" })] }), _jsx("span", { className: "font-bold", children: "University Edition" })] }), _jsxs("nav", { className: "flex items-center space-x-6 text-sm font-medium", children: [isAdmin && (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/university/admin", className: `transition-colors hover:text-foreground/80 ${location === "/university/admin"
                                                        ? "text-foreground"
                                                        : "text-foreground/60"}`, children: "Admin Dashboard" }), _jsx(Link, { href: "/university-admin", className: `transition-colors hover:text-foreground/80 ${location.startsWith("/university-admin")
                                                        ? "text-foreground"
                                                        : "text-foreground/60"}`, children: "Admin Portal" })] })), _jsx(Link, { href: "/university/study-plan", className: `transition-colors hover:text-foreground/80 ${location === "/university/study-plan"
                                                ? "text-foreground"
                                                : "text-foreground/60"}`, children: "Study Plan" }), _jsx(Link, { href: "/university/learning", className: `transition-colors hover:text-foreground/80 ${location === "/university/learning"
                                                ? "text-foreground"
                                                : "text-foreground/60"}`, children: "Learning Modules" })] })] }), _jsxs("div", { className: "flex items-center space-x-4", children: [_jsxs(Link, { href: "/career-dashboard", className: "flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-md border border-foreground/20 bg-background hover:bg-background/80 transition-colors cursor-pointer", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4", children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }), _jsx("span", { children: "Career App" })] }), user && (_jsxs("div", { className: "relative group", children: [_jsxs("button", { className: "flex items-center space-x-2 text-sm font-medium px-3 py-1.5 rounded-md hover:bg-foreground/5 transition-colors", children: [_jsx("span", { className: "text-foreground/80", children: user.name }), _jsx("div", { className: "w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold", children: user.profileImage ? (_jsx("img", { src: user.profileImage, alt: user.name, className: "w-8 h-8 rounded-full object-cover" })) : (user.name.charAt(0).toUpperCase()) }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 text-foreground/60", children: _jsx("path", { d: "m6 9 6 6 6-6" }) })] }), _jsx("div", { className: "absolute right-0 top-full mt-1 w-48 bg-background border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50", children: _jsxs("div", { className: "p-2", children: [_jsx("div", { className: "px-3 py-2 text-xs text-muted-foreground border-b border-border mb-1", children: user.email }), _jsxs(Link, { href: "/profile", className: "flex items-center px-3 py-2 text-sm text-foreground hover:bg-foreground/5 rounded-sm transition-colors", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2", children: [_jsx("path", { d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }), _jsx("circle", { cx: "12", cy: "7", r: "4" })] }), "Profile"] }), _jsxs(Link, { href: "/account", className: "flex items-center px-3 py-2 text-sm text-foreground hover:bg-foreground/5 rounded-sm transition-colors", children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2", children: _jsx("path", { d: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l11 11z" }) }), "Settings"] }), _jsx("hr", { className: "my-1 border-border" }), _jsxs("button", { onClick: () => logout(), className: "flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-sm transition-colors", children: [_jsxs("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", className: "h-4 w-4 mr-2", children: [_jsx("path", { d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }), _jsx("polyline", { points: "16,17 21,12 16,7" }), _jsx("line", { x1: "21", y1: "12", x2: "9", y2: "12" })] }), "Sign out"] })] }) })] }))] })] }) }), _jsx("main", { className: "container mx-auto py-6 px-4", children: children })] }));
}
// Import Admin Layout
import AdminLayout from "@/layouts/AdminLayout";
function App() {
    const [location, navigate] = useLocation();
    const isUniversityRoute = location.startsWith("/university") || location === "/university-dashboard";
    const isSignInRoute = location === "/sign-in";
    const isSignUpRoute = location === "/sign-up";
    // Remove auth route check since this route doesn't exist (using sign-in instead)
    // const isAuthRoute = location === "/auth" || location.startsWith("/auth?");
    // Load the html2pdf.js library for PDF exports
    useEffect(() => {
        const script = document.createElement("script");
        script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
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
    ].includes(location);
    // Payment portal routes
    const isPaymentPortalRoute = location.startsWith("/payment-portal");
    const isCheckoutRoute = location.startsWith("/checkout");
    const isSubscriptionSuccessRoute = location === "/subscription-success";
    // Onboarding and plan selection routes
    const isOnboardingRoute = location === "/onboarding";
    const isPlanSelectionRoute = location === "/plan-selection";
    const isBillingCycleRoute = location.startsWith("/billing-cycle");
    // Root path redirects to sign-in using useEffect to avoid render loop
    useEffect(() => {
        if (location === "/") {
            navigate("/sign-in");
        }
    }, [location, navigate]);
    // Special fix for super admin redirect issue - always ensure super_admin users go to /admin
    const { user } = useUser();
    useEffect(() => {
        // If a user with super_admin role is detected on a non-admin route, redirect them
        if (user &&
            user.role === "super_admin" &&
            location === "/career-dashboard") {
            console.log("SUPER ADMIN FIX: Detected super_admin at incorrect route, redirecting to /admin");
            navigate("/admin");
        }
    }, [user, location, navigate]);
    // Authentication routes always take precedence
    if (isSignInRoute ||
        isSignUpRoute ||
        location === "/forgot-password" ||
        location === "/reset-password" ||
        location === "/auth/callback" ||
        location === "/admin-login" ||
        location === "/staff-login" ||
        location === "/staff-signup") {
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/sign-in", component: SignIn }), _jsx(Route, { path: "/sign-up", component: SignUp }), _jsx(Route, { path: "/forgot-password", component: ForgotPassword }), _jsx(Route, { path: "/reset-password", component: ResetPassword }), _jsx(Route, { path: "/auth/callback", component: AuthCallback }), _jsx(Route, { path: "/admin-login", component: AdminLogin }), _jsx(Route, { path: "/staff-login", component: StaffLogin }), _jsx(Route, { path: "/staff-signup", component: StaffSignup })] }));
    }
    // Root redirect is handled above
    // Payment Portal Routes with layout
    if (isPaymentPortalRoute) {
        return (_jsx(PublicLayout, { children: _jsx(Switch, { children: _jsx(Route, { path: "/payment-portal/:planType", component: PaymentPortal }) }) }));
    }
    // Checkout Route
    if (isCheckoutRoute) {
        return (_jsx(PublicLayout, { children: _jsx(Switch, { children: _jsx(Route, { path: "/checkout", component: Checkout }) }) }));
    }
    // Subscription Success Route
    if (isSubscriptionSuccessRoute) {
        return (_jsx(PublicLayout, { children: _jsx(Switch, { children: _jsx(Route, { path: "/subscription-success", component: SubscriptionSuccess }) }) }));
    }
    // Onboarding Flow Route
    if (isOnboardingRoute) {
        return (_jsx(Switch, { children: _jsx(Route, { path: "/onboarding", children: _jsx(ProtectedRoute, { children: _jsx(OnboardingFlow, {}) }) }) }));
    }
    // Plan Selection Route
    if (isPlanSelectionRoute) {
        return (_jsx(Switch, { children: _jsx(Route, { path: "/plan-selection", children: _jsx(ProtectedRoute, { children: _jsx(PlanSelection, {}) }) }) }));
    }
    // Billing Cycle Route
    if (isBillingCycleRoute) {
        return (_jsx(Switch, { children: _jsx(Route, { path: "/billing-cycle", children: _jsx(ProtectedRoute, { children: _jsx(BillingCycle, {}) }) }) }));
    }
    // Use PublicLayout for public routes (excluding auth routes which are handled above)
    if (isPublicRoute) {
        return (_jsx(PublicLayout, { children: _jsxs(Switch, { children: [_jsx(Route, { path: "/", component: SignIn }), _jsx(Route, { path: "/home", component: Home }), _jsx(Route, { path: "/pricing", component: Pricing }), _jsx(Route, { path: "/solutions", component: Solutions }), _jsx(Route, { path: "/who-we-serve", component: WhoWeServe }), _jsx(Route, { path: "/forgot-password", component: ForgotPassword }), _jsx(Route, { path: "/reset-password", component: ResetPassword }), _jsx(Route, { path: "/auth/callback", component: AuthCallback }), _jsx(Route, { path: "/auth-test", component: AuthTest })] }) }));
    }
    // Define admin routes with the canonical /admin path
    const isAdminRoute = location.startsWith("/admin") && location !== "/admin-login";
    // University Admin routes check
    const isUniversityAdminRoute = location.startsWith("/university-admin");
    // University Admin Dashboard has its own layout
    if (isUniversityAdminRoute) {
        return (_jsxs(Switch, { children: [_jsx(UniversityAdminRouteGuard, { path: "/university-admin/dashboard", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminDashboard, {}) })) }), _jsx(UniversityAdminRouteGuard, { path: "/university-admin", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminDashboard, {}) })) }), _jsx(UniversityAdminRouteGuard, { path: "/university-admin/students", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminStudents, {}) })) }), _jsx(UniversityAdminRouteGuard, { path: "/university-admin/invite", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminInvite, {}) })) }), _jsx(UniversityAdminRouteGuard, { path: "/university-admin/usage", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminUsage, {}) })) }), _jsx(UniversityAdminRouteGuard, { path: "/university-admin/settings", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminSettings, {}) })) }), _jsx(UniversityAdminRouteGuard, { path: "/university-admin/support", component: () => (_jsx(UniversityAdminLayout, { children: _jsx(UniAdminSupport, {}) })) })] }));
    }
    // Admin Dashboard has its own layout
    if (isAdminRoute) {
        return (_jsx(AdminLayout, { children: _jsxs(Switch, { children: [_jsx(Route, { path: "/admin-dashboard", children: () => {
                            // Use useEffect to perform the redirect
                            React.useEffect(() => {
                                navigate("/admin");
                            }, []);
                            return null;
                        } }), _jsx(Route, { path: "/admin/universities", children: _jsx(AdminRoute, { children: _jsx(UniversitiesPage, {}) }) }), _jsx(Route, { path: "/admin/users", children: _jsx(AdminRoute, { children: _jsx(UserManagement, {}) }) }), _jsx(Route, { path: "/admin/analytics", children: _jsx(AdminRoute, { children: _jsx(AnalyticsPage, {}) }) }), _jsx(Route, { path: "/admin/reviews", children: _jsx(AdminRoute, { children: _jsx(ReviewsPage, {}) }) }), _jsx(Route, { path: "/admin/support", children: _jsx(AdminRoute, { children: _jsx(SupportPage, {}) }) }), _jsx(Route, { path: "/admin/support/:id", children: _jsx(AdminRoute, { children: _jsx(SupportPage, {}) }) }), _jsx(Route, { path: "/admin/models", children: _jsx(AdminRoute, { children: _jsx(AdminModelsPage, {}) }) }), _jsx(Route, { path: "/admin/openai-logs", children: _jsx(AdminRoute, { children: _jsx(AdminOpenAILogsPage, {}) }) }), _jsx(Route, { path: "/admin/email", children: _jsx(AdminRoute, { children: _jsx(EmailAdmin, {}) }) }), _jsx(Route, { path: "/admin/test-email", children: _jsx(AdminRoute, { children: _jsx(TestEmailPage, {}) }) }), _jsx(Route, { path: "/admin/billing", children: _jsx(AdminRoute, { children: _jsx(BillingPage, {}) }) }), _jsx(Route, { path: "/admin/settings", children: _jsx(AdminRoute, { children: _jsx(AdminSettingsTab, {}) }) }), _jsx(Route, { path: "/admin/system-security", children: _jsx(AdminRoute, { children: _jsx(SystemSecurity, {}) }) }), _jsx(Route, { path: "/admin", children: _jsx(AdminRoute, { children: _jsx(AdminDashboard, {}) }) })] }) }));
    }
    const isStaffRoute = (location.startsWith("/staff") && location !== "/staff-login") ||
        location === "/staff-dashboard";
    // Staff Dashboard has its own layout
    if (isStaffRoute) {
        return (_jsxs(Switch, { children: [_jsx(Route, { path: "/staff-dashboard", children: _jsx(StaffRoute, { children: _jsx(StaffDashboard, {}) }) }), _jsx(Route, { path: "/staff", children: _jsx(StaffRoute, { children: _jsx(StaffDashboard, {}) }) })] }));
    }
    // Choose layout based on route
    const LayoutComponent = isUniversityRoute ? UniversityLayout : Layout;
    return (_jsx(LayoutComponent, { children: _jsxs(Switch, { children: [_jsx(Route, { path: "/career-dashboard", children: _jsx(CareerRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/dashboard", children: _jsx(CareerRoute, { children: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/goals", children: _jsx(CareerRoute, { children: _jsx(Goals, {}) }) }), _jsx(Route, { path: "/resume", children: _jsx(CareerRoute, { children: _jsx(Resume, {}) }) }), _jsx(Route, { path: "/pdf-test", children: _jsx(CareerRoute, { children: _jsx(PdfTestPage, {}) }) }), _jsx(Route, { path: "/cover-letter", children: _jsx(CareerRoute, { children: _jsx(CoverLetter, {}) }) }), _jsx(Route, { path: "/cover-letters", children: _jsx(CareerRoute, { children: _jsx(CoverLetter, {}) }) }), _jsx(Route, { path: "/apply", children: _jsx(CareerRoute, { children: _jsx(Apply, {}) }) }), _jsx(Route, { path: "/application-tracker", children: _jsx(CareerRoute, { children: _jsx(Interview, {}) }) }), _jsx(Route, { path: "/work-history", children: _jsx(CareerRoute, { children: _jsx(WorkHistory, {}) }) }), _jsx(Route, { path: "/education-history", children: _jsx(CareerRoute, { children: _jsx(EducationHistory, {}) }) }), _jsx(Route, { path: "/achievements", children: _jsx(CareerRoute, { children: _jsx(Achievements, {}) }) }), _jsx(Route, { path: "/ai-coach", children: _jsx(CareerRoute, { children: _jsx(AICoach, {}) }) }), _jsx(Route, { path: "/career-path-explorer", children: _jsx(CareerRoute, { children: _jsx(CareerPathExplorer, {}) }) }), _jsx(Route, { path: "/projects", children: _jsx(CareerRoute, { children: _jsx(Projects, {}) }) }), _jsx(Route, { path: "/career-profile", children: _jsx(CareerRoute, { children: _jsx(CareerProfile, {}) }) }), _jsx(Route, { path: "/contacts", children: _jsx(CareerRoute, { children: _jsx(Contacts, {}) }) }), _jsx(Route, { path: "/canva-editor", children: _jsx(CareerRoute, { children: _jsx(CanvaEditor, {}) }) }), _jsx(Route, { path: "/profile", children: _jsx(CareerRoute, { children: _jsx(Profile, {}) }) }), _jsx(Route, { path: "/account", children: _jsx(CareerRoute, { children: _jsx(AccountSettings, {}) }) }), _jsx(Route, { path: "/university-dashboard", children: _jsx(UniversityRoute, { children: _jsx(LearningModules, {}) }) }), _jsx(Route, { path: "/university", children: _jsx(UniversityRoute, { children: _jsx(LearningModules, {}) }) }), _jsx(Route, { path: "/university/admin", children: _jsx(UniversityAdminRoute, { children: _jsx(UniversityAdminDashboard, {}) }) }), _jsx(Route, { path: "/university/study-plan", children: _jsx(UniversityRoute, { children: _jsx(StudyPlan, {}) }) }), _jsx(Route, { path: "/university/learning", children: _jsx(UniversityRoute, { children: _jsx(LearningModules, {}) }) }), _jsx(Route, { component: NotFound })] }) }));
}
// Import Providers
import { PendingTasksProvider } from "@/context/PendingTasksContext";
import { UpcomingInterviewsProvider } from "@/context/UpcomingInterviewsContext";
import { AuthProvider } from "@/hooks/use-auth";
// Wrap the app with all providers
const AppWithLoading = () => {
    return (_jsx(LoadingProvider, { children: _jsx(AuthProvider, { children: _jsx(PendingTasksProvider, { children: _jsxs(UpcomingInterviewsProvider, { children: [_jsx(ScrollToTop, {}), _jsx(App, {})] }) }) }) }));
};
export default AppWithLoading;
