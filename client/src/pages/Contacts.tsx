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
  
  // Delete contact mutation
  const deleteContactMutation = useMutation({
    mutationFn: async (contactId: number) => {
      console.log(`Attempting to delete contact with ID: ${contactId}`);
      
      // Always check if contact exists in local state first
      const contactExists = contacts.some(contact => contact.id === contactId);
      
      if (!contactExists) {
        console.log(`Contact ID ${contactId} doesn't exist in local state, skipping deletion`);
        return { success: true, skipped: true };
      }
      
      try {
        // Try to DELETE the contact from the API
        const response = await apiRequest({
          url: `/api/contacts/${contactId}`,
          method: 'DELETE',
        });
        console.log(`Delete contact response:`, response);
        return { success: true };
      } catch (error: any) {
        console.error(`Error deleting contact with ID ${contactId}:`, error);
        
        // Special handling for "Contact not found" errors (404)
        if (error.status === 404) {
          console.log(`Contact ID ${contactId} returned 404, handling gracefully`);
          
          // Still refresh the data
          queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
          
          // Return a success result - don't throw error for this case
          return { success: true, notFound: true };
        }
        
        // Let other errors propagate to onError handler
        throw error;
      }
    },
    onSuccess: (result: any) => {
      console.log('Contact delete mutation completed successfully');
      
      // Refresh all contact-related data
      queryClient.invalidateQueries({ queryKey: ['/api/contacts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/need-followup'] });
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
      
      // Show appropriate toast based on the result
      if (result?.notFound) {
        toast({
          title: 'Contact already deleted',
          description: 'This contact has already been removed from your network.',
        });
      } else if (result?.skipped) {
        toast({
          title: 'Contact not found',
          description: 'This contact has already been removed from your network.',
        });
      } else {
        toast({
          title: 'Contact deleted',
          description: 'The contact has been removed from your network.',
        });
      }
      
      // Always close any open dialogs
      setSelectedContactId(null);
    },
    onError: (error: any) => {
      console.error('Contact deletion error details:', error);
      toast({
        title: 'Error',
        description: `Failed to delete the contact. Please try again.`,
        variant: 'destructive',
      });
    },
  });

  // Handle contact selection
  const handleSelectContact = (contactId: number) => {
    setSelectedContactId(contactId);
  };

  // Handle contact deletion with confirmation
  const handleDeleteContact = (contactId: number) => {
    if (window.confirm('Are you sure you want to delete this contact? This action cannot be undone.')) {
      // The actual deletion logic with error handling is in the mutation
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