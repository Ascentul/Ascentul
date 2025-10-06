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
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Convex mutations
  const updateUser = useMutation(api.users.updateUser);

  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [progress, setProgress] = useState<number>(20);
  const [isSavingOnboarding, setIsSavingOnboarding] = useState<boolean>(false);

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(Math.floor((step / 2) * 100)); // 2 steps total
  }, [step]);

  const handleDataChange = (key: keyof OnboardingData, value: string) => {
    setData((prevData) => ({
      ...prevData,
      [key]: value,
    }));
  };

  const handleNext = async () => {
    if (step === 2) {
      const success = await saveOnboardingData();
      if (!success) {
        toast({
          title: "Error saving onboarding data",
          description:
            "There was an error saving your profile information. Please try again.",
          variant: "destructive",
        });
      }
    } else if (step < 2) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
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
    switch (step) {
      case 1:
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
            <CardFooter className="flex justify-end">
              <Button
                onClick={handleNext}
                disabled={!data.major || !data.graduationYear}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        );

      case 2:
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

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {step} of 2
            </p>
          </div>

          <Card className="w-full">{renderStep()}</Card>
        </div>
      </div>
    </div>
  );
}
