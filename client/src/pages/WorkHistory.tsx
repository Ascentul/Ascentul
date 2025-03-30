import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Plus, 
  BriefcaseBusiness, 
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

const workHistorySchema = z.object({
  company: z.string().min(1, { message: 'Company name is required' }),
  position: z.string().min(1, { message: 'Position is required' }),
  location: z.string().optional(),
  startDate: z.string().min(1, { message: 'Start date is required' }),
  endDate: z.string().optional(),
  currentJob: z.boolean().default(false),
  description: z.string().optional(),
  achievements: z.array(z.string()).default([]),
});

type WorkHistoryFormValues = z.infer<typeof workHistorySchema>;

export default function WorkHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkHistory, setEditingWorkHistory] = useState<any>(null);
  const [achievement, setAchievement] = useState('');
  
  // Fetch work history
  const { data: workHistory, isLoading } = useQuery({
    queryKey: ['/api/work-history'],
  });

  const form = useForm<WorkHistoryFormValues>({
    resolver: zodResolver(workHistorySchema),
    defaultValues: {
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      currentJob: false,
      description: '',
      achievements: [],
    }
  });

  const resetForm = () => {
    form.reset({
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      currentJob: false,
      description: '',
      achievements: [],
    });
    setAchievement('');
  };

  // Open dialog for adding new work history
  const handleAddNew = () => {
    setEditingWorkHistory(null);
    resetForm();
    setIsDialogOpen(true);
  };

  // Open dialog for editing work history
  const handleEdit = (item: any) => {
    setEditingWorkHistory(item);
    
    form.reset({
      company: item.company,
      position: item.position,
      location: item.location || '',
      startDate: item.startDate ? format(new Date(item.startDate), 'yyyy-MM-dd') : '',
      endDate: item.currentJob ? '' : (item.endDate ? format(new Date(item.endDate), 'yyyy-MM-dd') : ''),
      currentJob: !!item.currentJob,
      description: item.description || '',
      achievements: item.achievements || [],
    });
    
    setIsDialogOpen(true);
  };

  // Create work history mutation
  const createWorkHistoryMutation = useMutation({
    mutationFn: async (data: WorkHistoryFormValues) => {
      return apiRequest('POST', '/api/work-history', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
      toast({
        title: 'Work History Added',
        description: 'Your work experience has been added successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add work history: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Update work history mutation
  const updateWorkHistoryMutation = useMutation({
    mutationFn: async (data: WorkHistoryFormValues & { id: number }) => {
      const { id, ...rest } = data;
      return apiRequest('PUT', `/api/work-history/${id}`, rest);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
      toast({
        title: 'Work History Updated',
        description: 'Your work experience has been updated successfully',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to update work history: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Delete work history mutation
  const deleteWorkHistoryMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/work-history/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-history'] });
      toast({
        title: 'Work History Deleted',
        description: 'The work experience has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to delete work history: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this work experience?')) {
      deleteWorkHistoryMutation.mutate(id);
    }
  };

  const onSubmit = (data: WorkHistoryFormValues) => {
    // If currentJob is true, clear the endDate
    if (data.currentJob) {
      data.endDate = undefined;
    }
    
    if (editingWorkHistory) {
      updateWorkHistoryMutation.mutate({ ...data, id: editingWorkHistory.id });
    } else {
      createWorkHistoryMutation.mutate(data);
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
  const formatDateRange = (startDate: string, endDate?: string, currentJob?: boolean) => {
    const start = format(new Date(startDate), 'MMM yyyy');
    if (currentJob) return `${start} - Present`;
    if (endDate) return `${start} - ${format(new Date(endDate), 'MMM yyyy')}`;
    return start;
  };

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-poppins">Work History</h1>
          <p className="text-neutral-500">Manage your professional experience</p>
        </div>
        <Button 
          className="mt-4 md:mt-0"
          onClick={handleAddNew}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Experience
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : workHistory && workHistory.length > 0 ? (
        <div className="space-y-6">
          {workHistory.map((item) => (
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
                  <BriefcaseBusiness className="h-6 w-6 text-primary" />
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{item.position}</h2>
                    <div className="flex items-center space-x-2 mt-1 md:mt-0">
                      {item.currentJob && (
                        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                          Current
                        </Badge>
                      )}
                      <div className="text-sm text-neutral-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDateRange(item.startDate, item.endDate, item.currentJob)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-primary font-medium mb-4">
                    <span>{item.company}</span>
                    {item.location && (
                      <>
                        <span className="mx-2">•</span>
                        <div className="flex items-center text-neutral-500 font-normal">
                          <MapPin className="h-4 w-4 mr-1" />
                          {item.location}
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
                        Key Achievements
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
          <BriefcaseBusiness className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <h3 className="text-xl font-medium mb-2">No Work Experience Added</h3>
          <p className="text-neutral-500 mb-4">
            Add your professional experience to showcase your career journey
          </p>
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Experience
          </Button>
        </div>
      )}
      
      {/* Work History Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkHistory ? 'Edit Work Experience' : 'Add Work Experience'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Acme Corporation" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                          disabled={form.watch('currentJob')}
                          placeholder={form.watch('currentJob') ? "Present" : ""}
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
                name="currentJob"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>This is my current job</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your responsibilities and role..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <FormLabel>Key Achievements</FormLabel>
                  <div className="text-xs text-neutral-500">Highlight your accomplishments</div>
                </div>
                
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="e.g., Increased sales by 20% in 6 months"
                    value={achievement}
                    onChange={(e) => setAchievement(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAchievement();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddAchievement}>
                    Add
                  </Button>
                </div>
                
                {form.watch('achievements').length > 0 && (
                  <div className="bg-neutral-50 p-3 rounded-md border">
                    <ul className="space-y-2">
                      {form.watch('achievements').map((item, index) => (
                        <li key={index} className="flex items-center justify-between text-sm">
                          <span>• {item}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveAchievement(index)}
                            className="h-6 w-6 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingWorkHistory ? 'Update Experience' : 'Add Experience'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
