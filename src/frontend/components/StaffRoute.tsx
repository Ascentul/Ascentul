import { ReactNode } from 'react';
import { Route, Redirect } from 'wouter';
import { useUser, useIsStaffUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';

interface StaffRouteProps {
  path: string;
  children: ReactNode;
}

export default function StaffRoute({ path, children }: StaffRouteProps) {
  const { isLoading } = useUser();
  const isStaff = useIsStaffUser();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!isStaff) {
    return (
      <Route path={path}>
        <Redirect to="/staff-login" />
      </Route>
    );
  }

  return <Route path={path}>{children}</Route>;
}