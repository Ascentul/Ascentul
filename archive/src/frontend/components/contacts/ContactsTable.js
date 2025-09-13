import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { CalendarDays, Edit, MoreHorizontal, Trash2, User, Building, Mail, RotateCw, Briefcase } from 'lucide-react';
export default function ContactsTable({ contacts, onSelectContact, onDeleteContact }) {
    // Helper function to get relation type badge color
    const getRelationTypeColor = (type) => {
        const types = {
            'Current Colleague': 'bg-blue-100 text-blue-800',
            'Former Colleague': 'bg-purple-100 text-purple-800',
            'Industry Expert': 'bg-amber-100 text-amber-800',
            'Mentor': 'bg-emerald-100 text-emerald-800',
            'Client': 'bg-green-100 text-green-800',
            'Recruiter': 'bg-fuchsia-100 text-fuchsia-800',
            'Hiring Manager': 'bg-indigo-100 text-indigo-800',
            'Friend': 'bg-teal-100 text-teal-800'
        };
        return types[type] || 'bg-gray-100 text-gray-800';
    };
    // Helper function to check if a contact needs follow-up
    const needsFollowUp = (lastContactedDate) => {
        if (!lastContactedDate)
            return true;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return new Date(lastContactedDate) < thirtyDaysAgo;
    };
    return (_jsx("div", { className: "border rounded-md shadow-sm bg-white", children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { className: "w-[250px]", children: "Contact" }), _jsx(TableHead, { children: "Position" }), _jsx(TableHead, { children: "Relationship" }), _jsx(TableHead, { children: "Last Contact" }), _jsx(TableHead, { className: "text-right", children: "Actions" })] }) }), _jsx(TableBody, { children: contacts.map((contact) => (_jsxs(TableRow, { className: "group hover:bg-muted/20", children: [_jsx(TableCell, { className: "font-medium", children: _jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0", children: contact.fullName ? contact.fullName.charAt(0).toUpperCase() : _jsx(User, {}) }), _jsxs("div", { children: [_jsx("div", { className: "font-medium cursor-pointer hover:text-primary", onClick: () => onSelectContact(contact.id), children: contact.fullName }), _jsx("div", { className: "flex items-center gap-1 text-xs text-muted-foreground mt-1", children: contact.email && (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Mail, { className: "w-3 h-3" }), _jsx("span", { children: contact.email })] })) })] })] }) }), _jsx(TableCell, { children: _jsxs("div", { className: "flex flex-col", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Briefcase, { className: "w-3 h-3 text-muted-foreground" }), _jsx("span", { children: contact.jobTitle || 'Not specified' })] }), contact.company && (_jsxs("div", { className: "flex items-center gap-1 text-xs text-muted-foreground mt-1", children: [_jsx(Building, { className: "w-3 h-3" }), _jsx("span", { children: contact.company })] }))] }) }), _jsx(TableCell, { children: contact.relationshipType && (_jsx(Badge, { variant: "outline", className: `${getRelationTypeColor(contact.relationshipType)} border-transparent`, children: contact.relationshipType })) }), _jsx(TableCell, { children: _jsx("div", { className: "flex flex-col", children: contact.lastContactedDate ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(CalendarDays, { className: "w-3 h-3 text-muted-foreground" }), _jsx("span", { children: format(new Date(contact.lastContactedDate), 'MMM d, yyyy') })] }), needsFollowUp(contact.lastContactedDate) && (_jsx(Badge, { variant: "outline", className: "mt-1 bg-red-100 text-red-800 border-transparent px-1 py-0 text-xs inline-flex items-center justify-center rounded-full font-medium", children: "Needs follow-up" }))] })) : (_jsx(Badge, { variant: "outline", className: "bg-gray-100 text-gray-800 border-transparent px-1 py-0 text-xs inline-flex items-center justify-center rounded-full font-medium", children: "Never contacted" })) }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsxs(Button, { variant: "ghost", className: "h-8 w-8 p-0", children: [_jsx("span", { className: "sr-only", children: "Open menu" }), _jsx(MoreHorizontal, { className: "h-4 w-4" })] }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsxs(DropdownMenuItem, { onClick: () => onSelectContact(contact.id), children: [_jsx(User, { className: "mr-2 h-4 w-4" }), "View details"] }), _jsxs(DropdownMenuItem, { onClick: () => {
                                                        // View contact details for editing
                                                        onSelectContact(contact.id);
                                                    }, children: [_jsx(Edit, { className: "mr-2 h-4 w-4" }), "Edit contact"] }), _jsxs(DropdownMenuItem, { children: [_jsx(RotateCw, { className: "mr-2 h-4 w-4" }), "Log interaction"] }), _jsx(DropdownMenuSeparator, {}), _jsxs(DropdownMenuItem, { className: "text-red-600", onClick: (e) => {
                                                        e.stopPropagation(); // Prevent event bubbling
                                                        onDeleteContact(contact.id);
                                                    }, children: [_jsx(Trash2, { className: "mr-2 h-4 w-4" }), "Delete contact"] })] })] }) })] }, contact.id))) })] }) }));
}
