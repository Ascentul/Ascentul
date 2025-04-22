import React from 'react';
import { NetworkingContact } from '@shared/schema';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Mail, 
  ExternalLink, 
  Phone,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface ContactsTableProps {
  contacts: NetworkingContact[];
  onSelectContact: (contactId: number) => void;
  onDeleteContact: (contactId: number) => void;
}

export default function ContactsTable({ 
  contacts,
  onSelectContact,
  onDeleteContact
}: ContactsTableProps) {
  // Helper function to get the relationship type color
  const getRelationshipTypeColor = (type: string): string => {
    switch (type) {
      case 'Current Colleague':
        return 'bg-blue-100 text-blue-800';
      case 'Former Colleague':
        return 'bg-indigo-100 text-indigo-800';
      case 'Industry Expert':
        return 'bg-purple-100 text-purple-800';
      case 'Mentor':
        return 'bg-green-100 text-green-800';
      case 'Client':
        return 'bg-yellow-100 text-yellow-800';
      case 'Recruiter':
        return 'bg-orange-100 text-orange-800';
      case 'Hiring Manager':
        return 'bg-pink-100 text-pink-800';
      case 'Friend':
        return 'bg-teal-100 text-teal-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sort contacts by last contacted date (null values first)
  const sortedContacts = [...contacts].sort((a, b) => {
    if (!a.lastContactedDate && !b.lastContactedDate) return 0;
    if (!a.lastContactedDate) return -1;
    if (!b.lastContactedDate) return 1;
    return new Date(b.lastContactedDate).getTime() - new Date(a.lastContactedDate).getTime();
  });

  // Format date function
  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Function to open email client
  const sendEmail = (email: string | null) => {
    if (email) {
      window.location.href = `mailto:${email}`;
    }
  };

  // Function to open phone dialer
  const callPhone = (phone: string | null) => {
    if (phone) {
      window.location.href = `tel:${phone}`;
    }
  };

  // Function to open LinkedIn URL
  const openLinkedIn = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="rounded-md border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Last Contacted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedContacts.map((contact) => (
            <TableRow key={contact.id}>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span 
                    className="cursor-pointer hover:text-primary"
                    onClick={() => onSelectContact(contact.id)}
                  >
                    {contact.fullName}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {contact.jobTitle}
                  </span>
                </div>
              </TableCell>
              <TableCell>{contact.company}</TableCell>
              <TableCell>
                <Badge className={getRelationshipTypeColor(contact.relationshipType)}>
                  {contact.relationshipType}
                </Badge>
              </TableCell>
              <TableCell>
                {formatDate(contact.lastContactedDate)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {contact.email && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => sendEmail(contact.email)}
                      title="Send Email"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  )}
                  {contact.phone && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => callPhone(contact.phone)}
                      title="Call"
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  )}
                  {contact.linkedInUrl && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => openLinkedIn(contact.linkedInUrl)}
                      title="View LinkedIn Profile"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectContact(contact.id)}>
                        <Edit className="mr-2 h-4 w-4" />
                        View & Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDeleteContact(contact.id)}
                        className="text-red-600 focus:text-red-600">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}