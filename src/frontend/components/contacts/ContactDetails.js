import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import ContactForm from './ContactForm';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { v4 as uuidv4 } from 'uuid';
// Helper functions for managing notes in localStorage
const NOTES_STORAGE_PREFIX = 'ascentul.notes.';
const getContactNotesKey = (contactId) => {
    return `${NOTES_STORAGE_PREFIX}${contactId}`;
};
const getContactNotes = (contactId) => {
    const storageKey = getContactNotesKey(contactId);
    const notesJson = localStorage.getItem(storageKey);
    return notesJson ? JSON.parse(notesJson) : [];
};
const saveContactNotes = (contactId, notes) => {
    const storageKey = getContactNotesKey(contactId);
    localStorage.setItem(storageKey, JSON.stringify(notes));
};
const addContactNote = (contactId, text) => {
    const notes = getContactNotes(contactId);
    const newNote = {
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
const updateContactNote = (contactId, noteId, text) => {
    const notes = getContactNotes(contactId);
    const noteIndex = notes.findIndex(note => note.id === noteId);
    if (noteIndex === -1)
        return null;
    notes[noteIndex] = {
        ...notes[noteIndex],
        text,
        timestamp: new Date().toISOString() // Update timestamp on edit
    };
    saveContactNotes(contactId, notes);
    return notes[noteIndex];
};
const deleteContactNote = (contactId, noteId) => {
    const notes = getContactNotes(contactId);
    const filteredNotes = notes.filter(note => note.id !== noteId);
    if (filteredNotes.length === notes.length)
        return false;
    saveContactNotes(contactId, filteredNotes);
    return true;
};
// UI Components
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, } from '@/components/ui/dialog';
import { AlertCircle, Building, Calendar, CalendarPlus, Edit, ExternalLink, Loader2, Mail, Phone, UserRound, Users, Briefcase, Linkedin, Clock, CalendarClock, MessageSquare, Video, Coffee, Plus, Utensils, Trash, Check, } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from '@/components/ui/card';
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
export default function ContactDetails({ contactId, onClose }) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditing, setIsEditing] = useState(false);
    const [showInteractionForm, setShowInteractionForm] = useState(false);
    const [showFollowUpForm, setShowFollowUpForm] = useState(false);
    const [activeTab, setActiveTab] = useState("info");
    const [editingInteraction, setEditingInteraction] = useState(null);
    const [editingFollowUp, setEditingFollowUp] = useState(null);
    const [notesText, setNotesText] = useState("");
    // Contact notes from localStorage
    const [contactNotes, setContactNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const [newNoteText, setNewNoteText] = useState("");
    const [showNoteDialog, setShowNoteDialog] = useState(false);
    // Load notes from localStorage when contact changes
    useEffect(() => {
        if (contactId) {
            const notes = getContactNotes(contactId);
            setContactNotes(notes);
        }
    }, [contactId]);
    // Fetch contact data
    const { data: contact, isLoading, error, } = useQuery({
        queryKey: [`/api/contacts/${contactId}`],
        queryFn: async () => apiRequest({
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
    const { data: interactions = [], isLoading: isLoadingInteractions, } = useQuery({
        queryKey: [`/api/contacts/${contactId}/interactions`],
        queryFn: async () => apiRequest({
            url: `/api/contacts/${contactId}/interactions`,
            method: 'GET',
        }),
        enabled: !!contactId,
    });
    // Fetch contact follow-ups
    const { data: followUps = [], isLoading: isLoadingFollowUps, } = useQuery({
        queryKey: [`/api/contacts/${contactId}/followups`],
        queryFn: async () => apiRequest({
            url: `/api/contacts/${contactId}/followups`,
            method: 'GET',
        }),
        enabled: !!contactId,
    });
    // Form for interaction
    const interactionForm = useForm({
        resolver: zodResolver(interactionFormSchema),
        defaultValues: {
            interactionType: "",
            notes: "",
            date: new Date(),
        },
    });
    // Form for follow-up
    const followUpForm = useForm({
        resolver: zodResolver(followUpFormSchema),
        defaultValues: {
            followUpDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Default to 1 week from now
            notes: "",
            reminderType: "Email",
        },
    });
    // Log interaction mutation
    const logInteractionMutation = useMutation({
        mutationFn: async (values) => {
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
        mutationFn: async (values) => {
            console.log("🔎 Starting form submission with values:", values);
            // Validate the date field
            let dateToUse;
            if (!values.followUpDate) {
                console.warn("⚠️ No date provided, using current date");
                dateToUse = new Date();
            }
            else if (values.followUpDate instanceof Date) {
                if (isNaN(values.followUpDate.getTime())) {
                    console.error("❌ Invalid Date object, timestamp is NaN");
                    throw new Error("Invalid date selected");
                }
                console.log("✅ Valid Date object provided:", values.followUpDate);
                dateToUse = values.followUpDate;
            }
            else {
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
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] }); // Invalidate dashboard follow-up overview
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
        mutationFn: async (followUpId) => {
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
        mutationFn: async (followUpId) => {
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
        mutationFn: async ({ followUpId, data }) => {
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
        mutationFn: async ({ interactionId, data }) => {
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
        mutationFn: async (notes) => {
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
        mutationFn: async (interactionId) => {
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
        mutationFn: async (text) => {
            const newNote = addContactNote(contactId, text);
            return newNote;
        },
        onSuccess: (newNote) => {
            // Reset the text input
            setNewNoteText("");
            // Close the dialog
            setShowNoteDialog(false);
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
        mutationFn: async ({ noteId, text }) => {
            const updatedNote = updateContactNote(contactId, noteId, text);
            return updatedNote;
        },
        onSuccess: (updatedNote) => {
            if (updatedNote) {
                // Update the notes array with the updated note
                setContactNotes(prevNotes => prevNotes.map(note => note.id === updatedNote.id ? updatedNote : note));
                // Reset editing state
                setEditingNote(null);
                // Close the dialog
                setShowNoteDialog(false);
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
        mutationFn: async (noteId) => {
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
        return (_jsxs("div", { className: "flex flex-col items-center justify-center p-8", children: [_jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }), _jsx("p", { className: "mt-2 text-muted-foreground", children: "Loading contact details..." })] }));
    }
    if (error || !contact) {
        return (_jsxs("div", { className: "flex flex-col items-center justify-center p-8 text-center", children: [_jsx(AlertCircle, { className: "h-8 w-8 text-destructive" }), _jsx("p", { className: "mt-2 text-lg font-medium", children: "Contact Not Found" }), _jsx("p", { className: "mt-1 text-muted-foreground", children: "This contact may have been deleted or doesn't exist anymore." }), _jsxs("div", { className: "flex gap-2 mt-4", children: [_jsx(Button, { onClick: () => {
                                // Refresh the contacts list to sync with server state
                                queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
                                onClose();
                            }, className: "mt-4", variant: "default", children: "Refresh Contacts" }), _jsx(Button, { onClick: onClose, className: "mt-4", variant: "outline", children: "Close" })] })] }));
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
        if (isLoadingFollowUps || !followUps.length)
            return null;
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
        if (!contact.lastContactedDate)
            return true;
        // Case 2: If we have scheduled follow-ups that are overdue
        const overdueFollowUp = followUps.some(followUp => {
            return !followUp.completed &&
                followUp.dueDate &&
                new Date(followUp.dueDate) < new Date();
        });
        if (overdueFollowUp)
            return true;
        // Case 3: Traditional 30-day rule (if no specific follow-up is scheduled)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return (!nextFollowUp && new Date(contact.lastContactedDate) < thirtyDaysAgo);
    };
    // Handle log interaction
    const handleLogInteraction = (data) => {
        logInteractionMutation.mutate(data);
    };
    // Handle schedule follow-up
    const handleScheduleFollowUp = (data) => {
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
        return (_jsx(Dialog, { open: isEditing, onOpenChange: setIsEditing, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Edit Contact" }) }), _jsx(ContactForm, { initialData: contact, isEdit: true, onSuccess: () => {
                            setIsEditing(false);
                            queryClient.invalidateQueries({ queryKey: [`/api/contacts/${contactId}`] });
                        }, onCancel: () => setIsEditing(false) })] }) }));
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center", children: [_jsx("div", { className: "h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl mr-4", children: contact.fullName ? contact.fullName.charAt(0).toUpperCase() : _jsx(UserRound, {}) }), _jsxs("div", { children: [_jsx("h2", { className: "text-xl font-semibold", children: contact.fullName }), _jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [contact.jobTitle && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Briefcase, { className: "h-3 w-3" }), contact.jobTitle] })), contact.jobTitle && contact.company && (_jsx("span", { className: "mx-1", children: "\u2022" })), contact.company && (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Building, { className: "h-3 w-3" }), contact.company] }))] })] })] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setIsEditing(true), children: [_jsx(Edit, { className: "h-4 w-4 mr-1" }), "Edit"] })] }), contact.relationshipType && (_jsxs(Badge, { className: "text-sm", variant: "secondary", children: [_jsx(Users, { className: "h-3 w-3 mr-1" }), contact.relationshipType] })), _jsxs(Tabs, { value: activeTab, onValueChange: setActiveTab, className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsx(TabsTrigger, { value: "info", children: "Info" }), _jsx(TabsTrigger, { value: "interactions", children: "Interactions" }), _jsx(TabsTrigger, { value: "follow-ups", children: "Follow-ups" }), _jsx(TabsTrigger, { value: "notes", children: "Notes" })] }), _jsxs(TabsContent, { value: "info", className: "space-y-4 pt-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-3", children: "Contact Information" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [contact.email && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Mail, { className: "h-4 w-4 text-muted-foreground" }), _jsx("a", { href: `mailto:${contact.email}`, className: "text-sm text-primary hover:underline", children: contact.email })] })), contact.phone && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Phone, { className: "h-4 w-4 text-muted-foreground" }), _jsx("a", { href: `tel:${contact.phone}`, className: "text-sm", children: contact.phone })] }))] })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-3", children: "Social & Web" }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: contact.linkedInUrl && (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Linkedin, { className: "h-4 w-4 text-muted-foreground" }), _jsxs("a", { href: contact.linkedInUrl, target: "_blank", rel: "noopener noreferrer", className: "text-sm text-primary hover:underline flex items-center", children: ["LinkedIn Profile", _jsx(ExternalLink, { className: "h-3 w-3 ml-1" })] })] })) })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-3", children: "Follow-up Information" }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { className: "flex items-start gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-muted-foreground mt-0.5" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm", children: "Last Contact:" }), _jsx("span", { className: "text-sm text-muted-foreground", children: formattedLastContact })] })] }), _jsxs("div", { className: "flex items-start gap-2", children: [_jsx(CalendarClock, { className: "h-4 w-4 text-muted-foreground mt-0.5" }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "text-sm", children: "Next Follow-up:" }), _jsx("span", { className: "text-sm text-muted-foreground", children: formattedNextFollowUp })] })] }), _jsxs("div", { className: "col-span-2 mt-2 space-y-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: handleQuickInteraction, disabled: logInteractionMutation.isPending, className: "w-full", children: logInteractionMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Logging..."] })) : (_jsxs(_Fragment, { children: [_jsx(Calendar, { className: "mr-2 h-4 w-4" }), "Log Interaction"] })) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: handleQuickFollowUp, className: "w-full", children: [_jsx(CalendarPlus, { className: "mr-2 h-4 w-4" }), "Schedule Follow-up"] })] })] })] }), _jsx(Separator, {}), _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-medium text-muted-foreground mb-3", children: "Record Information" }), _jsx("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: _jsxs("span", { children: ["Added on ", formattedCreatedAt] }) })] })] }), _jsx(TabsContent, { value: "interactions", className: "py-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-medium", children: "Interaction History" }), _jsxs(Button, { size: "sm", onClick: () => setShowInteractionForm(true), className: "gap-1", children: [_jsx(Plus, { className: "h-4 w-4" }), " Log Interaction"] })] }), showInteractionForm && (_jsx(Dialog, { open: showInteractionForm, onOpenChange: setShowInteractionForm, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Log New Interaction" }) }), _jsx(Form, { ...interactionForm, children: _jsxs("form", { onSubmit: interactionForm.handleSubmit(handleLogInteraction), className: "space-y-4", children: [_jsx(FormField, { control: interactionForm.control, name: "interactionType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Interaction Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select interaction type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Call", children: "Call" }), _jsx(SelectItem, { value: "Email", children: "Email" }), _jsx(SelectItem, { value: "Meeting", children: "Meeting" }), _jsx(SelectItem, { value: "Video Call", children: "Video Call" }), _jsx(SelectItem, { value: "Coffee Chat", children: "Coffee Chat" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: interactionForm.control, name: "date", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", value: field.value ? new Date(field.value).toISOString().split('T')[0] : '', onChange: (e) => {
                                                                                const date = e.target.value ? new Date(e.target.value) : new Date();
                                                                                field.onChange(date);
                                                                            } }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: interactionForm.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter notes about this interaction", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowInteractionForm(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: logInteractionMutation.isPending, children: logInteractionMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Save Interaction') })] })] }) })] }) })), isLoadingInteractions ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : interactions.length > 0 ? (_jsx("div", { className: "space-y-4", children: interactions.map((interaction) => (_jsxs(Card, { className: "overflow-hidden", children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex items-center gap-2", children: [interaction.interactionType === 'Call' && _jsx(Phone, { className: "h-4 w-4 text-blue-500" }), interaction.interactionType === 'Email' && _jsx(Mail, { className: "h-4 w-4 text-green-500" }), interaction.interactionType === 'Meeting' && _jsx(Users, { className: "h-4 w-4 text-purple-500" }), interaction.interactionType === 'Video Call' && _jsx(Video, { className: "h-4 w-4 text-red-500" }), interaction.interactionType === 'Coffee Chat' && _jsx(Coffee, { className: "h-4 w-4 text-amber-500" }), interaction.interactionType === 'Other' && _jsx(MessageSquare, { className: "h-4 w-4 text-gray-500" }), _jsx(CardTitle, { className: "text-base", children: interaction.interactionType })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: format(new Date(interaction.date), 'MMM d, yyyy').replace(/-/g, ' ') }), _jsxs("div", { className: "flex gap-1 ml-2", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => setEditingInteraction(interaction), title: "Edit interaction", children: _jsx(Edit, { className: "h-3.5 w-3.5 text-muted-foreground" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => {
                                                                                if (window.confirm('Are you sure you want to delete this interaction?')) {
                                                                                    deleteInteractionMutation.mutate(interaction.id);
                                                                                }
                                                                            }, title: "Delete interaction", children: _jsx(Trash, { className: "h-3.5 w-3.5 text-muted-foreground hover:text-destructive" }) })] })] })] }) }), _jsx(CardContent, { children: _jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap", children: interaction.notes }) })] }, interaction.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(Clock, { className: "h-12 w-12 mx-auto text-muted-foreground opacity-50" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No interactions yet" }), _jsx("p", { className: "text-muted-foreground mt-2 max-w-md mx-auto", children: "Record your calls, meetings, and other communications with this contact to keep track of your relationship." })] }))] }) }), _jsx(TabsContent, { value: "follow-ups", className: "py-4", children: _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-medium", children: "Follow-up Reminders" }), _jsxs(Button, { size: "sm", onClick: () => setShowFollowUpForm(true), className: "gap-1", children: [_jsx(Plus, { className: "h-4 w-4" }), " Schedule Follow-up"] })] }), showFollowUpForm && (_jsx(Dialog, { open: showFollowUpForm, onOpenChange: setShowFollowUpForm, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Schedule Follow-up" }) }), _jsx(Form, { ...followUpForm, children: _jsxs("form", { onSubmit: followUpForm.handleSubmit(handleScheduleFollowUp), className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsx(FormField, { control: followUpForm.control, name: "followUpDate", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Follow-up Date" }), _jsx(FormControl, { children: _jsx(Input, { type: "date", "data-testid": "follow-up-date-input", id: "follow-up-date", value: field.value ? new Date(field.value).toISOString().split('T')[0] : '', onChange: (e) => {
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
                                                                                        }
                                                                                        else {
                                                                                            console.log("⚠️ Empty date input");
                                                                                            field.onChange(null);
                                                                                        }
                                                                                    } }) }), _jsx(FormMessage, {})] })) }), _jsx(FormField, { control: followUpForm.control, name: "reminderType", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Follow-up Type" }), _jsxs(Select, { onValueChange: field.onChange, defaultValue: field.value, children: [_jsx(FormControl, { children: _jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select follow-up type" }) }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Email", children: "Send Email" }), _jsx(SelectItem, { value: "Call", children: "Make Call" }), _jsx(SelectItem, { value: "Meeting", children: "Schedule Meeting" }), _jsx(SelectItem, { value: "Coffee", children: "Coffee Meetup" }), _jsx(SelectItem, { value: "Lunch", children: "Lunch Meetup" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] }), _jsx(FormMessage, {})] })) })] }), _jsx(FormField, { control: followUpForm.control, name: "notes", render: ({ field }) => (_jsxs(FormItem, { children: [_jsx(FormLabel, { children: "Notes" }), _jsx(FormControl, { children: _jsx(Textarea, { placeholder: "Enter notes for this follow-up", className: "min-h-[100px]", ...field }) }), _jsx(FormMessage, {})] })) }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setShowFollowUpForm(false), children: "Cancel" }), _jsx(Button, { type: "submit", disabled: scheduleFollowUpMutation.isPending, children: scheduleFollowUpMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Saving..."] })) : ('Schedule Follow-up') })] })] }) })] }) })), isLoadingFollowUps ? (_jsx("div", { className: "flex justify-center py-8", children: _jsx(Loader2, { className: "h-6 w-6 animate-spin text-primary" }) })) : followUps.length > 0 ? (_jsx("div", { className: "space-y-4", children: followUps.map((followUp) => (_jsxs(Card, { className: cn("overflow-hidden", followUp.completed ? "opacity-70" : "", new Date(followUp.dueDate) < new Date() && !followUp.completed ? "border-red-300" : ""), children: [_jsx(CardHeader, { className: "pb-2", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "mt-0.5", children: (() => {
                                                                        // Extract the type from the format 'contact_Type'
                                                                        const reminderType = followUp.type?.startsWith('contact_')
                                                                            ? followUp.type.replace('contact_', '')
                                                                            : followUp.type;
                                                                        // Render appropriate icon based on type
                                                                        switch (reminderType) {
                                                                            case 'Call':
                                                                                return _jsx(Phone, { className: "h-4 w-4 text-blue-500" });
                                                                            case 'Email':
                                                                                return _jsx(Mail, { className: "h-4 w-4 text-green-500" });
                                                                            case 'Meeting':
                                                                                return _jsx(Users, { className: "h-4 w-4 text-purple-500" });
                                                                            case 'Coffee':
                                                                                return _jsx(Coffee, { className: "h-4 w-4 text-amber-500" });
                                                                            case 'Lunch':
                                                                                return _jsx(Utensils, { className: "h-4 w-4 text-orange-500" });
                                                                            default:
                                                                                return _jsx(CalendarPlus, { className: "h-4 w-4 text-gray-500" });
                                                                        }
                                                                    })() }), _jsxs("div", { className: "flex flex-col", children: [_jsxs(CardTitle, { className: "text-base font-medium leading-tight", children: [followUp.type?.startsWith('contact_')
                                                                                    ? followUp.type.replace('contact_', '')
                                                                                    : followUp.type, " ", format(new Date(followUp.dueDate), 'MMM d, yyyy').replace(/-/g, ' ')] }), _jsx(CardDescription, { className: "text-xs mt-0.5", children: followUp.completed
                                                                                ? `Completed on ${followUp.completedDate ? format(new Date(followUp.completedDate), 'MMM d, yyyy').replace(/-/g, ' ') : 'Unknown'}`
                                                                                : new Date(followUp.dueDate) < new Date()
                                                                                    ? 'Overdue'
                                                                                    : `Due in ${Math.ceil((new Date(followUp.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days` })] })] }), _jsxs("div", { className: "flex gap-1", children: [!followUp.completed && (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0", onClick: () => markFollowUpCompleteMutation.mutate(followUp.id), disabled: markFollowUpCompleteMutation.isPending, children: [markFollowUpCompleteMutation.isPending ? (_jsx(Loader2, { className: "h-3 w-3 animate-spin" })) : (_jsx(Check, { className: "h-3 w-3" })), _jsx("span", { className: "sr-only", children: "Mark complete" })] })), !followUp.completed && (_jsxs(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0", onClick: () => setEditingFollowUp(followUp), children: [_jsx(Edit, { className: "h-3 w-3" }), _jsx("span", { className: "sr-only", children: "Edit follow-up" })] })), _jsxs(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0 text-destructive hover:text-destructive/90", onClick: () => deleteFollowUpMutation.mutate(followUp.id), disabled: deleteFollowUpMutation.isPending, children: [deleteFollowUpMutation.isPending ? (_jsx(Loader2, { className: "h-3 w-3 animate-spin" })) : (_jsx(Trash, { className: "h-3 w-3" })), _jsx("span", { className: "sr-only", children: "Delete follow-up" })] })] })] }) }), followUp.notes && (_jsx(CardContent, { className: "pb-4 pt-0 pl-7", children: _jsx("p", { className: "text-sm text-muted-foreground whitespace-pre-wrap", children: followUp.notes }) }))] }, followUp.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(CalendarClock, { className: "h-12 w-12 mx-auto text-muted-foreground opacity-50" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No follow-ups scheduled" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Schedule follow-ups to keep track of when to reconnect with this contact." })] }))] }) }), _jsx(TabsContent, { value: "notes", className: "py-4", children: _jsxs("div", { className: "flex flex-col space-y-4", children: [_jsxs("div", { className: "flex justify-between items-center mb-2", children: [_jsx("h3", { className: "text-lg font-medium", children: "Notes" }), _jsxs(Button, { onClick: () => {
                                                setNewNoteText("");
                                                setEditingNote(null);
                                                setShowNoteDialog(true);
                                            }, size: "sm", children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "Add Note"] })] }), contactNotes.length > 0 ? (_jsx("div", { className: "space-y-4 max-h-[400px] overflow-y-auto pr-2", children: contactNotes.map((note) => (_jsxs("div", { className: "relative p-4 bg-muted/50 rounded-md", children: [_jsxs("div", { className: "absolute top-2 right-2 flex space-x-1", children: [_jsxs(Button, { variant: "ghost", size: "sm", onClick: () => {
                                                            setEditingNote(note);
                                                            setNewNoteText(note.text);
                                                            setShowNoteDialog(true);
                                                        }, className: "h-6 w-6 p-0", children: [_jsx(Edit, { className: "h-3 w-3" }), _jsx("span", { className: "sr-only", children: "Edit note" })] }), _jsxs(Button, { variant: "ghost", size: "sm", onClick: () => deleteNoteMutation.mutate(note.id), className: "h-6 w-6 p-0 text-destructive hover:text-destructive/90", children: [_jsx(Trash, { className: "h-3 w-3" }), _jsx("span", { className: "sr-only", children: "Delete note" })] })] }), _jsx("p", { className: "whitespace-pre-wrap mb-2", children: note.text }), _jsx("p", { className: "text-xs text-muted-foreground mt-2", children: format(new Date(note.timestamp), 'MMM d, yyyy - h:mm a') })] }, note.id))) })) : (_jsxs("div", { className: "text-center py-6", children: [_jsx(MessageSquare, { className: "h-12 w-12 mx-auto text-muted-foreground opacity-50" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No notes available" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "There are no notes for this contact yet." }), _jsxs(Button, { onClick: () => {
                                                setNewNoteText("");
                                                setEditingNote(null);
                                                setShowNoteDialog(true);
                                            }, variant: "outline", className: "mt-4", children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add First Note"] })] }))] }) })] }), editingInteraction && (_jsx(Dialog, { open: !!editingInteraction, onOpenChange: (open) => !open && setEditingInteraction(null), children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Interaction" }), _jsx(DialogDescription, { children: "Update the details of this interaction." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Interaction Type" }), _jsxs(Select, { value: editingInteraction.interactionType, onValueChange: (value) => {
                                                        setEditingInteraction({
                                                            ...editingInteraction,
                                                            interactionType: value
                                                        });
                                                    }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select interaction type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Call", children: "Call" }), _jsx(SelectItem, { value: "Email", children: "Email" }), _jsx(SelectItem, { value: "Meeting", children: "Meeting" }), _jsx(SelectItem, { value: "Video Call", children: "Video Call" }), _jsx(SelectItem, { value: "Coffee Chat", children: "Coffee Chat" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Date" }), _jsx(Input, { type: "date", value: new Date(editingInteraction.date).toISOString().split('T')[0], onChange: (e) => {
                                                        if (e.target.value) {
                                                            const dateString = e.target.value + 'T00:00:00';
                                                            const date = new Date(dateString);
                                                            setEditingInteraction({
                                                                ...editingInteraction,
                                                                date: date
                                                            });
                                                        }
                                                    } })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(Textarea, { placeholder: "Enter details about this interaction", className: "min-h-[100px]", value: editingInteraction.notes || '', onChange: (e) => {
                                                setEditingInteraction({
                                                    ...editingInteraction,
                                                    notes: e.target.value
                                                });
                                            } })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setEditingInteraction(null), children: "Cancel" }), _jsx(Button, { onClick: () => {
                                                updateInteractionMutation.mutate({
                                                    interactionId: editingInteraction.id,
                                                    data: {
                                                        interactionType: editingInteraction.interactionType,
                                                        date: editingInteraction.date,
                                                        notes: editingInteraction.notes
                                                    }
                                                });
                                            }, disabled: updateInteractionMutation.isPending, children: updateInteractionMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Updating..."] })) : ('Update Interaction') })] })] })] }) })), editingFollowUp && (_jsx(Dialog, { open: !!editingFollowUp, onOpenChange: (open) => !open && setEditingFollowUp(null), children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Edit Follow-up" }), _jsx(DialogDescription, { children: "Update the details of this follow-up." })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Follow-up Type" }), _jsxs(Select, { value: editingFollowUp.type, onValueChange: (value) => {
                                                        setEditingFollowUp({
                                                            ...editingFollowUp,
                                                            type: value
                                                        });
                                                    }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Select follow-up type" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "Call", children: "Call" }), _jsx(SelectItem, { value: "Email", children: "Email" }), _jsx(SelectItem, { value: "Meeting", children: "Meeting" }), _jsx(SelectItem, { value: "Coffee", children: "Coffee" }), _jsx(SelectItem, { value: "Lunch", children: "Lunch" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Due Date" }), _jsx(Input, { type: "date", value: new Date(editingFollowUp.dueDate).toISOString().split('T')[0], onChange: (e) => {
                                                        if (e.target.value) {
                                                            const dateString = e.target.value + 'T00:00:00';
                                                            const date = new Date(dateString);
                                                            setEditingFollowUp({
                                                                ...editingFollowUp,
                                                                dueDate: date.toISOString()
                                                            });
                                                        }
                                                    } })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Notes" }), _jsx(Textarea, { placeholder: "Enter details about this follow-up", className: "min-h-[100px]", value: editingFollowUp.notes || '', onChange: (e) => {
                                                setEditingFollowUp({
                                                    ...editingFollowUp,
                                                    notes: e.target.value
                                                });
                                            } })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => setEditingFollowUp(null), children: "Cancel" }), _jsx(Button, { onClick: () => {
                                                updateFollowUpMutation.mutate({
                                                    followUpId: editingFollowUp.id,
                                                    data: {
                                                        type: editingFollowUp.type,
                                                        dueDate: editingFollowUp.dueDate,
                                                        notes: editingFollowUp.notes
                                                    }
                                                });
                                            }, disabled: updateFollowUpMutation.isPending, children: updateFollowUpMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Updating..."] })) : ('Update Follow-up') })] })] })] }) })), _jsx(Dialog, { open: showNoteDialog, onOpenChange: (open) => {
                    if (!open) {
                        setShowNoteDialog(false);
                        setEditingNote(null);
                        setNewNoteText("");
                    }
                }, children: _jsxs(DialogContent, { className: "sm:max-w-[500px]", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingNote ? 'Edit Note' : 'Add Note' }), _jsx(DialogDescription, { children: editingNote ? 'Update the existing note.' : 'Add a new note for this contact.' })] }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Note" }), _jsx(Textarea, { placeholder: "Enter your note here...", className: "min-h-[200px]", value: newNoteText, onChange: (e) => setNewNoteText(e.target.value) })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx(Button, { type: "button", variant: "outline", onClick: () => {
                                                setShowNoteDialog(false);
                                                setEditingNote(null);
                                                setNewNoteText("");
                                            }, children: "Cancel" }), editingNote ? (_jsx(Button, { onClick: () => {
                                                updateNoteMutation.mutate({
                                                    noteId: editingNote.id,
                                                    text: newNoteText
                                                });
                                            }, disabled: updateNoteMutation.isPending || !newNoteText.trim(), children: updateNoteMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Updating..."] })) : (_jsxs(_Fragment, { children: [_jsx(Check, { className: "mr-2 h-4 w-4" }), "Update Note"] })) })) : (_jsx(Button, { onClick: () => {
                                                addNoteMutation.mutate(newNoteText);
                                            }, disabled: addNoteMutation.isPending || !newNoteText.trim(), children: addNoteMutation.isPending ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "mr-2 h-4 w-4 animate-spin" }), "Adding..."] })) : (_jsxs(_Fragment, { children: [_jsx(Plus, { className: "mr-2 h-4 w-4" }), "Add Note"] })) }))] })] })] }) }), _jsx("div", { className: "flex justify-end pt-4", children: _jsx(Button, { variant: "outline", onClick: onClose, children: "Close" }) })] }));
}
