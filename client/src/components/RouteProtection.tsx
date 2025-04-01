import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useUser, useIsAdminUser, useIsUniversityUser, useIsStaffUser, useIsRegularUser } from '@/lib/useUserData';
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

// Career app-specific route guard
export function CareerRouteGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  const isRegularUser = useIsRegularUser();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user isn't logged in
  if (!user) {
    // Redirect to login
    setLocation('/sign-in');
    return null;
  }
  
  // Staff users should be redirected to their dashboard
  if (user.userType === 'staff') {
    setLocation('/staff');
    return null;
  }
  
  // Admins, university users, and regular users should have access to career features
  return <>{children}</>;
}

export function CareerRoute({ children }: { children: ReactNode }) {
  return <CareerRouteGuard>{children}</CareerRouteGuard>;
}

interface AdminRouteGuardProps {
  children: ReactNode;
}

export function AdminRouteGuard({ children }: AdminRouteGuardProps) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Strict check: only true admin users (userType === 'admin') can access admin dashboard
  // Not university admins or any other role
  if (!user || user.userType !== 'admin') {
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'staff') {
      setLocation('/staff');
    } else if (user.userType === 'university_admin' || user.userType === 'university_student') {
      setLocation('/university');
    } else {
      setLocation('/dashboard');
    }
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
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Allow university students and university admins to access university features
  if (!user || (user.userType !== 'university_student' && user.userType !== 'university_admin')) {
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'admin') {
      setLocation('/admin');
    } else if (user.userType === 'staff') {
      setLocation('/staff');
    } else {
      setLocation('/dashboard');
    }
    return null;
  }
  
  return <>{children}</>;
}

export function UniversityRoute({ children }: { children: ReactNode }) {
  return <UniversityRouteGuard>{children}</UniversityRouteGuard>;
}

interface StaffRouteGuardProps {
  children: ReactNode;
}

export function StaffRouteGuard({ children }: StaffRouteGuardProps) {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Allow both staff and admin users (since admins can see staff dashboards)
  if (!user || (user.userType !== 'staff' && user.userType !== 'admin')) {
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'university_admin' || user.userType === 'university_student') {
      setLocation('/university');
    } else {
      setLocation('/dashboard');
    }
    return null;
  }
  
  return <>{children}</>;
}

export function StaffRoute({ children }: { children: ReactNode }) {
  return <StaffRouteGuard>{children}</StaffRouteGuard>;
}

interface UniversityAdminRouteGuardProps {
  children: ReactNode;
}

export function UniversityAdminRouteGuard({ children }: UniversityAdminRouteGuardProps) {
  const { user, isLoading } = useUser();
  const isUniversityAdmin = user?.userType === 'university_admin';
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Only university admins (not regular university students) can access university admin features
  if (!user || !isUniversityAdmin) {
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'university_student') {
      setLocation('/university');
      // Show access denied message
      alert('You need university administrator privileges to access this section');
    } else if (user.userType === 'admin') {
      setLocation('/admin');
    } else if (user.userType === 'staff') {
      setLocation('/staff');
    } else {
      setLocation('/dashboard');
    }
    return null;
  }
  
  return <>{children}</>;
}

export function UniversityAdminRoute({ children }: { children: ReactNode }) {
  return <UniversityAdminRouteGuard>{children}</UniversityAdminRouteGuard>;
}