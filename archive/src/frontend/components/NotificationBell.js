import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useRef } from 'react';
export function NotificationBell() {
    const { notifications, isLoading, markNotificationRead } = useNotifications();
    const { toast } = useToast();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    // Track previous notification IDs to detect new ones
    const prevNotifIdsRef = useRef([]);
    // Count unread notifications
    const unreadCount = notifications.filter(n => !n.read).length;
    // Show toast for new daily recommendation notifications
    useEffect(() => {
        const prevIds = prevNotifIdsRef.current;
        const currentIds = notifications.map(n => n.id);
        // Find newly arrived notifications
        const newNotifs = notifications.filter(n => !prevIds.includes(n.id) && !n.read &&
            (n.title.toLowerCase().includes('recommendation') ||
                n.body.toLowerCase().includes('recommendation')));
        if (newNotifs.length > 0) {
            // Show a toast for each new daily recommendation notification
            newNotifs.forEach(n => {
                toast({
                    title: n.title,
                    description: n.body,
                    variant: 'default',
                });
            });
        }
        prevNotifIdsRef.current = currentIds;
    }, [notifications, toast]);
    return (_jsxs("div", { className: "relative", children: [_jsxs(Button, { variant: "ghost", size: "icon", className: "relative text-neutral-700 hover:text-primary", "aria-label": "Notifications", onClick: () => setDropdownOpen(open => !open), children: [_jsx(Bell, { className: "h-5 w-5" }), unreadCount > 0 && (_jsx("span", { className: "absolute top-1 right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs", children: unreadCount }))] }), dropdownOpen && (_jsxs("div", { className: "absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-md z-50 border", children: [_jsx("div", { className: "p-3 border-b font-semibold text-sm", children: "Notifications" }), _jsx("div", { className: "max-h-80 overflow-y-auto", children: isLoading ? (_jsx("div", { className: "p-4 text-center text-muted-foreground", children: "Loading..." })) : notifications.length === 0 ? (_jsx("div", { className: "p-4 text-center text-muted-foreground", children: "No notifications" })) : (notifications.map(n => (_jsxs("div", { className: `p-3 border-b last:border-b-0 cursor-pointer ${n.read ? 'bg-white' : 'bg-blue-50'}`, onClick: () => {
                                if (!n.read)
                                    markNotificationRead(n.id);
                                setDropdownOpen(false);
                            }, children: [_jsx("div", { className: "font-medium text-sm", children: n.title }), _jsx("div", { className: "text-xs text-muted-foreground", children: n.body }), _jsx("div", { className: "text-[10px] text-muted-foreground mt-1", children: new Date(n.timestamp).toLocaleString() })] }, n.id)))) })] }))] }));
}
