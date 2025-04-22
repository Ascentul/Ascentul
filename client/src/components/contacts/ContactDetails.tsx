import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { NetworkingContact } from '@shared/schema';
import { format } from 'date-fns';
import ContactForm from './ContactForm';

// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Building,
  Calendar,
  Edit,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  UserRound,
  Users,
  Briefcase,
  Linkedin,
  Globe,
  Clock,
  CalendarClock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

interface ContactDetailsProps {
  contactId: number;
  onClose: () => void;
}

export default function ContactDetails({ contactId, onClose }: ContactDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch contact data
  const {
    data: contact,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/contacts/${contactId}`],
    queryFn: async () => apiRequest<NetworkingContact>(`/api/contacts/${contactId}`),
  });

  // Log interaction mutation
  const logInteractionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/contacts/${contactId}/log-interaction`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: 'Interaction logged',
        description: 'Contact interaction has been recorded successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to log interaction. Please try again.',
        variant: 'destructive',
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-muted-foreground">Loading contact details...</p>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="h-8 w-8 text-destructive" />
        <p className="mt-2 text-lg font-medium">Error loading contact</p>
        <p className="mt-1 text-muted-foreground">
          There was a problem fetching the contact details. Please try again.
        </p>
        <Button onClick={onClose} className="mt-4" variant="outline">
          Close
        </Button>
      </div>
    );
  }

  // Format dates for display
  const formattedCreatedAt = contact.createdAt 
    ? format(new Date(contact.createdAt), 'MMMM d, yyyy')
    : 'Unknown';
  
  const formattedLastContact = contact.lastContactDate
    ? format(new Date(contact.lastContactDate), 'MMMM d, yyyy')
    : 'Never';
  
  const formattedNextFollowUp = contact.nextFollowUpDate
    ? format(new Date(contact.nextFollowUpDate), 'MMMM d, yyyy')
    : 'Not scheduled';

  // Check if follow-up is needed
  const needsFollowUp = () => {
    if (!contact.lastContactDate) return true;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Date(contact.lastContactDate) < thirtyDaysAgo;
  };

  // Handle log interaction
  const handleLogInteraction = () => {
    logInteractionMutation.mutate();
  };

  if (isEditing) {
    return (
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          
          <ContactForm
            initialData={contact}
            isEdit={true}
            onSuccess={() => {
              setIsEditing(false);
              queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
            }}
            onCancel={() => setIsEditing(false)}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-6">
      {/* Contact header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mr-4">
            {contact.fullName ? contact.fullName.charAt(0).toUpperCase() : <UserRound />}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{contact.fullName}</h2>
            <div className="flex items-center gap-1 text-muted-foreground">
              {contact.position && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {contact.position}
                </span>
              )}
              {contact.position && contact.company && (
                <span className="mx-1">•</span>
              )}
              {contact.company && (
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {contact.company}
                </span>
              )}
            </div>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
          <Edit className="h-4 w-4 mr-1" />
          Edit
        </Button>
      </div>

      {/* Contact Badge */}
      {contact.relationshipType && (
        <Badge className="text-sm" variant="secondary">
          <Users className="h-3 w-3 mr-1" />
          {contact.relationshipType}
        </Badge>
      )}

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="info" className="space-y-4 pt-4">
          {/* Contact Information Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contact.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${contact.email}`} 
                    className="text-sm text-primary hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${contact.phone}`} 
                    className="text-sm"
                  >
                    {contact.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Social & Web Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Social & Web</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {contact.linkedinUrl && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={contact.linkedinUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    LinkedIn Profile 
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              
              {contact.websiteUrl && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={contact.websiteUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    Website
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Follow-up Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Follow-up Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Last Contact: {formattedLastContact}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Next Follow-up: {formattedNextFollowUp}</span>
              </div>

              {needsFollowUp() && (
                <div className="col-span-2">
                  <Badge variant="outline" className="bg-red-100 text-red-800 border-transparent">
                    Needs follow-up
                  </Badge>
                </div>
              )}

              <div className="col-span-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogInteraction}
                  disabled={logInteractionMutation.isPending}
                  className="w-full"
                >
                  {logInteractionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Log Interaction Today
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Metadata Information */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Record Information</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Added on {formattedCreatedAt}</span>
            </div>
          </div>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions" className="py-4">
          <div className="text-center py-6">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mt-4">Interaction history is not available</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              This feature is coming soon. You will be able to track all interactions, meetings, and communications with this contact.
            </p>
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="py-4">
          {contact.notes ? (
            <div className="p-4 bg-muted/50 rounded-md">
              <p className="whitespace-pre-wrap">{contact.notes}</p>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mt-4">No notes available</h3>
              <p className="text-muted-foreground mt-2">
                There are no notes for this contact. Edit the contact to add notes.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}