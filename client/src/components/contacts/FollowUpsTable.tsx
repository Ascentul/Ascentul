import React from 'react';
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, Calendar, CalendarCheck, AlertCircle, Mail, Smartphone, Video, Users, MessageCircle } from "lucide-react";
import { formatDistanceToNow, format } from 'date-fns';

// Type for a follow-up with contact information
interface FollowUpWithContact {
  id: number;
  type: string;
  description: string;
  dueDate: string | Date;
  completed: boolean;
  notes: string | null;
  contact: {
    id: number;
    fullName: string;
    company: string | null;
    email: string | null;
    phone: string | null;
  };
}

interface FollowUpsTableProps {
  followUps: FollowUpWithContact[];
  onSelectContact: (contactId: number) => void;
  onCompleteFollowUp?: (followUpId: number) => void;
}

export function FollowUpsTable({ followUps, onSelectContact, onCompleteFollowUp }: FollowUpsTableProps) {
  // Helper function to get the icon based on the follow-up type
  const getTypeIcon = (type: string) => {
    // Remove the contact_ prefix if it exists
    const cleanType = type.replace('contact_', '');
    
    switch (cleanType.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4 text-blue-500" />;
      case 'call':
        return <Smartphone className="h-4 w-4 text-green-500" />;
      case 'meeting':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'video':
        return <Video className="h-4 w-4 text-red-500" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-primary" />;
    }
  };

  // Helper function to format due date and calculate days until
  const getDueDateInfo = (dueDate: string | Date) => {
    const date = new Date(dueDate);
    const formattedDate = format(date, 'MMM d, yyyy');
    const timeUntil = formatDistanceToNow(date, { addSuffix: true });
    
    return {
      formattedDate,
      timeUntil
    };
  };

  return (
    <div className="rounded-md border bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Contact</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Follow-up Type</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {followUps.map((followUp) => {
            const { formattedDate, timeUntil } = getDueDateInfo(followUp.dueDate);
            
            return (
              <TableRow key={followUp.id}>
                <TableCell className="font-medium">
                  {followUp.contact.fullName}
                </TableCell>
                <TableCell>
                  {followUp.contact.company || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    {getTypeIcon(followUp.type)}
                    <span>{followUp.type.replace('contact_', '')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{formattedDate}</span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{timeUntil}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => onSelectContact(followUp.contact.id)}
                    >
                      View Contact
                    </Button>
                    {onCompleteFollowUp && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-1"
                        onClick={() => onCompleteFollowUp(followUp.id)}
                      >
                        <CalendarCheck className="h-4 w-4" />
                        Complete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          
          {followUps.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <AlertCircle className="h-8 w-8 text-muted-foreground" />
                  <div className="text-muted-foreground">No follow-ups found</div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}