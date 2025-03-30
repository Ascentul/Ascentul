import React, { useState } from 'react';
import { useUser, useChangeEmail } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2
} from 'lucide-react';
import EmailChangeForm, { EmailChangeFormValues } from '@/components/EmailChangeForm';

export default function Account() {
  const { user, logout, updateProfile } = useUser();
  const { toast } = useToast();
  
  // State for dialogs
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  
  // Email change mutation using useChangeEmail hook from useUserData
  const changeEmailMutation = useChangeEmail();
  
  // Helper function to get pretty plan name
  const getPlanName = (plan: string | undefined): string => {
    if (!plan) return 'Free Plan';
    
    switch (plan) {
      case 'free':
        return 'Free Plan';
      case 'premium':
        return 'Pro Plan';
      case 'pro_monthly':
        return 'Pro Plan (Monthly)';
      case 'pro_annual':
        return 'Pro Plan (Annual)';
      case 'university':
        return 'University License';
      default:
        return plan.replace('_', ' ');
    }
  };

  // Subscription management functions
  const upgradeSubscription = async () => {
    try {
      // Close dialog if open
      setIsManagingSubscription(false);
      
      // Redirect to pricing page to select a plan
      window.location.href = '/pricing';
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upgrade subscription",
        variant: "destructive"
      });
    }
  };
  
  const cancelSubscription = async () => {
    try {
      const response = await fetch('/api/payments/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }
      
      setIsCancellingSubscription(false);
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled successfully.",
        variant: "default"
      });
      
      // Reload the page to reflect changes
      window.location.reload();
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive"
      });
    }
  };
  
  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
    },
  });

  const handleLogout = () => {
    logout();
    window.location.href = '/auth';
  };
  
  const handleEditProfile = () => {
    // Reset form with current user values
    profileForm.reset({
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
    });
    setIsEditingProfile(true);
  };
  
  const handleProfileSubmit = async (data: any) => {
    try {
      await updateProfile(data);
      setIsEditingProfile(false);
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "Failed to update profile",
        description: error.message || "An error occurred while updating your profile.",
        variant: "destructive",
      });
    }
  };

  // Format dates helper function
  const formatDate = (date: Date | undefined | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return <div className="p-8 text-center">Loading user information...</div>;
  }

  return (
    <div className="container max-w-5xl py-8">
      <h1 className="text-2xl font-bold mb-6">Account Settings</h1>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-6">
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

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Button variant="outline" size="sm" onClick={handleEditProfile}>
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
              <div>
                <h3 className="font-medium text-sm text-muted-foreground">XP Level</h3>
                <p>{user.level || 1} ({user.xp || 0} XP)</p>
              </div>
            </CardContent>
          </Card>

          {/* Profile Edit Dialog */}
          <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile information here.
                </DialogDescription>
              </DialogHeader>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4 py-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="Your email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Your username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter className="mt-6">
                    <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Current Plan</h3>
                  <p className="font-medium">{getPlanName(user.subscriptionPlan)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Status</h3>
                  <p className="capitalize">
                    {user.subscriptionStatus ? 
                      (user.subscriptionStatus === 'active' ? 
                        <span className="flex items-center text-green-600 font-medium">
                          <CheckCircle2 className="h-4 w-4 mr-1" /> Active
                        </span> : 
                        user.subscriptionStatus.replace('_', ' ')) : 
                      <span className="text-gray-500">Free</span>}
                  </p>
                </div>
                
                {/* Additional subscription details */}
                {user.subscriptionPlan !== 'free' && (
                  <>
                    <div>
                      <h3 className="font-medium text-sm text-muted-foreground">Billing Cycle</h3>
                      <p>Monthly</p>
                    </div>
                    {user.subscriptionExpiresAt && (
                      <div>
                        <h3 className="font-medium text-sm text-muted-foreground">
                          {user.subscriptionStatus === 'active' ? 'Next Billing Date' : 'Expires On'}
                        </h3>
                        <p>{formatDate(user.subscriptionExpiresAt)}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
              
              {/* Free plan features description */}
              {user.subscriptionPlan === 'free' && (
                <div className="mt-6 p-4 bg-muted/50 rounded-md">
                  <h3 className="font-medium mb-2">Free Plan Features</h3>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Basic resume builder
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Limited interview practice
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Work history tracking
                    </li>
                  </ul>
                  <Button variant="default" size="sm" className="mt-4" onClick={upgradeSubscription}>
                    Upgrade to Pro
                  </Button>
                </div>
              )}
              
              {/* Premium features description */}
              {user.subscriptionPlan === 'premium' && (
                <div className="mt-6 p-4 bg-muted/50 rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">Your Pro Features</h3>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => setIsManagingSubscription(true)}>
                        Manage Subscription
                      </Button>
                    </div>
                  </div>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Advanced resume builder
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Unlimited interview practice
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> AI career coach
                    </li>
                    <li className="flex items-center">
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" /> Cover letter generator
                    </li>
                  </ul>
                </div>
              )}
            </CardContent>
            
            {/* Add Card Footer with Unsubscribe Button for paid plans */}
            {user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active' && (
              <CardFooter className="border-t pt-6 flex flex-col items-stretch">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">Subscription Management</h3>
                    <p className="text-sm text-muted-foreground">Need to make changes to your billing?</p>
                  </div>
                  <Button variant="default" size="sm" onClick={() => setIsManagingSubscription(true)}>
                    Manage Payment Methods
                  </Button>
                </div>

              </CardFooter>
            )}
          </Card>
          
          {/* Subscription Management Dialog */}
          <Dialog open={isManagingSubscription} onOpenChange={setIsManagingSubscription}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Subscription Management</DialogTitle>
                <DialogDescription>
                  Manage your subscription settings and payment methods.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-6">
                {/* Subscription Details */}
                <div className="rounded-md border p-4">
                  <h3 className="font-medium mb-2 text-lg">Current Subscription</h3>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Plan</p>
                      <p className="font-medium">{getPlanName(user.subscriptionPlan)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Status</p>
                      <p className="font-medium flex items-center">
                        {user.subscriptionStatus === 'active' && (
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                        )}
                        {user.subscriptionStatus ? user.subscriptionStatus.replace('_', ' ') : 'Free'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Billing Cycle</p>
                      <p className="font-medium">Monthly</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Next Billing Date</p>
                      <p className="font-medium">{formatDate(user.subscriptionExpiresAt)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Plan Actions */}
                <div className="space-y-3">
                  <h3 className="font-medium text-lg">Plan Actions</h3>
                  <div className="flex flex-col gap-3">
                    <Button variant="outline" onClick={upgradeSubscription}>
                      {user.subscriptionPlan === 'free' ? 'Upgrade to Pro' : 'Change Plan'}
                    </Button>
                    
                    {user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active' && (
                      <Button 
                        variant="destructive" 
                        onClick={() => {
                          setIsManagingSubscription(false);
                          setIsCancellingSubscription(true);
                        }}
                      >
                        Cancel Subscription
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Cancel Subscription Confirmation Dialog */}
          <Dialog open={isCancellingSubscription} onOpenChange={setIsCancellingSubscription}>
            <DialogContent className="sm:max-w-[400px]">
              <DialogHeader>
                <DialogTitle>Cancel Subscription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsCancellingSubscription(false)}>
                  Keep Subscription
                </Button>
                <Button variant="destructive" onClick={cancelSubscription}>
                  Yes, Cancel
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>
                Verify and manage your email address to secure your account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-medium">Current Email</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <p>{user.email}</p>
                  {user.emailVerified ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
                      Not Verified
                    </span>
                  )}
                </div>
                
                {user.pendingEmail && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">
                      Verification email sent to <span className="font-medium">{user.pendingEmail}</span>.
                      Please check your inbox to complete the change.
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap space-x-2">
                {!user.pendingEmail && (
                  <Button variant="outline" onClick={() => setIsChangingEmail(true)}>
                    Change Email
                  </Button>
                )}
                
                {!user.emailVerified && !user.pendingEmail && (
                  <Button variant="default">
                    Resend Verification
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline">
                Change Password
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Password change functionality coming soon.
              </p>
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
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    
    {/* Email Change Dialog */}
    <Dialog open={isChangingEmail} onOpenChange={setIsChangingEmail}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Change Email Address</DialogTitle>
          <DialogDescription>
            Enter your new email address and current password to verify your identity.
            You will need to verify your new email before the change takes effect.
          </DialogDescription>
        </DialogHeader>
        
        {changeEmailMutation.isPending ? (
          <div className="py-8 flex items-center justify-center flex-col">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
            <p className="mt-4 text-sm text-muted-foreground">Processing your request...</p>
          </div>
        ) : (
          <EmailChangeForm 
            currentEmail={user.email} 
            onSubmit={(data) => {
              changeEmailMutation.mutate(data, {
                onSuccess: () => {
                  toast({
                    title: "Verification email sent",
                    description: "Please check your inbox to complete the email change.",
                    variant: "default",
                  });
                  setIsChangingEmail(false);
                },
                onError: (error: any) => {
                  toast({
                    title: "Failed to send verification",
                    description: error.message || "An error occurred while processing your request.",
                    variant: "destructive",
                  });
                }
              });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
}