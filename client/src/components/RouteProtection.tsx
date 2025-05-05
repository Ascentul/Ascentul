import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { 
  useUser, 
  useIsAdminUser, 
  useIsSystemAdmin,
  useIsUniversityUser, 
  useIsStaffUser, 
  useIsRegularUser 
} from '@/lib/useUserData';
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
  // Check both role and userType fields
  if (user.role === 'staff' || user.userType === 'staff') {
    console.log("Career route check - redirecting staff user to staff dashboard. Role:", user.role, "Type:", user.userType);
    setLocation('/staff-dashboard');
    return null;
  }
  
  // Admins, university users, and regular users should have access to career features
  console.log("Career route access granted for user with role:", user.role, "type:", user.userType);
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
  const isSystemAdmin = useIsSystemAdmin();
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Explicit check for super_admin role directly, then use helper function
  if (!user || !(user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin')) {
    console.log("Admin route check failed - redirecting. User role:", user?.role, "User type:", user?.userType);
    
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'staff') {
      setLocation('/staff-dashboard');
    } else if (user.userType === 'university_admin' || user.userType === 'university_student') {
      setLocation('/university-admin/dashboard');
    } else {
      setLocation('/career-dashboard');
    }
    return null;
  }
  
  // If we got here, the user is an admin
  console.log("Admin route access granted for user with role:", user?.role, "type:", user?.userType);
  
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
  // Check both role and userType fields
  if (!user || (
    user.role !== 'university_user' && 
    user.role !== 'university_admin' && 
    user.userType !== 'university_student' && 
    user.userType !== 'university_admin'
  )) {
    console.log("University route check failed - redirecting. User role:", user?.role, "User type:", user?.userType);
    
    // Redirect based on user type and role
    if (!user) {
      setLocation('/sign-in');
    } else if (user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin') {
      setLocation('/admin');
    } else if (user.role === 'staff' || user.userType === 'staff') {
      setLocation('/staff-dashboard');
    } else {
      setLocation('/career-dashboard');
    }
    return null;
  }
  
  console.log("University route access granted for user with role:", user?.role, "type:", user?.userType);
  
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
  
  // Check both role and userType fields for staff and admin permissions
  if (!user || !(
    user.role === 'staff' || 
    user.role === 'admin' || 
    user.role === 'super_admin' || 
    user.userType === 'staff' || 
    user.userType === 'admin'
  )) {
    console.log("Staff route check failed - redirecting. User role:", user?.role, "User type:", user?.userType);
    
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'university_admin' || user.userType === 'university_student') {
      setLocation('/university-dashboard');
    } else {
      setLocation('/career-dashboard');
    }
    return null;
  }
  
  // If we got here, the user has staff access
  console.log("Staff route access granted for user with role:", user?.role, "type:", user?.userType);
  
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
  // Remove the isUniversityAdmin variable as we'll check both role and userType directly
  const [, setLocation] = useLocation();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Check both role and userType fields for university admin permissions
  if (!user || !(user.role === 'university_admin' || user.userType === 'university_admin')) {
    console.log("University admin route check failed - redirecting. User role:", user?.role, "User type:", user?.userType);
    
    // Redirect based on user type
    if (!user) {
      setLocation('/sign-in');
    } else if (user.userType === 'university_student') {
      setLocation('/university-dashboard');
      // Show access denied message
      alert('You need university administrator privileges to access this section');
    } else if (user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin') {
      setLocation('/admin-dashboard');
    } else if (user.role === 'staff' || user.userType === 'staff') {
      setLocation('/staff-dashboard');
    } else {
      setLocation('/career-dashboard');
    }
    return null;
  }
  
  // If we got here, the user has university admin access
  console.log("University admin route access granted for user with role:", user?.role, "type:", user?.userType);
  
  return <>{children}</>;
}

export function UniversityAdminRoute({ children }: { children: ReactNode }) {
  // We now have a separate UniversityAdminRouteGuard component
  // Make sure this route is actually guarded
  return <UniversityAdminRouteGuard>{children}</UniversityAdminRouteGuard>;
}