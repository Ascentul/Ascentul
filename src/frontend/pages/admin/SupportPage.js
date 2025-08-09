import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye } from 'lucide-react';
export default function SupportPage() {
    const [sourceFilter, setSourceFilter] = useState('all');
    const [issueTypeFilter, setIssueTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    // Build query parameters
    const getQueryParams = () => {
        const params = new URLSearchParams();
        if (sourceFilter !== 'all')
            params.append('source', sourceFilter);
        if (issueTypeFilter !== 'all')
            params.append('issueType', issueTypeFilter);
        if (statusFilter !== 'all')
            params.append('status', statusFilter);
        if (searchQuery)
            params.append('search', searchQuery);
        return params.toString();
    };
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['supportTickets', sourceFilter, issueTypeFilter, statusFilter, searchQuery],
        queryFn: async () => {
            const queryParams = getQueryParams();
            const url = `/api/admin/support-tickets${queryParams ? `?${queryParams}` : ''}`;
            const response = await fetch(url);
            if (!response.ok)
                throw new Error('Failed to fetch tickets');
            return response.json();
        }
    });
    return (_jsxs("div", { className: "space-y-8 p-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4 mb-6", children: [_jsxs(Select, { value: sourceFilter, onValueChange: setSourceFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by source" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Sources" }), _jsx(SelectItem, { value: "in-app", children: "In-App" }), _jsx(SelectItem, { value: "marketing-site", children: "Marketing Site" }), _jsx(SelectItem, { value: "university-admin", children: "University Admin" })] })] }), _jsxs(Select, { value: issueTypeFilter, onValueChange: setIssueTypeFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by issue type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Types" }), [
                                        "Bug",
                                        "Billing",
                                        "Feedback",
                                        "Feature Request",
                                        "Other",
                                        "account_access",
                                        "student_management",
                                        "reporting",
                                        "technical"
                                    ].map(type => (_jsx(SelectItem, { value: type, children: type.includes('_')
                                            ? type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                                            : type }, type)))] })] }), _jsxs(Select, { value: statusFilter, onValueChange: setStatusFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by status" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Status" }), ["Open", "In Progress", "Resolved"].map(status => (_jsx(SelectItem, { value: status, children: status }, status)))] })] }), _jsx(Input, { placeholder: "Search by email or keyword...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), onKeyDown: (e) => {
                            if (e.key === 'Enter') {
                                // Refresh query
                                const inputElement = e.target;
                                setSearchQuery(inputElement.value);
                            }
                        } })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsx(CardTitle, { children: "Support Tickets" }), _jsx(CardDescription, { children: "Manage and respond to user support requests" })] }), _jsx(CardContent, { children: _jsxs(Table, { children: [_jsx(TableHeader, { children: _jsxs(TableRow, { children: [_jsx(TableHead, { children: "Ticket ID" }), _jsx(TableHead, { children: "Submitted At" }), _jsx(TableHead, { children: "User Email" }), _jsx(TableHead, { children: "Source" }), _jsx(TableHead, { children: "Issue Type" }), _jsx(TableHead, { children: "Description" }), _jsx(TableHead, { children: "Status" }), _jsx(TableHead, { className: "text-right", children: "Action" })] }) }), _jsx(TableBody, { children: isLoading ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, className: "text-center", children: "Loading tickets..." }) })) : tickets?.length === 0 ? (_jsx(TableRow, { children: _jsx(TableCell, { colSpan: 8, className: "text-center", children: "No tickets found" }) })) : (tickets?.map((ticket) => (_jsxs(TableRow, { children: [_jsxs(TableCell, { children: ["#", ticket.id] }), _jsx(TableCell, { children: new Date(ticket.createdAt).toLocaleString() }), _jsx(TableCell, { children: ticket.userEmail || "Guest Submission" }), _jsx(TableCell, { children: _jsx(Badge, { variant: "outline", children: ticket.source === 'in-app' ? 'In-App' :
                                                        ticket.source === 'marketing-site' ? 'Marketing Site' :
                                                            ticket.source === 'university-admin' ? 'University Admin' :
                                                                ticket.source }) }), _jsx(TableCell, { children: ticket.issueType }), _jsxs(TableCell, { children: [ticket.description.slice(0, 100), "..."] }), _jsx(TableCell, { children: _jsx(Badge, { className: ticket.status === 'Open' ? 'bg-red-100 text-red-800' :
                                                        ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800', children: ticket.status }) }), _jsx(TableCell, { className: "text-right", children: _jsxs(Button, { variant: "outline", size: "sm", onClick: () => { }, children: [_jsx(Eye, { className: "h-4 w-4 mr-2" }), "View Details"] }) })] }, ticket.id)))) })] }) })] })] }));
}
