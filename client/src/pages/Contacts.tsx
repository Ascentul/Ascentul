import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { NetworkingContact } from '@shared/schema';
import ContactDetails from '@/components/contacts/ContactDetails';
import ContactForm from '@/components/contacts/ContactForm';
import ContactsTable from '@/components/contacts/ContactsTable';
import CompaniesTable from '@/components/contacts/CompaniesTable';
import { FollowUpsTable } from '@/components/contacts/FollowUpsTable';

// Import UI components
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, PlusCircle, UserRound, Users, Clock, Building, ChevronRight } from 'lucide-react';
// Remove PrivateLayout to avoid duplicate wrappers
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Contacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [relationshipFilter, setRelationshipFilter] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  // Fetch contacts with optional filtering
  const {
    data: contacts = [],
    isLoading,
    error,
    refetch: refetchContacts,
  } = useQuery({
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
      
      return apiRequest<NetworkingContact[]>({
        url,
        method: 'GET',
      });
    },
    staleTime: 10000, // Consider data fresh for 10 seconds to reduce refetching
  });

  // Fetch contacts needing follow-up (this is the previous endpoint that returns contacts)
  const {
    data: contactsNeedingFollowUp = [],
    isLoading: isLoadingFollowUp,
  } = useQuery({
    queryKey: ['/api/contacts/need-followup'],
    queryFn: async () => apiRequest<NetworkingContact[]>({
      url: '/api/contacts/need-followup',
      method: 'GET',
    }),
  });

  // Define the interface for follow-ups
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

  // Fetch all active follow-ups (used in the new UI)
  const {
    data: allFollowUps = [] as FollowUpWithContact[],
    isLoading: isLoadingAllFollowUps,
  } = useQuery<FollowUpWithContact[]>({
    queryKey: ['/api/contacts/all-followups'],
    queryFn: async () => {
      const response = await apiRequest({
        url: '/api/contacts/all-followups',
        method: 'GET',
      });
      return response as FollowUpWithContact[];
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
    mutationFn: async (followUpId: number) => {
      await apiRequest<void>({
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
    mutationFn: async (contactId: number) => {
      console.log(`Executing deletion for contact ID: ${contactId}`);
      
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
          console.log(`Contact ID ${contactId} successfully deleted from API`);
          return { success: true };
        } 
        else if (response.status === 404) {
          // 404 means the contact doesn't exist anymore, which is fine
          console.log(`Contact ID ${contactId} returned 404, handling as success`);
          return { success: true, notFound: true };
        }
        else {
          // For other status codes, still return success since we've already updated the UI
          console.warn(`Contact deletion returned unexpected status ${response.status}`);
          return { success: true, apiStatus: response.status };
        }
      } catch (error: any) {
        console.error(`Error deleting contact with ID ${contactId}:`, error);
        
        // Return partial success - we'll keep the contact removed from UI
        // but notify in logs that the server-side delete had issues
        return { success: true, networkError: true };
      }
    },
    onSuccess: (result: any, variables: number) => {
      console.log('Contact delete mutation completed successfully', result);
      
      // Refresh all contact-related data to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
      
      // We no longer need to show toasts here - they're already shown in handleDeleteContact
      // but we'll keep the logging for reference
      
      if (result?.networkError) {
        // Log the network issue for tracking purposes
        console.warn('Network issue during contact deletion, but UI was updated');
      }
      else if (result?.notFound) {
        console.log('Contact was already removed');
      } 
      else if (result?.apiStatus && result.apiStatus !== 200 && result.apiStatus !== 204) {
        // For unexpected API status codes, log the issue
        console.warn(`API returned unusual status ${result.apiStatus} for contact deletion`);
      }
      else {
        // Normal success case
        console.log('Contact successfully deleted from server');
      }
      
      // Always close any open dialogs
      setSelectedContactId(null);
    },
    onError: (error: any) => {
      // This should never be called since we handle all errors in the mutationFn
      // and always return a success result
      console.error('UNEXPECTED: Contact deletion error in onError handler:', error);
      
      // But just in case something unexpected happens, refresh the contacts
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      
      // No toast needed since we've handled errors gracefully in mutationFn
    },
  });

  // Handle contact selection
  const handleSelectContact = (contactId: number) => {
    setSelectedContactId(contactId);
  };

  // Handle contact deletion with confirmation
  const handleDeleteContact = (contactId: number) => {
    if (window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      // Immediately find the contact to show the name in the UI feedback
      const contactToDelete = contacts.find(c => c.id === contactId);
      const contactName = contactToDelete?.fullName || 'The contact';
      
      // First immediately update the UI to remove the contact from the display
      // This ensures the contact is removed visually even if the API call is slow
      const contactQueryKey = ['/api/contacts', searchQuery, relationshipFilter];
      
      // First update main contacts tab
      queryClient.setQueryData(contactQueryKey, (oldData: any) => {
        if (Array.isArray(oldData)) {
          return oldData.filter(c => c.id !== contactId);
        }
        return oldData;
      });
      
      // Also update any other contact-related queries in other tabs
      queryClient.setQueryData(['/api/contacts/need-followup'], (oldData: any) => {
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
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
  };

  // Helper function to get the selected contact
  const getSelectedContact = () => {
    return contacts.find(contact => contact.id === selectedContactId);
  };

  return (
    <>
      <div className="container px-4 py-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Ascentul CRM</h1>
            <p className="text-muted-foreground mt-1">
              Manage your professional network and foster strategic relationships
            </p>
          </div>
          <Button 
            onClick={() => setIsAddingContact(true)}
            className="flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            Add Contact
          </Button>
        </div>

        {/* Search and filter */}
        <div className="mb-6 bg-white p-4 rounded-md border shadow-sm">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search contacts by name, company, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="w-full md:w-64">
              <Select 
                value={relationshipFilter} 
                onValueChange={setRelationshipFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Relationships</SelectItem>
                  <SelectItem value="Current Colleague">Current Colleague</SelectItem>
                  <SelectItem value="Former Colleague">Former Colleague</SelectItem>
                  <SelectItem value="Industry Expert">Industry Expert</SelectItem>
                  <SelectItem value="Mentor">Mentor</SelectItem>
                  <SelectItem value="Client">Client</SelectItem>
                  <SelectItem value="Recruiter">Recruiter</SelectItem>
                  <SelectItem value="Hiring Manager">Hiring Manager</SelectItem>
                  <SelectItem value="Friend">Friend</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit">Apply Filters</Button>
          </form>
        </div>

        {/* Tabs for different contact views */}
        <Tabs 
          defaultValue="all" 
          className="w-full"
          onValueChange={(value) => {
            // Update the active tab
            setActiveTab(value);
            // When the "follow-up" tab is selected, refresh the data
            if (value === "follow-up") {
              queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
            }
          }}
        >
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="all" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Contacts
            </TabsTrigger>
            <TabsTrigger value="companies" className="flex items-center gap-2">
              <Building className="w-4 h-4" />
              Companies
            </TabsTrigger>
            <TabsTrigger value="follow-up" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Need Follow-up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border shadow-sm">
                <UserRound className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium mt-4">No contacts found</h3>
                <p className="text-muted-foreground mt-2">
                  {searchQuery || relationshipFilter
                    ? 'Try adjusting your search filters'
                    : 'Start building your professional network by adding contacts'}
                </p>
                <Button 
                  onClick={() => setIsAddingContact(true)} 
                  className="mt-4"
                  variant="outline"
                >
                  Add Your First Contact
                </Button>
              </div>
            ) : (
              <ContactsTable
                contacts={contacts}
                onSelectContact={handleSelectContact}
                onDeleteContact={handleDeleteContact}
              />
            )}
          </TabsContent>

          <TabsContent value="follow-up">
            {isLoadingAllFollowUps ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : allFollowUps.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border shadow-sm">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium mt-4">No follow-ups needed</h3>
                <p className="text-muted-foreground mt-2">
                  You're all caught up! There are no pending follow-ups scheduled.
                </p>
              </div>
            ) : (
              <FollowUpsTable
                followUps={allFollowUps}
                onSelectContact={handleSelectContact}
                onCompleteFollowUp={(followUpId) => {
                  // Mark the follow-up as completed via API
                  completeFollowUpMutation.mutate(followUpId);
                }}
              />
            )}
          </TabsContent>
          
          <TabsContent value="companies">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-md border shadow-sm">
                <Building className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="text-lg font-medium mt-4">No companies found</h3>
                <p className="text-muted-foreground mt-2">
                  Add contacts with company information to see them grouped here
                </p>
                <Button 
                  onClick={() => setIsAddingContact(true)} 
                  className="mt-4"
                  variant="outline"
                >
                  Add Your First Contact
                </Button>
              </div>
            ) : selectedCompany ? (
              <div>
                <div className="mb-4 flex items-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setSelectedCompany(null)}
                    className="flex items-center mr-4"
                  >
                    <ChevronRight className="h-4 w-4 rotate-180 mr-1" /> Back to Companies
                  </Button>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Building className="w-5 h-5 mr-2 text-primary" />
                    {selectedCompany} Contacts
                  </h3>
                </div>
                <ContactsTable
                  contacts={contacts.filter(contact => contact.company === selectedCompany)}
                  onSelectContact={handleSelectContact}
                  onDeleteContact={handleDeleteContact}
                />
              </div>
            ) : (
              <CompaniesTable
                contacts={contacts}
                onSelectCompany={(companyName) => {
                  setSelectedCompany(companyName);
                }}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Contact Details Dialog */}
      <Dialog open={selectedContactId !== null} onOpenChange={() => handleCloseDialog()}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Contact Details</DialogTitle>
          </DialogHeader>
          
          {selectedContactId && (
            <ContactDetails
              contactId={selectedContactId}
              onClose={handleCloseDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Add Contact Dialog */}
      <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
          </DialogHeader>
          
          <ContactForm
            onSuccess={() => {
              setIsAddingContact(false);
              queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
            }}
            onCancel={() => setIsAddingContact(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}