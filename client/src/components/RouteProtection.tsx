import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
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
    setLocation('/auth');
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