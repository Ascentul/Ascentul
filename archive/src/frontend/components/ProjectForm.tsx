
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { InsertProject, insertProjectSchema } from "@/utils/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Image, X } from 'lucide-react';

interface ProjectFormProps {
  onSubmit: (data: InsertProject) => void;
  initialData?: InsertProject;
}

export default function ProjectForm({ onSubmit, initialData }: ProjectFormProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.imageUrl ? String(initialData.imageUrl) : null
  );
  
  const form = useForm<InsertProject>({
    resolver: zodResolver(insertProjectSchema),
    defaultValues: initialData || {
      title: '',
      role: '',
      description: '',
      clientOrCompany: '',
      projectUrl: '',
      projectType: 'personal',
      isPublic: false,
      skillsUsed: [],
      tags: [],
      imageUrl: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Convert to base64 for storage and preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        form.setValue('imageUrl', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImagePreview(null);
    form.setValue('imageUrl', '');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter project title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Your Role</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Lead Developer, Project Manager" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => field.onChange(date)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    setDate={(date) => field.onChange(date)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientOrCompany"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client or Company</FormLabel>
              <FormControl>
                <Input placeholder="Enter client or company name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project URL</FormLabel>
              <FormControl>
                <Input 
                  placeholder="https://example.com" 
                  value={field.value || ''} 
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Image</FormLabel>
              <div className="flex flex-col gap-4">
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="Project preview" className="w-full h-40 object-cover rounded-md" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 rounded-full"
                      onClick={clearImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center gap-2 text-gray-500">
                    <Image className="h-8 w-8" />
                    <p>Upload a project image</p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      id="projectImage"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('projectImage')?.click()}
                    >
                      Choose Image
                    </Button>
                  </div>
                )}
              </div>
              <FormDescription>
                Add an image to showcase your project. This will be displayed on your project card.
              </FormDescription>
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
                  placeholder="Describe the project, its goals, and your contributions..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="projectType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {initialData ? 'Update Project' : 'Create Project'}
        </Button>
      </form>
    </Form>
  );
}
