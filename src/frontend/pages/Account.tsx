import React, { useState, useEffect } from 'react';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  User, CreditCard, ShieldCheck, Edit, Building, GraduationCap, Trophy, 
  BookOpen, Award, Languages, MapPin, Settings, CheckCircle, Calendar,
  DollarSign, AlertCircle, Check, X, Plus
} from 'lucide-react';
import { z } from 'zod';

// Subscription Management Component
function SubscriptionManagement({ user }: { user: any }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'premium' | 'university'>('premium');
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  // Fetch payment methods
  const { data: paymentMethods, isLoading: paymentMethodsLoading } = useQuery({
    queryKey: ['/api/payment-methods'],
    queryFn: async () => {
      const response = await apiRequest({ url: '/api/payment-methods' });
      return response;
    },
  });

  // Upgrade subscription mutation
  const upgradeSubscriptionMutation = useMutation({
    mutationFn: async ({ plan, interval }: { plan: 'premium' | 'university'; interval: 'monthly' | 'quarterly' | 'annual' }) => {
      const res = await apiRequest('POST', '/api/subscription/upgrade', { plan, interval });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to upgrade subscription');
      }
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Subscription upgraded!',
        description: `Your subscription has been upgraded to ${selectedPlan}.`,
      });
      setUpgradeDialogOpen(false);
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Upgrade failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/subscription/cancel');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to cancel subscription');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Subscription cancelled',
        description: 'Your subscription has been cancelled successfully.',
      });
      setCancelDialogOpen(false);
      // Refresh user data
      queryClient.invalidateQueries({ queryKey: ['/api/users/me'] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Cancellation failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUpgrade = () => {
    upgradeSubscriptionMutation.mutate({ plan: selectedPlan, interval: selectedInterval });
  };

  const handleCancel = () => {
    cancelSubscriptionMutation.mutate();
  };

  // Plan pricing information
  const planPricing = {
    premium: {
      monthly: { price: 15, label: '$15/month' },
      quarterly: { price: 30, label: '$30/quarter ($10/month)' },
      annual: { price: 72, label: '$72/year ($6/month)' },
    },
    university: {
      monthly: { price: 25, label: '$25/month' },
      quarterly: { price: 60, label: '$60/quarter ($20/month)' },
      annual: { price: 200, label: '$200/year ($16.67/month)' },
    },
  };

  const getStatusBadge = (plan: string, status: string) => {
    if (plan === 'free') {
      return <Badge variant="outline">Free Plan</Badge>;
    }
    
    const variant = status === 'active' ? 'default' : status === 'past_due' ? 'destructive' : 'secondary';
    const label = plan === 'premium' ? 'Premium' : plan === 'university' ? 'University' : plan;
    
    return (
      <Badge variant={variant} className="capitalize">
        {label} - {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Manage your subscription plan and billing</CardDescription>
            </div>
            {getStatusBadge(user.subscriptionPlan, user.subscriptionStatus)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plan</p>
              <p className="font-medium capitalize">{user.subscriptionPlan || 'Free'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{user.subscriptionStatus?.replace('_', ' ') || 'Active'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Billing Cycle</p>
              <p className="font-medium capitalize">{user.subscriptionCycle || 'N/A'}</p>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex gap-3">
            {user.subscriptionPlan === 'free' ? (
              <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Upgrade Your Subscription</DialogTitle>
                    <DialogDescription>
                      Choose a plan that fits your needs and unlock premium features.
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Select Plan</label>
                      <Select value={selectedPlan} onValueChange={(value: 'premium' | 'university') => setSelectedPlan(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="premium">Premium Plan</SelectItem>
                          <SelectItem value="university">University Plan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Billing Interval</label>
                      <Select value={selectedInterval} onValueChange={(value: 'monthly' | 'quarterly' | 'annual') => setSelectedInterval(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly - {planPricing[selectedPlan].monthly.label}</SelectItem>
                          <SelectItem value="quarterly">Quarterly - {planPricing[selectedPlan].quarterly.label}</SelectItem>
                          <SelectItem value="annual">Annual - {planPricing[selectedPlan].annual.label}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm font-medium">Selected Plan</p>
                      <p className="text-lg font-bold">{planPricing[selectedPlan][selectedInterval].label}</p>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleUpgrade} disabled={upgradeSubscriptionMutation.isPending}>
                      {upgradeSubscriptionMutation.isPending ? 'Processing...' : 'Upgrade Now'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ) : (
              <>
                <Dialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Edit className="h-4 w-4 mr-2" />
                      Change Plan
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Change Your Subscription</DialogTitle>
                      <DialogDescription>
                        Update your current subscription plan.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium">Select Plan</label>
                        <Select value={selectedPlan} onValueChange={(value: 'premium' | 'university') => setSelectedPlan(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="premium">Premium Plan</SelectItem>
                            <SelectItem value="university">University Plan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Billing Interval</label>
                        <Select value={selectedInterval} onValueChange={(value: 'monthly' | 'quarterly' | 'annual') => setSelectedInterval(value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly - {planPricing[selectedPlan].monthly.label}</SelectItem>
                            <SelectItem value="quarterly">Quarterly - {planPricing[selectedPlan].quarterly.label}</SelectItem>
                            <SelectItem value="annual">Annual - {planPricing[selectedPlan].annual.label}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setUpgradeDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpgrade} disabled={upgradeSubscriptionMutation.isPending}>
                        {upgradeSubscriptionMutation.isPending ? 'Processing...' : 'Update Plan'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                
                <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive">
                      <X className="h-4 w-4 mr-2" />
                      Cancel Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Cancel Subscription</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel your subscription? You'll lose access to premium features.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-destructive/10 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm font-medium">This action cannot be undone</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your subscription will be cancelled immediately and you'll be moved to the free plan.
                      </p>
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                        Keep Subscription
                      </Button>
                      <Button variant="destructive" onClick={handleCancel} disabled={cancelSubscriptionMutation.isPending}>
                        {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Methods
          </CardTitle>
          <CardDescription>Manage your payment methods and billing information</CardDescription>
        </CardHeader>
        <CardContent>
          {paymentMethodsLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading payment methods...</p>
            </div>
          ) : paymentMethods?.payment_methods?.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.payment_methods.map((method: any) => (
                <div key={method.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-4 w-4" />
                    <div>
                      <p className="font-medium">
                        •••• •••• •••• {method.card?.last4}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.card?.brand?.toUpperCase()} • Expires {method.card?.exp_month}/{method.card?.exp_year}
                      </p>
                    </div>
                  </div>
                  {method.id === paymentMethods.default_payment_method && (
                    <Badge variant="secondary">Default</Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No payment methods added</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add a payment method to manage your subscription
              </p>
              <Button variant="outline" className="mt-3">
                <Plus className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Billing History
          </CardTitle>
          <CardDescription>View your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No billing history available</p>
            <p className="text-sm text-muted-foreground mt-1">
              Your billing history will appear here after your first payment
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Account() {
  const { user } = useUser();
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Get the active tab from URL query parameter
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    return tabParam === 'career' || tabParam === 'subscription' || tabParam === 'security'
      ? tabParam
      : 'profile';
  });
  
  // Listen for URL changes and update active tab
  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      
      if (tabParam === 'career' || tabParam === 'subscription' || tabParam === 'security') {
        setActiveTab(tabParam);
      }
    };

    // Call immediately to handle current URL
    handleUrlChange();
    
    // Add event listener for URL changes not captured by useLocation
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [location]);
  
  // Handle section editing for career profile sections
  const handleEditSection = (sectionId: string) => {
    toast({
      title: "Edit Section",
      description: `Editing ${sectionId} section. This feature is coming soon.`,
      variant: "default",
    });
  };
  
  // Profile completion data
  const profileSections = [
    { id: 'basic-info', title: 'Basic Information', completed: true },
    { id: 'work-history', title: 'Work History', completed: false },
    { id: 'education', title: 'Education', completed: false },
    { id: 'skills', title: 'Skills', completed: false },
    { id: 'certifications', title: 'Certifications', completed: false },
    { id: 'languages', title: 'Languages', completed: false },
    { id: 'career-summary', title: 'Career Summary', completed: false },
    { id: 'location-preferences', title: 'Location Preferences', completed: false },
  ];
  
  const completionPercentage = (profileSections.filter(s => s.completed).length / profileSections.length) * 100;

  if (!user) return null;

  // Function to update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Update URL with new tab parameter without page reload
    const url = new URL(window.location.href);
    if (value !== 'profile') {
      url.searchParams.set('tab', value);
    } else {
      url.searchParams.delete('tab');
    }
    
    window.history.pushState({}, '', url);
  };

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="career" className="flex items-center">
            <Building className="mr-2 h-4 w-4" />
            Career
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

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Name</h3>
                <p>{user.name}</p>
              </div>
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">Email</h3>
                <p>{user.email}</p>
              </div>
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
                <p className="capitalize">{user.userType ? user.userType.replace('_', ' ') : 'Standard'}</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Profile Completion Tracker */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Profile Completion</CardTitle>
              <CardDescription>Complete your career profile to maximize your opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {Math.round(completionPercentage)}% Complete
                </span>
                <span className="text-sm text-muted-foreground">
                  {profileSections.filter(section => section.completed).length}/{profileSections.length} Sections
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2 mb-4" />
            </CardContent>
          </Card>
          
          {/* Work History Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Building className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Work History</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('work-history')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your professional experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No work history added yet</p>
                <p className="text-sm mt-2">Add your professional experience to showcase your career progression</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Education Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Education</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('education')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your educational background</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No education history added yet</p>
                <p className="text-sm mt-2">Add your degrees, certifications, and educational achievements</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Skills Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Skills</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('skills')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your professional skills and expertise</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No skills added yet</p>
                <p className="text-sm mt-2">Add your technical and soft skills to showcase your expertise</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Certifications Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Certifications</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('certifications')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your professional certifications and credentials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No certifications added yet</p>
                <p className="text-sm mt-2">Add your professional certifications and credentials</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Languages Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <Languages className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Languages</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('languages')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Languages you speak</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No languages added yet</p>
                <p className="text-sm mt-2">Add languages you speak and your proficiency level</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Career Summary Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Career Summary</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('career-summary')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>A brief overview of your professional experience</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No career summary added yet</p>
                <p className="text-sm mt-2">Add a brief overview of your career and professional aspirations</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Location Preferences Section */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-primary" />
                  <CardTitle>Location Preferences</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleEditSection('location-preferences')}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
              </div>
              <CardDescription>Your geographical preferences for work</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-6 text-muted-foreground">
                <p>No location preferences added yet</p>
                <p className="text-sm mt-2">Add your preferred work locations and remote work preferences</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <SubscriptionManagement user={user} />
        </TabsContent>

        <TabsContent value="career" className="space-y-6">
          {/* Profile Completion Tracker */}
          <Card className="mt-6">
            <CardHeader className="pb-3">
              <CardTitle>Career Profile</CardTitle>
              <CardDescription>Complete your career profile to maximize your opportunities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {Math.round(completionPercentage)}% Complete
                </span>
                <span className="text-sm text-muted-foreground">
                  {profileSections.filter(section => section.completed).length}/{profileSections.length} Sections
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2 mb-4" />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {profileSections.map((section) => (
                  <Card key={section.id} className={`border ${section.completed ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        {section.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleEditSection(section.id)}>
                            <Edit className="h-4 w-4 mr-1" /> Add
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <p>This section is coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}