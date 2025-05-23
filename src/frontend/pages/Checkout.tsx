import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { apiRequest } from '@/lib/queryClient';

type PlanInterval = 'monthly' | 'quarterly' | 'yearly';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingInterval, setBillingInterval] = useState<PlanInterval>('monthly');
  
  // Get plan type and cycle from URL
  const searchParams = new URLSearchParams(window.location.search);
  const planType = searchParams.get('plan') || 'pro';
  const cycleParam = searchParams.get('cycle') as PlanInterval;
  
  // In a real implementation with Stripe, we would have a client_secret here
  const clientSecret = 'mock_client_secret_for_demo';
  
  // Initialize billing interval from URL parameter if available
  useEffect(() => {
    if (cycleParam && ['monthly', 'quarterly', 'yearly'].includes(cycleParam)) {
      setBillingInterval(cycleParam);
    }
  }, [cycleParam]);
  
  useEffect(() => {
    if (!clientSecret) {
      toast({
        title: "Payment Error",
        description: "Missing payment information. Please try again.",
        variant: "destructive"
      });
      navigate('/pricing');
      return;
    }
    
    // Simulate payment verification (mock for now)
    const verifyPayment = async () => {
      try {
        setIsLoading(true);
        // In a real implementation, we would use Stripe.js to handle this
        await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
        setIsLoading(false);
      } catch (error) {
        setIsLoading(false);
        toast({
          title: "Payment Error",
          description: "There was an error verifying your payment. Please try again.",
          variant: "destructive"
        });
      }
    };
    
    verifyPayment();
  }, [clientSecret, navigate, toast]);
  
  // Function to get pricing details based on plan and interval
  const getPricing = (plan: string, interval: PlanInterval) => {
    if (plan === 'pro') {
      switch (interval) {
        case 'monthly':
          return { price: '15.00', period: 'month' };
        case 'quarterly':
          return { price: '30.00', period: '3 months' };
        case 'yearly':
          return { price: '72.00', period: 'year' };
        default:
          return { price: '15.00', period: 'month' };
      }
    } else { // university plan
      switch (interval) {
        case 'monthly':
          return { price: '7.99', period: 'month' };
        case 'quarterly':
          return { price: '21.99', period: '3 months' };
        case 'yearly':
          return { price: '59.99', period: 'year' };
        default:
          return { price: '7.99', period: 'month' };
      }
    }
  };
  
  const handleCompletePayment = async () => {
    if (!user || !clientSecret) return;
    
    try {
      setIsProcessing(true);
      
      // In a real implementation, we would update the subscription with the selected billing interval
      // and then confirm the payment with Stripe
      
      // For demo, we simulate the API call to update the billing interval
      await apiRequest('PUT', '/api/payments/update-subscription', { 
        interval: billingInterval 
      });
      
      // Then simulate payment confirmation
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
      
      // Redirect directly to success page without showing temporary success state
      navigate('/subscription-success');
      
    } catch (error) {
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Verifying Payment</CardTitle>
            <CardDescription>Please wait while we verify your payment information...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Complete Your Payment</CardTitle>
          <CardDescription>Your subscription is almost ready!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-3">Billing Interval</h3>
            <RadioGroup 
              defaultValue={billingInterval}
              value={billingInterval}
              onValueChange={(value) => setBillingInterval(value as PlanInterval)}
              className="space-y-2"
            >
              <div className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly" className="cursor-pointer">Monthly</Label>
                </div>
                <div className="text-right">
                  <p className="font-medium">${planType === 'pro' ? '15.00' : '7.99'}/month</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="quarterly" id="quarterly" />
                  <Label htmlFor="quarterly" className="cursor-pointer">Quarterly</Label>
                </div>
                <div className="text-right">
                  <p className="font-medium">${planType === 'pro' ? '30.00' : '21.99'}/3 months</p>
                  <p className="text-xs text-muted-foreground">{planType === 'pro' ? 'Save $15' : 'Save $2'}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between border rounded-lg p-3 cursor-pointer hover:bg-muted/50">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yearly" id="yearly" />
                  <Label htmlFor="yearly" className="cursor-pointer">Yearly</Label>
                </div>
                <div className="text-right">
                  <p className="font-medium">${planType === 'pro' ? '72.00' : '59.99'}/year</p>
                  <p className="text-xs text-muted-foreground">{planType === 'pro' ? 'Save $108' : 'Save $35.89'}</p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-medium mb-2">Payment Summary</h3>
            <div className="flex justify-between mb-1">
              <span>Plan</span>
              <span>{planType === 'pro' ? 'Pro Plan' : 'University Edition'}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Billing Period</span>
              <span className="capitalize">{billingInterval}</span>
            </div>
            <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
              <span>Total</span>
              <span>
                ${getPricing(planType, billingInterval).price}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="border border-dashed rounded p-6 w-full">
              <p className="text-center text-muted-foreground">
                In a real implementation, the Stripe payment form would be displayed here.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button 
            className="w-full" 
            size="lg"
            onClick={handleCompletePayment}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                Complete Payment - ${getPricing(planType, billingInterval).price}
              </>
            )}
          </Button>
          
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => navigate('/pricing')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Plans
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}