import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useUser, useUpdateUserSubscription } from '@/lib/useUserData';
import { useToast } from '@/hooks/use-toast';

const planFeatures = {
  free: [
    'Resume Builder (1 resume)',
    'Cover Letter Generator (1 letter)',
    'Basic Goal Tracking',
    'Work History Management',
    'Limited Interview Practice Questions',
    'Community Access'
  ],
  pro: [
    'Unlimited Resumes & Templates',
    'Unlimited Cover Letters',
    'Advanced Interview Preparation',
    'AI Career Coach (100 messages/month)',
    'Advanced Goal Planning & Tracking',
    'Custom Dashboards',
    'Export in Multiple Formats',
    'Email & Priority Support'
  ],
};

export default function PlanSelection() {
  const [, setLocation] = useLocation();
  const [selectedPlan, setSelectedPlan] = useState<string>('free');
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const { user, isLoading } = useUser();
  const updateSubscriptionMutation = useUpdateUserSubscription();
  const { toast } = useToast();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to sign in if not authenticated
      setLocation('/sign-in');
    }
  }, [user, isLoading, setLocation]);
  
  // Handle user loading and subscription status
  useEffect(() => {
    if (isLoading || !user) {
      return; // Wait for user data to load
    }
    
    // If already subscribed, redirect to dashboard
    if (user.subscriptionPlan && user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active') {
      setLocation('/dashboard');
    }
  }, [user, isLoading, setLocation]);

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
    
    // Different actions based on selected plan
    if (plan === 'free') {
      // For free plan, handle directly
      handleContinue();
    } else {
      // For pro plan, navigate to billing cycle selection 
      setLocation('/billing-cycle?plan=pro');
    }
  };

  const calculatePrice = (plan: string, cycle: string): number => {
    if (plan === 'free') return 0;
    
    // Pro plan pricing
    if (cycle === 'monthly') return 15; 
    if (cycle === 'quarterly') return 30; // $10/month, billed quarterly
    if (cycle === 'yearly') return 72; // $6/month, billed yearly
    
    return 0;
  };

  const calculateSavings = (plan: string, cycle: string): number => {
    if (plan === 'free' || cycle === 'monthly') return 0;
    
    const monthlyPrice = 15; // Monthly price for pro plan
    
    if (cycle === 'quarterly') {
      const quarterlyTotal = monthlyPrice * 3; // 3 months
      return quarterlyTotal - 30; // Savings compared to 3 months paid monthly
    }
    
    if (cycle === 'yearly') {
      const yearlyTotal = monthlyPrice * 12; // 12 months
      return yearlyTotal - 72; // Savings compared to 12 months paid monthly
    }
    
    return 0;
  };

  const handleContinue = async () => {
    if (selectedPlan === 'free') {
      try {
        // Update user with free plan using the server-side API
        await updateSubscriptionMutation.mutateAsync({
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          subscriptionCycle: undefined
        });
        
        toast({
          title: 'Free plan activated',
          description: 'You now have access to all free features of CareerTracker.io',
        });
        
        // Redirect to dashboard with a slight delay to ensure data is updated
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } catch (error) {
        console.error('Error activating free plan:', error);
        toast({
          title: 'Error activating plan',
          description: 'There was an error activating your plan. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      // For pro plan, redirect to checkout
      setLocation(`/checkout?plan=${selectedPlan}&cycle=${billingCycle}`);
    }
  };

  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container max-w-5xl mx-auto px-6 md:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-muted-foreground text-lg">
            Select the plan that best fits your career development needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-10">
          {/* Free Plan */}
          <div className="relative">
            <div className="relative">
              <div className="pt-10">
                <Card className="relative overflow-hidden border rounded-lg">
                  <CardHeader className="pb-8 px-6 md:px-8">
                    <p className="text-sm text-muted-foreground mb-4">For individuals</p>
                    <CardTitle className="text-3xl font-bold mb-4">Free Plan</CardTitle>
                    <CardDescription className="text-sm mb-8">
                      Get started with basic career management tools
                    </CardDescription>
                    <div className="mt-8 mb-14">
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <div className="px-6 md:px-8 mb-16">
                    <Button 
                      variant="outline" 
                      className="w-full h-11"
                      onClick={() => handlePlanSelect('free')}
                    >
                      Create account
                    </Button>
                  </div>
                  <CardContent className="pb-8 px-6 md:px-8">
                    <ul className="space-y-6">
                      {planFeatures.free.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-primary mr-3 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          
          {/* Pro Plan */}
          <div className="relative">
            <div className="relative">
              <div className="absolute top-0 left-0 right-0 z-10 bg-primary text-white py-2 text-center font-medium rounded-t-lg flex items-center justify-center">
                Most popular <span className="ml-1">✨</span>
              </div>
              <div className="pt-10">
                <Card className="relative overflow-hidden border rounded-lg">
                  <CardHeader className="pb-8 px-6 md:px-8">
                    <p className="text-sm text-muted-foreground mb-4">For individuals and teams</p>
                    <CardTitle className="text-3xl font-bold mb-4">Pro Plan</CardTitle>
                    <CardDescription className="text-sm mb-8">
                      Advanced features for serious career development
                    </CardDescription>
                    <div className="mt-8 mb-14">
                      <span className="text-4xl font-bold">$15</span>
                      <span className="text-muted-foreground ml-1">/month</span>
                    </div>
                  </CardHeader>
                  <div className="px-6 md:px-8 mb-16">
                    <Button 
                      variant="default" 
                      className="w-full h-11 bg-primary"
                      onClick={() => handlePlanSelect('pro')}
                    >
                      Get started
                    </Button>
                    
                    <p className="text-xs text-muted-foreground text-center mt-4">
                      Choose your billing cycle on the next step
                    </p>
                  </div>
                  <CardContent className="pb-6 px-6 md:px-8">
                    <p className="font-semibold mb-4">Everything in Free, plus:</p>
                    <ul className="space-y-6">
                      {planFeatures.pro.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-primary mr-3 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start max-w-2xl">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              You can change or cancel your plan at any time from your account settings. 
              Pro plan features will be immediately available after payment processing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}