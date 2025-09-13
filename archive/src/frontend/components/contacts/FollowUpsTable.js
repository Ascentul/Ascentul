import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Calendar, CalendarCheck, AlertCircle, Mail, Smartphone, Video, Users, MessageCircle } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';
export function FollowUpsTable({ followUps, onSelectContact, onCompleteFollowUp }) {
    // Helper function to get the icon based on the follow-up type
    const getTypeIcon = (type) => {
        // Remove the contact_ prefix if it exists
        const cleanType = type.replace('contact_', '');
        switch (cleanType.toLowerCase()) {
            case 'email':
                return _jsx(Mail, { className: "h-4 w-4 text-blue-500" });
            case 'call':
                return _jsx(Smartphone, { className: "h-4 w-4 text-green-500" });
            case 'meeting':
                return _jsx(Users, { className: "h-4 w-4 text-purple-500" });
            case 'video':
                return _jsx(Video, { className: "h-4 w-4 text-red-500" });
            case 'message':
                return _jsx(MessageCircle, { className: "h-4 w-4 text-yellow-500" });
            default:
                return _jsx(Clock, { className: "h-4 w-4 text-primary" });
        }
    };
    // Helper function to format due date and calculate days until
    const getDueDateInfo = (dueDate) => {
        const date = new Date(dueDate);
        const formattedDate = format(date, 'MMM d, yyyy');
        const timeUntil = formatDistanceToNow(date, { addSuffix: true });
        return {
            formattedDate,
            timeUntil
        };
    };
    return (_jsx("div", { className: "rounded-md border bg-white", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Contact" }), _jsx(TableHead, { children: "Company" }), _jsx(TableHead, { children: "Follow-up Type" }), _jsx(TableHead, { children: "Due Date" }), _jsx(TableHead, { children: "Actions" })] }) }), _jsxs(TableBody, { children: [followUps.map((followUp) => {
                            const { formattedDate, timeUntil } = getDueDateInfo(followUp.dueDate);
                            return (_jsxs(TableRow, { children: [_jsx(TableCell, { className: "font-medium", children: followUp.contact.fullName }), _jsx(TableCell, { children: followUp.contact.company || "—" }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-1.5", children: [getTypeIcon(followUp.type), _jsx("span", { children: followUp.type.replace('contact_', '') })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Calendar, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { children: formattedDate })] }), _jsx("span", { className: "text-xs text-muted-foreground mt-1", children: timeUntil })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", className: "flex items-center gap-1", onClick: () => onSelectContact(followUp.contact.id), children: "View Contact" }), onCompleteFollowUp && (_jsxs(Button, { variant: "ghost", size: "sm", className: "flex items-center gap-1", onClick: () => onCompleteFollowUp(followUp.id), children: [_jsx(CalendarCheck, { className: "h-4 w-4" }), "Complete"] }))] }) })] }, followUp.id));
                        }), followUps.length === 0 && (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 5, className: "h-24 text-center", children: _jsxs("div", { className: "flex flex-col items-center justify-center space-y-2", children: [_jsx(AlertCircle, { className: "h-8 w-8 text-muted-foreground" }), _jsx("div", { className: "text-muted-foreground", children: "No follow-ups found" })] }) }) }))] })] }) }));
}
