import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';

interface UniversityAdminRouteGuardProps {
  children: ReactNode;
}

export function UniversityAdminRouteGuard({ children }: UniversityAdminRouteGuardProps) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // If loading is complete and user is not authenticated or not a university admin
    if (!isLoading && (!user || user.userType !== 'university_admin')) {
      // Redirect based on user type
      if (!user) {
        setLocation('/sign-in');
      } else {
        // For other user types, redirect to appropriate dashboards
        if (user.userType === 'admin') {
          setLocation('/admin');
        } else if (user.userType === 'staff') {
          setLocation('/staff');
        } else if (user.userType === 'university_student') {
          setLocation('/university/student');
        } else {
          setLocation('/dashboard');
        }
      }
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If not authenticated or not a university admin, return null (redirect will happen in useEffect)
  if (!user || user.userType !== 'university_admin') {
    return null;
  }
  
  return <>{children}</>;
}

export function UniversityAdminRoute({ children }: { children: ReactNode }) {
  return <UniversityAdminRouteGuard>{children}</UniversityAdminRouteGuard>;
}