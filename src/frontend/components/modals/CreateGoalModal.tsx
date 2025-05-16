import { useState } from 'react';
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

// Import the schema for consistency
import { goalChecklistItemSchema, type GoalChecklistItem } from "@/utils/schema";

// Form schema
const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().max(500).optional(),
  dueDate: z.date().optional(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  checklist: z.array(goalChecklistItemSchema).default([]),
});

type FormData = z.infer<typeof formSchema>;

interface CreateGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGoalModal({ isOpen, onClose }: CreateGoalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default form values
  const defaultValues: FormData = {
    title: '',
    description: '',
    status: 'in_progress', // Default to in-progress so goals show up in Active Goals count
    checklist: [],
  };
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });
  
  const createGoalMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Check if we should automatically set status to 'in_progress'
      let status = data.status;
      
      // Condition: If there are 2+ checklist items and at least one is checked, 
      // but not all are checked, set status to 'in_progress'
      if (data.checklist.length >= 2) {
        const hasAtLeastOneChecked = data.checklist.some(item => item.completed);
        const areAllChecked = data.checklist.every(item => item.completed);
        
        if (hasAtLeastOneChecked && !areAllChecked && status === 'not_started') {
          status = 'in_progress';
        }
      }
      
      // Calculate progress based on checklist items
      let progress = 0;
      if (data.checklist.length > 0) {
        const completedItems = data.checklist.filter(item => item.completed).length;
        progress = Math.round((completedItems / data.checklist.length) * 100);
      } else {
        // Default progress if no checklist
        progress = status === 'completed' ? 100 : status === 'in_progress' ? 50 : 0;
      }
      
      // Convert date to ISO string for API
      const formattedData = {
        ...data,
        status,
        progress,
        dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
      };
      
      const response = await apiRequest('POST', '/api/goals', formattedData);
      return response.json();
    },
    onMutate: async (newData) => {
      // Instead of using optimistic updates, we'll let the server handle it
      // and simply invalidate the queries after success
      return { previousGoals: undefined };
    },
    onSuccess: (data) => {
      // Show success message
      toast({
        title: "Goal created",
        description: "Your career goal has been created successfully.",
      });
      
      // Reset form and close modal
      form.reset();
      onClose();
    },
    onError: (error, newData, context: any) => {
      // Roll back to the previous state if there's an error
      if (context?.previousGoals) {
        queryClient.setQueryData(['/api/goals'], context.previousGoals);
      }
      
      toast({
        title: "Failed to create goal",
        description: error.message || "There was a problem creating your goal. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure cache consistency
      queryClient.invalidateQueries({ queryKey: ['/api/goals'] });
      // Also invalidate user statistics to update the Active Goals count
      queryClient.invalidateQueries({ queryKey: ['/api/users/statistics'] });
    },
  });
  
  const onSubmit = (data: FormData) => {
    createGoalMutation.mutate(data);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Goal</DialogTitle>
          <DialogDescription>
            Set a new career goal to track your professional growth.
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
                    >
                      <FormControl>
                        <SelectTrigger className="h-10">
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
                  <FormItem>
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full h-10 pl-3 text-left font-normal"
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
                          disabled={(date) => date < new Date()}
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
                            defaultValue={item.text}
                            onChange={(e) => {
                              // Using onChange with defaultValue
                              // This doesn't trigger a re-render immediately
                              // The text is stored in the input's DOM value
                            }}
                            onBlur={(e) => {
                              // Only update the state when the input loses focus
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
                disabled={createGoalMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createGoalMutation.isPending}
              >
                {createGoalMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Goal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}