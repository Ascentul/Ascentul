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
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/lib/useUserData';
import { apiRequest } from '@/lib/queryClient';

export default function Checkout() {
  const [, navigate] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Get client secret from URL
  const searchParams = new URLSearchParams(window.location.search);
  const clientSecret = searchParams.get('client_secret');
  
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
  
  const handleCompletePayment = async () => {
    if (!user || !clientSecret) return;
    
    try {
      setIsProcessing(true);
      
      // In a real implementation, we would confirm the payment with Stripe here
      await new Promise(resolve => setTimeout(resolve, 1500)); // simulate network delay
      
      // Update with payment success
      setPaymentSuccess(true);
      
      toast({
        title: "Payment Successful",
        description: "Your subscription has been activated successfully!",
      });
      
      // Show success state briefly before redirecting
      setTimeout(() => {
        navigate('/subscription-success');
      }, 1500);
      
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
  
  if (paymentSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Payment Successful!</CardTitle>
            <CardDescription>Your subscription has been activated.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <p className="text-center text-muted-foreground">
              Thank you for your payment. You now have full access to all features.
            </p>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </Button>
          </CardFooter>
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
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="font-medium mb-2">Payment Summary</h3>
            <div className="flex justify-between mb-1">
              <span>Plan</span>
              <span>{user?.subscriptionPlan === 'premium' ? 'Pro Plan' : 'University Edition'}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span>Billing Period</span>
              <span>{user?.subscriptionCycle || 'Monthly'}</span>
            </div>
            <div className="flex justify-between font-semibold mt-2 pt-2 border-t">
              <span>Total</span>
              <span>
                ${user?.subscriptionPlan === 'premium' 
                  ? (user?.subscriptionCycle === 'annual' ? '72.00' : user?.subscriptionCycle === 'quarterly' ? '30.00' : '15.00')
                  : (user?.subscriptionCycle === 'annual' ? '59.99' : user?.subscriptionCycle === 'quarterly' ? '21.99' : '7.99')
                }
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
              'Complete Payment'
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