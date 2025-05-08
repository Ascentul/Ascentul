import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Define the form schema
const skillFormSchema = z.object({
  name: z.string().min(1, { message: 'Skill name is required' }),
  proficiencyLevel: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
});

type SkillFormValues = z.infer<typeof skillFormSchema>;

interface SkillFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultValues?: SkillFormValues;
  onSuccess?: () => void;
}

export function SkillFormModal({
  open,
  onOpenChange,
  defaultValues = {
    name: '',
    proficiencyLevel: null,
    category: null,
  },
  onSuccess,
}: SkillFormModalProps) {
  const { toast } = useToast();

  // Initialize the form
  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillFormSchema),
    defaultValues,
  });

  // Predefined skill categories
  const skillCategories = [
    "Technical",
    "Programming",
    "Design",
    "Marketing",
    "Management",
    "Communication",
    "Leadership",
    "Project Management",
    "Sales",
    "Finance",
    "Data",
    "Other"
  ];

  // Proficiency levels with corresponding numeric values
  const proficiencyLevels = [
    { label: "Beginner", value: "1" },
    { label: "Intermediate", value: "2" },
    { label: "Advanced", value: "3" },
    { label: "Expert", value: "4" }
  ];

  // Form submission mutation
  const mutation = useMutation({
    mutationFn: async (values: SkillFormValues) => {
      const response = await apiRequest('POST', '/api/career-data/skills', values);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add skill');
      }

      return await response.json();
    },
    onSuccess: () => {
      // Show success toast
      toast({
        title: 'Skill added',
        description: 'Your skill has been added successfully.',
      });

      // Invalidate queries to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/career-data'] });

      // Close the modal
      onOpenChange(false);

      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Reset the form
      form.reset({
        name: '',
        proficiencyLevel: null,
        category: null,
      });
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
  const onSubmit = (values: SkillFormValues) => {
    // Ensure proficiencyLevel and category have defaults if not provided
    const valuesToSubmit = {
      ...values,
      proficiencyLevel: values.proficiencyLevel || "1", // Default to level 1 (Beginner) if not selected
      category: values.category || "Technical" // Default to Technical if not selected
    };
    mutation.mutate(valuesToSubmit);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
          <DialogDescription>
            Add a new skill to your profile. These skills will be used in your resume and profile.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Skill Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. React, Project Management, Python" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {skillCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proficiency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level">
                            {field.value && proficiencyLevels.find(level => level.value === field.value)?.label}
                          </SelectValue>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {proficiencyLevels.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            {level.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    Adding...
                  </>
                ) : (
                  'Add Skill'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}