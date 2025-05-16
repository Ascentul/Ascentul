import React from 'react';
import { format } from 'date-fns';
import { NetworkingContact } from "@/utils/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  CalendarDays, 
  Edit, 
  MoreHorizontal, 
  Trash2, 
  User, 
  Building, 
  Phone, 
  Mail, 
  RotateCw,
  Briefcase
} from 'lucide-react';

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
  
  // Helper function to get relation type badge color
  const getRelationTypeColor = (type: string): string => {
    const types: Record<string, string> = {
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
  const needsFollowUp = (lastContactedDate?: Date | null): boolean => {
    if (!lastContactedDate) return true;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Date(lastContactedDate) < thirtyDaysAgo;
  };

  return (
    <div className="border rounded-md shadow-sm bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Contact</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Relationship</TableHead>
            <TableHead>Last Contact</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow key={contact.id} className="group hover:bg-muted/20">
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3 flex-shrink-0">
                    {contact.fullName ? contact.fullName.charAt(0).toUpperCase() : <User />}
                  </div>
                  <div>
                    <div className="font-medium cursor-pointer hover:text-primary" onClick={() => onSelectContact(contact.id)}>
                      {contact.fullName}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      {contact.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span>{contact.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-muted-foreground" />
                    <span>{contact.jobTitle || 'Not specified'}</span>
                  </div>
                  {contact.company && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Building className="w-3 h-3" />
                      <span>{contact.company}</span>
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {contact.relationshipType && (
                  <Badge variant="outline" className={`${getRelationTypeColor(contact.relationshipType)} border-transparent`}>
                    {contact.relationshipType}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  {contact.lastContactedDate ? (
                    <>
                      <div className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3 text-muted-foreground" />
                        <span>{format(new Date(contact.lastContactedDate), 'MMM d, yyyy')}</span>
                      </div>
                      {needsFollowUp(contact.lastContactedDate) && (
                        <Badge variant="outline" className="mt-1 bg-red-100 text-red-800 border-transparent px-1 py-0 text-xs inline-flex items-center justify-center rounded-full font-medium">
                          Needs follow-up
                        </Badge>
                      )}
                    </>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100 text-gray-800 border-transparent px-1 py-0 text-xs inline-flex items-center justify-center rounded-full font-medium">
                      Never contacted
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onSelectContact(contact.id)}>
                      <User className="mr-2 h-4 w-4" />
                      View details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      // View contact details for editing
                      onSelectContact(contact.id);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit contact
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <RotateCw className="mr-2 h-4 w-4" />
                      Log interaction
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        onDeleteContact(contact.id);
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}