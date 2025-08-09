import { jsx as _jsx } from "react/jsx-runtime";
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Alert banner for model notifications - disabled per user request
export function ModelNotificationAlert() {
    // Always return null to prevent the notification from appearing
    return null;
}
// Bell notification icon with counter - disabled per user request
export function ModelNotificationIcon() {
    // Simply return the bell icon without any notifications
    return (_jsx(Button, { variant: "ghost", size: "icon", className: "relative", children: _jsx(Bell, { className: "h-5 w-5" }) }));
}
// Container that renders the alert in the appropriate context
export function ModelNotificationContainer() {
    return _jsx(ModelNotificationAlert, {});
}
