import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useUser, useIsRegularUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: ReactNode;
  requiresAuth?: boolean;
}

export function RouteGuard({ children, requiresAuth = true }: RouteGuardProps) {
  const { user, isLoading } = useUser();
  const isRegularUser = useIsRegularUser();
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
  
  // For routes that should only be accessible to regular (non-university) users
  if (requiresAuth && user && !isRegularUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Feature Access</h1>
        <p className="text-xl mb-8">
          This feature is intended for regular users. University users have access to different features.
        </p>
        <button 
          onClick={() => setLocation('/university')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Go to University Dashboard
        </button>
      </div>
    );
  }
  
  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiresAuth>{children}</RouteGuard>;
}

export function PublicRoute({ children }: { children: ReactNode }) {
  return <RouteGuard requiresAuth={false}>{children}</RouteGuard>;
}