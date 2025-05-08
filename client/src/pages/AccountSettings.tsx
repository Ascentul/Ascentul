import React, { useState, useEffect } from 'react';
import { useUser, useIsSubscriptionActive, useUpdateUserSubscription } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useCareerData } from '@/hooks/use-career-data';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

// Import the form modals
import { WorkHistoryFormModal } from '@/components/modals/WorkHistoryFormModal';
import { EducationFormModal } from '@/components/modals/EducationFormModal';
import { SkillFormModal } from '@/components/modals/SkillFormModal';
import { CertificationFormModal } from '@/components/modals/CertificationFormModal';
import { CareerSummaryFormModal } from '@/components/modals/CareerSummaryFormModal';
import { DeleteConfirmationDialog } from '@/components/modals/DeleteConfirmationDialog';
import { AddSectionButton } from '@/components/AddSectionButton';

import { 
  Loader2, 
  CreditCard, 
  ShieldCheck, 
  User, 
  LogOut, 
  Mail, 
  CheckCircle, 
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  RefreshCw,
  HelpCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ModeToggle } from '@/components/mode-toggle';

// Color pickers removed as per branding decision

// Schema for validating the profile form
const profileFormSchema = z.object({
  name: z.string().nonempty({ message: "Name is required." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  currentPassword: z.string().optional().or(z.literal('')), // Optional current password (required for email/password change)
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters." })
    .optional()
    .or(z.literal('')), // Allow empty string for no password change
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AccountSettings() {
  const { user, isLoading: userLoading, logout, updateProfile } = useUser();
  const isSubscriptionActive = useIsSubscriptionActive();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const updateUserSubscription = useUpdateUserSubscription();
  // Theme color customization removed as per branding decision
  const careerQuery = useCareerData();
  const { careerData, isLoading: careerDataLoading, refetch: refetchCareerData } = careerQuery;
  
  // Track the current active tab
  const [activeTab, setActiveTab] = useState('career');
  
  // Track overall page loading state - combines user and career data loading
  const isPageLoading = userLoading || (activeTab === 'career' && careerDataLoading);
  
  // Create form first before using it in useEffect
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '', // Current password field (required for email/password changes)
      password: '', // Empty password field by default (no password change)
    },
  });

  // No need to force refresh on component mount - rely on React Query's caching
  // This prevents the white flash by not removing cached data
  useEffect(() => {
    // Only refetch if the data is stale, which React Query handles automatically
    // We don't need to manually removeQueries
    if (!careerData) {
      console.log('Career data not found in cache, fetching');
      refetchCareerData();
    }
    
    // Always update form values when user data changes
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
        currentPassword: '',
        password: '',
      });
    }
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);
  
  // Only refresh career data when user switches to the Career tab IF data is stale or missing
  useEffect(() => {
    if (activeTab === 'career' && (!careerData || Object.keys(careerData).length === 0)) {
      console.log('Career data missing or empty, fetching on tab change');
      refetchCareerData().then(() => {
        console.log('Career data loaded on tab change');
      });
    }
    
    // Update form with latest user data when switching to profile tab
    if (activeTab === 'profile' && user) {
      form.reset({
        name: user.name,
        email: user.email,
        currentPassword: '', // Always reset password fields
        password: '',
      });
    }
  }, [activeTab, refetchCareerData, careerData, user, form]);
  
  // Modal state variables for career data forms
  const [workHistoryModal, setWorkHistoryModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    data?: any;
    id?: number;
  }>({ open: false, mode: 'add' });
  
  const [educationModal, setEducationModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    data?: any;
    id?: number;
  }>({ open: false, mode: 'add' });
  
  const [skillModal, setSkillModal] = useState<{
    open: boolean;
  }>({ open: false });
  
  const [certificationModal, setCertificationModal] = useState<{
    open: boolean;
    mode: 'add' | 'edit';
    data?: any;
    id?: number;
  }>({ open: false, mode: 'add' });
  
  const [careerSummaryModal, setCareerSummaryModal] = useState<{
    open: boolean;
    defaultValue: string;
  }>({ open: false, defaultValue: '' });
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    itemId: number;
    itemType: string;
    endpoint: string;
  }>({ open: false, itemId: 0, itemType: '', endpoint: '' });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/payments/cancel-subscription', {});
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled and will end at the end of your billing period.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Theme customization mutation removed as per branding decision

  // Send verification email mutation
  const sendVerificationEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/auth/send-verification-email', {});
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send verification email');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox for the verification link.",
      });
      
      // For development only - directly show the verification URL
      if (data.verificationUrl) {
        toast({
          title: "Development Mode",
          description: "Verification link: " + data.verificationUrl,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Email Send Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleCancelSubscription = async () => {
    if (!user || !isSubscriptionActive) {
      return;
    }
    
    cancelSubscriptionMutation.mutate();
  };

  const handleSendVerificationEmail = async () => {
    if (!user || user.emailVerified) {
      return;
    }
    
    sendVerificationEmailMutation.mutate();
  };

  const handleProfileSubmit = async (data: ProfileFormValues) => {
    try {
      if (!user) {
        throw new Error("User not found");
      }
      
      // Validate password requirements for email or password changes
      const isEmailChanged = data.email !== user.email;
      const isPasswordChanged = data.password && data.password.trim() !== '';
      
      if ((isEmailChanged || isPasswordChanged) && (!data.currentPassword || data.currentPassword.trim() === '')) {
        toast({
          title: "Validation Error",
          description: "Current password is required when changing email or password.",
          variant: "destructive"
        });
        return;
      }
      
      // Prepare update data
      const updateData: any = {
        name: data.name
      };
      
      // Only include email and password changes if current password is provided
      if (data.currentPassword && data.currentPassword.trim() !== '') {
        // Add current password for verification
        updateData.currentPassword = data.currentPassword;
        
        // Add email update if changed
        if (isEmailChanged) {
          updateData.email = data.email;
        }
        
        // Add password update if provided
        if (isPasswordChanged) {
          updateData.password = data.password;
        }
      } else if (data.name !== user.name) {
        // If only updating name (no password required)
        updateData.name = data.name;
      }
      
      // Send the update to the server
      await updateProfile(updateData);
      
      // Reset password fields after successful update
      form.setValue('password', '');
      form.setValue('currentPassword', '');
      
      // Show success toast
      toast({
        title: "Profile Updated",
        description: "Your profile information has been updated.",
      });
    } catch (error: any) {
      // Show error toast
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile information.",
        variant: "destructive"
      });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  // Theme color customization handlers removed as per branding decision

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // Show skeleton loading state when page is loading
  if (isPageLoading) {
    return (
      <div className="container py-10">
        <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
        
        <div className="space-y-8">
          <div className="flex flex-wrap gap-2 border-b">
            {["Profile", "Career", "Subscription", "Security"].map((tab, index) => (
              <div key={index} className="animate-pulse px-4 py-2 rounded-t-lg bg-gray-100 w-24 h-10" />
            ))}
          </div>
          
          <div className="px-6 py-8">
            <div className="space-y-6">
              {/* Skeleton for content section */}
              <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
                <div className="mb-4">
                  <div className="h-7 bg-gray-200 rounded w-1/3 animate-pulse mb-2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3 animate-pulse" />
                </div>
                
                {/* Skeleton form fields */}
                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                      <div className="h-10 bg-gray-100 rounded w-full animate-pulse" />
                    </div>
                  ))}
                  
                  <div className="flex justify-end">
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getPlanName = (plan: string) => {
    switch(plan) {
      case 'premium': return 'Premium';
      case 'university': return 'University Edition';
      default: return 'Free';
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-8">Account Settings</h1>
      
      <Tabs 
        defaultValue="career" 
        className="space-y-8"
        onValueChange={(value) => {
          console.log(`Tab changed to: ${value}`);
          setActiveTab(value);
        }}
      >
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="career" className="flex items-center">
            <Briefcase className="mr-2 h-4 w-4" />
            Career
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="px-6 py-8">
          <div className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
                <p className="text-sm text-gray-500 mt-1">Update your personal information and how we can contact you.</p>
              </div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-500">Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-500">Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          {user.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-100 text-xs font-medium px-2 py-0.5 rounded-full">
                              ✅ Verified
                            </span>
                          ) : (
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-sm" 
                              onClick={handleSendVerificationEmail}
                              disabled={sendVerificationEmailMutation.isPending}
                            >
                              {sendVerificationEmailMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>Not verified. Click to verify</>
                              )}
                            </Button>
                          )}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-500">Current Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Required to change email or password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Required only when changing email or password.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm text-gray-500">New Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Leave blank to keep current password" 
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters. Leave blank to keep your current password.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={form.formState.isSubmitting}
                      className="w-full sm:w-auto"
                    >
                      {form.formState.isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
            
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
                <p className="text-sm text-gray-500 mt-1">View your account details and session information.</p>
              </div>
              
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Username</dt>
                  <dd className="font-medium">{user.username}</dd>
                </div>
                
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Account Type</dt>
                  <dd className="font-medium capitalize">{user.userType || 'Regular'}</dd>
                </div>
                
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Account Created</dt>
                  <dd className="font-medium">
                    {user.createdAt ? formatDate(new Date(user.createdAt)) : 'N/A'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-xs text-gray-500 mb-1">Last Password Change</dt>
                  <dd className="font-medium">
                    {user.passwordLastChanged ? formatDate(new Date(user.passwordLastChanged)) : 'N/A'}
                  </dd>
                </div>
              </dl>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2" 
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="career" className="px-6 py-8">
          <div className="space-y-8">
            {/* Career Summary Section */}
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-primary" />
                    Career Summary
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Your professional summary that appears on your profile.</p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => setCareerSummaryModal({
                    open: true,
                    defaultValue: careerData?.careerSummary || ''
                  })}
                >
                  {!careerData?.careerSummary ? (
                    <>
                      <Pencil className="h-4 w-4 mr-1" /> Add Summary
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4 mr-1" /> Edit
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-md text-gray-700 min-h-20">
                {careerData?.careerSummary ? (
                  <div className="whitespace-pre-wrap">{careerData.careerSummary}</div>
                ) : (
                  <div className="text-gray-400 italic">
                    No career summary yet. Add a professional summary that highlights your career goals, expertise, and what sets you apart.
                  </div>
                )}
              </div>
            </div>
            
            {/* Work History Section */}
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Briefcase className="h-5 w-5 mr-2 text-primary" />
                    Work History
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Your professional experience, positions, and achievements.</p>
                </div>
                
                <AddSectionButton 
                  onClick={() => setWorkHistoryModal({
                    open: true,
                    mode: 'add'
                  })}
                />
              </div>
              
              {!careerData?.workHistory || careerData.workHistory.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Briefcase className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No work history</h3>
                  <p className="mt-1 text-sm text-gray-500">Add your work experience to help build your professional profile.</p>
                  <div className="mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setWorkHistoryModal({
                        open: true,
                        mode: 'add'
                      })}
                    >
                      <Briefcase className="h-4 w-4 mr-2" />
                      Add Work Experience
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {careerData.workHistory.map((work: any) => (
                    <div key={work.id} className="border border-gray-200 rounded-md p-4 relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setWorkHistoryModal({
                            open: true,
                            mode: 'edit',
                            data: work,
                            id: work.id
                          })}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-500"
                          onClick={() => setDeleteConfirmation({
                            open: true,
                            itemId: work.id,
                            itemType: 'work history',
                            endpoint: 'work-history'
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <div>
                          <Badge variant="outline" className="font-normal">
                            {new Date(work.startDate).getFullYear()} - {work.endDate ? new Date(work.endDate).getFullYear() : 'Present'}
                          </Badge>
                          <h3 className="text-base font-semibold mt-2">{work.jobTitle}</h3>
                          <p className="text-sm text-gray-700">{work.company}</p>
                          <div className="text-xs text-gray-500 mt-1 flex items-center">
                            <MapPin className="h-3 w-3 mr-1 inline" />
                            {work.location || 'Remote'}
                          </div>
                          
                          {work.description && (
                            <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{work.description}</div>
                          )}
                          
                          {work.highlights && work.highlights.length > 0 && (
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-500">Achievements:</span>
                              <ul className="mt-1 text-sm text-gray-600 list-disc pl-5 space-y-1">
                                {work.highlights.map((highlight: string, i: number) => (
                                  <li key={i}>{highlight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Education Section */}
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                    Education
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Your academic background, degrees, and certifications.</p>
                </div>
                
                <AddSectionButton 
                  onClick={() => setEducationModal({
                    open: true,
                    mode: 'add'
                  })}
                />
              </div>
              
              {!careerData?.educationHistory || careerData.educationHistory.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <GraduationCap className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No education history</h3>
                  <p className="mt-1 text-sm text-gray-500">Add your degrees, courses, and educational background.</p>
                  <div className="mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setEducationModal({
                        open: true,
                        mode: 'add'
                      })}
                    >
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Add Education
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {careerData.educationHistory.map((edu: any) => (
                    <div key={edu.id} className="border border-gray-200 rounded-md p-4 relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEducationModal({
                            open: true,
                            mode: 'edit',
                            data: edu,
                            id: edu.id
                          })}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-500"
                          onClick={() => setDeleteConfirmation({
                            open: true,
                            itemId: edu.id,
                            itemType: 'education',
                            endpoint: 'education'
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      
                      <div>
                        <Badge variant="outline" className="font-normal">
                          {new Date(edu.startDate).getFullYear()} - {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                        </Badge>
                        <h3 className="text-base font-semibold mt-2">{edu.degreeType} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}</h3>
                        <p className="text-sm text-gray-700">{edu.institution}</p>
                        <div className="text-xs text-gray-500 mt-1 flex items-center">
                          <MapPin className="h-3 w-3 mr-1 inline" />
                          {edu.location || 'Remote'}
                        </div>
                        
                        {edu.description && (
                          <div className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{edu.description}</div>
                        )}
                        
                        {edu.achievements && edu.achievements.length > 0 && (
                          <div className="mt-2">
                            <span className="text-xs font-medium text-gray-500">Achievements:</span>
                            <ul className="mt-1 text-sm text-gray-600 list-disc pl-5 space-y-1">
                              {edu.achievements.map((achievement: string, i: number) => (
                                <li key={i}>{achievement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Skills Section */}
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-primary" />
                    Skills
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Technical and professional skills that define your expertise.</p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center"
                  onClick={() => setSkillModal({ open: true })}
                >
                  <Pencil className="h-4 w-4 mr-1" /> Manage Skills
                </Button>
              </div>
              
              {!careerData?.skills || careerData.skills.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <Award className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No skills added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add your technical, soft, and industry-specific skills.</p>
                  <div className="mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setSkillModal({ open: true })}
                    >
                      <Award className="h-4 w-4 mr-2" />
                      Add Skills
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {careerData.skills.map((skill, index: number) => (
                    <Badge key={index} variant="secondary" className="px-3 py-1">
                      {skill.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            {/* Certifications Section */}
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-primary" />
                    Certifications
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">Professional certifications, licenses, and accreditations.</p>
                </div>
                
                <AddSectionButton 
                  onClick={() => setCertificationModal({
                    open: true,
                    mode: 'add'
                  })}
                />
              </div>
              
              {!careerData?.certifications || careerData.certifications.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-md bg-gray-50">
                  <BookOpen className="mx-auto h-10 w-10 text-gray-400" />
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No certifications added</h3>
                  <p className="mt-1 text-sm text-gray-500">Add any professional certifications or credentials you've earned.</p>
                  <div className="mt-4">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setCertificationModal({
                        open: true,
                        mode: 'add'
                      })}
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      Add Certification
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {careerData.certifications.map((cert: any) => (
                    <div key={cert.id} className="border border-gray-200 rounded-md p-4 relative group">
                      <div className="opacity-0 group-hover:opacity-100 absolute top-3 right-3 flex gap-1 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setCertificationModal({
                            open: true,
                            mode: 'edit',
                            data: cert,
                            id: cert.id
                          })}
                        >
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:text-red-500"
                          onClick={() => setDeleteConfirmation({
                            open: true,
                            itemId: cert.id,
                            itemType: 'certification',
                            endpoint: 'certifications'
                          })}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                      
                      <div>
                        <h3 className="text-base font-semibold">{cert.name}</h3>
                        <p className="text-sm text-gray-700">{cert.issuingOrganization}</p>
                        
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {cert.issueDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Issued: {formatDate(new Date(cert.issueDate))}
                            </div>
                          )}
                          
                          {cert.expirationDate && (
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              Expires: {formatDate(new Date(cert.expirationDate))}
                            </div>
                          )}
                        </div>
                        
                        {cert.credentialId && (
                          <div className="mt-2 text-xs text-gray-500">
                            Credential ID: {cert.credentialId}
                          </div>
                        )}
                        
                        {cert.credentialUrl && (
                          <div className="mt-2">
                            <a 
                              href={cert.credentialUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              View Credential
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Form modals */}
          <WorkHistoryFormModal 
            open={workHistoryModal.open}
            mode={workHistoryModal.mode}
            defaultValues={workHistoryModal.data}
            id={workHistoryModal.id}
            onClose={() => setWorkHistoryModal({ ...workHistoryModal, open: false })}
            onSuccess={() => {
              setWorkHistoryModal({ ...workHistoryModal, open: false });
              refetchCareerData();
            }}
          />
          
          <EducationFormModal 
            open={educationModal.open}
            mode={educationModal.mode}
            defaultValues={educationModal.data}
            educationId={educationModal.id}
            onOpenChange={(open) => setEducationModal({ ...educationModal, open })}
            onSuccess={() => {
              setEducationModal({ ...educationModal, open: false });
              refetchCareerData();
            }}
          />
          
          <SkillFormModal 
            open={skillModal.open}
            skills={careerData?.skills || []}
            onOpenChange={(open) => setSkillModal({ ...skillModal, open })}
            onSuccess={() => {
              setSkillModal({ ...skillModal, open: false });
              refetchCareerData();
            }}
          />
          
          <CertificationFormModal 
            open={certificationModal.open}
            mode={certificationModal.mode}
            defaultValues={certificationModal.data}
            certificationId={certificationModal.id}
            onOpenChange={(open) => setCertificationModal({ ...certificationModal, open })}
            onSuccess={() => {
              setCertificationModal({ ...certificationModal, open: false });
              refetchCareerData();
            }}
          />
          
          <CareerSummaryFormModal 
            open={careerSummaryModal.open}
            defaultValue={careerSummaryModal.defaultValue}
            onOpenChange={(open) => setCareerSummaryModal({ ...careerSummaryModal, open })}
            onSuccess={() => {
              setCareerSummaryModal({ ...careerSummaryModal, open: false });
              refetchCareerData();
            }}
          />
          
          <DeleteConfirmationDialog
            open={deleteConfirmation.open}
            itemType={deleteConfirmation.itemType}
            onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}
            onConfirm={async () => {
              try {
                await apiRequest('DELETE', `/api/career-data/${deleteConfirmation.endpoint}/${deleteConfirmation.itemId}`, {});
                toast({
                  title: "Deleted",
                  description: `The ${deleteConfirmation.itemType} has been deleted.`,
                });
                refetchCareerData();
              } catch (error) {
                toast({
                  title: "Error",
                  description: `Failed to delete the ${deleteConfirmation.itemType}.`,
                  variant: "destructive",
                });
              } finally {
                setDeleteConfirmation({ ...deleteConfirmation, open: false });
              }
            }}
          />
        </TabsContent>
        
        <TabsContent value="subscription" className="px-6 py-8">
          <div className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Subscription Details</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your current subscription and billing information.</p>
              </div>
              
              <div className="border border-gray-200 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Current Plan</span>
                    <h3 className="text-xl font-semibold mt-1">{getPlanName(user.subscriptionPlan)}</h3>
                  </div>
                  
                  <Badge 
                    variant={user.subscriptionStatus === 'active' ? 'default' : 'outline'} 
                    className={
                      user.subscriptionStatus === 'active' ? 'bg-green-500 text-white' :
                      user.subscriptionStatus === 'past_due' ? 'bg-amber-500 text-white' :
                      user.subscriptionStatus === 'cancelled' ? 'border-amber-500 text-amber-500' :
                      'border-gray-500 text-gray-500'
                    }
                  >
                    {user.subscriptionStatus === 'active' ? 'Active' :
                     user.subscriptionStatus === 'past_due' ? 'Past Due' :
                     user.subscriptionStatus === 'cancelled' ? 'Cancelled' :
                     'Inactive'}
                  </Badge>
                </div>
                
                <div className="space-y-4">
                  {user.subscriptionPlan !== 'free' && (
                    <>
                      <dl className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <dt className="text-gray-500">Billing Period</dt>
                          <dd className="font-medium capitalize">
                            {user.subscriptionCycle || 'Monthly'}
                          </dd>
                        </div>
                        
                        <div>
                          <dt className="text-gray-500">Next Billing Date</dt>
                          <dd className="font-medium">
                            {user.subscriptionExpiresAt ? formatDate(new Date(user.subscriptionExpiresAt)) : 'N/A'}
                          </dd>
                        </div>
                      </dl>
                      
                      {isSubscriptionActive && (
                        <div className="pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50 hover:border-red-200"
                            onClick={handleCancelSubscription}
                            disabled={cancelSubscriptionMutation.isPending}
                          >
                            {cancelSubscriptionMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              'Cancel Subscription'
                            )}
                          </Button>
                          <p className="text-xs text-gray-500 mt-2">
                            Your subscription will remain active until the end of your current billing period.
                          </p>
                        </div>
                      )}
                    </>
                  )}
                  
                  {user.subscriptionPlan === 'free' && (
                    <div className="py-4">
                      <p className="text-sm text-gray-600">You're currently on the free plan with limited features.</p>
                      <Button
                        className="mt-4"
                        onClick={() => {
                          navigate('/pricing');
                        }}
                      >
                        Upgrade Now
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                <h3 className="text-base font-semibold mb-2">Plan Features</h3>
                
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Career profile management</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Resume builder (basic templates)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span>Application tracking</span>
                  </li>
                  
                  {user.subscriptionPlan === 'premium' && (
                    <>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>AI-powered resume feedback</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Cover letter generator</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Interview preparation tools</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Advanced analytics and insights</span>
                      </li>
                    </>
                  )}
                </ul>
                
                {user.subscriptionPlan === 'free' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium mb-2">Premium Features</h4>
                    <ul className="space-y-3 text-sm text-gray-500">
                      <li className="flex items-start">
                        <HelpCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>AI-powered resume feedback</span>
                      </li>
                      <li className="flex items-start">
                        <HelpCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Cover letter generator</span>
                      </li>
                      <li className="flex items-start">
                        <HelpCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Interview preparation tools</span>
                      </li>
                      <li className="flex items-start">
                        <HelpCircle className="h-5 w-5 text-gray-400 mr-2 flex-shrink-0 mt-0.5" />
                        <span>Advanced analytics and insights</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="security" className="px-6 py-8">
          <div className="space-y-6">
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Manage your account security and privacy settings.</p>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-xs text-gray-500">Add an extra layer of security to your account.</p>
                  </div>
                  <Switch id="two-factor" disabled />
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
                    <p className="text-xs text-gray-500">Receive security alerts about suspicious account activity.</p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Session Management</h3>
                    <p className="text-xs text-gray-500">Manage your active sessions and sign out from other devices.</p>
                  </div>
                  <Button variant="outline" size="sm">Manage Sessions</Button>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Password Security</h3>
                  <p className="text-xs text-gray-500 mb-4">Use the Profile tab to update your password.</p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-700">Password last changed</p>
                      <p className="text-xs text-gray-500">
                        {user.passwordLastChanged ? formatDate(new Date(user.passwordLastChanged)) : 'Never'}
                      </p>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('profile')}
                    >
                      Change Password
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Connected Accounts</h2>
                <p className="text-sm text-gray-500 mt-1">Manage third-party services connected to your account.</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      G
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Google</h3>
                      <p className="text-xs text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>Connect</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      L
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">LinkedIn</h3>
                      <p className="text-xs text-gray-500">Not connected</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>Connect</Button>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg bg-white shadow-sm p-6 border border-gray-200">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-red-600">Danger Zone</h2>
                <p className="text-sm text-gray-500 mt-1">Permanent actions that cannot be undone.</p>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-md bg-red-50">
                  <h3 className="text-sm font-medium text-red-600 mb-1">Delete Account</h3>
                  <p className="text-xs text-red-500 mb-3">This action cannot be undone. All your data will be permanently deleted.</p>
                  <Button variant="destructive" size="sm" disabled>Delete Account</Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}