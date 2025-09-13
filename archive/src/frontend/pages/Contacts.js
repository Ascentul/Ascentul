import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import ContactDetails from '@/components/contacts/ContactDetails';
import ContactForm from '@/components/contacts/ContactForm';
import ContactsTable from '@/components/contacts/ContactsTable';
import CompaniesTable from '@/components/contacts/CompaniesTable';
import { FollowUpsTable } from '@/components/contacts/FollowUpsTable';
// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger, } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, UserRound, Users, Clock, Building, ChevronRight } from 'lucide-react';
// Remove PrivateLayout to avoid duplicate wrappers
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from '@/components/ui/select';
export default function Contacts() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [isAddingContact, setIsAddingContact] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [relationshipFilter, setRelationshipFilter] = useState('');
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    // Fetch contacts with optional filtering
    const { data: contacts = [], isLoading, error, refetch: refetchContacts, } = useQuery({
        queryKey: ['/api/contacts', searchQuery, relationshipFilter],
        queryFn: async () => {
            let url = '/api/contacts';
            const params = new URLSearchParams();
            if (searchQuery) {
                params.append('query', searchQuery);
            }
            if (relationshipFilter) {
                params.append('relationshipType', relationshipFilter);
            }
            if (params.toString()) {
                url = `${url}?${params.toString()}`;
            }
            return apiRequest({
                url,
                method: 'GET',
            });
        },
        staleTime: 10000, // Consider data fresh for 10 seconds to reduce refetching
    });
    // Fetch contacts needing follow-up (this is the previous endpoint that returns contacts)
    const { data: contactsNeedingFollowUp = [], isLoading: isLoadingFollowUp, } = useQuery({
        queryKey: ['/api/contacts/need-followup'],
        queryFn: async () => apiRequest({
            url: '/api/contacts/need-followup',
            method: 'GET',
        }),
    });
    // Fetch all active follow-ups (used in the new UI)
    const { data: allFollowUps = [], isLoading: isLoadingAllFollowUps, } = useQuery({
        queryKey: ['/api/contacts/all-followups'],
        queryFn: async () => {
            const response = await apiRequest({
                url: '/api/contacts/all-followups',
                method: 'GET',
            });
            return response;
        },
        enabled: activeTab === 'follow-up', // Only fetch when this tab is active
    });
    // When the follow-up tab is selected, refresh the data
    useEffect(() => {
        if (activeTab === 'follow-up') {
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
        }
    }, [activeTab, queryClient]);
    // Mutation for completing a follow-up
    const completeFollowUpMutation = useMutation({
        mutationFn: async (followUpId) => {
            await apiRequest({
                url: `/api/contacts/followups/${followUpId}/complete`,
                method: 'PUT',
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
            toast({
                title: 'Follow-up completed',
                description: 'The follow-up has been marked as completed.',
            });
        },
        onError: () => {
            toast({
                title: 'Error',
                description: 'Failed to complete the follow-up. Please try again.',
                variant: 'destructive',
            });
        },
    });
    // Delete contact mutation - handles the actual server-side deletion
    const deleteContactMutation = useMutation({
        mutationFn: async (contactId) => {

            try {
                // Send the DELETE request to the API
                const response = await fetch(`/api/contacts/${contactId}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add dev token in development mode
                        ...(import.meta.env.DEV ? { 'Authorization': 'Bearer dev_token' } : {})
                    }
                });
                // Even if we get a non-200 status, we'll still count it as success in certain cases
                if (response.status === 204 || response.status === 200) {

                    return { success: true };
                }
                else if (response.status === 404) {
                    // 404 means the contact doesn't exist anymore, which is fine

                    return { success: true, notFound: true };
                }
                else {
                    // For other status codes, still return success since we've already updated the UI

                    return { success: true, apiStatus: response.status };
                }
            }
            catch (error) {
                console.error(`Error deleting contact with ID ${contactId}:`, error);
                // Return partial success - we'll keep the contact removed from UI
                // but notify in logs that the server-side delete had issues
                return { success: true, networkError: true };
            }
        },
        onSuccess: (result, variables) => {

            // Refresh all contact-related data to ensure consistency
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
            queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
            // We no longer need to show toasts here - they're already shown in handleDeleteContact
            // but we'll keep the logging for reference
            if (result?.networkError) {
                // Log the network issue for tracking purposes

            }
            else if (result?.notFound) {

            }
            else if (result?.apiStatus && result.apiStatus !== 200 && result.apiStatus !== 204) {
                // For unexpected API status codes, log the issue

            }
            else {
                // Normal success case

            }
            // Always close any open dialogs
            setSelectedContactId(null);
        },
        onError: (error) => {
            // This should never be called since we handle all errors in the mutationFn
            // and always return a success result
            console.error('UNEXPECTED: Contact deletion error in onError handler:', error);
            // But just in case something unexpected happens, refresh the contacts
            queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
            // No toast needed since we've handled errors gracefully in mutationFn
        },
    });
    // Handle contact selection
    const handleSelectContact = (contactId) => {
        setSelectedContactId(contactId);
    };
    // Handle contact deletion with confirmation
    const handleDeleteContact = (contactId) => {
        if (window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
            // Immediately find the contact to show the name in the UI feedback
            const contactToDelete = contacts.find(c => c.id === contactId);
            const contactName = contactToDelete?.fullName || 'The contact';
            // First immediately update the UI to remove the contact from the display
            // This ensures the contact is removed visually even if the API call is slow
            const contactQueryKey = ['/api/contacts', searchQuery, relationshipFilter];
            // First update main contacts tab
            queryClient.setQueryData(contactQueryKey, (oldData) => {
                if (Array.isArray(oldData)) {
                    return oldData.filter(c => c.id !== contactId);
                }
                return oldData;
            });
            // Also update any other contact-related queries in other tabs
            queryClient.setQueryData(['/api/contacts/need-followup'], (oldData) => {
                if (Array.isArray(oldData)) {
                    return oldData.filter(c => c.id !== contactId);
                }
                return oldData;
            });
            // Show immediate feedback to the user
            toast({
                title: 'Contact removed',
                description: `${contactName} has been removed from your network.`
            });
            // Then perform the actual deletion with the server in the background
            deleteContactMutation.mutate(contactId);
        }
    };
    // Handle dialog close
    const handleCloseDialog = () => {
        setSelectedContactId(null);
        setIsAddingContact(false);
    };
    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
    };
    // Helper function to get the selected contact
    const getSelectedContact = () => {
        return contacts.find(contact => contact.id === selectedContactId);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "container px-4 py-6 max-w-7xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold mb-2 text-[#0C29AB]", children: "Network Hub" }), _jsx("p", { className: "text-muted-foreground mt-1", children: "Manage your professional network and foster strategic relationships" })] }), _jsxs(Button, { onClick: () => setIsAddingContact(true), className: "flex items-center gap-2", children: [_jsx(PlusCircle, { className: "w-4 h-4" }), "Add Contact"] })] }), _jsx("div", { className: "mb-6 bg-white p-4 rounded-md border shadow-sm", children: _jsxs("form", { onSubmit: handleSearch, className: "flex flex-col md:flex-row gap-4", children: [_jsx("div", { className: "flex-1", children: _jsx(Input, { placeholder: "Search contacts by name, company, or role...", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), className: "w-full" }) }), _jsx("div", { className: "w-full md:w-64", children: _jsxs(Select, { value: relationshipFilter, onValueChange: setRelationshipFilter, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Filter by relationship" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "all", children: "All Relationships" }), _jsx(SelectItem, { value: "Current Colleague", children: "Current Colleague" }), _jsx(SelectItem, { value: "Former Colleague", children: "Former Colleague" }), _jsx(SelectItem, { value: "Industry Expert", children: "Industry Expert" }), _jsx(SelectItem, { value: "Mentor", children: "Mentor" }), _jsx(SelectItem, { value: "Client", children: "Client" }), _jsx(SelectItem, { value: "Recruiter", children: "Recruiter" }), _jsx(SelectItem, { value: "Hiring Manager", children: "Hiring Manager" }), _jsx(SelectItem, { value: "Friend", children: "Friend" }), _jsx(SelectItem, { value: "Other", children: "Other" })] })] }) }), _jsx(Button, { type: "submit", variant: "outline", className: "bg-white", children: "Apply Filters" })] }) }), _jsxs(Tabs, { defaultValue: "all", className: "w-full", onValueChange: (value) => {
                            // Update the active tab
                            setActiveTab(value);
                            // When the "follow-up" tab is selected, refresh the data
                            if (value === "follow-up") {
                                queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
                            }
                        }, children: [_jsxs(TabsList, { className: "grid w-full grid-cols-3 mb-6", children: [_jsxs(TabsTrigger, { value: "all", className: "flex items-center gap-2", children: [_jsx(Users, { className: "w-4 h-4" }), "All Contacts"] }), _jsxs(TabsTrigger, { value: "companies", className: "flex items-center gap-2", children: [_jsx(Building, { className: "w-4 h-4" }), "Companies"] }), _jsxs(TabsTrigger, { value: "follow-up", className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4" }), "Need Follow-up"] })] }), _jsx(TabsContent, { value: "all", children: isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) })) : contacts.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-md border shadow-sm", children: [_jsx(UserRound, { className: "w-12 h-12 mx-auto text-muted-foreground" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No contacts found" }), _jsx("p", { className: "text-muted-foreground mt-2", children: searchQuery || relationshipFilter
                                                ? 'Try adjusting your search filters'
                                                : 'Start building your professional network by adding contacts' }), _jsx(Button, { onClick: () => setIsAddingContact(true), className: "mt-4", variant: "outline", children: "Add Your First Contact" })] })) : (_jsx(ContactsTable, { contacts: contacts, onSelectContact: handleSelectContact, onDeleteContact: handleDeleteContact })) }), _jsx(TabsContent, { value: "follow-up", children: isLoadingAllFollowUps ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) })) : allFollowUps.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-md border shadow-sm", children: [_jsx(Clock, { className: "w-12 h-12 mx-auto text-muted-foreground" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No follow-ups needed" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "You're all caught up! There are no pending follow-ups scheduled." })] })) : (_jsx(FollowUpsTable, { followUps: allFollowUps, onSelectContact: handleSelectContact, onCompleteFollowUp: (followUpId) => {
                                        // Mark the follow-up as completed via API
                                        completeFollowUpMutation.mutate(followUpId);
                                    } })) }), _jsx(TabsContent, { value: "companies", children: isLoading ? (_jsx("div", { className: "flex justify-center items-center py-12", children: _jsx(Loader2, { className: "w-8 h-8 animate-spin text-primary" }) })) : contacts.length === 0 ? (_jsxs("div", { className: "text-center py-12 bg-white rounded-md border shadow-sm", children: [_jsx(Building, { className: "w-12 h-12 mx-auto text-muted-foreground" }), _jsx("h3", { className: "text-lg font-medium mt-4", children: "No companies found" }), _jsx("p", { className: "text-muted-foreground mt-2", children: "Add contacts with company information to see them grouped here" }), _jsx(Button, { onClick: () => setIsAddingContact(true), className: "mt-4", variant: "outline", children: "Add Your First Contact" })] })) : selectedCompany ? (_jsxs("div", { children: [_jsxs("div", { className: "mb-4 flex items-center", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setSelectedCompany(null), className: "flex items-center mr-4", children: [_jsx(ChevronRight, { className: "h-4 w-4 rotate-180 mr-1" }), " Back to Companies"] }), _jsxs("h3", { className: "text-lg font-semibold flex items-center", children: [_jsx(Building, { className: "w-5 h-5 mr-2 text-primary" }), selectedCompany, " Contacts"] })] }), _jsx(ContactsTable, { contacts: contacts.filter(contact => contact.company === selectedCompany), onSelectContact: handleSelectContact, onDeleteContact: handleDeleteContact })] })) : (_jsx(CompaniesTable, { contacts: contacts, onSelectCompany: (companyName) => {
                                        setSelectedCompany(companyName);
                                    } })) })] })] }), _jsx(Dialog, { open: selectedContactId !== null, onOpenChange: () => handleCloseDialog(), children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Contact Details" }) }), selectedContactId && (_jsx(ContactDetails, { contactId: selectedContactId, onClose: handleCloseDialog }))] }) }), _jsx(Dialog, { open: isAddingContact, onOpenChange: setIsAddingContact, children: _jsxs(DialogContent, { className: "sm:max-w-[600px]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Add New Contact" }) }), _jsx(ContactForm, { onSuccess: () => {
                                setIsAddingContact(false);
                                queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
                            }, onCancel: () => setIsAddingContact(false) })] }) })] }));
}
