import { jsx as _jsx } from "react/jsx-runtime";
import { Route, Redirect } from 'wouter';
import { useUser, useIsStaffUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
export default function StaffRoute({ path, children }) {
    const { isLoading } = useUser();
    const isStaff = useIsStaffUser();
    if (isLoading) {
        return (_jsx(Route, { path: path, children: _jsx("div", { className: "flex items-center justify-center min-h-screen", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }) }));
    }
    if (!isStaff) {
        return (_jsx(Route, { path: path, children: _jsx(Redirect, { to: "/staff-login" }) }));
    }
    return _jsx(Route, { path: path, children: children });
}
