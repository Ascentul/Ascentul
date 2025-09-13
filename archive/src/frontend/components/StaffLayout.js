import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useUser } from '@/lib/useUserData';
import { useLocation } from 'wouter';
import { Loader2, Menu, Search, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'wouter';
// Navigation items for staff portal sidebar
const navigationItems = [
    { name: 'Dashboard', href: '/staff', icon: 'grid' },
    { name: 'User Management', href: '/staff/users', icon: 'users' },
    { name: 'Support Tickets', href: '/staff/support', icon: 'life-buoy' },
    { name: 'Content Manager', href: '/staff/content', icon: 'file-text' },
    { name: 'Analytics', href: '/staff/analytics', icon: 'bar-chart' },
    { name: 'Notifications', href: '/staff/notifications', icon: 'bell' },
    { name: 'Knowledge Base', href: '/staff/knowledge', icon: 'book-open' },
    { name: 'System Health', href: '/staff/system', icon: 'activity' },
    { name: 'Broadcast Messages', href: '/staff/broadcast', icon: 'send' },
    { name: 'Maintenance Mode', href: '/staff/maintenance', icon: 'tool' },
    { name: 'Staff Settings', href: '/staff/settings', icon: 'settings' },
    { name: 'Staff Profile', href: '/staff/profile', icon: 'user' },
];
export default function StaffLayout({ children }) {
    const { user, isLoading, logout } = useUser();
    const [location] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    // If no user or not a staff/admin, show access denied
    // Check both role and userType fields for consistent authorization
    if (!user || !(user.role === 'staff' ||
        user.role === 'admin' ||
        user.role === 'super_admin' ||
        user.userType === 'staff' ||
        user.userType === 'admin')) {

        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Access Denied" }), _jsx("p", { className: "mb-4", children: "You don't have permission to access the staff portal." }), _jsx(Button, { onClick: () => window.location.href = '/sign-in', children: "Return to Login" })] }));
    }

    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsx("div", { className: "lg:hidden fixed top-4 left-4 z-50", children: _jsx(Button, { variant: "outline", size: "icon", onClick: () => setIsSidebarOpen(!isSidebarOpen), className: "bg-white shadow-md", children: isSidebarOpen ? _jsx(X, { size: 20 }) : _jsx(Menu, { size: 20 }) }) }), _jsxs("aside", { className: `fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:relative lg:flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-200 ease-in-out z-40`, children: [_jsx("div", { className: "flex items-center justify-center h-16 px-4 border-b border-gray-200", children: _jsxs(Link, { href: "/staff", className: "flex items-center space-x-2", children: [_jsx("svg", { viewBox: "0 0 24 24", className: "h-8 w-8 text-primary", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: _jsx("path", { d: "M22 12h-4l-3 9L9 3l-3 9H2" }) }), _jsx("span", { className: "text-xl font-bold", children: "Staff Portal" })] }) }), _jsx("div", { className: "flex-1 overflow-y-auto py-4", children: _jsx("nav", { className: "px-2 space-y-1", children: navigationItems.map((item) => {
                                const isActive = location === item.href;
                                return (_jsx(Link, { href: item.href, className: `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-gray-700 hover:bg-gray-100'}`, children: _jsx("span", { className: "truncate", children: item.name }) }, item.name));
                            }) }) }), _jsx("div", { className: "p-4 border-t border-gray-200", children: _jsx(Button, { variant: "outline", className: "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50", onClick: logout, children: "Sign Out" }) })] }), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden", children: [_jsx("header", { className: "bg-white border-b border-gray-200 shadow-sm z-30", children: _jsxs("div", { className: "px-4 py-3 flex items-center justify-between", children: [_jsx("div", { className: "flex-1 flex", children: _jsxs("div", { className: "max-w-lg w-full lg:max-w-md relative", children: [_jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: _jsx(Search, { className: "h-5 w-5 text-gray-400" }) }), _jsx(Input, { type: "search", placeholder: "Search...", className: "pl-10 py-2" })] }) }), _jsxs("div", { className: "ml-4 flex items-center", children: [_jsx("button", { className: "p-1 rounded-full text-gray-500 hover:text-gray-700 focus:outline-none", children: _jsx(Bell, { className: "h-6 w-6" }) }), _jsxs("div", { className: "ml-3 relative flex items-center space-x-2", children: [_jsx("span", { className: "text-sm font-medium text-gray-700 hidden md:block", children: user.name }), _jsx("div", { className: "h-10 w-10 rounded-full flex items-center justify-center bg-primary text-primary-foreground", children: user.profileImage ? (_jsx("img", { src: user.profileImage, alt: user.name, className: "h-10 w-10 rounded-full" })) : (user.name.charAt(0)) })] })] })] }) }), _jsx("main", { className: "flex-1 overflow-auto p-4 bg-gray-50", children: children })] }), isSidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden", onClick: () => setIsSidebarOpen(false) }))] }));
}
