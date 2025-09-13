import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Award, Briefcase, GraduationCap, Medal, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertUserPersonalAchievementSchema } from "@/utils/schema";
import { DatePicker } from "@/components/ui/date-picker";
import { format } from "date-fns";

// Icons mapping
const iconComponents = {
  award: Award,
  briefcase: Briefcase,
  graduation: GraduationCap,
  medal: Medal,
  star: Star,
  trophy: Trophy,
};

// Categories
const categories = [
  { value: "professional", label: "Professional" },
  { value: "academic", label: "Academic" },
  { value: "personal", label: "Personal" },
  { value: "certification", label: "Certification" },
  { value: "award", label: "Award" },
];

// Extend the schema for the form validation
const formSchema = insertUserPersonalAchievementSchema.extend({
  // Optional validation rules can be added here
});

// TS type for the form values
type PersonalAchievementFormValues = z.infer<typeof formSchema>;

type AchievementFormProps = {
  onSuccess?: () => void;
  defaultValues?: Partial<PersonalAchievementFormValues>;
  achievementId?: number;
  closeDialog?: () => void;
  onCancel?: () => void;
};

export function AchievementForm({
  onSuccess,
  defaultValues,
  achievementId,
  closeDialog,
  onCancel,
}: AchievementFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [iconPreview, setIconPreview] = useState(defaultValues?.icon || "award");

  // Initialize the form
  const form = useForm<PersonalAchievementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "professional",
      icon: "award",
      achievementDate: new Date(),
      issuingOrganization: "",
      proofUrl: "",
      skills: "",
      xpValue: 50,
      isHighlighted: false,
      ...defaultValues,
    },
  });

  // Create or update mutation
  const mutation = useMutation({
    mutationFn: async (values: PersonalAchievementFormValues) => {
      if (achievementId) {
        // Update existing achievement
        const res = await apiRequest("PUT", `/api/personal-achievements/${achievementId}`, values);
        return await res.json();
      } else {
        // Create new achievement
        const res = await apiRequest("POST", "/api/personal-achievements", values);
        return await res.json();
      }
    },
    onSuccess: () => {
      // Invalidate queries to refresh the achievements list
      queryClient.invalidateQueries({ queryKey: ["/api/personal-achievements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users/statistics"] });
      
      // Show success message
      toast({
        title: achievementId ? "Achievement updated" : "Achievement created",
        description: achievementId
          ? "Your achievement has been updated successfully."
          : "Your achievement has been added successfully.",
      });
      
      // Reset form if creating
      if (!achievementId) {
        form.reset({
          title: "",
          description: "",
          category: "professional",
          icon: "award",
          achievementDate: new Date(),
          issuingOrganization: "",
          proofUrl: "",
          skills: "",
          xpValue: 50,
          isHighlighted: false,
        });
      }
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Close dialog if provided
      if (closeDialog) {
        closeDialog();
      }
    },
    onError: (error: any) => {
      console.error("Error saving achievement:", error);
      toast({
        title: "Error",
        description: "Failed to save the achievement. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit handler
  function onSubmit(values: PersonalAchievementFormValues) {
    mutation.mutate(values);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-6 md:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achievement Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Completed Project Leadership Certification" {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your achievement and its significance..."
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value ?? undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
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
              name="achievementDate"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Date Achieved</FormLabel>
                  <FormControl>
                    <div className="w-full">
                      <DatePicker
                        date={field.value instanceof Date ? field.value : new Date(field.value)}
                        setDate={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="issuingOrganization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issuing Organization (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Microsoft, Google, or University name" 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="icon"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Icon</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    setIconPreview(value);
                  }}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(iconComponents).map(([key, Icon]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center">
                          <Icon className="mr-2 h-4 w-4" />
                          <span className="capitalize">{key}</span>
                        </div>
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
            name="proofUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proof URL (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/certificate" 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormDescription>Link to certificate or proof of achievement</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Skills (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., Leadership, Python, Project Management" 
                    {...field} 
                    value={field.value ?? ''} 
                  />
                </FormControl>
                <FormDescription>Comma-separated list of related skills</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={mutation.isPending}
            className="px-6"
          >
            {mutation.isPending ? "Saving..." : achievementId ? "Update Achievement" : "Add Achievement"}
          </Button>
        </div>
      </form>
    </Form>
  );
}