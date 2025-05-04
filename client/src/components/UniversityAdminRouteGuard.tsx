import { useUser, useIsUniversityAdmin } from '@/lib/useUserData';
import { Redirect, Route, useLocation } from 'wouter';
import { Loader2 } from 'lucide-react';

type UniversityAdminRouteGuardProps = {
  path: string;
  component: React.ComponentType;
};

/**
 * A route guard component that only allows university admin users to access the route.
 * Redirects to sign-in page if not authenticated or to the career dashboard if not a university admin.
 */
export default function UniversityAdminRouteGuard({ 
  path, 
  component: Component 
}: UniversityAdminRouteGuardProps) {
  const { user, isLoading } = useUser();
  const isUniversityAdmin = useIsUniversityAdmin();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  // If not logged in, redirect to sign-in page
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/sign-in" />
      </Route>
    );
  }

  // If logged in but not a university admin, redirect to career dashboard
  if (!isUniversityAdmin) {
    return (
      <Route path={path}>
        <Redirect to="/career-dashboard" />
      </Route>
    );
  }

  // If user is a university admin, render the component
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}