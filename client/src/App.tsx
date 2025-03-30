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
import NotFound from "@/pages/not-found";

// University Edition Components
import UniversityAdminDashboard from "@/pages/university/AdminDashboard";
import StudyPlan from "@/pages/university/StudyPlan";
import LearningModules from "@/pages/university/LearningModules";

// Mock University Edition Layout
function UniversityLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
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
                <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
              </svg>
              <span className="font-bold">University Edition</span>
            </a>
            <nav className="flex items-center space-x-6 text-sm font-medium">
              <a
                href="/university/admin"
                className={`transition-colors hover:text-foreground/80 ${
                  location === "/university/admin" ? "text-foreground" : "text-foreground/60"
                }`}
              >
                Admin Dashboard
              </a>
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
              <a
                href="/"
                className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                Back to Career App
              </a>
            </nav>
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  const isUniversityRoute = location.startsWith("/university");

  // Choose layout based on route
  const LayoutComponent = isUniversityRoute ? UniversityLayout : Layout;

  return (
    <LayoutComponent>
      <Switch>
        {/* Career App Routes */}
        <Route path="/" component={Dashboard} />
        <Route path="/goals" component={Goals} />
        <Route path="/resume" component={Resume} />
        <Route path="/cover-letter" component={CoverLetter} />
        <Route path="/interviews" component={Interview} />
        <Route path="/work-history" component={WorkHistory} />
        <Route path="/achievements" component={Achievements} />
        <Route path="/ai-coach" component={AICoach} />
        <Route path="/profile" component={Profile} />
        
        {/* University Edition Routes */}
        <Route path="/university" component={LearningModules} />
        <Route path="/university/admin" component={UniversityAdminDashboard} />
        <Route path="/university/study-plan" component={StudyPlan} />
        <Route path="/university/learning" component={LearningModules} />
        
        {/* 404 Route */}
        <Route component={NotFound} />
      </Switch>
    </LayoutComponent>
  );
}

export default App;
