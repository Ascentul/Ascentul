import React from 'react';
import { useUser, useIsSubscriptionActive, useUpdateUserSubscription } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, CreditCard, ShieldCheck, User, LogOut, Mail, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    </div>
  );
}