import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { NetworkingContact, ContactInteraction } from '@shared/schema';
import { format } from 'date-fns';
import ContactForm from './ContactForm';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

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
  MessageSquare,
  Video,
  Coffee,
  Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface ContactDetailsProps {
  contactId: number;
  onClose: () => void;
}

// Form schema for logging interaction
const interactionFormSchema = z.object({
  interactionType: z.string({
    required_error: "Please select an interaction type",
  }),
  notes: z.string().min(3, "Notes must be at least 3 characters").max(500, "Notes must not exceed 500 characters"),
  date: z.date({
    required_error: "Please select a date",
  }),
});

type InteractionFormValues = z.infer<typeof interactionFormSchema>;

export default function ContactDetails({ contactId, onClose }: ContactDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  
  // Fetch contact data
  const {
    data: contact,
    isLoading,
    error,
  } = useQuery({
    queryKey: [`/api/contacts/${contactId}`],
    queryFn: async () => apiRequest<NetworkingContact>({
      url: `/api/contacts/${contactId}`,
      method: 'GET',
    }),
  });
  
  // Fetch contact interactions
  const {
    data: interactions = [],
    isLoading: isLoadingInteractions,
  } = useQuery({
    queryKey: [`/api/contacts/${contactId}/interactions`],
    queryFn: async () => apiRequest<ContactInteraction[]>({
      url: `/api/contacts/${contactId}/interactions`,
      method: 'GET',
    }),
    enabled: !!contactId,
  });

  // Form for interaction
  const interactionForm = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      interactionType: "",
      notes: "",
      date: new Date(),
    },
  });

  // Log interaction mutation
  const logInteractionMutation = useMutation({
    mutationFn: async (values: InteractionFormValues) => {
      return apiRequest({
        url: `/api/contacts/${contactId}/log-interaction`,
        method: 'POST',
        data: values,
      });
    },
    onSuccess: () => {
      setShowInteractionForm(false);
      interactionForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/interactions`] });
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
  
  const formattedLastContact = contact.lastContactedDate
    ? format(new Date(contact.lastContactedDate), 'MMMM d, yyyy')
    : 'Never';
  
  // NOTE: nextFollowUpDate is not in the current schema
  const formattedNextFollowUp = 'Not scheduled';

  // Check if follow-up is needed
  const needsFollowUp = () => {
    if (!contact.lastContactedDate) return true;
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return new Date(contact.lastContactedDate) < thirtyDaysAgo;
  };

  // Handle log interaction
  const handleLogInteraction = (data: InteractionFormValues) => {
    logInteractionMutation.mutate(data);
  };
  
  // Handle simple quick interaction log
  const handleQuickInteraction = () => {
    logInteractionMutation.mutate({
      interactionType: "Other",
      notes: "Quick interaction logged",
      date: new Date(),
    });
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
              {contact.jobTitle && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  {contact.jobTitle}
                </span>
              )}
              {contact.jobTitle && contact.company && (
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
              {contact.linkedInUrl && (
                <div className="flex items-center gap-2">
                  <Linkedin className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={contact.linkedInUrl} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center"
                  >
                    LinkedIn Profile 
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
              {/* Website URL field is not in the current schema */}
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
                  onClick={handleQuickInteraction}
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
                      Log Quick Interaction
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
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Interaction History</h3>
              <Button 
                size="sm" 
                onClick={() => setShowInteractionForm(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Log Interaction
              </Button>
            </div>
            
            {/* Interaction Form Dialog */}
            {showInteractionForm && (
              <Dialog open={showInteractionForm} onOpenChange={setShowInteractionForm}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Log New Interaction</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...interactionForm}>
                    <form onSubmit={interactionForm.handleSubmit(handleLogInteraction)} className="space-y-4">
                      <FormField
                        control={interactionForm.control}
                        name="interactionType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Interaction Type</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select interaction type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Call">Call</SelectItem>
                                <SelectItem value="Email">Email</SelectItem>
                                <SelectItem value="Meeting">Meeting</SelectItem>
                                <SelectItem value="Video Call">Video Call</SelectItem>
                                <SelectItem value="Coffee Chat">Coffee Chat</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={interactionForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl>
                              <Input 
                                type="date"
                                value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const date = e.target.value ? new Date(e.target.value) : new Date();
                                  field.onChange(date);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={interactionForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter notes about this interaction" 
                                className="min-h-[100px]"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-end gap-2 pt-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => setShowInteractionForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={logInteractionMutation.isPending}
                        >
                          {logInteractionMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Save Interaction'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Interaction List */}
            {isLoadingInteractions ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : interactions.length > 0 ? (
              <div className="space-y-4">
                {interactions.map((interaction) => (
                  <Card key={interaction.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {interaction.interactionType === 'Call' && <Phone className="h-4 w-4 text-blue-500" />}
                          {interaction.interactionType === 'Email' && <Mail className="h-4 w-4 text-green-500" />}
                          {interaction.interactionType === 'Meeting' && <Users className="h-4 w-4 text-purple-500" />}
                          {interaction.interactionType === 'Video Call' && <Video className="h-4 w-4 text-red-500" />}
                          {interaction.interactionType === 'Coffee Chat' && <Coffee className="h-4 w-4 text-amber-500" />}
                          {interaction.interactionType === 'Other' && <MessageSquare className="h-4 w-4 text-gray-500" />}
                          <CardTitle className="text-base">{interaction.interactionType}</CardTitle>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(interaction.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{interaction.notes}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mt-4">No interactions yet</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  Record your calls, meetings, and other communications with this contact to keep track of your relationship.
                </p>
              </div>
            )}
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