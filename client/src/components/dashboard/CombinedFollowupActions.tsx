import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, ArrowUpRight, Check, HelpCircle, Clock, Users, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePendingTasks } from '@/context/PendingTasksContext';

// Job Application Follow-up Action interface
interface FollowupAction {
  id: number;
  applicationId: number;
  type: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Job Application interface
interface Application {
  id: number;
  company: string;
  position: string;
  status: string;
}

// Contact Follow-up Action with Contact interface
interface ContactFollowupAction {
  id: number;
  type: string;
  description: string;
  dueDate: string | null;
  completed: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: number;
    fullName: string;
    company: string | null;
    email: string | null;
    phone: string | null;
  };
}

// Combined Follow-up Action type
type CombinedFollowup = 
  | (FollowupAction & { application?: Application; source: 'application' })
  | (ContactFollowupAction & { source: 'contact' });

interface CombinedFollowupActionsProps {
  limit?: number;
  showTitle?: boolean;
}

export function CombinedFollowupActions({ limit = 5, showTitle = true }: CombinedFollowupActionsProps) {
  const [followupActions, setFollowupActions] = useState<CombinedFollowup[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { updateTaskStatus, updatePendingFollowupCount, pendingFollowupCount } = usePendingTasks();
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch job application followups
  const { data: applications, isLoading: isLoadingApplications } = useQuery<Application[]>({
    queryKey: ['/api/job-applications'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/job-applications');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching applications from API:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch contact followups
  const { data: contactFollowups = [], isLoading: isLoadingContactFollowups } = useQuery<ContactFollowupAction[]>({
    queryKey: ['/api/contacts/all-followups'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/contacts/all-followups');
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        return await response.json();
      } catch (error) {
        console.error('Error fetching contact followups from API:', error);
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load application followups from localStorage and API
  const loadApplicationFollowups = async (): Promise<CombinedFollowup[]> => {
    if (!applications) return [];
    
    const pendingFollowups: CombinedFollowup[] = [];
    
    // First load all localStorage applications and their followups
    try {
      // Get all mockJobApplications from localStorage
      const mockAppsJson = localStorage.getItem('mockJobApplications');
      if (mockAppsJson) {
        const mockApps = JSON.parse(mockAppsJson);
        if (Array.isArray(mockApps)) {
          console.log(`Found ${mockApps.length} applications in localStorage`);
          
          // Process each localStorage application for followups
          for (const app of mockApps) {
            try {
              const followupsJson = localStorage.getItem(`mockFollowups_${app.id}`);
              if (followupsJson) {
                const followups = JSON.parse(followupsJson);
                if (Array.isArray(followups)) {
                  followups
                    .filter((f: any) => f && !f.completed)
                    .forEach((followup: any) => {
                      pendingFollowups.push({
                        ...followup,
                        applicationId: followup.applicationId || app.id,
                        application: app,
                        source: 'application'
                      });
                    });
                }
              }
            } catch (storageError) {
              console.error(`Error loading followups from localStorage for app ${app.id}:`, storageError);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading applications from localStorage:", error);
    }
    
    // Now process each database application for followups
    for (const app of applications) {
      try {
        // Skip if the ID is too large for PostgreSQL integer (probably a client-side ID)
        if (`${app.id}`.length > 10) {
          console.log(`Skipping API fetch for large application ID: ${app.id}`);
          continue;
        }
        
        // Try to get from API first
        const apiResponse = await apiRequest('GET', `/api/applications/${app.id}/followups`);
        if (apiResponse.ok) {
          const followups = await apiResponse.json();
          
          // Process API followups
          if (followups && Array.isArray(followups)) {
            followups
              .filter((f: FollowupAction) => f && !f.completed)
              .forEach((followup: FollowupAction) => {
                // Check if this followup is already in the pendingFollowups
                const exists = pendingFollowups.some(
                  (pf) => 
                    pf.source === 'application' && 
                    pf.id === followup.id
                );
                
                if (!exists) {
                  pendingFollowups.push({
                    ...followup,
                    applicationId: followup.applicationId || app.id,
                    application: app,
                    source: 'application'
                  });
                }
              });
          }
        }
      } catch (error) {
        console.error(`Error loading followups for application ${app.id}:`, error);
      }
    }
    
    return pendingFollowups;
  };

  // Process contact followups
  const processContactFollowups = (): CombinedFollowup[] => {
    if (!contactFollowups || !Array.isArray(contactFollowups)) return [];
    
    return contactFollowups
      .filter(followup => followup && !followup.completed)
      .map(followup => ({
        ...followup,
        source: 'contact'
      }));
  };

  // Sort all followups by due date
  const sortFollowups = (followups: CombinedFollowup[]): CombinedFollowup[] => {
    return followups.sort((a, b) => {
      // Sort by due date first (earliest due dates first)
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      
      // Items with due dates come before those without
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      
      // Then sort by creation date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  };
  
  // Refresh all followups data and combine them
  const refreshFollowups = async () => {
    try {
      setIsLoading(true);
      
      // Get application followups
      const appFollowups = await loadApplicationFollowups();
      
      // Get contact followups 
      const contactFups = processContactFollowups();
      
      // Combine and sort all followups
      const allFollowups = [...appFollowups, ...contactFups];
      const sortedFollowups = sortFollowups(allFollowups);
      
      console.log(`Combined ${appFollowups.length} application followups and ${contactFups.length} contact followups`);
      setFollowupActions(sortedFollowups);
    } catch (error) {
      console.error('Error refreshing followups:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshFollowups();
  }, [applications, contactFollowups]);

  // Set up refresh interval (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(refreshFollowups, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handle toggling application followup status
  const toggleApplicationFollowup = useMutation({
    mutationFn: async (params: { followupId: number, applicationId: number, completed: boolean }) => {
      const { followupId, applicationId, completed } = params;
      const endpoint = completed
        ? `/api/applications/${applicationId}/followups/${followupId}/complete`
        : `/api/applications/${applicationId}/followups/${followupId}/uncomplete`;
      
      const response = await apiRequest('POST', endpoint);
      if (!response.ok) throw new Error('Failed to update followup status');
      return await response.json();
    },
    onSuccess: () => {
      refreshFollowups();
      updatePendingFollowupCount().catch(console.error);
      toast({
        title: 'Followup updated',
        description: 'The followup status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update the followup status. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Handle toggling contact followup status
  const toggleContactFollowup = useMutation({
    mutationFn: async (params: { followupId: number, completed: boolean }) => {
      const { followupId, completed } = params;
      const endpoint = completed
        ? `/api/contacts/followups/${followupId}/complete`
        : `/api/contacts/followups/${followupId}/uncomplete`;
      
      const response = await apiRequest('POST', endpoint);
      if (!response.ok) throw new Error('Failed to update contact followup status');
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/contacts/all-followups'] });
      toast({
        title: 'Contact followup updated',
        description: 'The contact followup status has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Update failed',
        description: 'Failed to update the contact followup status. Please try again.',
        variant: 'destructive',
      });
    }
  });

  // Handle toggle followup status (detect type and call appropriate mutation)
  const handleToggleStatus = (followup: CombinedFollowup) => {
    // Create a copy of the followups array for optimistic UI update
    const updatedFollowups = followupActions.map(f => 
      f.id === followup.id && f.source === followup.source
        ? { ...f, completed: !f.completed }
        : f
    );
    
    // Update state immediately for better UX
    setFollowupActions(updatedFollowups);
    
    // Call the appropriate API based on the followup source
    if (followup.source === 'application' && 'application' in followup) {
      // Check if this is a localStorage-based application (client-side ID)
      if (`${followup.applicationId}`.length > 10) {
        // Handle localStorage update directly for client-side application
        try {
          const followupsJson = localStorage.getItem(`mockFollowups_${followup.applicationId}`);
          if (followupsJson) {
            const followups = JSON.parse(followupsJson);
            if (Array.isArray(followups)) {
              // Update the specific followup
              const updatedFollowups = followups.map((f: any) => 
                f.id === followup.id ? { ...f, completed: !followup.completed } : f
              );
              
              // Save back to localStorage
              localStorage.setItem(`mockFollowups_${followup.applicationId}`, JSON.stringify(updatedFollowups));
              
              // Update the counter via context
              updatePendingFollowupCount().catch(console.error);
              
              // Trigger a refresh after short delay
              setTimeout(refreshFollowups, 300);
              
              toast({
                title: 'Followup updated',
                description: 'The followup status has been updated successfully.',
              });
            }
          }
        } catch (error) {
          console.error("Error updating localStorage followup:", error);
          toast({
            title: 'Update failed',
            description: 'Failed to update the followup status in local storage.',
            variant: 'destructive',
          });
        }
      } else {
        // Use the API for database-stored application followups
        toggleApplicationFollowup.mutate({
          followupId: followup.id,
          applicationId: followup.applicationId,
          completed: !followup.completed
        });
      }
    } else if (followup.source === 'contact' && 'contact' in followup) {
      toggleContactFollowup.mutate({
        followupId: followup.id,
        completed: !followup.completed
      });
    }
  };

  // Render loading state
  if (isLoading || isLoadingApplications || isLoadingContactFollowups) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render empty state
  if (followupActions.length === 0) {
    return (
      <div className="text-center py-6">
        <HelpCircle className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
        <p className="text-muted-foreground">No follow-up actions to display</p>
        <div className="flex justify-center gap-2 mt-2">
          <Link href="/job-applications">
            <Button variant="link" className="text-sm">
              View applications
            </Button>
          </Link>
          <Link href="/networking">
            <Button variant="link" className="text-sm">
              View contacts
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Helper function to render followup type badge
  const renderFollowupType = (followup: CombinedFollowup) => {
    // Clean up the type by removing prefix
    const baseType = followup.type
      .replace('contact_', '')
      .replace('_', ' ');
    
    // Determine icon and style based on source and type
    let icon = <Clock className="h-3 w-3 mr-1" />;
    if (followup.source === 'contact') {
      if (baseType.includes('email')) icon = <Mail className="h-3 w-3 mr-1" />;
      else if (baseType.includes('call')) icon = <Phone className="h-3 w-3 mr-1" />;
      else if (baseType.includes('meeting')) icon = <Users className="h-3 w-3 mr-1" />;
    }
    
    return (
      <span className="text-sm capitalize flex items-center">
        {icon}
        {baseType}
      </span>
    );
  };

  // Render the list of follow-up actions
  return (
    <div className="space-y-4">
      {showTitle && (
        <h3 className="text-lg font-medium mb-4">Upcoming Follow-up Actions</h3>
      )}
      
      {followupActions.slice(0, limit).map((followup) => (
        <Card key={`${followup.source}-${followup.id}`} className="p-4 border shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                {renderFollowupType(followup)}
                
                {followup.source === 'application' && 'application' in followup && (
                  <Badge variant="outline" className="text-xs">
                    {followup.application?.company}
                  </Badge>
                )}
                
                {followup.source === 'contact' && 'contact' in followup && (
                  <Badge variant="outline" className="text-xs">
                    {followup.contact?.fullName}
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground">{followup.description}</p>
              
              {followup.dueDate && (
                <div className="flex items-center mt-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1.5" />
                  <span>Due: {format(new Date(followup.dueDate), 'MMM d, yyyy')}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-muted-foreground">
                  {followup.completed ? 'Completed' : 'Pending'}
                </span>
                <Switch 
                  checked={followup.completed}
                  onCheckedChange={() => handleToggleStatus(followup)}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
              
              {followup.source === 'application' && 'application' in followup && (
                <Link href={`/job-applications/${followup.applicationId}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
              
              {followup.source === 'contact' && 'contact' in followup && (
                <Link href={`/networking/${followup.contact.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      ))}
      
      {followupActions.length > limit && (
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/job-applications">
            <Button variant="outline" size="sm">
              View Applications
            </Button>
          </Link>
          <Link href="/networking">
            <Button variant="outline" size="sm">
              View Contacts
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}