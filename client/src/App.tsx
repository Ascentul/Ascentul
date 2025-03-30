import { Switch, Route, useLocation } from "wouter";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Goals from "@/pages/Goals";
import Resume from "@/pages/Resume";
import CoverLetter from "@/pages/CoverLetter";
import Interview from "@/pages/Interview";
import WorkHistory from "@/pages/WorkHistory";
import Achievements from "@/pages/Achievements";
import AICoach from "@/pages/AICoach";
import Profile from "@/pages/Profile";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";

// Route Protection Components
import { ProtectedRoute, PublicRoute } from "@/components/RouteProtection";
import { 
  UniversityRouteGuard, 
  AdminRouteGuard, 
  StudentRouteGuard 
} from "@/components/university/UniversityRouteProtection";

// User data hooks
import { useUser, useIsUniversityAdmin } from "@/lib/useUserData";

// University Edition Components
import UniversityAdminDashboard from "@/pages/university/AdminDashboard";
import StudyPlan from "@/pages/university/StudyPlan";
import LearningModules from "@/pages/university/LearningModules";

// University Edition Layout
function UniversityLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user } = useUser();
  const isAdmin = user?.userType === 'university_admin';
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center">
            <a href="/university" className="mr-6 flex items-center space-x-2">
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
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              {isAdmin && (
                <a
                  href="/university/admin"
                  className={`transition-colors hover:text-foreground/80 ${
                    location === "/university/admin" ? "text-foreground" : "text-foreground/60"
                  }`}
                >
                  Admin Dashboard
                </a>
              )}
              <a
                href="/university/study-plan"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/study-plan" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Study Plan
              </a>
              <a
                href="/university/learning"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/learning" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Learning Modules
              </a>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => window.location.href = '/'}
              className="flex items-center space-x-1 text-sm font-medium px-3 py-1.5 rounded-md border border-foreground/20 bg-background hover:bg-background/80 transition-colors"
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
            </button>
            
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
  const [location] = useLocation();
  const isUniversityRoute = location.startsWith("/university");
  const isAuthRoute = location === "/auth";

  // Skip layout for auth route
  if (isAuthRoute) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
      </Switch>
    );
  }

  // Choose layout based on route
  const LayoutComponent = isUniversityRoute ? UniversityLayout : Layout;

  return (
    <LayoutComponent>
      <Switch>
        {/* Authentication Route */}
        <Route path="/auth" component={AuthPage} />
        
        {/* Career App Routes - Protected for regular users */}
        <Route path="/">
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        </Route>
        <Route path="/goals">
          <ProtectedRoute>
            <Goals />
          </ProtectedRoute>
        </Route>
        <Route path="/resume">
          <ProtectedRoute>
            <Resume />
          </ProtectedRoute>
        </Route>
        <Route path="/cover-letter">
          <ProtectedRoute>
            <CoverLetter />
          </ProtectedRoute>
        </Route>
        <Route path="/interviews">
          <ProtectedRoute>
            <Interview />
          </ProtectedRoute>
        </Route>
        <Route path="/work-history">
          <ProtectedRoute>
            <WorkHistory />
          </ProtectedRoute>
        </Route>
        <Route path="/achievements">
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        </Route>
        <Route path="/ai-coach">
          <ProtectedRoute>
            <AICoach />
          </ProtectedRoute>
        </Route>
        <Route path="/profile">
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        </Route>
        
        {/* University Edition Routes - Protected for university users */}
        <Route path="/university">
          <StudentRouteGuard>
            <LearningModules />
          </StudentRouteGuard>
        </Route>
        <Route path="/university/admin">
          <AdminRouteGuard>
            <UniversityAdminDashboard />
          </AdminRouteGuard>
        </Route>
        <Route path="/university/study-plan">
          <StudentRouteGuard>
            <StudyPlan />
          </StudentRouteGuard>
        </Route>
        <Route path="/university/learning">
          <StudentRouteGuard>
            <LearningModules />
          </StudentRouteGuard>
        </Route>
        
        {/* 404 Route */}
        <Route component={NotFound} />
      </Switch>
    </LayoutComponent>
  );
}

export default App;
