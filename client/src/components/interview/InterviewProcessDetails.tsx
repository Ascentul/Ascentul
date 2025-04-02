import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { 
  Check, 
  Calendar, 
  MapPin, 
  Users, 
  FileText, 
  Plus, 
  Circle,
  Edit,
  Trash,
  PlusCircle,
  CheckCircle,
  PlayCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type InterviewProcess, type InterviewStage, type FollowupAction } from '@shared/schema';
import { PracticeSession } from './PracticeSession';

type InterviewProcessDetailsProps = {
  process: InterviewProcess & {
    stages?: InterviewStage[];
    followups?: FollowupAction[];
  };
};

export const InterviewProcessDetails = ({ process }: InterviewProcessDetailsProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddStageDialogOpen, setIsAddStageDialogOpen] = useState(false);
  const [isAddFollowupDialogOpen, setIsAddFollowupDialogOpen] = useState(false);
  const [showPracticeSession, setShowPracticeSession] = useState(false);
  const [newStage, setNewStage] = useState({
    type: '',
    scheduledDate: '',
    location: '',
    interviewers: '',
    notes: ''
  });
  const [newFollowup, setNewFollowup] = useState({
    type: '',
    description: '',
    dueDate: '',
    notes: ''
  });
  
  // Fetch stages for this specific process
  const { data: stages, isLoading: loadingStages } = useQuery<InterviewStage[]>({
    queryKey: [`/api/interview/processes/${process.id}/stages`],
    enabled: !!process.id, // Only run query if we have a process ID
  });
  
  // Fetch followups for this specific process
  const { data: followups, isLoading: loadingFollowups } = useQuery<FollowupAction[]>({
    queryKey: [`/api/interview/processes/${process.id}/followups`],
    enabled: !!process.id, // Only run query if we have a process ID
  });
  
  // Combine server data with any data from the process prop
  const processStages = stages || process.stages || [];
  const processFollowups = followups || process.followups || [];

  // Add interview stage mutation
  const addStageMutation = useMutation({
    mutationFn: async (stageData: any) => {
      console.log('Adding stage to process ID:', process.id, 'with data:', stageData);
      
      // Enhanced validation
      if (!process.id) {
        throw new Error('Process ID is missing. Please select a valid interview process.');
      }
      
      try {
        // Add processId to the request payload for additional validation on the server
        const payload = {
          ...stageData,
          processId: process.id
        };
        
        // Enhanced error logging
        console.log('Sending request to create stage with payload:', payload);
        
        const response = await apiRequest('POST', `/api/interview/processes/${process.id}/stages`, payload);
        
        // Additional response validation
        if (!response.ok) {
          let errorMessage = 'Failed to add interview stage';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Successfully created stage, received data:', data);
        return data;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Stage added successfully:', data);
      // Invalidate both the process list and the specific stages query
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/stages`] });
      // Also invalidate user statistics to update the upcoming interviews count
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
      toast({
        title: 'Success',
        description: 'Interview stage added successfully',
      });
      setIsAddStageDialogOpen(false);
      setNewStage({
        type: '',
        scheduledDate: '',
        location: '',
        interviewers: '',
        notes: ''
      });
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        title: 'Error',
        description: `Failed to add interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Add followup action mutation
  const addFollowupMutation = useMutation({
    mutationFn: async (followupData: any) => {
      console.log('Adding followup to process ID:', process.id, 'with data:', followupData);
      
      // Enhanced validation
      if (!process.id) {
        throw new Error('Process ID is missing. Please select a valid interview process.');
      }
      
      try {
        // Add processId to the request payload for additional validation on the server
        const payload = {
          ...followupData,
          processId: process.id
        };
        
        // Enhanced error logging
        console.log('Sending request to create followup with payload:', payload);
        
        const response = await apiRequest('POST', `/api/interview/processes/${process.id}/followups`, payload);
        
        // Additional response validation
        if (!response.ok) {
          let errorMessage = 'Failed to add followup action';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Successfully created followup, received data:', data);
        return data;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Followup added successfully:', data);
      // Invalidate both the process list and the specific followups query
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/followups`] });
      // Also invalidate user statistics to update any related data
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
      toast({
        title: 'Success',
        description: 'Followup action added successfully',
      });
      setIsAddFollowupDialogOpen(false);
      setNewFollowup({
        type: '',
        description: '',
        dueDate: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add followup action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Complete interview stage mutation
  const completeInterviewStageMutation = useMutation({
    mutationFn: async (stageId: number) => {
      console.log('Completing interview stage ID:', stageId);
      
      if (!stageId) {
        throw new Error('Stage ID is missing');
      }
      
      try {
        const response = await apiRequest('PUT', `/api/interview/stages/${stageId}`, {
          completedDate: new Date().toISOString().split('T')[0], // Send today's date as completion date
          processId: process.id // Send process ID for additional server validation
        });
        
        // Response validation
        if (!response.ok) {
          let errorMessage = 'Failed to complete interview stage';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Successfully completed interview stage, received data:', data);
        return data;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Interview stage completed successfully:', data);
      // Invalidate both the process list and the specific stages query
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/stages`] });
      // Also invalidate user statistics to update any related data
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
      toast({
        title: 'Success',
        description: 'Interview stage marked as completed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to complete interview stage: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  // Complete followup action mutation
  const completeFollowupMutation = useMutation({
    mutationFn: async (followupId: number) => {
      console.log('Completing followup action ID:', followupId);
      
      if (!followupId) {
        throw new Error('Followup action ID is missing');
      }
      
      try {
        const response = await apiRequest('PUT', `/api/interview/followup-actions/${followupId}/complete`, {
          processId: process.id // Send process ID for additional server validation
        });
        
        // Additional response validation
        if (!response.ok) {
          let errorMessage = 'Failed to complete followup action';
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            console.error('Could not parse error response:', e);
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        console.log('Successfully completed followup action, received data:', data);
        return data;
      } catch (error) {
        console.error('Error in mutation:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('Followup action completed successfully:', data);
      // Invalidate both the process list and the specific followups query
      queryClient.invalidateQueries({ queryKey: ['/api/interview/processes'] });
      queryClient.invalidateQueries({ queryKey: [`/api/interview/processes/${process.id}/followups`] });
      // Also invalidate user statistics to update any related data
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
      toast({
        title: 'Success',
        description: 'Followup action marked as completed',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to complete followup action: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    },
  });

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Format interviewers as an array
    const interviewersArray = newStage.interviewers
      ? newStage.interviewers.split(',').map(item => item.trim())
      : [];
      
    addStageMutation.mutate({
      ...newStage,
      interviewers: interviewersArray
    });
  };

  const handleAddFollowup = (e: React.FormEvent) => {
    e.preventDefault();
    addFollowupMutation.mutate(newFollowup);
  };

  const handleCompleteFollowup = (followupId: number) => {
    completeFollowupMutation.mutate(followupId);
  };
  
  const handleCompleteStage = (stageId: number) => {
    completeInterviewStageMutation.mutate(stageId);
  };

  // Sort stages by scheduled date (most recent first)
  const sortedStages = processStages.length > 0
    ? [...processStages].sort((a, b) => {
        if (!a.scheduledDate) return 1;
        if (!b.scheduledDate) return -1;
        return new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime();
      })
    : [];

  // Sort followups by due date
  const sortedFollowups = processFollowups.length > 0
    ? [...processFollowups].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      })
    : [];

  // Filter pending and completed followups
  const pendingFollowups = sortedFollowups.filter(f => !f.completed);
  const completedFollowups = sortedFollowups.filter(f => f.completed);

  // Format status badges
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <Badge className="bg-blue-500 hover:bg-blue-600">{status}</Badge>;
      case 'Completed':
        return <Badge className="bg-green-500 hover:bg-green-600">{status}</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-500 hover:bg-red-600">{status}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format dates
  const formatDate = (date: string | Date | null | undefined) => {
    if (!date) return 'Not scheduled';
    if (date instanceof Date) {
      return format(date, 'MMM d, yyyy');
    }
    return format(new Date(date), 'MMM d, yyyy');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{process.companyName}</CardTitle>
              <p className="text-muted-foreground">{process.position}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center"
                onClick={() => setShowPracticeSession(true)}
              >
                <PlayCircle className="h-4 w-4 mr-1" /> 
                Practice
              </Button>
              {getStatusBadge(process.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.jobDescription && (
            <div>
              <h3 className="text-sm font-medium mb-1">Job Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{process.jobDescription}</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {process.contactName && (
              <div>
                <h3 className="text-sm font-medium mb-1">Contact</h3>
                <p className="text-sm">{process.contactName}</p>
              </div>
            )}
            {process.contactEmail && (
              <div>
                <h3 className="text-sm font-medium mb-1">Email</h3>
                <p className="text-sm">{process.contactEmail}</p>
              </div>
            )}
            {process.contactPhone && (
              <div>
                <h3 className="text-sm font-medium mb-1">Phone</h3>
                <p className="text-sm">{process.contactPhone}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium mb-1">Created</h3>
              <p className="text-sm">{formatDate(process.createdAt)}</p>
            </div>
          </div>
          
          {process.notes && (
            <div>
              <h3 className="text-sm font-medium mb-1">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-line">{process.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="stages">
          <AccordionTrigger className="text-base font-medium">
            Interview Stages ({sortedStages.length})
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {sortedStages.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStages.map((stage) => (
                      <TableRow key={stage.id}>
                        <TableCell className="font-medium">{stage.type}</TableCell>
                        <TableCell>{formatDate(stage.scheduledDate)}</TableCell>
                        <TableCell>
                          {stage.completedDate ? (
                            <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                              Completed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                              Scheduled
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {!stage.completedDate && (
                                  <DropdownMenuItem 
                                    onClick={() => handleCompleteStage(stage.id)}
                                    disabled={completeInterviewStageMutation.isPending}
                                  >
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as Completed
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Details
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  No interview stages added yet.
                </div>
              )}
              
              <Button 
                onClick={() => setIsAddStageDialogOpen(true)} 
                variant="outline" 
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Interview Stage
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="followups">
          <AccordionTrigger className="text-base font-medium">
            Followup Actions ({pendingFollowups.length} pending)
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              {pendingFollowups.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Pending Actions</h3>
                  <div className="space-y-2">
                    {pendingFollowups.map((followup) => (
                      <div 
                        key={followup.id} 
                        className="flex items-start justify-between p-3 border rounded-md"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Circle className="h-3 w-3 text-blue-500 mr-2" />
                            <span className="font-medium">{followup.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{followup.description}</p>
                          {followup.dueDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              Due: {formatDate(followup.dueDate)}
                            </div>
                          )}
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleCompleteFollowup(followup.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {completedFollowups.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Completed Actions</h3>
                  <div className="space-y-2">
                    {completedFollowups.map((followup) => (
                      <div 
                        key={followup.id} 
                        className="flex items-start justify-between p-3 border rounded-md bg-gray-50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                            <span className="font-medium line-through text-muted-foreground">
                              {followup.type}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-through">
                            {followup.description}
                          </p>
                          {followup.completedDate && (
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3 mr-1" />
                              Completed: {formatDate(followup.completedDate)}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {sortedFollowups.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No followup actions added yet.
                </div>
              )}
              
              <Button 
                onClick={() => setIsAddFollowupDialogOpen(true)} 
                variant="outline" 
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Followup Action
              </Button>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      {/* Add Stage Dialog */}
      <Dialog open={isAddStageDialogOpen} onOpenChange={setIsAddStageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Interview Stage</DialogTitle>
            <DialogDescription>
              Add a new interview stage to track your interview process.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddStage} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type*</label>
              <Input 
                placeholder="e.g., Phone Screening, Technical Interview"
                value={newStage.type}
                onChange={(e) => setNewStage({...newStage, type: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Scheduled Date</label>
              <Input 
                type="date"
                value={newStage.scheduledDate}
                onChange={(e) => setNewStage({...newStage, scheduledDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <Input 
                placeholder="e.g., Zoom, On-site, Phone"
                value={newStage.location}
                onChange={(e) => setNewStage({...newStage, location: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Interviewers</label>
              <Input 
                placeholder="Names separated by commas"
                value={newStage.interviewers}
                onChange={(e) => setNewStage({...newStage, interviewers: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Enter names separated by commas</p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Additional details about this interview stage"
                value={newStage.notes}
                onChange={(e) => setNewStage({...newStage, notes: e.target.value})}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddStageDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!newStage.type || addStageMutation.isPending}>
                {addStageMutation.isPending ? 'Adding...' : 'Add Stage'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Followup Dialog */}
      <Dialog open={isAddFollowupDialogOpen} onOpenChange={setIsAddFollowupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Followup Action</DialogTitle>
            <DialogDescription>
              Add a new followup action to keep track of your next steps.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddFollowup} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type*</label>
              <Input 
                placeholder="e.g., Thank You Email, Prepare Questions"
                value={newFollowup.type}
                onChange={(e) => setNewFollowup({...newFollowup, type: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description*</label>
              <Textarea 
                placeholder="Detailed description of the action"
                value={newFollowup.description}
                onChange={(e) => setNewFollowup({...newFollowup, description: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input 
                type="date"
                value={newFollowup.dueDate}
                onChange={(e) => setNewFollowup({...newFollowup, dueDate: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes</label>
              <Textarea 
                placeholder="Additional notes or details"
                value={newFollowup.notes}
                onChange={(e) => setNewFollowup({...newFollowup, notes: e.target.value})}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddFollowupDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!newFollowup.type || !newFollowup.description || addFollowupMutation.isPending}
              >
                {addFollowupMutation.isPending ? 'Adding...' : 'Add Followup'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Practice Session Dialog */}
      <PracticeSession
        isOpen={showPracticeSession}
        onClose={() => setShowPracticeSession(false)}
        process={process}
      />
    </div>
  );
};