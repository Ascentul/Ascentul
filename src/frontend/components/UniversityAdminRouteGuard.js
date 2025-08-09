import { jsx as _jsx } from "react/jsx-runtime";
import { useUser, useIsUniversityAdmin } from '@/lib/useUserData';
import { Redirect, Route } from 'wouter';
import { Loader2 } from 'lucide-react';
/**
 * A route guard component that only allows university admin users to access the route.
 * Redirects to sign-in page if not authenticated or to the career dashboard if not a university admin.
 */
export default function UniversityAdminRouteGuard({ path, component: Component }) {
    const { user, isLoading } = useUser();
    const isUniversityAdmin = useIsUniversityAdmin();
    if (isLoading) {
        return (_jsx(Route, { path: path, children: _jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }) }));
    }
    // If not logged in, redirect to sign-in page
    if (!user) {
        return (_jsx(Route, { path: path, children: _jsx(Redirect, { to: "/sign-in" }) }));
    }
    // If logged in but not a university admin, redirect to career dashboard
    if (!isUniversityAdmin) {
        return (_jsx(Route, { path: path, children: _jsx(Redirect, { to: "/career-dashboard" }) }));
    }
    // If user is a university admin, render the component
    return (_jsx(Route, { path: path, children: _jsx(Component, {}) }));
}
