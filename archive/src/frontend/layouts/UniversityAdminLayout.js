import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useUser } from '@/lib/useUserData';
import { useLocation, Link } from 'wouter';
import { Loader2, Menu, X, LayoutDashboard, Users, UserPlus, BarChart3, Settings, LogOut, School, BookOpen, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
export default function UniversityAdminLayout({ children }) {
    const { user, isLoading, logout } = useUser();
    const [location] = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    // Handle loading state
    if (isLoading) {
        return (_jsx("div", { className: "flex items-center justify-center h-screen", children: _jsx(Loader2, { className: "h-10 w-10 animate-spin text-primary" }) }));
    }
    // If no user or not a university admin, show access denied
    if (!user || user.userType !== 'university_admin') {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center h-screen", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Access Denied" }), _jsx("p", { className: "mb-4", children: "You don't have permission to access the university admin portal." }), _jsx(Button, { onClick: () => window.location.href = '/sign-in', children: "Return to Login" })] }));
    }
    // Get university name from user profile (or fallback to a default)
    const universityName = user.universityName || 'University Admin Portal';
    // Navigation items for university admin portal sidebar
    const navigationItems = [
        {
            name: 'Dashboard',
            href: '/university-admin',
            icon: _jsx(LayoutDashboard, { className: "h-5 w-5" })
        },
        {
            name: 'Students',
            href: '/university-admin/students',
            icon: _jsx(Users, { className: "h-5 w-5" })
        },
        {
            name: 'Invite Students',
            href: '/university-admin/invite',
            icon: _jsx(UserPlus, { className: "h-5 w-5" })
        },
        {
            name: 'Usage Analytics',
            href: '/university-admin/usage',
            icon: _jsx(BarChart3, { className: "h-5 w-5" })
        },
        {
            name: 'Settings',
            href: '/university-admin/settings',
            icon: _jsx(Settings, { className: "h-5 w-5" })
        },
        {
            name: 'Support',
            href: '/university-admin/support',
            icon: _jsx(MessageSquare, { className: "h-5 w-5" })
        },
    ];
    return (_jsxs("div", { className: "flex h-screen bg-gray-50", children: [_jsx("div", { className: "lg:hidden fixed top-4 left-4 z-50", children: _jsx(Button, { variant: "outline", size: "icon", onClick: () => setIsSidebarOpen(!isSidebarOpen), className: "bg-white shadow-md", children: isSidebarOpen ? _jsx(X, { size: 20 }) : _jsx(Menu, { size: 20 }) }) }), _jsxs("aside", { className: `fixed inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200 ease-in-out lg:relative flex flex-col w-64 h-screen bg-white border-r border-gray-200 z-40`, children: [_jsx("div", { className: "flex items-center justify-center p-6 border-b", children: _jsxs("div", { className: "flex items-center", children: [_jsx(School, { className: "h-8 w-8 text-primary mr-2" }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-bold text-primary", children: "Ascentul" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "University Portal" })] })] }) }), _jsxs("div", { className: "p-4 border-b", children: [_jsx("h3", { className: "text-sm font-semibold text-muted-foreground", children: "INSTITUTION" }), _jsx("p", { className: "mt-1 text-base font-medium truncate", children: universityName })] }), _jsxs("nav", { className: "flex-1 overflow-y-auto p-4", children: [_jsx("h3", { className: "text-xs font-semibold uppercase text-muted-foreground mb-2", children: "Main Navigation" }), _jsx("div", { className: "space-y-1", children: navigationItems.map((item) => (_jsxs(Link, { href: item.href, className: cn("flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors", location === item.href
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"), children: [item.icon, _jsx("span", { className: "ml-3", children: item.name })] }, item.name))) })] }), _jsxs("div", { className: "p-4 border-t mt-auto", children: [_jsxs("div", { className: "flex items-center", children: [_jsxs(Avatar, { className: "h-9 w-9", children: [_jsx(AvatarImage, { src: user.profileImage || undefined }), _jsx(AvatarFallback, { className: "bg-primary/10 text-primary", children: user.name.charAt(0).toUpperCase() })] }), _jsxs("div", { className: "ml-3 overflow-hidden", children: [_jsx("p", { className: "text-sm font-medium", children: user.name }), _jsx("p", { className: "text-xs text-muted-foreground truncate", children: user.email })] })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "mt-2 w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50", onClick: () => logout(), children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), "Sign out"] })] })] }), _jsxs("div", { className: "flex flex-col flex-1 overflow-hidden", children: [_jsxs("header", { className: "bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6", children: [_jsx("div", { children: _jsx("h1", { className: "text-xl font-semibold", children: "University Admin Portal" }) }), _jsxs("div", { className: "flex items-center", children: [_jsxs(Button, { variant: "ghost", size: "sm", className: "mr-2 hidden md:flex", onClick: () => window.open('https://ascentul.com/university-help', '_blank'), children: [_jsx(BookOpen, { className: "h-4 w-4 mr-2" }), "Help Center"] }), _jsxs(Link, { to: "/university-admin/support", className: "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-foreground h-9 px-3 py-2 mr-2 hidden md:flex", children: [_jsx(MessageSquare, { className: "h-4 w-4 mr-2" }), "Support"] })] })] }), _jsx("main", { className: "flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6", children: children })] }), isSidebarOpen && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden", onClick: () => setIsSidebarOpen(false) }))] }));
}
