import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLocation, Link } from "wouter";
import { useUser } from "@/lib/useUserData";
import { LayoutGrid, Users, School, Settings, Mail, BarChart3, Shield, Cpu, FileText, Star, CreditCard, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
export default function AdminLayout({ children }) {
    const [location] = useLocation();
    const { user, logout } = useUser();
    // Check if user is super admin for enhanced features
    const isSuperAdmin = user?.role === "super_admin";
    // Base navigation items available to all admins
    const baseNavItems = [
        {
            title: "Dashboard",
            icon: _jsx(LayoutGrid, { className: "h-5 w-5" }),
            href: "/admin"
        },
        {
            title: "Universities",
            icon: _jsx(School, { className: "h-5 w-5" }),
            href: "/admin/universities"
        },
        {
            title: "Users",
            icon: _jsx(Users, { className: "h-5 w-5" }),
            href: "/admin/users"
        },
        {
            title: "Analytics",
            icon: _jsx(BarChart3, { className: "h-5 w-5" }),
            href: "/admin/analytics"
        },
        {
            title: "Reviews",
            icon: _jsx(Star, { className: "h-5 w-5" }),
            href: "/admin/reviews"
        },
        {
            title: "Email",
            icon: _jsx(Mail, { className: "h-5 w-5" }),
            href: "/admin/email"
        }
    ];
    // Enhanced navigation items only for super admins
    const superAdminNavItems = [
        {
            title: "System Settings",
            icon: _jsx(Settings, { className: "h-5 w-5" }),
            href: "/admin/settings"
        },
        {
            title: "AI Models",
            icon: _jsx(Cpu, { className: "h-5 w-5" }),
            href: "/admin/models"
        },
        {
            title: "System Logs",
            icon: _jsx(FileText, { className: "h-5 w-5" }),
            href: "/admin/openai-logs"
        },
        {
            title: "Billing Management",
            icon: _jsx(CreditCard, { className: "h-5 w-5" }),
            href: "/admin/billing"
        },
        {
            title: "System Security",
            icon: _jsx(Shield, { className: "h-5 w-5" }),
            href: "/admin/system-security"
        }
    ];
    // Combine nav items based on role
    const navItems = isSuperAdmin
        ? [...baseNavItems, ...superAdminNavItems]
        : baseNavItems;
    return (_jsxs("div", { className: "flex min-h-screen bg-gray-50 dark:bg-gray-900", children: [_jsx("aside", { className: "fixed left-0 top-0 z-40 h-screen w-64 border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800", children: _jsxs("div", { className: "flex h-full flex-col overflow-y-auto", children: [_jsx("div", { className: "flex h-16 items-center justify-center border-b border-gray-200 px-4 dark:border-gray-700", children: _jsx(Link, { href: "/admin", children: _jsxs("a", { className: "flex items-center gap-2", children: [_jsx(School, { className: "h-6 w-6 text-blue-600" }), _jsxs("div", { children: [_jsx("span", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Ascentul Admin" }), isSuperAdmin && (_jsxs("div", { className: "flex items-center gap-1 text-xs text-blue-600", children: [_jsx(Shield, { className: "h-3 w-3" }), _jsx("span", { children: "Super Admin" })] }))] })] }) }) }), _jsx("div", { className: "flex flex-col gap-1 p-4 flex-1", children: navItems.map((item) => (_jsx(Link, { href: item.href, children: _jsxs("a", { className: cn("flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors", location === item.href
                                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200"
                                        : "text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"), children: [item.icon, item.title] }) }, item.href))) }), _jsxs("div", { className: "p-4 border-t border-gray-200 dark:border-gray-700 mt-auto", children: [_jsxs("div", { className: "flex items-center mb-3", children: [_jsxs(Avatar, { className: "h-8 w-8", children: [_jsx(AvatarImage, { src: user?.profileImage || undefined }), _jsx(AvatarFallback, { className: "bg-blue-100 text-blue-600", children: user?.name?.charAt(0)?.toUpperCase() || "A" })] }), _jsxs("div", { className: "ml-3 overflow-hidden", children: [_jsx("p", { className: "text-sm font-medium text-gray-900 dark:text-white truncate", children: user?.name || "Admin User" }), _jsx("p", { className: "text-xs text-gray-500 dark:text-gray-400 truncate", children: isSuperAdmin ? "Super Administrator" : "Administrator" })] })] }), _jsxs(Button, { variant: "ghost", size: "sm", className: "w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20", onClick: () => logout(), children: [_jsx(LogOut, { className: "h-4 w-4 mr-2" }), "Sign out"] })] })] }) }), _jsx("main", { className: "ml-64 flex-1", children: _jsx("div", { className: "py-6", children: children }) })] }));
}
