"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
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
import { PricingTable } from "@clerk/nextjs";

interface OnboardingData {
  major: string;
  graduationYear: string;
  dreamJob: string;
}

const defaultOnboardingData: OnboardingData = {
  major: "",
  graduationYear: "",
  dreamJob: "",
};

export function OnboardingFlow() {
  const { user, subscription, hasPremium } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Convex mutations
  const updateUser = useMutation(api.users.updateUser);

  // Check if user should skip plan selection
  // University users and users who already subscribed skip plan selection
  const isUniversityUser = user?.university_id != null;
  const shouldSkipPlanSelection = isUniversityUser || hasPremium;

  // Dynamically calculate steps
  const totalSteps = shouldSkipPlanSelection ? 2 : 3;
  const planSelectionStep = 1;
  const educationStep = shouldSkipPlanSelection ? 1 : 2;
  const dreamJobStep = shouldSkipPlanSelection ? 2 : 3;

  const [step, setStep] = useState<number>(shouldSkipPlanSelection ? educationStep : planSelectionStep);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [progress, setProgress] = useState<number>(0);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState<boolean>(false);

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(Math.floor((step / totalSteps) * 100));
  }, [step, totalSteps]);

  // If user subscribes during onboarding, auto-advance to next step
  useEffect(() => {
    if (step === planSelectionStep && hasPremium && !subscription.isLoading) {
      toast({
        title: "Subscription activated!",
        description: `Welcome to ${subscription.planName}!`,
        variant: "success",
      });
      setStep(educationStep);
    }
  }, [hasPremium, subscription, step, planSelectionStep, educationStep, toast]);

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

  const handleBack = () => {
    const minStep = shouldSkipPlanSelection ? educationStep : planSelectionStep;
    if (step > minStep) {
      setStep(step - 1);
    }
  };

  const handleSkipPlanSelection = () => {
    // User chooses free plan - move to next step
    setStep(educationStep);
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

      // Wait for Convex to propagate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Redirect to dashboard
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
    // Plan Selection Step (using Clerk Billing)
    if (!shouldSkipPlanSelection && step === planSelectionStep) {
      return (
        <div className="space-y-6">
          <CardHeader>
            <CardTitle className="text-2xl">Choose Your Plan</CardTitle>
            <CardDescription>
              Select the plan that best fits your career goals. You can upgrade or downgrade at any time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Clerk Billing PricingTable Component */}
            {/* This automatically handles plan display, checkout, and payment */}
            <div className="clerk-pricing-table-wrapper">
              <PricingTable />
            </div>

            {/* Free plan option */}
            <div className="border-t pt-4 mt-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Not ready to subscribe?
                </p>
                <Button
                  variant="outline"
                  onClick={handleSkipPlanSelection}
                >
                  Continue with Free Plan
                </Button>
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
