import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useIsUniversityUser, useIsUniversityStudent, useIsUniversityAdmin } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/useUserData';

interface UniversityRouteGuardProps {
  children: ReactNode;
  requiresAdmin?: boolean;
}

export function UniversityRouteGuard({ children, requiresAdmin = false }: UniversityRouteGuardProps) {
  const { user, isLoading } = useUser();
  const isUniversityUser = useIsUniversityUser();
  const isUniversityAdmin = useIsUniversityAdmin();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not logged in
  if (!user) {
    // Redirect to login (fixed: using sign-in instead of auth which doesn't exist)
    setLocation('/sign-in'); 
    return null;
  }

  // For admin-only features
  if (requiresAdmin && !isUniversityAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">Admin Access Required</h1>
        <p className="text-xl mb-8">
          This section is only available to university administrators.
        </p>
        <button 
          onClick={() => setLocation('/university')}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Return to University Dashboard
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export function AdminRouteGuard({ children }: { children: ReactNode }) {
  return <UniversityRouteGuard requiresAdmin>{children}</UniversityRouteGuard>;
}

export function StudentRouteGuard({ children }: { children: ReactNode }) {
  return <UniversityRouteGuard>{children}</UniversityRouteGuard>;
}