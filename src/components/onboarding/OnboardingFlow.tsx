'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/ClerkAuthProvider"
import { useMutation } from "convex/react"
import { api } from "../../../convex/_generated/api"
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
} from "lucide-react"
import StepDiscordInvite from "./StepDiscordInvite"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"

type CareerStage = "student" | "early-career" | "mid-senior"
type StudentType = "undergraduate" | "graduate" | "none"
type JobRole = "team-member" | "manager" | "director" | "executive"

interface OnboardingData {
  careerStage: CareerStage | null
  studentInfo: {
    isCollegeStudent: boolean
    school: string
    graduationYear: string
    isGraduateStudent: StudentType
  }
  professionalInfo: {
    industry: string
    role: JobRole | null
  }
  interests: string[]
  username?: string
}

const defaultOnboardingData: OnboardingData = {
  careerStage: null,
  studentInfo: {
    isCollegeStudent: false,
    school: "",
    graduationYear: "",
    isGraduateStudent: "none"
  },
  professionalInfo: {
    industry: "",
    role: null
  },
  interests: []
}

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
  "Retail", "Media", "Government", "Non-profit", "Construction",
  "Agriculture", "Transportation", "Energy", "Entertainment", "Legal",
  "Consulting", "Marketing", "Real Estate", "Hospitality", "Automotive",
  "Telecommunications", "Other"
]

const features = [
  {
    id: "resume-builder",
    title: "Resume Builder",
    description: "Create and customize professional resumes",
    icon: FileText
  },
  {
    id: "cover-letter",
    title: "Cover Letter Generator", 
    description: "Generate tailored cover letters",
    icon: FileText
  },
  {
    id: "interview-prep",
    title: "Interview Preparation",
    description: "Practice with AI-generated questions",
    icon: BarChart
  },
  {
    id: "goal-tracking",
    title: "Goal Tracking",
    description: "Set and track professional goals",
    icon: Target
  },
  {
    id: "ai-coach",
    title: "AI Career Coach",
    description: "Get personalized career advice",
    icon: MessageSquare
  },
  {
    id: "work-history",
    title: "Work History Tracker",
    description: "Organize your work experience",
    icon: Briefcase
  }
]

export function OnboardingFlow() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  
  // Convex mutations
  const updateUser = useMutation(api.users.updateUser)

  const [step, setStep] = useState<number>(1)
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData)
  const [progress, setProgress] = useState<number>(20)
  const [isSavingOnboarding, setIsSavingOnboarding] = useState<boolean>(false)

  // Update progress bar based on current step
  useEffect(() => {
    setProgress(Math.floor((step / 5) * 100)) // 5 steps total
  }, [step])

  const handleCareerStageSelect = (stage: CareerStage) => {
    if (data.careerStage === stage) return

    setData({
      ...data,
      careerStage: stage,
      studentInfo: stage !== "student" ? defaultOnboardingData.studentInfo : data.studentInfo,
      professionalInfo: stage === "student" ? defaultOnboardingData.professionalInfo : data.professionalInfo
    })

    setStep(2)
  }

  const handleStudentInfoChange = (key: string, value: any) => {
    setData((prevData) => ({
      ...prevData,
      studentInfo: {
        ...prevData.studentInfo,
        [key]: value
      }
    }))
  }

  const handleProfessionalInfoChange = (key: string, value: any) => {
    setData({
      ...data,
      professionalInfo: {
        ...data.professionalInfo,
        [key]: value
      }
    })
  }

  const handleInterestToggle = (featureId: string) => {
    const interests = [...data.interests]
    const index = interests.indexOf(featureId)
    if (index === -1) {
      interests.push(featureId)
    } else {
      interests.splice(index, 1)
    }
    setData({ ...data, interests })
  }

  const handleNext = async () => {
    if (step === 3) {
      setStep(4)
    } else if (step === 4) {
      setStep(5)
    } else if (step === 5) {
      const success = await saveOnboardingData()
      if (!success) {
        toast({
          title: "Error saving onboarding data",
          description: "There was an error saving your profile information. Please try again.",
          variant: "destructive"
        })
      }
    } else if (step < 5) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const saveOnboardingData = async () => {
    if (!user) return false

    try {
      setIsSavingOnboarding(true)

      await updateUser({
        clerkId: user.clerkId,
        updates: {
          onboarding_completed: true
        }
      })

      toast({
        title: "Welcome to Ascentul!",
        description: "Your profile has been set up successfully."
      })

      // Redirect to dashboard
      router.push('/dashboard')
      return true
    } catch (error) {
      console.error("Error saving onboarding data:", error)
      return false
    } finally {
      setIsSavingOnboarding(false)
    }
  }

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
                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.careerStage === "student" ? "border-primary" : ""
                  }`}
                  onClick={() => handleCareerStageSelect("student")}
                >
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

                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.careerStage === "early-career" ? "border-primary" : ""
                  }`}
                  onClick={() => handleCareerStageSelect("early-career")}
                >
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

                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.careerStage === "mid-senior" ? "border-primary" : ""
                  }`}
                  onClick={() => handleCareerStageSelect("mid-senior")}
                >
                  <CardHeader className="text-center pt-6">
                    <div className="mx-auto mb-3 bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center">
                      <Crown className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">Mid-Senior Professional</CardTitle>
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
        )

      case 2:
        return data.careerStage === "student" ? (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Are you a college student, a graduate student, or an intern?</CardTitle>
              <CardDescription>
                This helps us tailor Ascentul to your specific educational journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.studentInfo.isGraduateStudent === "undergraduate" ? "border-primary" : ""
                  }`}
                  onClick={() => {
                    handleStudentInfoChange("isCollegeStudent", true)
                    handleStudentInfoChange("isGraduateStudent", "undergraduate")
                    handleNext()
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

                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.studentInfo.isGraduateStudent === "graduate" ? "border-primary" : ""
                  }`}
                  onClick={() => {
                    handleStudentInfoChange("isCollegeStudent", true)
                    handleStudentInfoChange("isGraduateStudent", "graduate")
                    handleNext()
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

                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.studentInfo.isGraduateStudent === "none" && data.studentInfo.isCollegeStudent ? "border-primary" : ""
                  }`}
                  onClick={() => {
                    handleStudentInfoChange("isCollegeStudent", true)
                    handleStudentInfoChange("isGraduateStudent", "none")
                    handleNext()
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

              {data.studentInfo.isCollegeStudent && (
                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="school">What school do you attend?</Label>
                    <Input
                      id="school"
                      placeholder="Enter your school name"
                      value={data.studentInfo.school}
                      onChange={(e) => handleStudentInfoChange("school", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grad-year">Expected graduation year</Label>
                    <Select
                      value={data.studentInfo.graduationYear}
                      onValueChange={(value) => handleStudentInfoChange("graduationYear", value)}
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
                          new Date().getFullYear() + 5
                        ].map((year) => (
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
            <CardFooter className="flex justify-start">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            </CardFooter>
          </div>
        ) : (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Tell us about your professional background</CardTitle>
              <CardDescription>
                This helps us tailor Ascentul to your specific professional needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">I work in:</Label>
                  <Select
                    value={data.professionalInfo.industry}
                    onValueChange={(value) => handleProfessionalInfoChange("industry", value)}
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
                      className={`cursor-pointer hover:bg-muted/50 ${
                        data.professionalInfo.role === "team-member" ? "border-primary" : ""
                      }`}
                      onClick={() => handleProfessionalInfoChange("role", "team-member")}
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
                      className={`cursor-pointer hover:bg-muted/50 ${
                        data.professionalInfo.role === "manager" ? "border-primary" : ""
                      }`}
                      onClick={() => handleProfessionalInfoChange("role", "manager")}
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
                      className={`cursor-pointer hover:bg-muted/50 ${
                        data.professionalInfo.role === "director" ? "border-primary" : ""
                      }`}
                      onClick={() => handleProfessionalInfoChange("role", "director")}
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
                      className={`cursor-pointer hover:bg-muted/50 ${
                        data.professionalInfo.role === "executive" ? "border-primary" : ""
                      }`}
                      onClick={() => handleProfessionalInfoChange("role", "executive")}
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
        )

      case 3:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Which features are you most interested in?</CardTitle>
              <CardDescription>
                Select the features you're most excited to use in Ascentul.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {features.map((feature) => {
                  const Icon = feature.icon
                  const isSelected = data.interests.includes(feature.id)
                  return (
                    <Card
                      key={feature.id}
                      className={`cursor-pointer ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
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
                        <p className="text-muted-foreground text-sm">{feature.description}</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button onClick={handleNext} disabled={data.interests.length === 0}>
                Join Discord <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <CardContent className="pt-6">
              <StepDiscordInvite onNext={handleNext} onSkip={handleNext} />
            </CardContent>
          </div>
        )

      case 5:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Choose your plan</CardTitle>
              <CardDescription>
                Select the plan that best fits your needs and goals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-md p-6 hover:shadow-md transition-shadow">
                  <h3 className="text-lg font-semibold mb-1">Free Plan</h3>
                  <p className="text-sm text-muted-foreground mb-4">Basic features for personal use</p>
                  <p className="text-3xl font-bold mb-4">
                    $0<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Basic career tracking</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Limited AI suggestions</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Job application tracker</span>
                    </li>
                  </ul>
                  <Button
                    onClick={async () => {
                      const success = await saveOnboardingData()
                      if (success) {
                        router.push('/dashboard')
                      }
                    }}
                    variant="outline"
                    className="w-full"
                    disabled={isSavingOnboarding}
                  >
                    {isSavingOnboarding ? "Saving..." : "Get Started"}
                  </Button>
                </div>

                <div className="border border-primary rounded-md p-6 bg-primary/5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-lg font-semibold">Pro Plan</h3>
                    <span className="bg-[#1333c2] text-white text-xs px-2 py-1 rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Advanced features for career growth</p>
                  <p className="text-3xl font-bold mb-4">
                    $9.99<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Everything in Free plan</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Unlimited AI career suggestions</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Advanced network management</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Priority support</span>
                    </li>
                  </ul>
                  <Button
                    onClick={async () => {
                      const success = await saveOnboardingData()
                      if (success) {
                        router.push('/dashboard')
                      }
                    }}
                    className="w-full"
                    disabled={isSavingOnboarding}
                  >
                    {isSavingOnboarding ? "Saving..." : "Choose Pro Plan"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Step {step} of 5
            </p>
          </div>

          <Card className="w-full">
            {renderStep()}
          </Card>
        </div>
      </div>
    </div>
  )
}
