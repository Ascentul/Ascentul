import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// Create schema for the form
const followupSchema = z.object({
  type: z.string(),
  description: z.string().min(1, "Description is required"),
  dueDate: z.date().optional().nullable(),
  completed: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

type FollowupFormValues = z.infer<typeof followupSchema>;

interface EditFollowupFormProps {
  isOpen: boolean;
  onClose: () => void;
  followup: FollowupAction;
  applicationId: number;
  onSuccess?: () => void;
}

export function EditFollowupForm({ 
  isOpen, 
  onClose, 
  followup, 
  applicationId,
  onSuccess 
}: EditFollowupFormProps) {
  const [isPending, setIsPending] = useState(false);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Initialize form with current values
  const form = useForm<FollowupFormValues>({
    resolver: zodResolver(followupSchema),
    defaultValues: {
      type: followup.type,
      description: followup.description,
      dueDate: followup.dueDate ? new Date(followup.dueDate) : null,
      completed: followup.completed,
      notes: followup.notes,
    }
  });
  
  // Mutation to update the followup
  const updateFollowupMutation = useMutation({
    mutationFn: async (values: FollowupFormValues) => {
      try {
        const response = await apiRequest(
          'PATCH',
          `/api/applications/${applicationId}/followups/${followup.id}`,
          values
        );
        return await response.json();
      } catch (error) {
        console.error("Error updating followup via API:", error);
        throw error;
      }
    }
  });
  
  // Mutation to delete the followup
  const deleteFollowupMutation = useMutation({
    mutationFn: async () => {
      try {
        const response = await apiRequest(
          'DELETE',
          `/api/applications/${applicationId}/followups/${followup.id}`
        );
        return response.ok;
      } catch (error) {
        console.error("Error deleting followup via API:", error);
        throw error;
      }
    }
  });
  
  // Function to handle follow-up deletion
  const handleDelete = () => {
    setIsDeletePending(true);
    
    // First delete from localStorage for immediate UI update
    try {
      // Get current followups from localStorage
      const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${applicationId}`) || '[]');
      
      // Filter out the followup to delete
      const updatedFollowups = mockFollowups.filter((f: any) => f.id !== followup.id);
      
      // Save back to localStorage
      localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(updatedFollowups));
      
      // Force UI update
      queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
    } catch (localStorageError) {
      console.error("Error updating localStorage:", localStorageError);
    }
    
    // Also try to delete on the server
    deleteFollowupMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Follow-up deleted",
          description: "The follow-up action has been removed successfully.",
        });
        
        // Call the onSuccess callback
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      },
      onError: (error) => {
        console.error("Error deleting followup via API:", error);
        
        // Even if the API delete fails, the localStorage delete should have worked,
        // so we can still call the success callback
        toast({
          title: "Follow-up deleted",
          description: "The follow-up action has been removed successfully.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      },
      onSettled: () => setIsDeletePending(false)
    });
  };
  
  const onSubmit = (data: FollowupFormValues) => {
    setIsPending(true);

    // First, update the followup in localStorage immediately for better UX
    try {
      // Get current followups from localStorage
      const mockFollowups = JSON.parse(localStorage.getItem(`mockFollowups_${applicationId}`) || '[]');

      // Find the index of the followup to update
      const followupIndex = mockFollowups.findIndex((f: any) => f.id === followup.id);
      
      if (followupIndex !== -1) {
        // Update the followup with new values while preserving existing ones
        mockFollowups[followupIndex] = {
          ...mockFollowups[followupIndex],
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          updatedAt: new Date().toISOString()
        };

        // Save back to localStorage
        localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(mockFollowups));
        
        // Force UI update
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
      } else {

        // If followup doesn't exist in localStorage yet, add it
        mockFollowups.push({
          ...followup,
          ...data,
          dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
          updatedAt: new Date().toISOString()
        });
        
        // Save back to localStorage
        localStorage.setItem(`mockFollowups_${applicationId}`, JSON.stringify(mockFollowups));
        
        // Force UI update
        queryClient.invalidateQueries({ queryKey: [`/api/applications/${applicationId}/followups`] });
      }
    } catch (localStorageError) {
      console.error("Error updating localStorage:", localStorageError);
    }
    
    // Also try to update on the server
    updateFollowupMutation.mutate(data, {
      onSuccess: () => {
        // Call the onSuccess callback
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      },
      onError: (error) => {
        console.error("Error updating followup via API:", error);
        
        // Even if the API update fails, the localStorage update should have worked,
        // so we can still call the success callback
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      },
      onSettled: () => setIsPending(false)
    });
  };
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Follow-up Action</DialogTitle>
            <DialogDescription>
              Update the details of this follow-up action.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select action type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="thank_you_email">Thank You Email</SelectItem>
                        <SelectItem value="follow_up">Follow-up</SelectItem>
                        <SelectItem value="preparation">Interview Preparation</SelectItem>
                        <SelectItem value="document_submission">Document Submission</SelectItem>
                        <SelectItem value="networking">Networking Connection</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Brief description of the follow-up action" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Completed</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Additional notes about this follow-up"
                        className="min-h-[80px]"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="flex justify-between sm:justify-between">
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={isDeletePending}
                >
                  {isDeletePending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </>
                  )}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Follow-up'
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Delete */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this follow-up action. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              {isDeletePending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}