import React, { useState } from 'react';
import { useUser } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogOut, User, CreditCard, ShieldCheck, Edit, Save, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';

export default function Account() {
  const { user, logout } = useUser();
  const { toast } = useToast();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isUpgradingSubscription, setIsUpgradingSubscription] = useState(false);
  
  // Since updateProfile isn't available in useUser, we'll implement it here
  const updateProfile = async (data: any) => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Reload the page to reflect changes
      window.location.reload();
      return await response.json();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };
  
  // Subscription management functions
  const upgradeSubscription = async () => {
    try {
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
        headers: { 'Content-Type': 'application/json' }
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

  // Plan name helper
  const getPlanName = (plan: string | undefined) => {
    if (!plan) return 'Free Plan';
    
    switch (plan) {
      case 'free':
        return 'Free Plan';
      case 'premium':
        return 'Premium Plan';
      case 'university':
        return 'University License';
      default:
        return plan;
    }
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subscription Details</CardTitle>
              <div className="space-x-2">
                {user.subscriptionPlan === 'free' && (
                  <Button variant="default" size="sm" onClick={upgradeSubscription}>
                    Upgrade Plan
                  </Button>
                )}
                {user.subscriptionStatus === 'active' && user.subscriptionPlan !== 'free' && (
                  <Button variant="outline" size="sm" onClick={() => setIsCancellingSubscription(true)}>
                    Cancel Subscription
                  </Button>
                )}
              </div>
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
                    Upgrade to Premium
                  </Button>
                </div>
              )}
              
              {/* Premium features description */}
              {user.subscriptionPlan === 'premium' && (
                <div className="mt-6 p-4 bg-muted/50 rounded-md">
                  <h3 className="font-medium mb-2">Your Premium Features</h3>
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
          </Card>
          
          {/* Cancel Subscription Dialog */}
          <Dialog open={isCancellingSubscription} onOpenChange={setIsCancellingSubscription}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Cancel Subscription</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Your subscription will remain active until the end of your current billing period ({formatDate(user.subscriptionExpiresAt)}).
                </p>
                <p className="text-sm text-destructive font-medium mb-2 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" /> Things you'll lose access to:
                </p>
                <ul className="space-y-1 text-sm mb-4">
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" /> AI-powered resume suggestions
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" /> Unlimited interview practice
                  </li>
                  <li className="flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-muted-foreground" /> AI career coach
                  </li>
                </ul>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCancellingSubscription(false)}>
                  Keep Subscription
                </Button>
                <Button type="button" variant="destructive" onClick={cancelSubscription}>
                  Cancel Subscription
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {/* Email verification */}
          <Card>
            <CardHeader>
              <CardTitle>Email Verification</CardTitle>
              <CardDescription>
                Verify your email address to ensure account security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <p className="text-sm">
                    Status: 
                    {user.emailVerified ? (
                      <span className="ml-2 text-green-600 font-medium flex items-center">
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Verified
                      </span>
                    ) : (
                      <span className="ml-2 text-amber-600 font-medium">Not Verified</span>
                    )}
                  </p>
                </div>
                {!user.emailVerified && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      // Send verification email
                      fetch('/api/auth/send-verification-email', {
                        method: 'POST',
                      })
                        .then(response => {
                          if (response.ok) {
                            toast({
                              title: "Verification Email Sent",
                              description: "Please check your inbox for the verification link.",
                              variant: "default",
                            });
                          } else {
                            throw new Error('Failed to send verification email');
                          }
                        })
                        .catch(error => {
                          toast({
                            title: "Error",
                            description: "Failed to send verification email. Please try again later.",
                            variant: "destructive",
                          });
                        });
                    }}
                  >
                    Send Verification Email
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle>Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm">
                  Last changed: Never
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // We would typically open a password change dialog here
                    // For now, let's just show a toast
                    toast({
                      title: "Feature Coming Soon",
                      description: "Password change functionality will be available soon.",
                      variant: "default",
                    });
                  }}
                >
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Sign Out */}
          <Card>
            <CardHeader>
              <CardTitle>Sign Out</CardTitle>
              <CardDescription>
                Sign out from your account on this device
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
    </div>
  );
}