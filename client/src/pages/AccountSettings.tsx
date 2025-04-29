import React, { useState } from 'react';
import { useUser, useIsSubscriptionActive, useUpdateUserSubscription } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useCareerData } from '@/hooks/use-career-data';

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
  Palette, 
  Briefcase,
  GraduationCap,
  Award,
  BookOpen,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  MapPin,
  Info,
  RefreshCw
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
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation } from 'wouter';

const profileFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function AccountSettings() {
  const { user, isLoading: userLoading, logout } = useUser();
  const isSubscriptionActive = useIsSubscriptionActive();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const updateUserSubscription = useUpdateUserSubscription();
  const [selectedColor, setSelectedColor] = useState('#0C29AB'); // Default color from theme.json
  const careerQuery = useCareerData();
  const { data: careerData, isLoading: careerDataLoading, refetch: refetchCareerData } = careerQuery;
  
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

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

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

  // Update theme mutation
  const updateThemeMutation = useMutation({
    mutationFn: async (themeData: { primary: string }) => {
      const response = await apiRequest('PUT', '/api/user/theme', themeData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update theme');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Theme Updated",
        description: "Your theme settings have been updated.",
      });
      
      // Reload the page to apply theme changes
      window.location.reload();
    },
    onError: (error: Error) => {
      toast({
        title: "Theme Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

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
    // In a real app, would send this to the server
    toast({
      title: "Profile Updated",
      description: "Your profile information has been updated.",
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };
  
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedColor(e.target.value);
  };
  
  const handleThemeSubmit = () => {
    updateThemeMutation.mutate({ primary: selectedColor });
  };

  if (userLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
      
      <Tabs defaultValue="profile" className="space-y-8">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="career" className="flex items-center">
            <Briefcase className="mr-2 h-4 w-4" />
            Career
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center">
            <CreditCard className="mr-2 h-4 w-4" />
            Subscription
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center">
            <Palette className="mr-2 h-4 w-4" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and how we can contact you.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleProfileSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
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
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input placeholder="your.email@example.com" {...field} />
                        </FormControl>
                        <FormDescription>
                          {user.emailVerified ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verified
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
                  
                  <Button type="submit">
                    Update Profile
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Other information about your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Username</h3>
                <p>{user.username}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Account Created</h3>
                <p>March 15, 2025</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">User Type</h3>
                <p className="capitalize">{user.userType.replace('_', ' ')}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">XP Level</h3>
                <p>{user.level} ({user.xp} XP)</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Rank</h3>
                <p>{user.rank}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="career" className="space-y-6">
          {careerDataLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Profile Completion Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Profile Completion</h3>
                  {(() => {
                    // Calculate completion percentage
                    const sections = [
                      !!careerData?.careerSummary,
                      (careerData?.workHistory?.length || 0) > 0,
                      (careerData?.educationHistory?.length || 0) > 0,
                      (careerData?.skills?.length || 0) > 0,
                      (careerData?.certifications?.length || 0) > 0
                    ];
                    const completedSections = sections.filter(Boolean).length;
                    const percentage = Math.round((completedSections / sections.length) * 100);
                    
                    return (
                      <span className="text-sm font-medium">
                        {percentage}% ({completedSections} of {sections.length} sections)
                      </span>
                    );
                  })()}
                </div>
                <Progress value={(() => {
                  const sections = [
                    !!careerData?.careerSummary,
                    (careerData?.workHistory?.length || 0) > 0,
                    (careerData?.educationHistory?.length || 0) > 0,
                    (careerData?.skills?.length || 0) > 0,
                    (careerData?.certifications?.length || 0) > 0
                  ];
                  const completedSections = sections.filter(Boolean).length;
                  return (completedSections / sections.length) * 100;
                })()} className="h-2" />
              </div>
              
              {/* Career Summary Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Career Summary
                    </CardTitle>
                    <CardDescription>
                      A brief overview of your professional background and goals
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => setCareerSummaryModal({ 
                      open: true, 
                      defaultValue: careerData?.careerSummary || '' 
                    })}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    {careerData?.careerSummary ? 'Edit' : 'Add'}
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {careerData?.careerSummary ? (
                    <div className="relative border rounded-lg p-4">
                      <p className="whitespace-pre-wrap">{careerData.careerSummary}</p>
                      <div className="mt-4 text-xs text-muted-foreground flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        Used in Resume Studio, AI Coach, and Voice Interview Practice.
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3 mr-1" /> Synced to Resume
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4 border-dashed flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-8 w-8 text-muted-foreground mb-2" />
                      <h3 className="font-medium mb-1">No career summary added yet</h3>
                      <p className="text-muted-foreground text-sm mb-3 max-w-md">
                        Your career summary helps highlight your professional journey, skills, and goals.
                        It powers your resume, AI coaching sessions, and interview practice.
                      </p>
                      <Button 
                        onClick={() => setCareerSummaryModal({ open: true, defaultValue: '' })}
                        variant="secondary"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Career Summary
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Work History Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <Briefcase className="mr-2 h-5 w-5" />
                      Work History
                    </CardTitle>
                    <CardDescription>
                      Manage your professional work history
                    </CardDescription>
                  </div>
                  <AddSectionButton
                    size="sm"
                    label="Add Job"
                    mode="add"
                    onClick={() => setWorkHistoryModal({ open: true, mode: 'add' })}
                  />
                </CardHeader>
                <CardContent className="pt-6">
                  {careerData?.workHistory?.length > 0 ? (
                    <div className="space-y-5">
                      {careerData.workHistory.map((job) => (
                        <div key={job.id} className="border rounded-lg p-4 relative">
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setWorkHistoryModal({ 
                                open: true, 
                                mode: 'edit', 
                                data: job,
                                id: job.id 
                              })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfirmation({
                                open: true,
                                itemId: job.id,
                                itemType: 'Work history',
                                endpoint: '/api/career-data/work-history'
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold text-xl mb-1">{job.position}</h3>
                          <p className="text-muted-foreground font-medium">{job.company}</p>
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 inline" />
                            {formatDate(job.startDate)} - {job.currentJob ? 'Present' : formatDate(job.endDate)}
                          </div>
                          {job.location && (
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 inline" />
                              {job.location}
                            </div>
                          )}
                          {job.description && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">{job.description}</p>
                            </div>
                          )}
                          {job.achievements && job.achievements.length > 0 && (
                            <div className="mt-3">
                              <h4 className="font-medium text-sm mb-1.5">Key Achievements:</h4>
                              <ul className="list-disc list-outside ml-5 space-y-1 text-sm">
                                {job.achievements.map((achievement, i) => (
                                  <li key={i}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <RefreshCw className="h-3 w-3 mr-1" /> Synced to Resume
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No work history added yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add your professional experience to enhance your profile.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Education Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <GraduationCap className="mr-2 h-5 w-5" />
                      Education
                    </CardTitle>
                    <CardDescription>
                      Manage your educational background
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => setEducationModal({ open: true, mode: 'add' })}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Education
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {careerData?.educationHistory?.length > 0 ? (
                    <div className="space-y-5">
                      {careerData.educationHistory.map((education) => (
                        <div key={education.id} className="border rounded-lg p-4 relative">
                          <div className="absolute top-4 right-4 flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setEducationModal({ 
                                open: true, 
                                mode: 'edit', 
                                data: education,
                                id: education.id 
                              })}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfirmation({
                                open: true,
                                itemId: education.id,
                                itemType: 'Education',
                                endpoint: '/api/career-data/education'
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold text-xl mb-1">{education.degree}</h3>
                          <p className="text-md font-medium">{education.fieldOfStudy}</p>
                          <p className="text-muted-foreground">{education.institution}</p>
                          <div className="flex items-center mt-2 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5 mr-1.5 inline" />
                            {formatDate(education.startDate)} - {education.current ? 'Present' : formatDate(education.endDate)}
                          </div>
                          {education.location && (
                            <div className="flex items-center mt-1 text-sm text-muted-foreground">
                              <MapPin className="h-3.5 w-3.5 mr-1.5 inline" />
                              {education.location}
                            </div>
                          )}
                          {education.gpa && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">GPA:</span> {education.gpa}
                            </div>
                          )}
                          {education.description && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-md">
                              <p className="text-sm whitespace-pre-wrap">{education.description}</p>
                            </div>
                          )}
                          {education.achievements && education.achievements.length > 0 && (
                            <div className="mt-3">
                              <h4 className="font-medium text-sm mb-1.5">Achievements:</h4>
                              <ul className="list-disc list-outside ml-5 space-y-1 text-sm">
                                {education.achievements.map((achievement, i) => (
                                  <li key={i}>{achievement}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <RefreshCw className="h-3 w-3 mr-1" /> Synced to Resume
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-muted-foreground">No education history added yet.</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Add your educational background to complete your profile.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Skills Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <Award className="mr-2 h-5 w-5" />
                      Skills
                    </CardTitle>
                    <CardDescription>
                      Manage your professional and technical skills
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => setSkillModal({ open: true })}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Skill
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {careerData?.skills?.length > 0 ? (
                    <div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {careerData.skills.map((skill) => (
                          <div key={skill.id} className="flex items-center bg-secondary text-secondary-foreground rounded-full px-3 py-1.5 text-sm">
                            {skill.name}
                            {skill.proficiencyLevel && (
                              <span className="ml-1 text-xs text-muted-foreground">({skill.proficiencyLevel})</span>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6 ml-1 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteConfirmation({
                                open: true,
                                itemId: skill.id,
                                itemType: 'Skill',
                                endpoint: '/api/career-data/skills'
                              })}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center mt-6">
                        <div className="text-xs text-muted-foreground flex items-center">
                          <Info className="h-3 w-3 mr-1" />
                          These skills are highlighted in your resume and used by the AI Coach.
                        </div>
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3 mr-1" /> Synced to Resume
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6 border-dashed flex flex-col items-center justify-center py-8 text-center">
                      <Award className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-2">No skills added yet</h3>
                      <p className="text-muted-foreground text-sm mb-3 max-w-md">
                        Add your technical and soft skills to showcase your expertise.
                      </p>
                      <p className="text-muted-foreground text-sm italic mb-4">
                        Need inspiration? Use AI Coach to suggest skills based on your work history.
                      </p>
                      <Button 
                        onClick={() => setSkillModal({ open: true })}
                        variant="secondary"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Skill
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Certifications Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <BookOpen className="mr-2 h-5 w-5" />
                      Certifications
                    </CardTitle>
                    <CardDescription>
                      Manage your certifications and credentials
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => setCertificationModal({ open: true, mode: 'add' })}
                  >
                    <Plus className="mr-1 h-4 w-4" />
                    Add Certification
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {careerData?.certifications?.length > 0 ? (
                    <div className="space-y-5">
                      {careerData.certifications.map((cert) => (
                        <div key={cert.id} className="border rounded-lg p-4 relative">
                          <div className="absolute top-4 right-4 flex space-x-2">
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
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => setDeleteConfirmation({
                                open: true,
                                itemId: cert.id,
                                itemType: 'Certification',
                                endpoint: '/api/career-data/certifications'
                              })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <h3 className="font-semibold text-xl mb-1">{cert.name}</h3>
                          <p className="text-muted-foreground font-medium">{cert.issuingOrganization}</p>
                          
                          {cert.issueDate && (
                            <div className="flex items-center mt-2 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5 mr-1.5 inline" />
                              Issued: {formatDate(cert.issueDate)}
                              {cert.expiryDate && <> · Expires: {formatDate(cert.expiryDate)}</>}
                              {!cert.expiryDate && cert.noExpiration && <> · No Expiration</>}
                            </div>
                          )}
                          
                          {cert.credentialID && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Credential ID:</span> {cert.credentialID}
                            </div>
                          )}
                          
                          {cert.credentialURL && (
                            <div className="mt-2">
                              <a 
                                href={cert.credentialURL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm flex items-center"
                              >
                                <Info className="h-3.5 w-3.5 mr-1.5" /> 
                                View Credential
                              </a>
                            </div>
                          )}
                          
                          <div className="absolute bottom-2 right-2">
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              <RefreshCw className="h-3 w-3 mr-1" /> Synced to Resume
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6 border-dashed flex flex-col items-center justify-center py-8 text-center">
                      <BookOpen className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-2">No certifications added yet</h3>
                      <p className="text-muted-foreground text-sm mb-3 max-w-md">
                        Add your professional certifications to validate your expertise and credibility.
                      </p>
                      <p className="text-muted-foreground text-sm italic mb-4">
                        Certifications help enhance your resume and stand out to potential employers.
                      </p>
                      <Button 
                        onClick={() => setCertificationModal({ open: true, mode: 'add' })}
                        variant="secondary"
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Add Certification
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Career Summary Section */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-xl flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      Career Summary
                    </CardTitle>
                    <CardDescription>
                      Update your professional summary
                    </CardDescription>
                  </div>
                  <Button 
                    size="sm" 
                    className="flex items-center"
                    onClick={() => setCareerSummaryModal({ 
                      open: true, 
                      defaultValue: careerData?.careerSummary || '' 
                    })}
                  >
                    <Pencil className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                </CardHeader>
                <CardContent className="pt-6">
                  {careerData?.careerSummary ? (
                    <div className="border rounded-lg p-5 relative">
                      <p className="whitespace-pre-wrap">{careerData.careerSummary}</p>
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          <RefreshCw className="h-3 w-3 mr-1" /> Synced to Resume
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-6 border-dashed flex flex-col items-center justify-center py-8 text-center">
                      <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                      <h3 className="font-medium mb-2">No career summary added yet</h3>
                      <p className="text-muted-foreground text-sm mb-3 max-w-md">
                        Add a professional summary to introduce yourself to potential employers.
                      </p>
                      <p className="text-muted-foreground text-sm italic mb-4">
                        A good career summary highlights your experience, skills, and career goals.
                      </p>
                      <Button 
                        onClick={() => setCareerSummaryModal({ 
                          open: true, 
                          defaultValue: careerData?.careerSummary || '' 
                        })}
                        variant="secondary"
                      >
                        <Pencil className="mr-1 h-4 w-4" />
                        Add Career Summary
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
        
        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              <CardDescription>
                Manage your subscription and billing information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Current Plan</h3>
                <p className="font-medium">{getPlanName(user.subscriptionPlan)}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                <p className="capitalize">
                  {user.subscriptionStatus === 'active' ? 
                    <span className="text-green-600 font-medium">Active</span> : 
                    user.subscriptionStatus.replace('_', ' ')}
                </p>
              </div>
              {user.subscriptionExpiresAt && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Renewal / Expiration Date</h3>
                  <p>{formatDate(user.subscriptionExpiresAt)}</p>
                </div>
              )}
              {user.stripeCustomerId && (
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Customer ID</h3>
                  <p className="text-sm text-muted-foreground">{user.stripeCustomerId}</p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col items-start gap-4">
              {user.subscriptionPlan !== 'free' && (
                <>
                  {isSubscriptionActive ? (
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={cancelSubscriptionMutation.isPending}
                    >
                      {cancelSubscriptionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>Cancel Subscription</>
                      )}
                    </Button>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      Your subscription will expire on {formatDate(user.subscriptionExpiresAt)}.
                    </div>
                  )}
                </>
              )}
              
              <Link href="/pricing">
                <Button variant={user.subscriptionPlan === 'free' ? 'default' : 'outline'}>
                  {user.subscriptionPlan === 'free' ? 'Upgrade Plan' : 'Change Plan'}
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Theme Color</h3>
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-md border" 
                      style={{ backgroundColor: selectedColor }}
                    />
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={handleColorChange}
                      className="w-full max-w-xs h-10"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select a primary color to customize your experience. Changes will apply to the entire application.
                  </p>
                </div>
              </div>
              
              <Button onClick={handleThemeSubmit} disabled={updateThemeMutation.isPending}>
                {updateThemeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Save Theme Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>
                Verify your email address to secure your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Status</h3>
                <p className="flex items-center mt-1">
                  {user.emailVerified ? (
                    <span className="text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Your email address is verified
                    </span>
                  ) : (
                    <span className="text-amber-600">
                      Your email address is not verified
                    </span>
                  )}
                </p>
              </div>
              
              {!user.emailVerified && (
                <Button 
                  onClick={handleSendVerificationEmail}
                  disabled={sendVerificationEmailMutation.isPending}
                >
                  {sendVerificationEmailMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending verification email...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Verification Email
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
              <CardDescription>
                Sign out of your account on this device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Career Data Form Modals */}
      <WorkHistoryFormModal 
        open={workHistoryModal.open} 
        onOpenChange={(open) => setWorkHistoryModal({ ...workHistoryModal, open })}
        mode={workHistoryModal.mode}
        defaultValues={workHistoryModal.data}
        workHistoryId={workHistoryModal.id}
        onSuccess={() => {
          refetchCareerData();
          toast({
            title: `Work history ${workHistoryModal.mode === 'add' ? 'added' : 'updated'} successfully`,
            description: `Your work history has been ${workHistoryModal.mode === 'add' ? 'added to' : 'updated in'} your profile.`,
          });
        }}
      />
      
      <EducationFormModal 
        open={educationModal.open} 
        onOpenChange={(open) => setEducationModal({ ...educationModal, open })}
        mode={educationModal.mode}
        defaultValues={educationModal.data}
        educationId={educationModal.id}
        onSuccess={() => {
          refetchCareerData();
          toast({
            title: `Education ${educationModal.mode === 'add' ? 'added' : 'updated'} successfully`,
            description: `Your education has been ${educationModal.mode === 'add' ? 'added to' : 'updated in'} your profile.`,
          });
        }}
      />
      
      <SkillFormModal 
        open={skillModal.open} 
        onOpenChange={(open) => setSkillModal({ ...skillModal, open })}
        onSuccess={() => {
          refetchCareerData();
          toast({
            title: "Skill added successfully",
            description: "Your skill has been added to your profile.",
          });
        }}
      />
      
      <CertificationFormModal 
        open={certificationModal.open} 
        onOpenChange={(open) => setCertificationModal({ ...certificationModal, open })}
        mode={certificationModal.mode}
        defaultValues={certificationModal.data}
        certificationId={certificationModal.id}
        onSuccess={() => {
          refetchCareerData();
          toast({
            title: `Certification ${certificationModal.mode === 'add' ? 'added' : 'updated'} successfully`,
            description: `Your certification has been ${certificationModal.mode === 'add' ? 'added to' : 'updated in'} your profile.`,
          });
        }}
      />
      
      <CareerSummaryFormModal 
        open={careerSummaryModal.open} 
        onOpenChange={(open) => setCareerSummaryModal({ ...careerSummaryModal, open })}
        defaultValue={careerSummaryModal.defaultValue}
        onSuccess={() => {
          refetchCareerData();
          toast({
            title: "Career summary updated successfully",
            description: "Your career summary has been updated.",
          });
        }}
      />
      
      <DeleteConfirmationDialog 
        open={deleteConfirmation.open}
        onOpenChange={(open) => setDeleteConfirmation({ ...deleteConfirmation, open })}
        title={`Delete ${deleteConfirmation.itemType}`}
        description={`Are you sure you want to delete this ${deleteConfirmation.itemType.toLowerCase()}? This action cannot be undone.`}
        endpoint={deleteConfirmation.endpoint}
        itemId={deleteConfirmation.itemId}
        itemType={deleteConfirmation.itemType}
        onSuccess={() => {
          refetchCareerData();
          toast({
            title: `${deleteConfirmation.itemType} deleted`,
            description: `The ${deleteConfirmation.itemType.toLowerCase()} has been removed from your profile.`,
          });
        }}
      />
    </div>
  );
}