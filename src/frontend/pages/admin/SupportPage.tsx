
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
    if (sourceFilter !== 'all') params.append('source', sourceFilter);
    if (issueTypeFilter !== 'all') params.append('issueType', issueTypeFilter);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (searchQuery) params.append('search', searchQuery);
    return params.toString();
  };

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['supportTickets', sourceFilter, issueTypeFilter, statusFilter, searchQuery],
    queryFn: async () => {
      const queryParams = getQueryParams();
      const url = `/api/admin/support-tickets${queryParams ? `?${queryParams}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch tickets');
      return response.json();
    }
  });

  return (
    <div className="space-y-8 p-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="in-app">In-App</SelectItem>
            <SelectItem value="marketing-site">Marketing Site</SelectItem>
            <SelectItem value="university-admin">University Admin</SelectItem>
          </SelectContent>
        </Select>

        <Select value={issueTypeFilter} onValueChange={setIssueTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by issue type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {[
              "Bug", 
              "Billing", 
              "Feedback", 
              "Feature Request", 
              "Other", 
              "account_access", 
              "student_management", 
              "reporting", 
              "technical"
            ].map(type => (
              <SelectItem key={type} value={type}>
                {type.includes('_') 
                  ? type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
                  : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {["Open", "In Progress", "Resolved"].map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input 
          placeholder="Search by email or keyword..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Refresh query
              const inputElement = e.target as HTMLInputElement;
              setSearchQuery(inputElement.value);
            }
          }}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
          <CardDescription>Manage and respond to user support requests</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket ID</TableHead>
                <TableHead>Submitted At</TableHead>
                <TableHead>User Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Issue Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">Loading tickets...</TableCell>
                </TableRow>
              ) : tickets?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">No tickets found</TableCell>
                </TableRow>
              ) : (
                tickets?.map((ticket: any) => (
                  <TableRow key={ticket.id}>
                    <TableCell>#{ticket.id}</TableCell>
                    <TableCell>{new Date(ticket.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{ticket.userEmail || "Guest Submission"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {ticket.source === 'in-app' ? 'In-App' : 
                         ticket.source === 'marketing-site' ? 'Marketing Site' : 
                         ticket.source === 'university-admin' ? 'University Admin' : 
                         ticket.source}
                      </Badge>
                    </TableCell>
                    <TableCell>{ticket.issueType}</TableCell>
                    <TableCell>{ticket.description.slice(0, 100)}...</TableCell>
                    <TableCell>
                      <Badge className={
                        ticket.status === 'Open' ? 'bg-red-100 text-red-800' :
                        ticket.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {/* Handle view details */}}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
