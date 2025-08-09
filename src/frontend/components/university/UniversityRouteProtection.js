import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useLocation } from 'wouter';
import { useIsUniversityUser, useIsUniversityAdmin } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
import { useUser } from '@/lib/useUserData';
export function UniversityRouteGuard({ children, requiresAdmin = false }) {
    const { user, isLoading } = useUser();
    const isUniversityUser = useIsUniversityUser();
    const isUniversityAdmin = useIsUniversityAdmin();
    const [, setLocation] = useLocation();
    if (isLoading) {
        return (_jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    // Not logged in
    if (!user) {
        // Redirect to login (fixed: using sign-in instead of auth which doesn't exist)
        setLocation('/sign-in');
        return null;
    }
    // For admin-only features
    if (requiresAdmin && !isUniversityAdmin) {
        return (_jsxs("div", { className: "min-h-screen flex flex-col items-center justify-center p-4", children: [_jsx("h1", { className: "text-4xl font-bold mb-4", children: "Admin Access Required" }), _jsx("p", { className: "text-xl mb-8", children: "This section is only available to university administrators." }), _jsx("button", { onClick: () => setLocation('/university'), className: "px-4 py-2 bg-primary text-primary-foreground rounded-md", children: "Return to University Dashboard" })] }));
    }
    return _jsx(_Fragment, { children: children });
}
export function AdminRouteGuard({ children }) {
    return _jsx(UniversityRouteGuard, { requiresAdmin: true, children: children });
}
export function StudentRouteGuard({ children }) {
    return _jsx(UniversityRouteGuard, { children: children });
}
