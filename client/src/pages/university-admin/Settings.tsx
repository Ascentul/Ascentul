import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { 
  AlertCircle, 
  Check, 
  Trash2, 
  Upload, 
  Lock, 
  Globe, 
  Mail, 
  BellRing, 
  Users,
  Building,
  GraduationCap,
  BookOpen,
  Plus,
  PenLine,
  Calendar,
  Loader2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Form schema for university profile
const universityProfileSchema = z.object({
  universityName: z.string().min(1, 'University name is required'),
  description: z.string().optional(),
  website: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  contactEmail: z.string().email('Please enter a valid email address'),
  logo: z.any().optional(),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color code'),
  secondaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color code').optional(),
});

// Schema for integration settings
const integrationSettingsSchema = z.object({
  lmsEnabled: z.boolean().default(false),
  lmsApiKey: z.string().optional(),
  lmsUrl: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  ssoEnabled: z.boolean().default(false),
  ssoProvider: z.string().optional(),
  ssoClientId: z.string().optional(),
  ssoClientSecret: z.string().optional(),
});

// Schema for notification settings
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean().default(true),
  studentActivityDigest: z.boolean().default(true),
  usageReports: z.boolean().default(true),
  sendCopyToAdmin: z.boolean().default(false),
  adminEmail: z.string().email('Please enter a valid email address').optional(),
});

// Interface for academic programs
export interface AcademicProgram {
  id: number;
  programName: string;
  degreeType: 'Associate' | 'Bachelor' | 'Master' | 'Doctorate' | 'Certificate';
  departmentName: string;
  description?: string;
  duration?: number;
  active: boolean;
}

// Schema for academic program
const academicProgramSchema = z.object({
  programName: z.string().min(1, 'Program name is required'),
  degreeType: z.enum(['Associate', 'Bachelor', 'Master', 'Doctorate', 'Certificate']),
  departmentName: z.string().min(1, 'Department name is required'),
  description: z.string().optional(),
  duration: z.number().min(1, 'Duration must be at least 1').max(10, 'Duration cannot exceed 10'),
  active: z.boolean().default(true),
});

export default function Settings() {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isAddProgramDialogOpen, setIsAddProgramDialogOpen] = useState(false);
  const [isEditProgramDialogOpen, setIsEditProgramDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<AcademicProgram | null>(null);
  
  // Query for fetching academic programs
  const { 
    data: programs = [], 
    isLoading: programsLoading,
    error: programsError 
  } = useQuery({
    queryKey: ['/api/academic-programs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/academic-programs');
      if (!response.ok) {
        throw new Error('Failed to fetch academic programs');
      }
      return response.json();
    }
  });
  
  // Mutation for adding a new program
  const addProgramMutation = useMutation({
    mutationFn: async (program: z.infer<typeof academicProgramSchema>) => {
      const response = await apiRequest('POST', '/api/academic-programs', program);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add program: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
      setIsAddProgramDialogOpen(false);
      toast({
        title: 'Program Added',
        description: 'The academic program has been added successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Add Program',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutation for updating a program
  const updateProgramMutation = useMutation({
    mutationFn: async ({ id, program }: { id: number, program: z.infer<typeof academicProgramSchema> }) => {
      const response = await apiRequest('PUT', `/api/academic-programs/${id}`, program);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update program: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
      setIsEditProgramDialogOpen(false);
      setSelectedProgram(null);
      toast({
        title: 'Program Updated',
        description: 'The academic program has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Update Program',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Mutation for deleting a program
  const deleteProgramMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/academic-programs/${id}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete program: ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] });
      setIsEditProgramDialogOpen(false);
      setSelectedProgram(null);
      toast({
        title: 'Program Deleted',
        description: 'The academic program has been deleted successfully.',
        variant: 'destructive',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Delete Program',
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  // University profile form
  const profileForm = useForm<z.infer<typeof universityProfileSchema>>({
    resolver: zodResolver(universityProfileSchema),
    defaultValues: {
      universityName: user?.universityName || 'Stanford University',
      description: 'Stanford University is a leading research and teaching institution located in Stanford, California. Established in 1885, Stanford is dedicated to providing an innovative and transformational education that prepares students to be creative citizens and leaders.',
      website: 'https://www.stanford.edu',
      contactEmail: 'career-services@stanford.edu',
      primaryColor: '#8C1515',
      secondaryColor: '#2F2424',
    },
  });

  // Integration settings form
  const integrationForm = useForm<z.infer<typeof integrationSettingsSchema>>({
    resolver: zodResolver(integrationSettingsSchema),
    defaultValues: {
      lmsEnabled: true,
      lmsApiKey: 'lms_api_key_123456789',
      lmsUrl: 'https://canvas.stanford.edu',
      ssoEnabled: true,
      ssoProvider: 'SAML',
      ssoClientId: 'stanford_sso_client_123',
      ssoClientSecret: '••••••••••••••••',
    },
  });

  // Notification settings form
  const notificationForm = useForm<z.infer<typeof notificationSettingsSchema>>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      emailNotifications: true,
      studentActivityDigest: true,
      usageReports: true,
      sendCopyToAdmin: true,
      adminEmail: 'admin@stanford.edu',
    },
  });

  // Handle logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form submission handlers
  const onProfileSubmit = (data: z.infer<typeof universityProfileSchema>) => {
    console.log('Profile data:', data);
    toast({
      title: 'Profile updated',
      description: 'University profile settings have been saved.',
    });
  };

  const onIntegrationSubmit = (data: z.infer<typeof integrationSettingsSchema>) => {
    console.log('Integration data:', data);
    toast({
      title: 'Integration settings updated',
      description: 'Integration settings have been saved.',
    });
  };

  const onNotificationSubmit = (data: z.infer<typeof notificationSettingsSchema>) => {
    console.log('Notification data:', data);
    toast({
      title: 'Notification settings updated',
      description: 'Notification preferences have been saved.',
    });
  };
  
  // Academic program form management
  const programForm = useForm<z.infer<typeof academicProgramSchema>>({
    resolver: zodResolver(academicProgramSchema),
    defaultValues: {
      programName: '',
      degreeType: 'Bachelor',
      departmentName: '',
      description: '',
      duration: 4,
      active: true,
    }
  });
  
  const editProgramForm = useForm<z.infer<typeof academicProgramSchema>>({
    resolver: zodResolver(academicProgramSchema),
    defaultValues: {
      programName: '',
      degreeType: 'Bachelor',
      departmentName: '',
      description: '',
      duration: 4,
      active: true,
    }
  });
  
  // Reset and initialize add program form
  const handleOpenAddProgramDialog = () => {
    programForm.reset({
      programName: '',
      degreeType: 'Bachelor', 
      departmentName: '',
      description: '',
      duration: 4,
      active: true,
    });
    setIsAddProgramDialogOpen(true);
  };
  
  // Reset and initialize edit program form
  const handleOpenEditProgramDialog = (program: AcademicProgram) => {
    setSelectedProgram(program);
    editProgramForm.reset({
      programName: program.programName,
      degreeType: program.degreeType as any,
      departmentName: program.departmentName,
      description: program.description || '',
      duration: program.duration || 4,
      active: program.active,
    });
    setIsEditProgramDialogOpen(true);
  };
  
  // Add a new program
  const handleAddProgram = (data: z.infer<typeof academicProgramSchema>) => {
    addProgramMutation.mutate(data);
  };
  
  // Update an existing program
  const handleUpdateProgram = (data: z.infer<typeof academicProgramSchema>) => {
    if (!selectedProgram) return;
    
    updateProgramMutation.mutate({
      id: selectedProgram.id,
      program: data
    });
  };
  
  // Delete a program
  const handleDeleteProgram = (id: number) => {
    deleteProgramMutation.mutate(id);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">University Settings</h1>
        <p className="text-muted-foreground">
          Manage your university's profile, integrations, and notification preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            University Profile
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Globe className="mr-2 h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center">
            <BellRing className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="programs" className="flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Programs
          </TabsTrigger>
        </TabsList>

        {/* University Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>University Profile</CardTitle>
              <CardDescription>
                Manage your university's profile information and branding.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* University Name */}
                    <FormField
                      control={profileForm.control}
                      name="universityName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>University Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter university name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Contact Email */}
                    <FormField
                      control={profileForm.control}
                      name="contactEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter contact email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Website */}
                    <FormField
                      control={profileForm.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website</FormLabel>
                          <FormControl>
                            <Input placeholder="https://www.example.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Logo Upload */}
                    <div className="space-y-2">
                      <FormLabel>University Logo</FormLabel>
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                          {logoPreview ? (
                            <img src={logoPreview} alt="University logo" className="w-full h-full object-contain" />
                          ) : (
                            <GraduationCap className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <label className="cursor-pointer">
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Logo
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={handleLogoUpload}
                              />
                            </label>
                          </Button>
                          <FormDescription className="text-xs mt-1">
                            PNG, JPG or SVG (max. 2MB)
                          </FormDescription>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* University Description */}
                  <FormField
                    control={profileForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter a brief description of your university"
                            className="min-h-32"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Theme */}
                  <div className="space-y-2">
                    <FormLabel>Brand Colors</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={profileForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border" 
                                style={{ backgroundColor: field.value }}
                              />
                              <FormControl>
                                <Input placeholder="#000000" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>Primary Color</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={profileForm.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-6 h-6 rounded border" 
                                style={{ backgroundColor: field.value }}
                              />
                              <FormControl>
                                <Input placeholder="#000000" {...field} />
                              </FormControl>
                            </div>
                            <FormDescription>Secondary Color</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <Button type="submit">Save University Profile</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>LMS Integration</CardTitle>
              <CardDescription>
                Connect with your Learning Management System (Canvas, Blackboard, etc.)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...integrationForm}>
                <form onSubmit={integrationForm.handleSubmit(onIntegrationSubmit)} className="space-y-6">
                  <FormField
                    control={integrationForm.control}
                    name="lmsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable LMS Integration</FormLabel>
                          <FormDescription>
                            Sync student data with your Learning Management System
                          </FormDescription>
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

                  {integrationForm.watch('lmsEnabled') && (
                    <div className="space-y-4">
                      <FormField
                        control={integrationForm.control}
                        name="lmsUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LMS URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://canvas.yourschool.edu" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={integrationForm.control}
                        name="lmsApiKey"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>LMS API Key</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter API key" {...field} />
                            </FormControl>
                            <FormDescription>
                              This key will be used to authenticate with your LMS
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  <FormField
                    control={integrationForm.control}
                    name="ssoEnabled"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Single Sign-On</FormLabel>
                          <FormDescription>
                            Allow students to login with your university's authentication system
                          </FormDescription>
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

                  {integrationForm.watch('ssoEnabled') && (
                    <div className="space-y-4">
                      <FormField
                        control={integrationForm.control}
                        name="ssoProvider"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>SSO Provider</FormLabel>
                            <FormControl>
                              <Input placeholder="SAML, OAuth, etc." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={integrationForm.control}
                          name="ssoClientId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client ID</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter client ID" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={integrationForm.control}
                          name="ssoClientSecret"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Client Secret</FormLabel>
                              <FormControl>
                                <div className="flex">
                                  <Input
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    {...field}
                                    className="rounded-r-none"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-l-none"
                                  >
                                    <Lock className="h-4 w-4" />
                                  </Button>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  )}

                  <Button type="submit">Save Integration Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage email notifications and reports for your university
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationForm}>
                <form onSubmit={notificationForm.handleSubmit(onNotificationSubmit)} className="space-y-6">
                  <FormField
                    control={notificationForm.control}
                    name="emailNotifications"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Email Notifications</FormLabel>
                          <FormDescription>
                            Receive email notifications about important updates
                          </FormDescription>
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
                    control={notificationForm.control}
                    name="studentActivityDigest"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Student Activity Digest</FormLabel>
                          <FormDescription>
                            Receive weekly summaries of student activity
                          </FormDescription>
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
                    control={notificationForm.control}
                    name="usageReports"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Monthly Usage Reports</FormLabel>
                          <FormDescription>
                            Receive monthly reports on platform usage and student engagement
                          </FormDescription>
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
                    control={notificationForm.control}
                    name="sendCopyToAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Send Copy to Administrator</FormLabel>
                          <FormDescription>
                            Send a copy of all notifications to the administrator email
                          </FormDescription>
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

                  {notificationForm.watch('sendCopyToAdmin') && (
                    <FormField
                      control={notificationForm.control}
                      name="adminEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Administrator Email</FormLabel>
                          <FormControl>
                            <Input placeholder="admin@example.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button type="submit">Save Notification Settings</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Academic Programs Tab */}
        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Academic Programs</CardTitle>
                <CardDescription>
                  Manage your university's academic programs and departments.
                </CardDescription>
              </div>
              <Button 
                onClick={handleOpenAddProgramDialog} 
                className="ml-auto"
                size="sm"
                disabled={programsLoading || addProgramMutation.isPending}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </CardHeader>
            <CardContent>
              {programsLoading ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <Loader2 className="h-10 w-10 text-muted-foreground mb-3 animate-spin" />
                  <h3 className="font-semibold mb-1">Loading programs...</h3>
                </div>
              ) : programsError ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <AlertCircle className="h-10 w-10 text-destructive mb-3" />
                  <h3 className="font-semibold mb-1">Error loading programs</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {(programsError as Error).message || 'Failed to fetch academic programs'}
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/academic-programs'] })}
                  >
                    Try Again
                  </Button>
                </div>
              ) : programs.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-semibold mb-1">No programs added</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your first academic program to start managing course offerings.
                  </p>
                  <Button variant="secondary" onClick={handleOpenAddProgramDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Program
                  </Button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full divide-y text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left font-medium">Program</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium">Degree Type</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium">Department</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium">Duration</th>
                        <th scope="col" className="px-4 py-3 text-left font-medium">Status</th>
                        <th scope="col" className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {programs.map((program: AcademicProgram) => (
                        <tr key={program.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium">{program.programName}</div>
                          </td>
                          <td className="px-4 py-3">{program.degreeType}</td>
                          <td className="px-4 py-3">{program.departmentName}</td>
                          <td className="px-4 py-3">{program.duration} {program.duration === 1 ? 'year' : 'years'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              program.active 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {program.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleOpenEditProgramDialog(program)}
                              disabled={updateProgramMutation.isPending || deleteProgramMutation.isPending}
                            >
                              <PenLine className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Add Program Dialog */}
          <Dialog open={isAddProgramDialogOpen} onOpenChange={setIsAddProgramDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add Academic Program</DialogTitle>
                <DialogDescription>
                  Create a new academic program for your university.
                </DialogDescription>
              </DialogHeader>
              <Form {...programForm}>
                <form onSubmit={programForm.handleSubmit(handleAddProgram)} className="space-y-4">
                  <FormField
                    control={programForm.control}
                    name="programName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="degreeType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Degree Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select degree type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Associate">Associate</SelectItem>
                            <SelectItem value="Bachelor">Bachelor</SelectItem>
                            <SelectItem value="Master">Master</SelectItem>
                            <SelectItem value="Doctorate">Doctorate</SelectItem>
                            <SelectItem value="Certificate">Certificate</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="departmentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., School of Engineering" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a brief description of the program" 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Program</FormLabel>
                          <FormDescription>
                            Inactive programs won't be displayed to students
                          </FormDescription>
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
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => setIsAddProgramDialogOpen(false)}
                      disabled={addProgramMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={addProgramMutation.isPending}
                    >
                      {addProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        'Add Program'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          {/* Edit Program Dialog */}
          <Dialog open={isEditProgramDialogOpen} onOpenChange={setIsEditProgramDialogOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Edit Academic Program</DialogTitle>
                <DialogDescription>
                  Update the details of an existing academic program.
                </DialogDescription>
              </DialogHeader>
              <Form {...editProgramForm}>
                <form onSubmit={editProgramForm.handleSubmit(handleUpdateProgram)} className="space-y-4">
                  <FormField
                    control={editProgramForm.control}
                    name="programName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Computer Science" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editProgramForm.control}
                      name="degreeType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Degree Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select degree type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Associate">Associate</SelectItem>
                              <SelectItem value="Bachelor">Bachelor</SelectItem>
                              <SelectItem value="Master">Master</SelectItem>
                              <SelectItem value="Doctorate">Doctorate</SelectItem>
                              <SelectItem value="Certificate">Certificate</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editProgramForm.control}
                      name="duration"
                      render={({ field }) => (
                        <div>
                          <div className="text-sm font-medium">Duration (years)</div>
                          <div className="mt-1">
                            <Input 
                              type="number" 
                              min={1} 
                              max={10} 
                              {...field}
                              onChange={e => field.onChange(Number(e.target.value))}
                            />
                          </div>
                          <div className="mt-1 text-sm text-destructive">{editProgramForm.formState.errors.duration?.message}</div>
                        </div>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={editProgramForm.control}
                    name="departmentName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., School of Engineering" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editProgramForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Provide a brief description of the program" 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editProgramForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active Program</FormLabel>
                          <FormDescription>
                            Inactive programs won't be displayed to students
                          </FormDescription>
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
                  
                  <DialogFooter className="flex justify-between">
                    <Button 
                      variant="destructive" 
                      type="button" 
                      onClick={() => selectedProgram && handleDeleteProgram(selectedProgram.id)}
                      disabled={deleteProgramMutation.isPending || updateProgramMutation.isPending}
                    >
                      {deleteProgramMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Program
                        </>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => setIsEditProgramDialogOpen(false)}
                        disabled={updateProgramMutation.isPending || deleteProgramMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={updateProgramMutation.isPending}
                      >
                        {updateProgramMutation.isPending ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Update Program'
                        )}
                      </Button>
                    </div>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}