import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, Settings, GraduationCap } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useUser } from '@/lib/useUserData';
import { Link } from 'wouter';
export default function Header({ onMenuToggle }) {
    const { user } = useUser();
    const isUniversityUser = user?.userType === 'university_student' || user?.userType === 'university_admin';
    return (_jsx("header", { className: "bg-white shadow-sm z-10", children: _jsxs("div", { className: "flex items-center justify-between h-16 px-4", children: [_jsxs("div", { className: "flex items-center", children: [_jsx(Button, { variant: "ghost", className: "md:hidden mr-2 text-neutral-700 p-2", onClick: onMenuToggle, children: _jsx(Menu, { className: "h-6 w-6" }) }), _jsx("h1", { className: "md:hidden text-lg font-bold text-primary font-poppins", children: "CareerTracker.io" })] }), _jsxs("div", { className: "flex items-center", children: [isUniversityUser && (_jsxs(Link, { href: "/university", className: "mr-3 border border-primary rounded-md px-3 py-1.5 text-primary hover:bg-primary/5 flex items-center cursor-pointer", children: [_jsx(GraduationCap, { className: "h-4 w-4 mr-2" }), _jsx("span", { className: "hidden sm:inline", children: "University Edition" })] })), _jsx(NotificationBell, {}), _jsx(Button, { variant: "ghost", size: "icon", className: "ml-2 text-neutral-700 hover:text-primary", onClick: () => window.location.href = '/account', children: _jsx(Settings, { className: "h-5 w-5" }) }), user && (_jsx(Avatar, { className: "ml-3 h-8 w-8 md:hidden", children: user.profileImage ? (_jsx(AvatarImage, { src: user.profileImage || '', alt: user.name, onError: (e) => {

                                    e.currentTarget.style.display = 'none';
                                }, className: "object-cover", style: { objectPosition: 'center' } })) : (_jsx(AvatarFallback, { className: "bg-primary/10 text-primary", children: user.name.charAt(0) })) }))] })] }) }));
}
