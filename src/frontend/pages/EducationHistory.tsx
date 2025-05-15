import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  GraduationCap, 
  Calendar, 
  MapPin, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Sparkles, 
  CalendarRange 
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const educationHistorySchema = z.object({
  institution: z.string().min(1, { message: 'Institution name is required' }),
  degree: z.string().min(1, { message: 'Degree is required' }),
  fieldOfStudy: z.string().min(1, { message: 'Field of study is required' }),
  location: z.string().optional(),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  endDate: z.string().optional(),
  current: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
  gpa: z.string().optional(),
});

type EducationHistoryFormValues = z.infer<typeof educationHistorySchema>;

export default function EducationHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEducation, setEditingEducation] = useState<any>(null);
  const [achievement, setAchievement] = useState('');
  
  // Fetch education history
  const { data: educationHistory, isLoading } = useQuery({
    queryKey: ['/api/education-history'],
  });

  const form = useForm<EducationHistoryFormValues>({
    resolver: zodResolver(educationHistorySchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
      gpa: '',
    }
  });

  const resetForm = () => {
    form.reset({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: [],
      gpa: '',
    });
    setAchievement('');
  };

  // Open dialog for adding new education history
  const handleAddNew = () => {
    setEditingEducation(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing education history
  const handleEdit = (item: any) => {
    setEditingEducation(item);
    
    form.reset({
      institution: item.institution,
      degree: item.degree,
      fieldOfStudy: item.fieldOfStudy,
      location: item.location || '',
      startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
      endDate: item.current ? '' : (item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : ''),
      current: !!item.current,
      description: item.description || '',
      achievements: item.achievements || [],
      gpa: item.gpa || '',
    });
    
    setIsDialogOpen(true);
  };

  // Create education history mutation
  const createEducationHistoryMutation = useMutation({
    mutationFn: async (data: EducationHistoryFormValues) => {
      return apiRequest('POST', '/api/education-history', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education-history'] });
      toast({
        title: 'Education History Added',
        description: 'Your education has been added successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add education history: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update education history mutation
  const updateEducationHistoryMutation = useMutation({
    mutationFn: async (data: EducationHistoryFormValues & { id: number }) => {
      const { id, ...rest } = data;
      return apiRequest('PUT', `/api/education-history/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education-history'] });
      toast({
        title: 'Education History Updated',
        description: 'Your education has been updated successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update education history: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete education history mutation
  const deleteEducationHistoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/education-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/education-history'] });
      toast({
        title: 'Education History Deleted',
        description: 'The education entry has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete education history: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this education entry?')) {
      deleteEducationHistoryMutation.mutate(id);
    }
  };

  const onSubmit = (data: EducationHistoryFormValues) => {
    // If current is true, clear the endDate
    if (data.current) {
      data.endDate = undefined;
    }
    
    if (editingEducation) {
      updateEducationHistoryMutation.mutate({ ...data, id: editingEducation.id });
    } else {
      createEducationHistoryMutation.mutate(data);
    }
  };

  // Add achievement to the form
  const handleAddAchievement = () => {
    if (!achievement.trim()) return;
    
    const currentAchievements = form.getValues('achievements') || [];
    form.setValue('achievements', [...currentAchievements, achievement.trim()]);
    setAchievement('');
  };

  // Remove achievement from the form
  const handleRemoveAchievement = (index: number) => {
    const currentAchievements = form.getValues('achievements') || [];
    form.setValue(
      'achievements',
      currentAchievements.filter((_, i) => i !== index)
    );
  };

  // Format date range for display
  const formatDateRange = (startDate: string, endDate?: string, current?: boolean) => {
    const start = format(new Date(startDate), 'MMM yyyy');
    if (current) return `${start} - Present`;
    if (endDate) return `${start} - ${format(new Date(endDate), 'MMM yyyy')}`;
    return start;
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Education History</h1>
          <p className="text-neutral-500">Manage your educational background</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={handleAddNew}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Education
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : educationHistory && educationHistory.length > 0 ? (
        <div className="space-y-6">
          {educationHistory.map((item) => (
            <Card key={item.id} className="p-6 relative group">
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{item.degree} in {item.fieldOfStudy}</h2>
                    <div className="flex items-center space-x-2 mt-1 md:mt-0">
                      {item.current && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Current
                        </Badge>
                      )}
                      <div className="text-sm text-neutral-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateRange(item.startDate, item.endDate, item.current)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-primary font-medium mb-4">
                    <span>{item.institution}</span>
                    {item.location && (
                      <>
                        <span className="mx-2">•</span>
                        <div className="flex items-center text-neutral-500 font-normal">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
                        </div>
                      </>
                    )}
                    {item.gpa && (
                      <>
                        <span className="mx-2">•</span>
                        <div className="text-neutral-500 font-normal">
                          GPA: {item.gpa}
                        </div>
                      </>
                    )}
                  </div>
                  
                  {item.description && (
                    <div className="mb-4">
                      <p className="text-neutral-700">{item.description}</p>
                    </div>
                  )}
                  
                  {item.achievements && item.achievements.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2 flex items-center">
                        <Sparkles className="h-4 w-4 mr-1 text-amber-500" />
                        Achievements & Activities
                      </h3>
                      <ul className="list-disc pl-5 space-y-1">
                        {item.achievements.map((achievement, index) => (
                          <li key={index} className="text-sm">{achievement}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <GraduationCap className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Education History Added</h3>
          <p className="text-neutral-500 mb-4">
            Add your educational background to showcase your academic achievements
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Education
          </Button>
        </div>
      )}
      
      {/* Education History Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEducation ? 'Edit Education' : 'Add Education'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Institution Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., University of Technology" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="degree"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Degree</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Bachelor of Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="fieldOfStudy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Field of Study</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Boston, MA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gpa"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GPA (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3.8/4.0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                        <Input 
                          type="date" 
                          disabled={form.watch('current')}
                          placeholder={form.watch('current') ? "Present" : ""}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>I am currently studying here</FormLabel>
                    </div>
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
                        placeholder="Describe your studies, specializations, or thesis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Achievements section */}
              <div>
                <FormLabel>Achievements & Activities</FormLabel>
                <div className="flex mt-2 mb-2 gap-2">
                  <Input
                    placeholder="e.g., Dean's List, Research Project, Student Organization"
                    value={achievement}
                    onChange={(e) => setAchievement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddAchievement}>Add</Button>
                </div>
                
                {form.watch('achievements').length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2">Added Achievements:</h4>
                    <ul className="space-y-2">
                      {form.watch('achievements').map((item, index) => (
                        <li key={index} className="flex items-center justify-between p-2 bg-muted rounded-md text-sm">
                          <span>{item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => handleRemoveAchievement(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingEducation ? 'Update Education' : 'Add Education'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}