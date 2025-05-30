import React, { useState, useEffect } from 'react';
import { useUser, useChangeEmail, useChangePassword } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loadStripe } from '@stripe/stripe-js';
import { 
  Elements, 
  PaymentElement,
  useStripe, 
  useElements,
  AddressElement
} from '@stripe/react-stripe-js';

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles, CreditCardIcon, RotateCcw,
  Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, Users, Plus, Settings
} from 'lucide-react';
import EmailChangeForm, { EmailChangeFormValues } from '@/components/EmailChangeForm';
import { z } from 'zod';

// Load Stripe outside of component to avoid recreating on renders
// Make sure we're using the public key (starts with pk_)
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
if (!stripePublicKey || !stripePublicKey.startsWith('pk_')) {
  console.error('Missing or invalid Stripe public key. Make sure VITE_STRIPE_PUBLIC_KEY is set correctly.');
}
const stripePromise = loadStripe(stripePublicKey);

// Password Change Form schema and type
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;

// Password Change Form component
function PasswordChangeForm({ 
  onSubmit, 
  isPending 
}: { 
  onSubmit: (data: PasswordChangeFormValues) => void;
  isPending: boolean;
}) {
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your current password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your new password" {...field} />
              </FormControl>
              <FormDescription>
                Password must be at least 8 characters and include uppercase, lowercase, and a number.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Confirm your new password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="mt-6">
          <Button type="submit" disabled={isPending}>
            {isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Changing Password...</> : "Change Password"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

// Payment Method Form Component
function PaymentMethodForm({ 
  onSuccess, 
  onCancel 
}: { 
  onSuccess: () => void; 
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Use the card Element to tokenize payment details
      const { error: submitError } = await elements.submit();

      if (submitError) {
        throw new Error(submitError.message);
      }

      // Confirm the SetupIntent
      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/account',
        },
        redirect: 'if_required',
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // If we got here, then setup was successful
      onSuccess();
    } catch (err: any) {
      console.error('Error updating payment method:', err);
      setError(err.message || 'An error occurred while updating your payment method');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Card Details</label>
          <PaymentElement />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Billing Address</label>
          <AddressElement options={{ mode: 'billing' }} />
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={!stripe || !elements || isSubmitting}
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
            ) : (
              'Save Payment Method'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default function Account() {
  const { user, logout, updateProfile } = useUser();
  const { toast } = useToast();

  // State for dialogs
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);
  const [isManagingPaymentMethods, setIsManagingPaymentMethods] = useState(false);
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  // State for Career Profile sections completion tracking
  const [profileSections, setProfileSections] = useState([
    { id: 'work-history', title: 'Work History', icon: 'Building', completed: false },
    { id: 'education', title: 'Education', icon: 'GraduationCap', completed: false },
    { id: 'achievements', title: 'Achievements', icon: 'Trophy', completed: false },
    { id: 'skills', title: 'Skills', icon: 'BookOpen', completed: false },
    { id: 'certifications', title: 'Certifications', icon: 'Award', completed: false },
    { id: 'languages', title: 'Languages', icon: 'Languages', completed: false },
    { id: 'summary', title: 'Career Summary', icon: 'Users', completed: false },
    { id: 'location', title: 'Location Preferences', icon: 'MapPin', completed: false },
  ]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // State for Stripe payment elements
  const [isLoading, setIsLoading] = useState(false);
  const [setupIntentClientSecret, setSetupIntentClientSecret] = useState<string | null>(null);
  const [paymentMethodInfo, setPaymentMethodInfo] = useState<{
    last4: string;
    brand: string;
    exp_month: number;
    exp_year: number;
  } | null>(null);

  // Email and password change mutations using hooks from useUserData
  const changeEmailMutation = useChangeEmail();
  const changePasswordMutation = useChangePassword();

  // Fetch current payment method and calculate profile completion
  useEffect(() => {
    if (user && user.subscriptionPlan !== 'free') {
      fetchPaymentMethodInfo();
    }
    
    // Calculate profile completion percentage
    const completedSections = profileSections.filter(section => section.completed).length;
    const percentage = (completedSections / profileSections.length) * 100;
    setCompletionPercentage(percentage);
    
    // In a real implementation, fetch the profile sections data from the server
    // and update the completion status based on that
  }, [user, profileSections]);

  // Function to fetch the user's current payment method info
  const fetchPaymentMethodInfo = async () => {
    try {
      const response = await fetch('/api/payments/payment-methods', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment methods');
      }

      const data = await response.json();
      if (data?.default_payment_method) {
        setPaymentMethodInfo({
          last4: data.default_payment_method.card.last4,
          brand: data.default_payment_method.card.brand,
          exp_month: data.default_payment_method.card.exp_month,
          exp_year: data.default_payment_method.card.exp_year
        });
      }
    } catch (error: any) {
      console.error('Error fetching payment methods:', error);
    }
  };

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
  const upgradeSubscription = async (cycle?: 'monthly' | 'quarterly' | 'annual') => {
    try {
      // Close dialog if open
      setIsManagingSubscription(false);
      setIsUpgradingPlan(false);

      // Use selected billing cycle or default to monthly
      const selectedCycle = cycle || billingCycle;

      // Create subscription with the selected interval
      const response = await fetch('/api/payments/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id,
          plan: 'premium',
          interval: selectedCycle,
          email: user?.email
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const { clientSecret } = await response.json();

      // Redirect to checkout page with client secret
      window.location.href = `/checkout?client_secret=${clientSecret}`;
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

  // Function to initialize the Stripe setup intent for managing payment methods
  const initializePaymentMethodsUpdate = async () => {
    try {
      setIsLoading(true);

      // Get a setup intent from the server
      const response = await fetch('/api/payments/create-setup-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user?.id 
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initialize payment method update');
      }

      const { clientSecret } = await response.json();
      setSetupIntentClientSecret(clientSecret);

    } catch (error: any) {
      console.error('Error initializing payment method update:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment method management",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const profileForm = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      username: user?.username || '',
    },
  });

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      window.location.href = '/sign-in';
    } catch (error) {
      console.error("Logout failed:", error);
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      });
    }
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

  // Function to handle edit for a career profile section
  const handleEditSection = (sectionId: string) => {
    // You would implement section-specific edit logic here
    toast({
      title: "Edit Section",
      description: `Editing ${sectionId} section`,
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
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Customize the appearance of your application.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Color Mode</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'light' ? 'border-primary' : ''}`}
                      onClick={() => updateTheme({ appearance: 'light' })}
                    >
                      <div className="h-12 w-12 bg-background border rounded-full flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-foreground"><circle cx="12" cy="12" r="4"></circle><path d="M12 8a2 2 0 1 0 4 0 4 4 0 0 0-8 0 6 6 0 0 0 12 0c0 8-12 8-12 0a8 8 0 0 0 16 0c0 12-16 12-16 0"></path></svg>
                      </div>
                      <span>Light</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'dark' ? 'border-primary' : ''}`}
                      onClick={() => updateTheme({ appearance: 'dark' })}
                    >
                      <div className="h-12 w-12 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>
                      </div>
                      <span>Dark</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.appearance === 'system' ? 'border-primary' : ''}`}
                      onClick={() => updateTheme({ appearance: 'system' })}
                    >
                      <div className="h-12 w-12 bg-gradient-to-br from-background to-zinc-900 border rounded-full flex items-center justify-center mb-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="14" x="3" y="3" rx="2"></rect><path d="M7 20h10"></path><path d="M9 16v4"></path><path d="M15 16v4"></path></svg>
                      </div>
                      <span>System</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Primary Color</h3>
                  <div className="flex flex-wrap gap-3">
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0C29AB] hover:ring-2 hover:ring-offset-2 hover:ring-[#0C29AB]/50"
                      style={{ backgroundColor: "#0C29AB" }}
                      onClick={() => {
                        setCustomColor("#0C29AB");
                        updateTheme({ primary: "#0C29AB" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#7C3AED] hover:ring-2 hover:ring-offset-2 hover:ring-[#7C3AED]/50"
                      style={{ backgroundColor: "#7C3AED" }}
                      onClick={() => {
                        setCustomColor("#7C3AED");
                        updateTheme({ primary: "#7C3AED" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#10B981] hover:ring-2 hover:ring-offset-2 hover:ring-[#10B981]/50"
                      style={{ backgroundColor: "#10B981" }}
                      onClick={() => {
                        setCustomColor("#10B981");
                        updateTheme({ primary: "#10B981" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#F97316] hover:ring-2 hover:ring-offset-2 hover:ring-[#F97316]/50"
                      style={{ backgroundColor: "#F97316" }}
                      onClick={() => {
                        setCustomColor("#F97316");
                        updateTheme({ primary: "#F97316" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#EF4444] hover:ring-2 hover:ring-offset-2 hover:ring-[#EF4444]/50"
                      style={{ backgroundColor: "#EF4444" }}
                      onClick={() => {
                        setCustomColor("#EF4444");
                        updateTheme({ primary: "#EF4444" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#6366F1] hover:ring-2 hover:ring-offset-2 hover:ring-[#6366F1]/50"
                      style={{ backgroundColor: "#6366F1" }}
                      onClick={() => {
                        setCustomColor("#6366F1");
                        updateTheme({ primary: "#6366F1" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#2563EB] hover:ring-2 hover:ring-offset-2 hover:ring-[#2563EB]/50"
                      style={{ backgroundColor: "#2563EB" }}
                      onClick={() => {
                        setCustomColor("#2563EB");
                        updateTheme({ primary: "#2563EB" });
                        applyTheme();
                      }}
                    />
                    <div
                      className="w-8 h-8 rounded-full p-0 border border-input cursor-pointer bg-[#0891B2] hover:ring-2 hover:ring-offset-2 hover:ring-[#0891B2]/50"
                      style={{ backgroundColor: "#0891B2" }}
                      onClick={() => {
                        setCustomColor("#0891B2");
                        updateTheme({ primary: "#0891B2" });
                        applyTheme();
                      }}
                    />
                    <label htmlFor="custom-color" className="w-8 h-8 rounded-full border border-dashed border-input flex items-center justify-center cursor-pointer hover:bg-muted">
                      <Palette className="h-4 w-4" />
                      <input
                        type="color"
                        id="custom-color"
                        className="sr-only"
                        value={customColor}
                        onChange={(e) => {
                          const color = e.target.value;
                          setCustomColor(color);
                          updateTheme({ primary: color });
                          applyTheme();
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Variant</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <Button 
                      variant="outline" 
                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'professional' ? 'border-primary' : ''}`}
                      onClick={() => {
                        updateTheme({ variant: 'professional' });
                        applyTheme();
                      }}
                    >
                      <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-r from-primary/20 to-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-3a2 2 0 0 1-2-2V2"></path><path d="M7 2v4a2 2 0 0 1-2 2H2"></path><path d="M20 17h-3a2 2 0 0 0-2 2v3"></path><path d="M2 17h3a2 2 0 0 1 2 2v3"></path><rect width="9" height="9" x="7.5" y="7.5" rx="1"></rect></svg>
                      </div>
                      <span>Professional</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'tint' ? 'border-primary' : ''}`}
                      onClick={() => {
                        updateTheme({ variant: 'tint' });
                        applyTheme();
                      }}
                    >
                      <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-br from-primary/30 to-primary/10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path><path d="m19 9-2 2-2-2"></path><path d="m5 9 2 2 2-2"></path><path d="m9 19 2-2 2 2"></path><path d="m9 5 2 2 2-2"></path></svg>
                      </div>
                      <span>Tint</span>
                    </Button>

                    <Button 
                      variant="outline" 
                      className={`flex flex-col items-center justify-center h-24 ${user?.theme?.variant === 'vibrant' ? 'border-primary' : ''}`}
                      onClick={() => {
                        updateTheme({ variant: 'vibrant' });
                        applyTheme();
                      }}
                    >
                      <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2 bg-gradient-to-tr from-primary/90 to-primary/30">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"></circle><circle cx="19" cy="17" r="3"></circle><circle cx="6" cy="12" r="4"></circle></svg>
                      </div>
                      <span>Vibrant</span>
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Border Radius</h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <Button 
                        variant="outline" 
                        className={`flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0 ? 'border-primary' : ''}`}
                        onClick={() => {
                          updateTheme({ radius: 0 });
                          applyTheme();
                        }}
                      >
                        <div className="h-12 w-12 border rounded-none flex items-center justify-center mb-2">
                          <span className="text-xs">0px</span>
                        </div>
                        <span>None</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 0.5 ? 'border-primary' : ''}`}
                        onClick={() => {
                          updateTheme({ radius: 0.5 });
                          applyTheme();
                        }}
                      >
                        <div className="h-12 w-12 border rounded-sm flex items-center justify-center mb-2">
                          <span className="text-xs">0.5rem</span>
                        </div>
                        <span>Small</span>
                      </Button>

                      <Button 
                        variant="outline" 
                        className={`flex flex-col items-center justify-center h-24 ${user?.theme?.radius === 1 ? 'border-primary' : ''}`}
                        onClick={() => {
                          updateTheme({ radius: 1 });
                          applyTheme();
                        }}
                      >
                        <div className="h-12 w-12 border rounded-md flex items-center justify-center mb-2">
                          <span className="text-xs">1rem</span>
                        </div>
                        <span>Medium</span>
                      </Button>
                    </div>

                    <Slider
                      defaultValue={[user?.theme?.radius || 0.5]}
                      min={0}
                      max={1.5}
                      step={0.1}
                      onValueChange={(value) => {
                        updateTheme({ radius: value[0] });
                        applyTheme();
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button 
                onClick={() => {
                  resetTheme();
                  applyTheme();
                }} 
                variant="outline" 
                className="mr-2"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button onClick={() => applyTheme()} disabled={isUpdatingTheme}>
                {isUpdatingTheme ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
              {user.subscriptionPlan === 'free' && (
                <div className="flex justify-end">
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => setIsUpgradingPlan(true)}
                    className="mt-2"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Upgrade Plan
                  </Button>
                </div>
              )}
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
                      <p className="capitalize">{user.subscriptionCycle || 'Monthly'}</p>
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
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="mt-4" 
                    onClick={() => upgradeSubscription()}>
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
                  <Button variant="default" size="sm" onClick={() => setIsManagingPaymentMethods(true)}>
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
                      <p className="font-medium">
                        {user.subscriptionCycle === 'monthly' && 'Monthly'}
                        {user.subscriptionCycle === 'quarterly' && 'Quarterly'}
                        {user.subscriptionCycle === 'annual' && 'Annual'}
                        {!user.subscriptionCycle && 'N/A'}
                      </p>
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
                    {user.subscriptionPlan === 'free' ? (
                      <Button 
                        variant="default" 
                        onClick={() => {
                          setIsManagingSubscription(false);
                          setIsUpgradingPlan(true);
                        }}
                      >
                        Upgrade to Pro
                      </Button>
                    ) : (
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
                    <div className="mt-3">
                      <Button variant="outline" size="sm" onClick={() => setIsChangingEmail(true)}>
                        <RotateCcw className="h-3.5 w-3.5 mr-1" />
                        Try Again
                      </Button>
                    </div>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Current Password</span>
                  <div className="flex items-center">
                    <span className="mr-3 tracking-widest text-muted-foreground">
                      {user.passwordLength ? '•'.repeat(user.passwordLength) : '••••••••'}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setIsChangingPassword(true)}>
                      Change Password
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>Password last changed: {user.passwordLastChanged ? new Date(user.passwordLastChanged).toLocaleDateString() : 'Not available'}</p>
                </div>
              </div>
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

    {/* Password Change Dialog */}
    <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new secure password.
          </DialogDescription>
        </DialogHeader>

        <PasswordChangeForm 
          isPending={changePasswordMutation.isPending}
          onSubmit={(data) => {
            changePasswordMutation.mutate(
              { 
                currentPassword: data.currentPassword,
                newPassword: data.newPassword
              },
              {
                onSuccess: () => {
                  toast({
                    title: "Password Changed",
                    description: "Your password has been updated successfully.",
                    variant: "default",
                  });
                  setIsChangingPassword(false);
                },
                onError: (error: any) => {
                  toast({
                    title: "Failed to change password",
                    description: error.message || "An error occurred. Please check your current password and try again.",
                    variant: "destructive",
                  });
                }
              }
            );
          }}
        />
      </DialogContent>
    </Dialog>

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

    {/* Upgrade Plan Dialog for Free Users */}
    <Dialog open={isUpgradingPlan} onOpenChange={setIsUpgradingPlan}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upgrade to Pro</DialogTitle>
          <DialogDescription>
            Unlock all premium features to accelerate your career growth.
          </DialogDescription>
        </DialogHeader>
        <div className="py-6">
          <div className="rounded-xl bg-primary/5 p-5 border border-primary/20 mb-6">
            <h3 className="font-semibold text-lg mb-3 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-primary" />
              Pro Plan Benefits
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Advanced Resume Builder</span>
                  <p className="text-sm text-muted-foreground">Create unlimited professional resumes with AI enhancement</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Unlimited Interview Practice</span>
                  <p className="text-sm text-muted-foreground">Practice with unlimited AI-generated questions and feedback</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">AI Career Coach</span>
                  <p className="text-sm text-muted-foreground">Get personalized career advice whenever you need it</p>
                </div>
              </li>
              <li className="flex items-start">
                <CheckCircle2 className="h-5 w-5 mr-2 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium">Cover Letter Generator</span>
                  <p className="text-sm text-muted-foreground">Create tailored cover letters for every application</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Billing cycle tabs */}
          <div className="mb-6">
            <Tabs defaultValue="monthly" className="w-full" onValueChange={(value) => setBillingCycle(value as 'monthly' | 'quarterly' | 'annual')}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="annual">Annual</TabsTrigger>
              </TabsList>
              <TabsContent value="monthly" className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-semibold">$15.00 <span className="text-sm font-normal text-muted-foreground">/ month</span></p>
                    <p className="text-sm text-muted-foreground">Cancel anytime</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsUpgradingPlan(false)}>Cancel</Button>
                    <Button onClick={() => upgradeSubscription('monthly')}>Upgrade Now</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="quarterly" className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold">$30.00 <span className="text-sm font-normal text-muted-foreground">/ 3 months</span></p>
                      <span className="ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5">Save $15</span>
                    </div>
                    <p className="text-sm text-muted-foreground">$10.00 per month, billed quarterly</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsUpgradingPlan(false)}>Cancel</Button>
                    <Button onClick={() => upgradeSubscription('quarterly')}>Upgrade Now</Button>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="annual" className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center">
                      <p className="text-lg font-semibold">$72.00 <span className="text-sm font-normal text-muted-foreground">/ year</span></p>
                      <span className="ml-2 text-xs font-medium text-green-600 bg-green-100 rounded-full px-2 py-0.5">Save $108</span>
                    </div>
                    <p className="text-sm text-muted-foreground">$6.00 per month, billed annually</p>
                  </div>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={() => setIsUpgradingPlan(false)}>Cancel</Button>
                    <Button onClick={() => upgradeSubscription('annual')}>Upgrade Now</Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    {/* Payment Methods Management Dialog */}
    <Dialog open={isManagingPaymentMethods} onOpenChange={setIsManagingPaymentMethods}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Payment Methods</DialogTitle>
          <DialogDescription>
            Manage your payment methods for subscription billing.
          </DialogDescription>
        </DialogHeader>

        {!setupIntentClientSecret ? (
          <div className="py-6 space-y-4">
            {/* Current Payment Method */}
            {paymentMethodInfo ? (
              <div className="rounded-md border p-4">
                <h3 className="font-medium mb-3">Current Payment Method</h3>
                <div className="flex items-center">
                  <div className="p-3 bg-muted rounded-md mr-4">
                    <CreditCardIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-medium capitalize">{paymentMethodInfo.brand} •••• {paymentMethodInfo.last4}</p>
                    <p className="text-sm text-muted-foreground">
                      Expires {paymentMethodInfo.exp_month}/{paymentMethodInfo.exp_year}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-md border p-4 text-center py-8">
                <p className="text-muted-foreground mb-2">No payment methods found</p>
                <p className="text-sm text-muted-foreground">Add a payment method to manage your subscription</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button 
                onClick={initializePaymentMethodsUpdate}
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...</>
                ) : (
                  <>{paymentMethodInfo ? 'Update Payment Method' : 'Add Payment Method'}</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6">
            <Elements stripe={stripePromise} options={{ clientSecret: setupIntentClientSecret }}>
              <PaymentMethodForm 
                onSuccess={() => {
                  setIsManagingPaymentMethods(false);
                  setSetupIntentClientSecret(null);
                  fetchPaymentMethodInfo();
                  toast({
                    title: "Payment method updated",
                    description: "Your payment method has been updated successfully.",
                    variant: "default",
                  });
                }}
                onCancel={() => {
                  setSetupIntentClientSecret(null);
                }}
              />
            </Elements>
          </div>
        )}
      </DialogContent>
    </Dialog>
  </div>
  );
}