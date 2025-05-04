import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { NetworkingContact, ContactInteraction, FollowupAction } from '@shared/schema';
import { format } from 'date-fns';
import ContactForm from './ContactForm';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';

// Define the type for individual notes
interface ContactNote {
  id: string;
  contactId: number;
  text: string;
  timestamp: string;
}

// Helper functions for managing notes in localStorage
const NOTES_STORAGE_PREFIX = 'ascentul.notes.';

const getContactNotesKey = (contactId: number): string => {
  return `${NOTES_STORAGE_PREFIX}${contactId}`;
};

const getContactNotes = (contactId: number): ContactNote[] => {
  const storageKey = getContactNotesKey(contactId);
  const notesJson = localStorage.getItem(storageKey);
  return notesJson ? JSON.parse(notesJson) : [];
};

const saveContactNotes = (contactId: number, notes: ContactNote[]): void => {
  const storageKey = getContactNotesKey(contactId);
  localStorage.setItem(storageKey, JSON.stringify(notes));
};

const addContactNote = (contactId: number, text: string): ContactNote => {
  const notes = getContactNotes(contactId);
  const newNote: ContactNote = {
    id: uuidv4(),
    contactId,
    text,
    timestamp: new Date().toISOString()
  };
  
  // Add to the beginning for reverse chronological order
  notes.unshift(newNote);
  saveContactNotes(contactId, notes);
  return newNote;
};

const updateContactNote = (contactId: number, noteId: string, text: string): ContactNote | null => {
  const notes = getContactNotes(contactId);
  const noteIndex = notes.findIndex(note => note.id === noteId);
  
  if (noteIndex === -1) return null;
  
  notes[noteIndex] = {
    ...notes[noteIndex],
    text,
    timestamp: new Date().toISOString() // Update timestamp on edit
  };
  
  saveContactNotes(contactId, notes);
  return notes[noteIndex];
};

const deleteContactNote = (contactId: number, noteId: string): boolean => {
  const notes = getContactNotes(contactId);
  const filteredNotes = notes.filter(note => note.id !== noteId);
  
  if (filteredNotes.length === notes.length) return false;
  
  saveContactNotes(contactId, filteredNotes);
  return true;
};

// UI Components
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertCircle,
  Building,
  Calendar,
  CalendarPlus,
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
  Utensils,
  Trash,
  Pencil,
  Check,
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

// Form schema for scheduling follow-up
const followUpFormSchema = z.object({
  followUpDate: z.date({
    required_error: "Please select a follow-up date",
  }),
  notes: z.string().min(3, "Notes must be at least 3 characters").max(500, "Notes must not exceed 500 characters"),
  reminderType: z.enum(["Email", "Call", "Meeting", "Coffee", "Lunch", "Other"], {
    required_error: "Please select a follow-up type",
  }),
});

type InteractionFormValues = z.infer<typeof interactionFormSchema>;
type FollowUpFormValues = z.infer<typeof followUpFormSchema>;

export default function ContactDetails({ contactId, onClose }: ContactDetailsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [editingInteraction, setEditingInteraction] = useState<ContactInteraction | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowupAction | null>(null);
  const [notesText, setNotesText] = useState<string>("");
  
  // Contact notes from localStorage
  const [contactNotes, setContactNotes] = useState<ContactNote[]>([]);
  const [editingNote, setEditingNote] = useState<ContactNote | null>(null);
  const [newNoteText, setNewNoteText] = useState("");
  
  // Load notes from localStorage when contact changes
  useEffect(() => {
    if (contactId) {
      const notes = getContactNotes(contactId);
      setContactNotes(notes);
    }
  }, [contactId]);

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
    onSuccess: (data) => {
      setNotesText(data.notes || '');
      
      // If no notes exist in localStorage, but there's a legacy note in the contact data,
      // migrate it to the new format
      const existingNotes = getContactNotes(contactId);
      if (existingNotes.length === 0 && data.notes) {
        const migratedNote = addContactNote(contactId, data.notes);
        setContactNotes([migratedNote]);
      }
    }
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
  
  // Fetch contact follow-ups
  const {
    data: followUps = [],
    isLoading: isLoadingFollowUps,
  } = useQuery({
    queryKey: [`/api/contacts/${contactId}/followups`],
    queryFn: async () => apiRequest<FollowupAction[]>({
      url: `/api/contacts/${contactId}/followups`,
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
  
  // Form for follow-up
  const followUpForm = useForm<FollowUpFormValues>({
    resolver: zodResolver(followUpFormSchema),
    defaultValues: {
      followUpDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week from now
      notes: "",
      reminderType: "Email",
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
  
  // Schedule follow-up mutation
  const scheduleFollowUpMutation = useMutation({
    mutationFn: async (values: FollowUpFormValues) => {
      console.log("🔎 Starting form submission with values:", values);
      
      // Validate the date field
      let dateToUse: Date;
      
      if (!values.followUpDate) {
        console.warn("⚠️ No date provided, using current date");
        dateToUse = new Date();
      } else if (values.followUpDate instanceof Date) {
        if (isNaN(values.followUpDate.getTime())) {
          console.error("❌ Invalid Date object, timestamp is NaN");
          throw new Error("Invalid date selected");
        }
        console.log("✅ Valid Date object provided:", values.followUpDate);
        dateToUse = values.followUpDate;
      } else {
        // Handle string dates by creating a new Date object
        console.log("🔄 Converting string date to Date object:", values.followUpDate);
        const parsedDate = new Date(values.followUpDate);
        
        if (isNaN(parsedDate.getTime())) {
          console.error("❌ Failed to parse date string:", values.followUpDate);
          throw new Error("Could not parse the provided date");
        }
        
        console.log("✅ Successfully parsed date:", parsedDate);
        dateToUse = parsedDate;
      }
      
      // Extra sanity check - if date is Dec 31, 1969 (invalid timestamp near epoch), reject it
      if (dateToUse.getFullYear() < 2000) {
        console.error("❌ Suspicious date detected:", dateToUse);
        throw new Error("Invalid date detected. Please try again with a valid date.");
      }
      
      // Format server data
      const serverData = {
        type: values.reminderType,
        notes: values.notes,
        dueDate: dateToUse.toISOString(),
      };
      
      console.log('📤 Submitting follow-up with data:', serverData);
      
      return apiRequest({
        url: `/api/contacts/${contactId}/schedule-followup`,
        method: 'POST',
        data: serverData,
      });
    },
    onSuccess: () => {
      setShowFollowUpForm(false);
      followUpForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: 'Follow-up scheduled',
        description: 'Follow-up reminder has been scheduled successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to schedule follow-up. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Mark follow-up as complete mutation
  const markFollowUpCompleteMutation = useMutation({
    mutationFn: async (followUpId: number) => {
      return apiRequest({
        url: `/api/contacts/${contactId}/followups/${followUpId}/complete`,
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: 'Follow-up completed',
        description: 'Follow-up has been marked as completed.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark follow-up as complete. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Delete follow-up mutation
  const deleteFollowUpMutation = useMutation({
    mutationFn: async (followUpId: number) => {
      return apiRequest({
        url: `/api/contacts/${contactId}/followups/${followUpId}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: 'Follow-up deleted',
        description: 'Follow-up has been removed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete follow-up. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Update follow-up mutation
  const updateFollowUpMutation = useMutation({
    mutationFn: async ({ followUpId, data }: { followUpId: number; data: Partial<FollowupAction> }) => {
      return apiRequest({
        url: `/api/contacts/${contactId}/followups/${followUpId}`,
        method: 'PUT',
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/followups`] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      toast({
        title: 'Follow-up updated',
        description: 'Follow-up has been updated successfully.',
      });
      // Reset editing state
      setEditingFollowUp(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update follow-up. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Update interaction mutation
  const updateInteractionMutation = useMutation({
    mutationFn: async ({ interactionId, data }: { interactionId: number; data: Partial<ContactInteraction> }) => {
      return apiRequest({
        url: `/api/contacts/interactions/${interactionId}`,
        method: 'PUT',
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/interactions`] });
      toast({
        title: 'Interaction updated',
        description: 'Interaction has been updated successfully.',
      });
      // Reset editing state
      setEditingInteraction(null);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update interaction. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Update contact notes mutation
  const updateContactNotesMutation = useMutation({
    mutationFn: async (notes: string) => {
      return apiRequest({
        url: `/api/contacts/${contactId}`,
        method: 'PATCH',
        data: { notes },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
      toast({
        title: 'Notes updated',
        description: 'Contact notes have been updated successfully.',
      });
      setIsEditing(false); // Close editing mode
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update notes. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Delete interaction mutation
  const deleteInteractionMutation = useMutation({
    mutationFn: async (interactionId: number) => {
      return apiRequest({
        url: `/api/contacts/interactions/${interactionId}`,
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}/interactions`] });
      toast({
        title: 'Interaction deleted',
        description: 'Interaction has been removed successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete interaction. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      const newNote = addContactNote(contactId, text);
      return newNote;
    },
    onSuccess: (newNote) => {
      // Reset the text input
      setNewNoteText("");
      // Update state with the new note
      setContactNotes(prevNotes => [newNote, ...prevNotes]);
      toast({
        title: 'Note added',
        description: 'Contact note has been added successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add note. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ noteId, text }: { noteId: string, text: string }) => {
      const updatedNote = updateContactNote(contactId, noteId, text);
      return updatedNote;
    },
    onSuccess: (updatedNote) => {
      if (updatedNote) {
        // Update the notes array with the updated note
        setContactNotes(prevNotes => 
          prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note)
        );
        // Reset editing state
        setEditingNote(null);
        toast({
          title: 'Note updated',
          description: 'Contact note has been updated successfully.',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update note. Please try again.',
        variant: 'destructive',
      });
    },
  });
  
  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const success = deleteContactNote(contactId, noteId);
      return { success, noteId };
    },
    onSuccess: ({ success, noteId }) => {
      if (success) {
        // Remove the deleted note from state
        setContactNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
        toast({
          title: 'Note deleted',
          description: 'Contact note has been deleted successfully.',
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete note. Please try again.',
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
    ? format(new Date(contact.createdAt), 'MMMM d, yyyy').replace(/-/g, ' ')
    : 'Unknown';
  
  const formattedLastContact = contact.lastContactedDate
    ? format(new Date(contact.lastContactedDate), 'MMMM d, yyyy').replace(/-/g, ' ')
    : 'Never';
  
  // Find the next scheduled follow-up that's not completed
  const getNextFollowUp = () => {
    if (isLoadingFollowUps || !followUps.length) return null;
    
    // Filter follow-ups that aren't completed and sort by due date (earliest first)
    const pendingFollowUps = followUps
      .filter(followUp => !followUp.completed && followUp.dueDate)
      .sort((a, b) => {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return dateA.getTime() - dateB.getTime();
      });
    
    // Return the earliest pending follow-up if it exists
    return pendingFollowUps.length > 0 ? pendingFollowUps[0] : null;
  };
  
  const nextFollowUp = getNextFollowUp();
  
  // Format next follow-up date and display with time remaining
  const formattedNextFollowUp = nextFollowUp?.dueDate 
    ? (() => {
        const dueDate = new Date(nextFollowUp.dueDate);
        const daysUntil = Math.ceil((dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        // Generate a description of how many days until the follow-up
        const timeDescription = daysUntil < 0 
          ? `${Math.abs(daysUntil)} days overdue` 
          : daysUntil === 0 
            ? 'Today' 
            : daysUntil === 1 
              ? 'Tomorrow' 
              : `In ${daysUntil} days`;
        
        return `${format(dueDate, 'MMM d, yyyy').replace(/-/g, ' ')} (${timeDescription})`;
      })()
    : 'Not scheduled';

  // Check if follow-up is needed
  const needsFollowUp = () => {
    // Case 1: No last contact date means we should follow up
    if (!contact.lastContactedDate) return true;
    
    // Case 2: If we have scheduled follow-ups that are overdue
    const overdueFollowUp = followUps.some(followUp => {
      return !followUp.completed && 
        followUp.dueDate && 
        new Date(followUp.dueDate) < new Date();
    });
    
    if (overdueFollowUp) return true;
    
    // Case 3: Traditional 30-day rule (if no specific follow-up is scheduled)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return (!nextFollowUp && new Date(contact.lastContactedDate) < thirtyDaysAgo);
  };

  // Handle log interaction
  const handleLogInteraction = (data: InteractionFormValues) => {
    logInteractionMutation.mutate(data);
  };
  
  // Handle schedule follow-up
  const handleScheduleFollowUp = (data: FollowUpFormValues) => {
    scheduleFollowUpMutation.mutate(data);
  };
  
  // Handle log interaction button click
  const handleQuickInteraction = () => {
    setActiveTab("interactions");
    setShowInteractionForm(true);
  };
  
  // Handle schedule follow-up button click
  const handleQuickFollowUp = () => {
    setActiveTab("follow-ups");
    setShowFollowUpForm(true);
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
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
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm">Last Contact:</span>
                  <span className="text-sm text-muted-foreground">{formattedLastContact}</span>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <CalendarClock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="flex flex-col">
                  <span className="text-sm">Next Follow-up:</span>
                  <span className="text-sm text-muted-foreground">{formattedNextFollowUp}</span>
                </div>
              </div>

              <div className="col-span-2 mt-2 space-y-2">
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
                      Log Interaction
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleQuickFollowUp}
                  className="w-full"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule Follow-up
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(interaction.date), 'MMM d, yyyy').replace(/-/g, ' ')}
                          </p>
                          <div className="flex gap-1 ml-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingInteraction(interaction)}
                              title="Edit interaction"
                            >
                              <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => {
                                if (window.confirm('Are you sure you want to delete this interaction?')) {
                                  deleteInteractionMutation.mutate(interaction.id);
                                }
                              }}
                              title="Delete interaction"
                            >
                              <Trash className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                            </Button>
                          </div>
                        </div>
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
        
        {/* Follow-ups Tab */}
        <TabsContent value="follow-ups" className="py-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Follow-up Reminders</h3>
              <Button 
                size="sm" 
                onClick={() => setShowFollowUpForm(true)}
                className="gap-1"
              >
                <Plus className="h-4 w-4" /> Schedule Follow-up
              </Button>
            </div>
            
            {/* Follow-up Form Dialog */}
            {showFollowUpForm && (
              <Dialog open={showFollowUpForm} onOpenChange={setShowFollowUpForm}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Schedule Follow-up</DialogTitle>
                  </DialogHeader>
                  
                  <Form {...followUpForm}>
                    <form onSubmit={followUpForm.handleSubmit(handleScheduleFollowUp)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={followUpForm.control}
                          name="followUpDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Follow-up Date</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date"
                                  data-testid="follow-up-date-input"
                                  id="follow-up-date"
                                  value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      // Log the raw date input from the date picker
                                      console.log("🚨 Raw Date Input:", e.target.value);
                                      
                                      // Create a date using a direct string conversion with time component
                                      // Format: YYYY-MM-DDT00:00:00
                                      const dateString = e.target.value + 'T00:00:00';
                                      const date = new Date(dateString);
                                      
                                      console.log("📆 Parsed Date Object:", date);
                                      console.log("⏱ Timestamp:", date.getTime());
                                      console.log("📅 ISO String:", date.toISOString());
                                      
                                      // Set the raw Date object as the field value
                                      field.onChange(date);
                                    } else {
                                      console.log("⚠️ Empty date input");
                                      field.onChange(null);
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={followUpForm.control}
                          name="reminderType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Follow-up Type</FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select follow-up type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="Email">Send Email</SelectItem>
                                  <SelectItem value="Call">Make Call</SelectItem>
                                  <SelectItem value="Meeting">Schedule Meeting</SelectItem>
                                  <SelectItem value="Coffee">Coffee Meetup</SelectItem>
                                  <SelectItem value="Lunch">Lunch Meetup</SelectItem>
                                  <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={followUpForm.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter notes for this follow-up" 
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
                          onClick={() => setShowFollowUpForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit"
                          disabled={scheduleFollowUpMutation.isPending}
                        >
                          {scheduleFollowUpMutation.isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            'Schedule Follow-up'
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
            
            {/* Follow-ups List */}
            {isLoadingFollowUps ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : followUps.length > 0 ? (
              <div className="space-y-4">
                {followUps.map((followUp) => (
                  <Card key={followUp.id} className={cn(
                    "overflow-hidden", 
                    followUp.completed ? "opacity-70" : "",
                    new Date(followUp.dueDate) < new Date() && !followUp.completed ? "border-red-300" : ""
                  )}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {(() => {
                            // Extract the type from the format 'contact_Type'
                            const reminderType = followUp.type?.startsWith('contact_') 
                              ? followUp.type.replace('contact_', '') 
                              : followUp.type;
                            
                            // Render appropriate icon based on type
                            switch(reminderType) {
                              case 'Call':
                                return <Phone className="h-4 w-4 text-blue-500" />;
                              case 'Email':
                                return <Mail className="h-4 w-4 text-green-500" />;
                              case 'Meeting':
                                return <Users className="h-4 w-4 text-purple-500" />;
                              case 'Coffee':
                                return <Coffee className="h-4 w-4 text-amber-500" />;
                              case 'Lunch':
                                return <Utensils className="h-4 w-4 text-orange-500" />;
                              default:
                                return <CalendarPlus className="h-4 w-4 text-gray-500" />;
                            }
                          })()}
                          <div>
                            <CardTitle className="text-base font-medium">
                              {/* Extract the type from the format 'contact_Type' */}
                              {followUp.type?.startsWith('contact_') 
                                ? followUp.type.replace('contact_', '') 
                                : followUp.type} {format(new Date(followUp.dueDate), 'MMM d, yyyy').replace(/-/g, ' ')}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              {followUp.completed 
                                ? `Completed on ${followUp.completedDate ? format(new Date(followUp.completedDate), 'MMM d, yyyy').replace(/-/g, ' ') : 'Unknown'}`
                                : new Date(followUp.dueDate) < new Date() 
                                  ? 'Overdue' 
                                  : `Due in ${Math.ceil((new Date(followUp.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                              }
                            </CardDescription>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          {!followUp.completed && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              onClick={() => markFollowUpCompleteMutation.mutate(followUp.id)}
                              disabled={markFollowUpCompleteMutation.isPending}
                            >
                              {markFollowUpCompleteMutation.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                'Mark Complete'
                              )}
                            </Button>
                          )}
                          {!followUp.completed && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="h-8 px-2 text-xs"
                              onClick={() => setEditingFollowUp(followUp)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
                            onClick={() => deleteFollowUpMutation.mutate(followUp.id)}
                            disabled={deleteFollowUpMutation.isPending}
                          >
                            {deleteFollowUpMutation.isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {followUp.notes && (
                      <CardContent className="pb-4 pt-0">
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{followUp.notes}</p>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mt-4">No follow-ups scheduled</h3>
                <p className="text-muted-foreground mt-2">
                  Schedule follow-ups to keep track of when to reconnect with this contact.
                </p>
                <Button 
                  onClick={() => setShowFollowUpForm(true)} 
                  variant="outline" 
                  className="mt-4"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Schedule a Follow-up
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="py-4">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Notes</h3>
              <Button 
                onClick={() => {
                  setNewNoteText(""); 
                  setIsEditing(true);
                }} 
                size="sm"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
            </div>
            
            {contactNotes.length > 0 ? (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {contactNotes.map((note) => (
                  <div key={note.id} className="relative p-4 bg-muted/50 rounded-md">
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingNote(note);
                          setNewNoteText(note.text);
                          setIsEditing(true);
                        }} 
                        className="h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                        <span className="sr-only">Edit note</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteNoteMutation.mutate(note.id)} 
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive/90"
                      >
                        <Trash className="h-3 w-3" />
                        <span className="sr-only">Delete note</span>
                      </Button>
                    </div>
                    
                    <p className="whitespace-pre-wrap mb-2">{note.text}</p>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium mt-4">No notes available</h3>
                <p className="text-muted-foreground mt-2">
                  There are no notes for this contact yet.
                </p>
                <Button 
                  onClick={() => {
                    setNewNoteText("");
                    setIsEditing(true);
                  }} 
                  variant="outline" 
                  className="mt-4"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Note
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Interaction Dialog */}
      {editingInteraction && (
        <Dialog open={!!editingInteraction} onOpenChange={(open) => !open && setEditingInteraction(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Interaction</DialogTitle>
              <DialogDescription>
                Update the details of this interaction.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Interaction Type</label>
                  <Select 
                    value={editingInteraction.interactionType}
                    onValueChange={(value) => {
                      setEditingInteraction({
                        ...editingInteraction,
                        interactionType: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select interaction type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Video Call">Video Call</SelectItem>
                      <SelectItem value="Coffee Chat">Coffee Chat</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input 
                    type="date"
                    value={new Date(editingInteraction.date).toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const dateString = e.target.value + 'T00:00:00';
                        const date = new Date(dateString);
                        setEditingInteraction({
                          ...editingInteraction,
                          date: date
                        });
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea 
                  placeholder="Enter details about this interaction" 
                  className="min-h-[100px]"
                  value={editingInteraction.notes || ''}
                  onChange={(e) => {
                    setEditingInteraction({
                      ...editingInteraction,
                      notes: e.target.value
                    });
                  }}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditingInteraction(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateInteractionMutation.mutate({
                      interactionId: editingInteraction.id,
                      data: {
                        interactionType: editingInteraction.interactionType,
                        date: editingInteraction.date,
                        notes: editingInteraction.notes
                      }
                    });
                  }}
                  disabled={updateInteractionMutation.isPending}
                >
                  {updateInteractionMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Interaction'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Follow-up Dialog */}
      {editingFollowUp && (
        <Dialog open={!!editingFollowUp} onOpenChange={(open) => !open && setEditingFollowUp(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Edit Follow-up</DialogTitle>
              <DialogDescription>
                Update the details of this follow-up.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Follow-up Type</label>
                  <Select 
                    value={editingFollowUp.type}
                    onValueChange={(value) => {
                      setEditingFollowUp({
                        ...editingFollowUp,
                        type: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select follow-up type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Call">Call</SelectItem>
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Meeting">Meeting</SelectItem>
                      <SelectItem value="Coffee">Coffee</SelectItem>
                      <SelectItem value="Lunch">Lunch</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">Due Date</label>
                  <Input 
                    type="date"
                    value={new Date(editingFollowUp.dueDate).toISOString().split('T')[0]}
                    onChange={(e) => {
                      if (e.target.value) {
                        const dateString = e.target.value + 'T00:00:00';
                        const date = new Date(dateString);
                        setEditingFollowUp({
                          ...editingFollowUp,
                          dueDate: date.toISOString()
                        });
                      }
                    }}
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea 
                  placeholder="Enter details about this follow-up" 
                  className="min-h-[100px]"
                  value={editingFollowUp.notes || ''}
                  onChange={(e) => {
                    setEditingFollowUp({
                      ...editingFollowUp,
                      notes: e.target.value
                    });
                  }}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setEditingFollowUp(null)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateFollowUpMutation.mutate({
                      followUpId: editingFollowUp.id,
                      data: {
                        type: editingFollowUp.type,
                        dueDate: editingFollowUp.dueDate,
                        notes: editingFollowUp.notes
                      }
                    });
                  }}
                  disabled={updateFollowUpMutation.isPending}
                >
                  {updateFollowUpMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Follow-up'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Notes Dialog */}
      <Dialog open={activeTab === "notes" && isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Contact Notes</DialogTitle>
            <DialogDescription>
              Update notes for this contact.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Enter notes about this contact" 
                className="min-h-[200px]"
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={() => updateContactNotesMutation.mutate(notesText)}
                disabled={updateContactNotesMutation.isPending}
              >
                {updateContactNotesMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Notes'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}