import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { 
  ChevronRight, 
  ChevronLeft, 
  Briefcase,
  GraduationCap,
  Target,
  BarChart,
  FileText,
  MessageSquare,
  Check,
  AlertCircle,
  Loader2,
  Users,
  UserCog,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";

type CareerStage = 'student' | 'early-career' | 'mid-senior';
type StudentType = 'undergraduate' | 'graduate' | 'none';
type JobRole = 'team-member' | 'manager' | 'director' | 'executive';

interface OnboardingData {
  careerStage: CareerStage | null;
  studentInfo: {
    isCollegeStudent: boolean;
    school: string;
    graduationYear: string;
    isGraduateStudent: StudentType;
  };
  professionalInfo: {
    industry: string;
    role: JobRole | null;
  };
  interests: string[];
  username?: string;
}

const defaultOnboardingData: OnboardingData = {
  careerStage: null,
  studentInfo: {
    isCollegeStudent: false,
    school: '',
    graduationYear: '',
    isGraduateStudent: 'none',
  },
  professionalInfo: {
    industry: '',
    role: null,
  },
  interests: [],
};

const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Media',
  'Government',
  'Non-profit',
  'Construction',
  'Agriculture',
  'Transportation',
  'Energy',
  'Entertainment',
  'Legal',
  'Consulting',
  'Marketing',
  'Real Estate',
  'Hospitality',
  'Automotive',
  'Telecommunications',
  'Other'
];

const features = [
  { 
    id: 'resume-builder', 
    title: 'Resume Builder', 
    description: 'Create and customize professional resumes', 
    icon: FileText 
  },
  { 
    id: 'cover-letter', 
    title: 'Cover Letter Generator', 
    description: 'Generate tailored cover letters', 
    icon: FileText 
  },
  { 
    id: 'interview-prep', 
    title: 'Interview Preparation', 
    description: 'Practice with AI-generated questions', 
    icon: BarChart 
  },
  { 
    id: 'goal-tracking', 
    title: 'Goal Tracking', 
    description: 'Set and track professional goals', 
    icon: Target 
  },
  { 
    id: 'ai-coach', 
    title: 'AI Career Coach', 
    description: 'Get personalized career advice', 
    icon: MessageSquare 
  },
  { 
    id: 'work-history', 
    title: 'Work History Tracker', 
    description: 'Organize your work experience', 
    icon: Briefcase 
  }
];

export default function OnboardingFlow() {
  const { user } = useUser();
  const [, setLocation] = useLocation();
  
  // If the user needs to set a username, we start at step 0 (username selection)
  // Otherwise, start at step 1 (career stage)
  const needsUsername = user?.needsUsername || false;
  const [step, setStep] = useState<number>(needsUsername ? 0 : 1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [progress, setProgress] = useState<number>(needsUsername ? 15 : 25);
  
  // Username state
  const [username, setUsername] = useState<string>('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameChecking, setUsernameChecking] = useState<boolean>(false);
  const [usernameError, setUsernameError] = useState<string>('');
  const { toast } = useToast();

  // Update progress bar based on current step and check if user needs to set username
  useEffect(() => {
    // We don't need to check user data here anymore as we get it from useUser() hook
    // The useEffect is only needed for updating progress bar
    
    // If the user needs to set a username, we'll add a step (so 4 steps total)
    if (needsUsername) {
      setProgress(step * 25);
    } else {
      setProgress(step * 33.33);
    }
  }, [step, needsUsername]);

  const handleCareerStageSelect = (stage: CareerStage) => {
    setData({ ...data, careerStage: stage });
    setStep(2);
  };

  const handleStudentInfoChange = (key: string, value: any) => {
    setData({
      ...data,
      studentInfo: {
        ...data.studentInfo,
        [key]: value,
      },
    });
  };

  const handleProfessionalInfoChange = (key: string, value: any) => {
    setData({
      ...data,
      professionalInfo: {
        ...data.professionalInfo,
        [key]: value,
      },
    });
  };

  const handleInterestToggle = (featureId: string) => {
    const interests = [...data.interests];
    const index = interests.indexOf(featureId);
    
    if (index === -1) {
      interests.push(featureId);
    } else {
      interests.splice(index, 1);
    }
    
    setData({ ...data, interests });
  };

  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters long');
      setUsernameAvailable(false);
      return;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      setUsernameAvailable(false);
      return;
    }
    
    setUsernameChecking(true);
    setUsernameError('');
    
    try {
      const response = await fetch(`/api/users/check-username?username=${username}`);
      const data = await response.json();
      
      if (response.ok) {
        setUsernameAvailable(data.available);
        if (!data.available) {
          setUsernameError('This username is already taken');
        }
      } else {
        setUsernameError(data.message || 'Error checking username');
        setUsernameAvailable(false);
      }
    } catch (error) {
      console.error('Error checking username:', error);
      setUsernameError('Error checking username availability');
      setUsernameAvailable(false);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Update username
  const updateUsername = async () => {
    if (!username || !usernameAvailable) return;
    
    try {
      const response = await fetch('/api/users/update-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to update username');
      }
      
      // Set username in onboarding data
      setData({ ...data, username });
      
      // Username is set, proceed with career stage selection
      setStep(1);
      
      toast({
        title: "Username set successfully",
        description: `You'll be known as @${username} on CareerTracker.io`,
      });
    } catch (error) {
      console.error('Error updating username:', error);
      
      toast({
        title: "Failed to set username",
        description: error instanceof Error ? error.message : 'Please try a different username',
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    if (needsUsername && step === 0) {
      // If username is needed, we handle it separately
      updateUsername();
    } else if (step === 3) {
      // When we're on the final step (interests selection)
      // Save onboarding data to user profile
      saveOnboardingData();
      
      // Navigate to plan selection page after all steps are completed
      setLocation('/plan-selection');
      console.log('Navigating to /plan-selection');
    } else if ((needsUsername && step < 4) || (!needsUsername && step < 3)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > (needsUsername ? 0 : 1)) {
      setStep(step - 1);
    }
  };

  const saveOnboardingData = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          onboardingCompleted: true,
          onboardingData: data,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save onboarding data');
      }
      
      console.log('Onboarding data saved successfully');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        // This is only shown if the user needs to set a username
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Create your username</CardTitle>
              <CardDescription>
                Choose a unique username that will identify you on CareerTracker.io.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <Input
                      id="username"
                      placeholder="e.g., johndoe, career_pro"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (e.target.value.length >= 3) {
                          checkUsernameAvailability(e.target.value);
                        } else {
                          setUsernameAvailable(null);
                        }
                      }}
                      className={`pr-10 ${
                        usernameAvailable === true
                          ? 'border-green-500 focus-visible:ring-green-500'
                          : usernameAvailable === false
                          ? 'border-red-500 focus-visible:ring-red-500'
                          : ''
                      }`}
                    />
                    {usernameChecking && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3 text-muted-foreground" />
                    )}
                    {!usernameChecking && usernameAvailable === true && (
                      <Check className="h-4 w-4 absolute right-3 top-3 text-green-500" />
                    )}
                    {!usernameChecking && usernameAvailable === false && (
                      <AlertCircle className="h-4 w-4 absolute right-3 top-3 text-red-500" />
                    )}
                  </div>
                  {usernameError && (
                    <p className="text-sm text-red-500 mt-1">{usernameError}</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-sm text-green-500 mt-1">Username is available!</p>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Username requirements:</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center ${username.length >= 3 ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                        {username.length >= 3 && <Check className="h-3 w-3 text-white" />}
                      </div>
                      At least 3 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center ${/^[a-zA-Z0-9_]+$/.test(username) ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                        {/^[a-zA-Z0-9_]+$/.test(username) && <Check className="h-3 w-3 text-white" />}
                      </div>
                      Only letters, numbers, and underscores
                    </li>
                    <li className="flex items-center gap-2">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center ${usernameAvailable === true ? 'bg-green-500' : 'bg-muted-foreground/30'}`}>
                        {usernameAvailable === true && <Check className="h-3 w-3 text-white" />}
                      </div>
                      Unique and available
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleNext} 
                disabled={!usernameAvailable || username.length < 3}
                className="w-full"
              >
                Continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Where are you in your career?</CardTitle>
              <CardDescription>
                Help us personalize your experience by telling us about your current situation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`cursor-pointer hover:bg-muted/50 ${data.careerStage === 'student' ? 'border-primary' : ''}`} onClick={() => handleCareerStageSelect('student')}>
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Student</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      Current undergraduate or graduate student
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer hover:bg-muted/50 ${data.careerStage === 'early-career' ? 'border-primary' : ''}`} onClick={() => handleCareerStageSelect('early-career')}>
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Early-Career Professional</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      0-5 years of professional experience
                    </p>
                  </CardContent>
                </Card>
                
                <Card className={`cursor-pointer hover:bg-muted/50 ${data.careerStage === 'mid-senior' ? 'border-primary' : ''}`} onClick={() => handleCareerStageSelect('mid-senior')}>
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Mid-to-Senior Career Professional</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      5+ years of professional experience
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </div>
        );
      
      case 2:
        return data.careerStage === 'student' ? (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Are you a college student, a graduate student, or an intern?</CardTitle>
              <CardDescription>
                This helps us tailor CareerTracker.io to your specific educational journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Undergraduate Option */}
                <Card 
                  className={`cursor-pointer hover:bg-muted/50 ${data.studentInfo.isGraduateStudent === 'undergraduate' ? 'border-primary' : ''}`} 
                  onClick={() => {
                    handleStudentInfoChange('isCollegeStudent', true);
                    handleStudentInfoChange('isGraduateStudent', 'undergraduate');
                  }}
                >
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">College Student</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      Currently pursuing a bachelor's degree
                    </p>
                  </CardContent>
                </Card>
                
                {/* Graduate Student Option */}
                <Card 
                  className={`cursor-pointer hover:bg-muted/50 ${data.studentInfo.isGraduateStudent === 'graduate' ? 'border-primary' : ''}`} 
                  onClick={() => {
                    handleStudentInfoChange('isCollegeStudent', true);
                    handleStudentInfoChange('isGraduateStudent', 'graduate');
                  }}
                >
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Graduate Student</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      Currently pursuing a master's or doctorate degree
                    </p>
                  </CardContent>
                </Card>
                
                {/* Intern Option */}
                <Card 
                  className={`cursor-pointer hover:bg-muted/50 ${data.studentInfo.isGraduateStudent === 'none' && data.studentInfo.isCollegeStudent ? 'border-primary' : ''}`} 
                  onClick={() => {
                    handleStudentInfoChange('isCollegeStudent', true);
                    handleStudentInfoChange('isGraduateStudent', 'none');
                  }}
                >
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <Briefcase className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Intern</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-center text-muted-foreground text-sm">
                      Currently in an internship program
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Optional additional details if a student type is selected */}
              {data.studentInfo.isCollegeStudent && (
                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="school">What school do you attend?</Label>
                    <Input 
                      id="school" 
                      placeholder="Enter your school name" 
                      value={data.studentInfo.school}
                      onChange={(e) => handleStudentInfoChange('school', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grad-year">Expected graduation year</Label>
                    <Select 
                      value={data.studentInfo.graduationYear} 
                      onValueChange={(value) => handleStudentInfoChange('graduationYear', value)}
                    >
                      <SelectTrigger id="grad-year">
                        <SelectValue placeholder="Select graduation year" />
                      </SelectTrigger>
                      <SelectContent>
                        {[new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2, new Date().getFullYear() + 3, new Date().getFullYear() + 4, new Date().getFullYear() + 5].map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        ) : (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Tell us about your professional background</CardTitle>
              <CardDescription>
                This helps us tailor CareerTracker.io to your specific professional needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">I work in:</Label>
                  <Select 
                    value={data.professionalInfo.industry} 
                    onValueChange={(value) => handleProfessionalInfoChange('industry', value)}
                  >
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>My role is:</Label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                    <Card 
                      className={`cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === 'team-member' ? 'border-primary' : ''}`} 
                      onClick={() => handleProfessionalInfoChange('role', 'team-member')}
                    >
                      <CardHeader className="text-center pt-6">
                        <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Team Member</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-muted-foreground text-sm">
                          Individual contributor
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === 'manager' ? 'border-primary' : ''}`} 
                      onClick={() => handleProfessionalInfoChange('role', 'manager')}
                    >
                      <CardHeader className="text-center pt-6">
                        <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                          <UserCog className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Manager</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-muted-foreground text-sm">
                          Team or project manager
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === 'director' ? 'border-primary' : ''}`} 
                      onClick={() => handleProfessionalInfoChange('role', 'director')}
                    >
                      <CardHeader className="text-center pt-6">
                        <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                          <Briefcase className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">Director</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-muted-foreground text-sm">
                          Department or division head
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer hover:bg-muted/50 ${data.professionalInfo.role === 'executive' ? 'border-primary' : ''}`} 
                      onClick={() => handleProfessionalInfoChange('role', 'executive')}
                    >
                      <CardHeader className="text-center pt-6">
                        <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                          <Crown className="h-6 w-6 text-primary" />
                        </div>
                        <CardTitle className="text-lg">CEO or Owner</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-center text-muted-foreground text-sm">
                          Executive leadership
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={!data.professionalInfo.industry || !data.professionalInfo.role}
              >
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Which features are you most interested in?</CardTitle>
              <CardDescription>
                Select the features you're most excited to use in CareerTracker.io.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  const isSelected = data.interests.includes(feature.id);
                  
                  return (
                    <Card 
                      key={feature.id}
                      className={`cursor-pointer ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'}`}
                      onClick={() => handleInterestToggle(feature.id)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <Checkbox checked={isSelected} />
                        </div>
                        <CardTitle className="text-base mt-2">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                onClick={handleNext}
                disabled={data.interests.length === 0}
              >
                Choose a Plan <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2">Welcome to CareerTracker.io</h1>
          <p className="text-muted-foreground">
            Help us personalize your experience with a few questions
          </p>
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>Step {step} of 3</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <Card className="w-full bg-card">
          {renderStep()}
        </Card>
      </div>
    </div>
  );
}