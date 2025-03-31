import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Check, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useUser } from '@/lib/useUserData';
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
  const { user, updateUser } = useUser();
  const { toast } = useToast();
  
  // Redirect to dashboard if the user already has a plan
  useEffect(() => {
    if (user?.subscriptionPlan && user?.subscriptionPlan !== 'free' && user?.subscriptionStatus === 'active') {
      setLocation('/dashboard');
    }
  }, [user, setLocation]);

  const handlePlanSelect = (plan: string) => {
    setSelectedPlan(plan);
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
        // Update user with free plan
        await updateUser({
          subscriptionPlan: 'free',
          subscriptionStatus: 'active',
          subscriptionCycle: null
        });
        
        toast({
          title: 'Free plan activated',
          description: 'You now have access to all free features of CareerTracker.io',
        });
        
        // Redirect to dashboard
        setLocation('/dashboard');
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
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
          <p className="text-muted-foreground">
            Select the plan that best fits your career development needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Free Plan */}
          <Card className={`relative overflow-hidden ${selectedPlan === 'free' ? 'border-primary border-2' : ''}`}>
            {selectedPlan === 'free' && (
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg">
                Selected
              </div>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Free Plan</CardTitle>
              <CardDescription>
                Get started with basic career management tools
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground ml-1">forever</span>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <ul className="space-y-2">
                {planFeatures.free.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedPlan === 'free' ? 'default' : 'outline'} 
                className="w-full"
                onClick={() => handlePlanSelect('free')}
              >
                {selectedPlan === 'free' ? 'Selected' : 'Select Free Plan'}
              </Button>
            </CardFooter>
          </Card>
          
          {/* Pro Plan */}
          <Card className={`relative overflow-hidden ${selectedPlan === 'pro' ? 'border-primary border-2' : ''}`}>
            {selectedPlan === 'pro' && (
              <div className="absolute top-0 right-0 bg-primary text-white px-3 py-1 rounded-bl-lg">
                Selected
              </div>
            )}
            <div className="absolute top-0 left-0 bg-primary text-white px-3 py-1 rounded-br-lg">
              Popular
            </div>
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">Pro Plan</CardTitle>
              <CardDescription>
                Advanced features for serious career development
              </CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">${calculatePrice('pro', billingCycle)}</span>
                <span className="text-muted-foreground ml-1">
                  {billingCycle === 'monthly' && '/month'}
                  {billingCycle === 'quarterly' && '/quarter'}
                  {billingCycle === 'yearly' && '/year'}
                </span>
                
                {calculateSavings('pro', billingCycle) > 0 && (
                  <div className="text-green-600 text-sm mt-1">
                    Save ${calculateSavings('pro', billingCycle)} with this plan
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <RadioGroup 
                className="mb-4"
                value={billingCycle}
                onValueChange={setBillingCycle}
              >
                <div className="flex items-center justify-between space-x-2 border rounded-lg p-3 mb-2 cursor-pointer hover:bg-muted/50" onClick={() => setBillingCycle('monthly')}>
                  <div className="flex items-center">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="ml-2 cursor-pointer">Monthly</Label>
                  </div>
                  <span className="font-medium">$15/mo</span>
                </div>
                
                <div className="flex items-center justify-between space-x-2 border rounded-lg p-3 mb-2 cursor-pointer hover:bg-muted/50" onClick={() => setBillingCycle('quarterly')}>
                  <div className="flex items-center">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <Label htmlFor="quarterly" className="ml-2 cursor-pointer">
                      Quarterly
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Save $15
                      </span>
                    </Label>
                  </div>
                  <span className="font-medium">$30/qtr</span>
                </div>
                
                <div className="flex items-center justify-between space-x-2 border rounded-lg p-3 cursor-pointer hover:bg-muted/50" onClick={() => setBillingCycle('yearly')}>
                  <div className="flex items-center">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="ml-2 cursor-pointer">
                      Yearly
                      <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                        Save $108
                      </span>
                    </Label>
                  </div>
                  <span className="font-medium">$72/yr</span>
                </div>
              </RadioGroup>
              
              <ul className="space-y-2">
                {planFeatures.pro.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-primary mr-2 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                variant={selectedPlan === 'pro' ? 'default' : 'outline'} 
                className="w-full"
                onClick={() => handlePlanSelect('pro')}
              >
                {selectedPlan === 'pro' ? 'Selected' : 'Select Pro Plan'}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <div className="flex flex-col items-center">
          <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start max-w-2xl">
            <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-700">
              You can change or cancel your plan at any time from your account settings. 
              Pro plan features will be immediately available after payment processing.
            </p>
          </div>
          
          <Button 
            size="lg" 
            onClick={handleContinue}
            className="px-8"
          >
            Continue with {selectedPlan === 'free' ? 'Free Plan' : 'Pro Plan'}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}