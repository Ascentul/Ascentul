import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// Define the form schema
const workHistoryFormSchema = z.object({
  position: z.string().min(1, { message: 'Job title is required' }),
  company: z.string().min(1, { message: 'Company name is required' }),
  startDate: z.date({ required_error: 'Start date is required' }),
  endDate: z.date().nullable().optional(),
  currentJob: z.boolean().default(false),
  location: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  achievements: z.array(z.string()).nullable().optional(),
});

type WorkHistoryFormValues = z.infer<typeof workHistoryFormSchema>;

interface WorkHistoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: WorkHistoryFormValues;
  mode: 'add' | 'edit';
  workHistoryId?: number;
  onSuccess?: () => void;
}

export function WorkHistoryFormModal({
  open,
  onOpenChange,
  defaultValues = {
    position: '',
    company: '',
    startDate: new Date(),
    endDate: null,
    currentJob: false,
    location: '',
    description: '',
    achievements: [],
  },
  mode = 'add',
  workHistoryId,
  onSuccess,
}: WorkHistoryFormModalProps) {
  const [achievementInput, setAchievementInput] = useState('');
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<WorkHistoryFormValues>({
    resolver: zodResolver(workHistoryFormSchema),
    defaultValues,
  });

  // Get the current values from the form to use for conditional rendering
  const currentJob = form.watch('currentJob');

  // Add achievement to the array
  const handleAddAchievement = () => {
    if (!achievementInput.trim()) return;
    
    const currentAchievements = form.getValues('achievements') || [];
    form.setValue('achievements', [...currentAchievements, achievementInput.trim()]);
    setAchievementInput('');
  };

  // Remove achievement from the array
  const handleRemoveAchievement = (index: number) => {
    const achievements = form.getValues('achievements') || [];
    form.setValue(
      'achievements',
      achievements.filter((_, i) => i !== index)
    );
  };

  // Form submission mutation
  const mutation = useMutation({
    mutationFn: async (values: WorkHistoryFormValues) => {
      // If currentJob is true, set endDate to null
      if (values.currentJob) {
        values.endDate = null;
      }

      let response;
      if (mode === 'add') {
        response = await apiRequest('POST', '/api/career-data/work-history', values);
      } else {
        response = await apiRequest('PUT', `/api/career-data/work-history/${workHistoryId}`, values);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save work history');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: mode === 'add' ? 'Work history added' : 'Work history updated',
        description: 'Your changes have been saved successfully.',
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });

      // Close the modal
      onOpenChange(false);

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Submit handler
  const onSubmit = (values: WorkHistoryFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === 'add' ? 'Add Work History' : 'Edit Work History'}</DialogTitle>
          <DialogDescription>
            Add details about your professional experience. This information will be used in your resume and profile.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Job Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Software Engineer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Corporation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date('1900-01-01')
                          }
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
                name="currentJob"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between space-y-0 pt-7">
                    <FormLabel>Current Job</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {!currentJob && (
              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, 'PPP')
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
                          selected={field.value ?? undefined}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < form.getValues('startDate') || date < new Date('1900-01-01')
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New York, NY" {...field} value={field.value || ''} />
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
                  <FormLabel>Description <span className="text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your role, responsibilities, and achievements..."
                      className="min-h-[120px]"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel>Key Achievements <span className="text-muted-foreground">(Optional)</span></FormLabel>
              <div className="flex mt-2">
                <Input
                  placeholder="Add an achievement..."
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddAchievement}
                  className="ml-2"
                >
                  Add
                </Button>
              </div>
              <div className="mt-2 space-y-2">
                {form.watch('achievements')?.map((achievement, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-secondary rounded-md"
                  >
                    <span className="text-sm">{achievement}</span>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleRemoveAchievement(index)}
                      className="text-destructive h-6 w-6 p-0"
                    >
                      &times;
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}