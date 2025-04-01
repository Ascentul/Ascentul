import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { CalendarIcon, Loader2, Plus, X, CheckSquare, Square } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';

// Import the checklist schema from shared schema
import { goalChecklistItemSchema, type GoalChecklistItem } from '@shared/schema';

// Form schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  dueDate: z.date().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  checklist: z.array(goalChecklistItemSchema).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: number | null;
  goals: any[];
}

export default function EditGoalModal({ isOpen, onClose, goalId, goals }: EditGoalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [goal, setGoal] = useState<any>(null);
  
  // Default form values
  const defaultValues: FormData = {
    title: '',
    description: '',
    status: 'not_started',
    checklist: [],
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  // Find the goal to edit when goalId changes
  useEffect(() => {
    if (goalId && goals && goals.length > 0) {
      const foundGoal = goals.find(g => g.id === goalId);
      if (foundGoal) {
        setGoal(foundGoal);
        
        // Reset form with goal data
        form.reset({
          title: foundGoal.title,
          description: foundGoal.description || '',
          status: foundGoal.status,
          dueDate: foundGoal.dueDate ? new Date(foundGoal.dueDate) : undefined,
          checklist: foundGoal.checklist || [],
        });
      }
    }
  }, [goalId, goals, form]);
  
  const updateGoalMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!goalId) throw new Error("No goal selected for editing");
      
      // Convert date to ISO string for API
      const formattedData = {
        ...data,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
        progress: data.status === 'completed' ? 100 : data.status === 'in_progress' ? 50 : 0,
      };
      
      const response = await apiRequest('PUT', `/api/goals/${goalId}`, formattedData);
      return response.json();
    },
    onMutate: async (newData) => {
      // Cancel any outgoing refetches 
      await queryClient.cancelQueries({ queryKey: ['/api/goals'] });
      
      // Snapshot the previous value
      const previousGoals = queryClient.getQueryData(['/api/goals']);
      
      // Optimistically update to the new value
      queryClient.setQueryData(['/api/goals'], (old: any[]) => {
        if (!old) return [];
        
        return old.map(goal => {
          if (goal.id === goalId) {
            return {
              ...goal,
              title: newData.title,
              description: newData.description || '',
              status: newData.status,
              progress: newData.status === 'completed' ? 100 : 
                        newData.status === 'in_progress' ? 50 : 0,
              dueDate: newData.dueDate ? newData.dueDate.toISOString() : goal.dueDate,
              checklist: newData.checklist || goal.checklist || []
            };
          }
          return goal;
        });
      });
      
      // Return a context object with the snapshotted value
      return { previousGoals };
    },
    onSuccess: (data) => {
      // Update with the actual server data if needed
      queryClient.setQueryData(['/api/goals'], (old: any[]) => {
        if (!old) return [data];
        return old.map(goal => goal.id === goalId ? data : goal);
      });
      
      // Show success message
      toast({
        title: "Goal updated",
        description: "Your career goal has been updated successfully.",
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error, newData, context: any) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousGoals) {
        queryClient.setQueryData(['/api/goals'], context.previousGoals);
      }
      
      toast({
        title: "Failed to update goal",
        description: error.message || "There was a problem updating your goal. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
    },
  });
  
  const onSubmit = (data: FormData) => {
    updateGoalMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Goal</DialogTitle>
          <DialogDescription>
            Update your career goal details.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Learn React Native" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Describe your goal in more detail..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="not_started">Not Started</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span className="text-muted-foreground">Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Checklist Field */}
            <FormField
              control={form.control}
              name="checklist"
              render={({ field }) => {
                const { fields, append, remove, update } = useFieldArray({
                  name: "checklist",
                  control: form.control
                });
                
                const generateId = () => {
                  return Math.random().toString(36).substring(2, 11);
                };
                
                return (
                  <FormItem className="space-y-3">
                    <FormLabel>Goal Checklist (Optional)</FormLabel>
                    <div className="flex flex-col space-y-2">
                      {fields.map((item, index) => (
                        <div key={item.id} className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newItem = { ...item, completed: !item.completed };
                              update(index, newItem);
                            }}
                            className="h-6 w-6"
                          >
                            {item.completed ? (
                              <CheckSquare className="h-4 w-4 text-primary" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                          <Input 
                            value={item.text}
                            onChange={(e) => {
                              const newItem = { ...item, text: e.target.value };
                              update(index, newItem);
                            }}
                            className="h-8 flex-1"
                            placeholder="Enter a task..."
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-6 w-6"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ id: generateId(), text: '', completed: false })}
                      className="mt-1"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Checklist Item
                    </Button>
                  </FormItem>
                );
              }}
            />
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={updateGoalMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateGoalMutation.isPending}
              >
                {updateGoalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Goal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}