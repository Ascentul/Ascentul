import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { 
  ChevronRight, 
  ChevronLeft, 
  Briefcase,
  GraduationCap,
  Target,
  BarChart,
  FileText,
  MessageSquare 
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
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<number>(1);
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData);
  const [progress, setProgress] = useState<number>(25);

  // Update progress bar based on current step (now 3 steps instead of 4)
  useEffect(() => {
    setProgress(step * 33.33);
  }, [step]);

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

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Save onboarding data to user profile
      saveOnboardingData();
      
      // Navigate to plan selection page after step 3
      setLocation('/plan-selection');
    }
  };

  const handleBack = () => {
    if (step > 1) {
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
                  <RadioGroup 
                    value={data.professionalInfo.role || ''} 
                    onValueChange={(value: JobRole) => handleProfessionalInfoChange('role', value)}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="team-member" id="team-member" />
                      <Label htmlFor="team-member">Team member</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="manager" id="manager" />
                      <Label htmlFor="manager">Manager</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="director" id="director" />
                      <Label htmlFor="director">Director</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="executive" id="executive" />
                      <Label htmlFor="executive">CEO or Owner</Label>
                    </div>
                  </RadioGroup>
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