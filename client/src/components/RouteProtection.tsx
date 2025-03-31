import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useUser, useIsAdminUser, useIsUniversityUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
}

export function RouteGuard({ children, requiresAuth = true }: RouteGuardProps) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If auth is required and user isn't logged in
  if (requiresAuth && !user) {
    // Redirect to login
    setLocation('/sign-in');
    return null;
  }
  
  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiresAuth>{children}</RouteGuard>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiresAuth={false}>{children}</RouteGuard>;
}

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoading } = useUser();
  const isAdmin = useIsAdminUser();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user isn't logged in or isn't an admin
  if (!user || !isAdmin) {
    // Redirect to dashboard
    setLocation('/dashboard');
    return null;
  }
  
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return <AdminRouteGuard>{children}</AdminRouteGuard>;
}

interface UniversityRouteGuardProps {
  children: ReactNode;
}

export function UniversityRouteGuard({ children }: UniversityRouteGuardProps) {
  const { user, isLoading } = useUser();
  const isUnivUser = useIsUniversityUser();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user isn't logged in or isn't a university user
  if (!user || !isUnivUser) {
    // Redirect to dashboard
    setLocation('/dashboard');
    return null;
  }
  
  return <>{children}</>;
}

export function UniversityRoute({ children }: { children: ReactNode }) {
  return <UniversityRouteGuard>{children}</UniversityRouteGuard>;
}