import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { LayoutDashboard, Users, FileText, TicketCheck, BarChart3, Settings, LogOut, ShieldAlert, BookOpen, MessageSquare, Bell, ServerCog, Zap } from 'lucide-react';
export default function StaffSidebar() {
    const [location] = useLocation();
    const { user, logout } = useUser();
    if (!user)
        return null;
    // Staff navigation items
    const staffNavigationItems = [
        { href: '/staff', icon: _jsx(LayoutDashboard, { className: "w-5 h-5 mr-3" }), label: 'Dashboard' },
        { href: '/staff/users', icon: _jsx(Users, { className: "w-5 h-5 mr-3" }), label: 'User Management' },
        { href: '/staff/support', icon: _jsx(TicketCheck, { className: "w-5 h-5 mr-3" }), label: 'Support Tickets' },
        { href: '/staff/content', icon: _jsx(FileText, { className: "w-5 h-5 mr-3" }), label: 'Content Manager' },
        { href: '/staff/analytics', icon: _jsx(BarChart3, { className: "w-5 h-5 mr-3" }), label: 'Analytics' },
        { href: '/staff/notifications', icon: _jsx(Bell, { className: "w-5 h-5 mr-3" }), label: 'Notifications' },
        { href: '/staff/knowledge', icon: _jsx(BookOpen, { className: "w-5 h-5 mr-3" }), label: 'Knowledge Base' },
        { href: '/staff/system', icon: _jsx(ServerCog, { className: "w-5 h-5 mr-3" }), label: 'System Health' },
    ];
    return (_jsxs("div", { className: "hidden md:flex flex-col w-64 bg-white shadow-md z-10", children: [_jsxs("div", { className: "flex items-center justify-center h-16 border-b bg-primary text-white", children: [_jsx(ShieldAlert, { className: "w-5 h-5 mr-2" }), _jsx("h1", { className: "text-xl font-bold font-poppins", children: "Staff Portal" })] }), _jsxs("div", { className: "flex flex-col items-center py-6 border-b", children: [_jsx(Avatar, { className: "w-16 h-16 border-2 border-primary", children: user.profileImage ? (_jsx(AvatarImage, { src: user.profileImage, alt: user.name })) : (_jsx(AvatarFallback, { className: "bg-primary/10 text-primary text-xl", children: user.name.charAt(0) })) }), _jsx("h2", { className: "mt-3 font-medium text-lg", children: user.name }), _jsx("div", { className: "mt-1 text-sm text-neutral-400 capitalize", children: user.userType }), _jsxs("div", { className: "mt-3 px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium flex items-center", children: [_jsx(ShieldAlert, { className: "w-3 h-3 mr-1" }), "Staff Access"] })] }), _jsxs("nav", { className: "flex-1 overflow-y-auto py-4", children: [_jsx("div", { className: "px-6 py-2 text-xs font-medium text-neutral-400 uppercase", children: "Staff Tools" }), staffNavigationItems.map((item) => (_jsxs(Link, { href: item.href, className: `flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5
              ${location === item.href ? 'text-primary bg-primary/10 border-l-4 border-primary' : 'border-l-4 border-transparent'}`, children: [item.icon, item.label] }, item.href)))] }), _jsxs("div", { className: "border-t py-2", children: [_jsx("div", { className: "px-6 py-2 text-xs font-medium text-neutral-400 uppercase", children: "Quick Actions" }), _jsxs(Link, { href: "/staff/broadcast", className: `flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5`, children: [_jsx(MessageSquare, { className: "w-5 h-5 mr-3" }), "Send Broadcast"] }), _jsxs(Link, { href: "/staff/maintenance", className: `flex items-center px-6 py-3 text-sm transition-colors hover:bg-primary/5`, children: [_jsx(Zap, { className: "w-5 h-5 mr-3" }), "Maintenance Mode"] })] }), _jsxs("div", { className: "border-t py-4", children: [_jsxs(Link, { href: "/staff/settings", className: "flex items-center px-6 py-3 text-sm hover:bg-primary/5 transition-colors", children: [_jsx(Settings, { className: "w-5 h-5 mr-3" }), "Staff Settings"] }), _jsxs("button", { className: "flex items-center px-6 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left", onClick: () => logout(), children: [_jsx(LogOut, { className: "w-5 h-5 mr-3" }), "Logout"] })] })] }));
}
