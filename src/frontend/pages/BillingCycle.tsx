import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Check, ArrowRight, ArrowLeft } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';

export default function BillingCycle() {
  const [location, setLocation] = useLocation();
  const [billingCycle, setBillingCycle] = useState<string>('monthly');
  const { toast } = useToast();
  const { user, isLoading } = useUser();
  
  // Parse the URL parameters
  const params = new URLSearchParams(location.split('?')[1]);
  const plan = params.get('plan');
  
  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to sign in if not authenticated
      setLocation('/sign-in');
    }
  }, [user, isLoading, setLocation]);
  
  // Handle URL parameters and subscription status
  useEffect(() => {
    // If no plan specified, redirect back to plan selection
    if (!plan) {
      setLocation('/plan-selection');
    }
    
    // Skip other checks if still loading or no user
    if (isLoading || !user) {
      return;
    }
    
    // If already subscribed with active subscription, redirect to dashboard
    if (user.subscriptionPlan && user.subscriptionPlan !== 'free' && user.subscriptionStatus === 'active') {
      setLocation('/dashboard');
    }
  }, [plan, setLocation, user, isLoading]);

  const calculatePrice = (cycle: string): number => {
    // Pro plan pricing
    if (cycle === 'monthly') return 15; 
    if (cycle === 'quarterly') return 30; // $10/month, billed quarterly
    if (cycle === 'yearly') return 72; // $6/month, billed yearly
    
    return 15; // Default to monthly
  };

  const calculateSavings = (cycle: string): number => {
    if (cycle === 'monthly') return 0;
    
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

  const handleContinue = () => {
    // Redirect to checkout with plan and billing cycle
    setLocation(`/checkout?plan=${plan}&cycle=${billingCycle}`);
  };

  const handleBack = () => {
    // Go back to plan selection
    setLocation('/plan-selection');
  };

  if (!plan || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        {!plan ? "Redirecting..." : "Loading..."}
      </div>
    );
  }
  
  // If no user after loading is complete, redirect to sign in (this is a fallback)
  if (!user) {
    return <div className="flex justify-center items-center min-h-screen">Redirecting to sign in...</div>;
  }

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container max-w-3xl mx-auto px-6 md:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Choose Your Billing Cycle</h1>
          <p className="text-muted-foreground">
            Select how you'd like to be billed for your Pro Plan
          </p>
        </div>
        
        <Card className="mb-8">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-2xl">Select Billing Cycle</CardTitle>
            <CardDescription>
              Choose the option that works best for you
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <RadioGroup 
              className="space-y-4"
              value={billingCycle}
              onValueChange={setBillingCycle}
            >
              <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setBillingCycle('monthly')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <div className="ml-3">
                      <Label htmlFor="monthly" className="text-lg font-medium cursor-pointer">Monthly</Label>
                      <p className="text-muted-foreground text-sm">
                        Pay month-to-month, cancel anytime
                      </p>
                    </div>
                  </div>
                  <div className="font-semibold">$15/month</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setBillingCycle('quarterly')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RadioGroupItem value="quarterly" id="quarterly" />
                    <div className="ml-3">
                      <Label htmlFor="quarterly" className="text-lg font-medium cursor-pointer">
                        Quarterly
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Save $15
                        </span>
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Pay every 3 months, save 17%
                      </p>
                    </div>
                  </div>
                  <div className="font-semibold">$30/quarter</div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setBillingCycle('yearly')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <div className="ml-3">
                      <Label htmlFor="yearly" className="text-lg font-medium cursor-pointer">
                        Yearly
                        <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                          Save $108
                        </span>
                      </Label>
                      <p className="text-muted-foreground text-sm">
                        Pay once a year, save 60%
                      </p>
                    </div>
                  </div>
                  <div className="font-semibold">$72/year</div>
                </div>
              </div>
            </RadioGroup>
            
            <div className="mt-8 p-4 bg-primary/5 rounded-lg">
              <div className="flex justify-between font-medium text-lg mb-2">
                <span>Total:</span>
                <span>${calculatePrice(billingCycle)}</span>
              </div>
              {calculateSavings(billingCycle) > 0 && (
                <div className="flex justify-between text-green-600 text-sm">
                  <span>You save:</span>
                  <span>${calculateSavings(billingCycle)}</span>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Plans
            </Button>
            <Button onClick={handleContinue}>
              Continue to Checkout
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>
            By proceeding with payment, you agree to our <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
}