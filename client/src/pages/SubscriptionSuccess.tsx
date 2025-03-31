import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useUser } from '@/lib/useUserData';

export default function SubscriptionSuccess() {
  const [, navigate] = useLocation();
  const { user, isLoading } = useUser();

  useEffect(() => {
    // Redirect to login if no user
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl mb-2">Subscription Activated!</CardTitle>
          <CardDescription>
            Thank you for subscribing to CareerPilot
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border p-4 rounded-lg bg-muted/50">
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Plan:</span>
              <span className="font-medium">{user?.subscriptionPlan === 'premium' ? 'Pro Plan' : 'University Edition'}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-muted-foreground">Billing Cycle:</span>
              <span className="font-medium">{user?.subscriptionCycle || 'Monthly'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600">Active</span>
            </div>
          </div>
          
          <p className="text-center text-sm text-muted-foreground">
            Your subscription is now active. You can manage your subscription at any time from your account settings.
          </p>
        </CardContent>
        <CardFooter className="flex flex-col space-y-3">
          <Button className="w-full" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" className="w-full" onClick={() => navigate('/account')}>
            Manage Subscription
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}