"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2, Sparkles, Crown, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface OnboardingData {
  major: string;
  graduationYear: string;
  dreamJob: string;
  selectedPlan?: 'free' | 'monthly' | 'annual';
}

const defaultOnboardingData: OnboardingData = {
  major: "",
  graduationYear: "",
  dreamJob: "",
  selectedPlan: undefined,
};

export function OnboardingFlow() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Convex mutations
  const updateUser = useMutation(api.users.updateUser);

  // Check if user is from a university (should skip plan selection)
  const isUniversityUser = user?.university_id != null;

  // Check if user has active premium subscription (should skip plan selection)
  const hasPremiumSubscription = user?.subscription_plan === 'premium' && user?.subscription_status === 'active';

  // Users who should skip plan selection: university users OR users with active premium
  const shouldSkipPlanSelection = isUniversityUser || hasPremiumSubscription;

  // Dynamically calculate total steps based on user type
  const totalSteps = shouldSkipPlanSelection ? 2 : 3; // 3 steps for regular users (plan + 2 onboarding), 2 for others
  const planSelectionStep = 1;
  const educationStep = shouldSkipPlanSelection ? 1 : 2;
  const dreamJobStep = shouldSkipPlanSelection ? 2 : 3;

  const [step, setStep] = useState<number>(shouldSkipPlanSelection ? educationStep : planSelectionStep);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [progress, setProgress] = useState<number>(0);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState<boolean>(false);
  const [processingPayment, setProcessingPayment] = useState<'monthly' | 'annual' | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(Math.floor((step / totalSteps) * 100));
  }, [step, totalSteps]);

  const handleDataChange = (key: keyof OnboardingData, value: string) => {
    setData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleNext = async () => {
    if (step === dreamJobStep) {
      // Final step - save onboarding data
      const success = await saveOnboardingData();
      if (!success) {
        toast({
          title: "Error saving onboarding data",
          description:
            "There was an error saving your profile information. Please try again.",
          variant: "destructive",
        });
      }
    } else if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePlanSelection = async (planType: 'free' | 'monthly' | 'annual') => {
    setData((prevData) => ({
      ...prevData,
      selectedPlan: planType,
    }));

    if (planType === 'free') {
      // Free plan - just move to next step
      setStep(step + 1);
    } else {
      // Paid plan - redirect to Stripe payment link
      await openPaymentLink(planType);
    }
  };

  const openPaymentLink = async (interval: 'monthly' | 'annual') => {
    if (processingPayment) return;

    try {
      setProcessingPayment(interval);
      setPaymentError(null);

      const monthlyUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY;
      const annualUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ANNUAL;
      const base = interval === 'monthly' ? monthlyUrl : annualUrl;

      if (!base) {
        throw new Error('Payment link not configured');
      }

      const url = new URL(base);
      // Help Stripe link the session to the current user for webhook reconciliation
      if (user?.email) url.searchParams.set('prefilled_email', user.email);
      if (user?.clerkId) url.searchParams.set('client_reference_id', user.clerkId);

      // Redirect to Stripe
      window.location.href = url.toString();
    } catch (e) {
      console.error('Payment link error:', e);
      setPaymentError('Unable to process payment. Please try again or contact support.');
      setProcessingPayment(null);
    }
  };

  const handleBack = () => {
    const minStep = shouldSkipPlanSelection ? educationStep : planSelectionStep;
    if (step > minStep) {
      setStep(step - 1);
    }
  };

  const saveOnboardingData = async () => {
    if (!user) return false;

    try {
      setIsSavingOnboarding(true);

      await updateUser({
        clerkId: user.clerkId,
        updates: {
          major: data.major,
          graduation_year: data.graduationYear,
          dream_job: data.dreamJob,
          onboarding_completed: true,
        },
      });

      toast({
        title: "Welcome to Ascentful!",
        description: "Your profile has been set up successfully.",
        variant: "success",
      });

      // Wait longer for Convex to propagate the update and the query to refresh
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Force a hard redirect to ensure the user data is fully refreshed
      window.location.href = "/dashboard";
      return true;
    } catch (error) {
      console.error("Error saving onboarding data:", error);
      return false;
    } finally {
      setIsSavingOnboarding(false);
    }
  };

  const renderStep = () => {
    // Plan Selection Step (only for users without premium subscription)
    if (!shouldSkipPlanSelection && step === planSelectionStep) {
      return (
        <div className="space-y-6">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
            <CardDescription>
              Select the plan that best fits your career goals. You can always change this later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {paymentError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">Payment Error</p>
                  <p className="text-sm text-red-600">{paymentError}</p>
                </div>
              </div>
            )}

            {/* Free Plan */}
            <div className="border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer" onClick={() => handlePlanSelection('free')}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Free</h3>
                  <p className="text-sm text-muted-foreground mb-3">Perfect for exploring your career</p>
                  <div className="text-2xl font-bold mb-2">$0</div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Basic career goal tracking
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Job application tracker
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Basic resume templates
                    </li>
                  </ul>
                  <Button variant="outline" className="w-full" onClick={(e) => { e.stopPropagation(); handlePlanSelection('free'); }}>
                    Continue with Free
                  </Button>
                </div>
              </div>
            </div>

            {/* Premium Monthly */}
            <div className={`border rounded-lg p-4 hover:border-primary transition-colors ${processingPayment === 'monthly' ? 'ring-2 ring-primary' : ''}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Premium Monthly</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Accelerate your career growth</p>
                  <div className="text-2xl font-bold mb-2">$9.99<span className="text-sm font-normal text-muted-foreground">/month</span></div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Everything in Free
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Unlimited AI-powered resume reviews
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Premium cover letter templates
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handlePlanSelection('monthly')}
                    disabled={processingPayment === 'monthly'}
                  >
                    {processingPayment === 'monthly' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Choose Monthly Plan
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Premium Annual */}
            <div className={`border border-primary rounded-lg p-4 hover:shadow-lg transition-all relative ${processingPayment === 'annual' ? 'ring-2 ring-primary' : ''}`}>
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                  BEST VALUE
                </span>
              </div>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Crown className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-lg">Premium Annual</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Maximum savings and exclusive perks</p>
                  <div className="text-2xl font-bold mb-1">$99<span className="text-sm font-normal text-muted-foreground">/year</span></div>
                  <div className="text-xs text-green-600 font-medium mb-3">Save 17% vs monthly</div>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Everything in Premium Monthly
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Exclusive career coaching sessions
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                      Early access to new features
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={() => handlePlanSelection('annual')}
                    disabled={processingPayment === 'annual'}
                  >
                    {processingPayment === 'annual' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Choose Annual Plan
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      );
    }

    // Education Step
    if (step === educationStep) {
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">
                Tell us about your education
              </CardTitle>
              <CardDescription>
                Help us personalize your experience by sharing your academic
                details.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="major">What's your major?</Label>
                <Input
                  id="major"
                  placeholder="e.g., Computer Science, Business, Psychology"
                  value={data.major}
                  onChange={(e) => handleDataChange("major", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grad-year">Expected graduation year</Label>
                <Select
                  value={data.graduationYear}
                  onValueChange={(value) =>
                    handleDataChange("graduationYear", value)
                  }
                >
                  <SelectTrigger id="grad-year">
                    <SelectValue placeholder="Select graduation year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      new Date().getFullYear(),
                      new Date().getFullYear() + 1,
                      new Date().getFullYear() + 2,
                      new Date().getFullYear() + 3,
                      new Date().getFullYear() + 4,
                      new Date().getFullYear() + 5,
                      new Date().getFullYear() + 6,
                    ].map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              {!shouldSkipPlanSelection && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={!data.major || !data.graduationYear}
                className={shouldSkipPlanSelection ? "ml-auto" : ""}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        );
      }

      // Dream Job Step
      if (step === dreamJobStep) {
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">What's your dream job?</CardTitle>
              <CardDescription>
                Tell us about your career aspirations so we can help you get
                there.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dreamJob">Dream job title or role</Label>
                <Input
                  id="dreamJob"
                  placeholder="e.g., Software Engineer at Google, Marketing Manager, Data Scientist"
                  value={data.dreamJob}
                  onChange={(e) => handleDataChange("dreamJob", e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Be as specific or general as you'd like - this helps us tailor
                  your experience.
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={async () => {
                  const success = await saveOnboardingData();
                  if (success) {
                    router.push("/dashboard");
                  }
                }}
                disabled={isSavingOnboarding || !data.dreamJob}
                className="min-w-[140px]"
              >
                {isSavingOnboarding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  "Complete Setup"
                )}
              </Button>
            </CardFooter>
          </div>
        );
      }

      return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {step} of {totalSteps}
            </p>
          </div>

          <Card className="w-full">{renderStep()}</Card>
        </div>
      </div>
    </div>
  );
}
