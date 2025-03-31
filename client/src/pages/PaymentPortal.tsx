import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Calendar, 
  ArrowLeft, 
  Lock, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type PlanInterval = 'monthly' | 'quarterly' | 'annual';

type PlanDetails = {
  name: string;
  features: string[];
  priceDetails: {
    monthly: { price: string; period: string; savings: string; };
    quarterly: { price: string; period: string; savings: string; };
    annual: { price: string; period: string; savings: string; };
  };
};

export default function PaymentPortal() {
  const [, navigate] = useLocation();
  const location = window.location.pathname;
  const planType = location.includes('premium') ? 'premium' : location.includes('university') ? 'university' : 'premium';
  const { user } = useUser();
  const { toast } = useToast();
  
  const [billingInterval, setBillingInterval] = useState<PlanInterval>('monthly');
  const [isProcessing, setIsProcessing] = useState(false);

  // Use the extracted plan type from the URL
  const currentPlanType = planType;

  // Plan details based on the selected plan type
  const planDetails: Record<string, PlanDetails> = {
    premium: {
      name: 'Pro Plan',
      features: [
        'Unlimited resumes and cover letters',
        'Advanced interview preparation',
        'AI career coach (10 conversations/mo)',
        'Comprehensive goal tracking',
        'Achievement system with rewards',
        'Work history management',
        'Interview process tracking',
      ],
      priceDetails: {
        monthly: { price: '15.00', period: 'month', savings: '' },
        quarterly: { price: '30.00', period: '3 months', savings: 'Save $15' },
        annual: { price: '72.00', period: 'year', savings: 'Save $108' }
      }
    },
    university: {
      name: 'University Edition',
      features: [
        'All Pro features',
        'Study plan creator',
        'Course tracking and management',
        'Learning modules',
        'Assignment tracking',
        'Academic goal integration',
        'University-specific career resources',
      ],
      priceDetails: {
        monthly: { price: '7.99', period: 'month', savings: '47% off Pro' },
        quarterly: { price: '21.99', period: '3 months', savings: '27% off Pro' },
        annual: { price: '59.99', period: 'year', savings: '17% off Pro' }
      }
    }
  };

  // Get the current plan's details
  const currentPlan = planDetails[currentPlanType];
  
  // Get pricing for the selected billing interval
  const currentPricing = currentPlan.priceDetails[billingInterval];

  // Create subscription mutation
  const subscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/payments/create-subscription', {
        plan: currentPlanType,
        interval: billingInterval,
        email: user?.email,
        userId: user?.id,
        userName: user?.name
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      // For the Stripe checkout flow, redirect to the checkout page with the client secret
      if (data.clientSecret) {
        toast({
          title: "Subscription Started",
          description: "Your subscription has been activated successfully.",
        });
        
        // Navigate to the subscription success page
        navigate('/subscription-success');
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  });

  const handleSubscribe = async () => {
    if (!user) {
      // Redirect to auth page if not logged in
      navigate('/auth');
      return;
    }
    
    setIsProcessing(true);
    subscriptionMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container mx-auto px-4">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate('/pricing')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Plans
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Plan details card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                Complete Your {currentPlan.name} Subscription
              </CardTitle>
              <CardDescription>
                Choose your preferred billing cycle to get started
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Billing Cycle</h3>
                  <RadioGroup 
                    defaultValue="monthly"
                    value={billingInterval}
                    onValueChange={(value) => setBillingInterval(value as PlanInterval)}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="monthly" id="monthly" />
                        <Label htmlFor="monthly" className="cursor-pointer">Monthly</Label>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${currentPlan.priceDetails.monthly.price}/{currentPlan.priceDetails.monthly.period}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="quarterly" id="quarterly" />
                        <Label htmlFor="quarterly" className="cursor-pointer">Quarterly</Label>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${currentPlan.priceDetails.quarterly.price}/{currentPlan.priceDetails.quarterly.period}</p>
                        {currentPlan.priceDetails.quarterly.savings && (
                          <p className="text-xs text-green-600">{currentPlan.priceDetails.quarterly.savings}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border rounded-lg p-4 cursor-pointer hover:bg-muted/50">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="annual" id="annual" />
                        <Label htmlFor="annual" className="cursor-pointer">Annual</Label>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${currentPlan.priceDetails.annual.price}/{currentPlan.priceDetails.annual.period}</p>
                        {currentPlan.priceDetails.annual.savings && (
                          <p className="text-xs text-green-600">{currentPlan.priceDetails.annual.savings}</p>
                        )}
                      </div>
                    </div>
                  </RadioGroup>
                </div>

                <Separator />
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Payment Summary</h3>
                  <div className="flex justify-between">
                    <span>{currentPlan.name} ({billingInterval})</span>
                    <span>${currentPricing.price}</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total billed {billingInterval === 'monthly' ? 'monthly' : billingInterval === 'quarterly' ? 'every 3 months' : 'annually'}</span>
                    <span>${currentPricing.price}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                size="lg"
                onClick={handleSubscribe}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Subscribe Now - ${currentPricing.price}/{currentPricing.period}
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Plan details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{currentPlan.name} Includes:</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border rounded-lg p-4 bg-muted/50">
                <div className="flex items-center mb-2">
                  <Lock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm font-medium">Secure Payment</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your payment information is securely processed by Stripe. We never store your full credit card details.
                </p>
              </div>

              <div className="mt-4 text-sm text-muted-foreground">
                <p>By subscribing, you agree to our <Link href="/terms" className="text-primary underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.</p>
                <p className="mt-2">You can cancel your subscription at any time from your account settings.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}