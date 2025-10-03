'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/ClerkAuthProvider"
import { useMutation } from "convex/react"
import { api } from "convex/_generated/api"
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
  }
}

const industries = [
  "Technology", "Healthcare", "Finance", "Education", "Manufacturing",
  "Retail", "Media", "Government", "Non-profit", "Construction",
  "Agriculture", "Transportation", "Energy", "Entertainment", "Legal",
  "Consulting", "Marketing", "Real Estate", "Hospitality", "Automotive",
  "Telecommunications", "Other"
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
    setProgress(Math.floor((step / 2) * 100)) // 2 steps total
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


  const handleNext = async () => {
    if (step === 2) {
      const success = await saveOnboardingData()
      if (!success) {
        toast({
          title: "Error saving onboarding data",
          description: "There was an error saving your profile information. Please try again.",
          variant: "destructive"
        })
      }
    } else if (step < 2) {
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
        title: "Welcome to Ascentful!",
        description: "Your profile has been set up successfully.",
        variant: 'success'
      })

      // Wait for Convex to propagate the update before redirecting
      await new Promise(resolve => setTimeout(resolve, 500))

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
                This helps us tailor Ascentful to your specific educational journey.
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
                    setStep(2)
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
                    setStep(2)
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
                    setStep(2)
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
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button
                onClick={async () => {
                  const success = await saveOnboardingData()
                  if (success) {
                    router.push('/dashboard')
                  }
                }}
                disabled={isSavingOnboarding || !data.studentInfo.school || !data.studentInfo.graduationYear}
                className="min-w-[140px]"
              >
                {isSavingOnboarding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
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
                onClick={async () => {
                  const success = await saveOnboardingData()
                  if (success) {
                    router.push('/dashboard')
                  }
                }}
                disabled={isSavingOnboarding || !data.professionalInfo.industry || !data.professionalInfo.role}
                className="min-w-[140px]"
              >
                {isSavingOnboarding ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up...
                  </>
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </CardFooter>
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
              Step {step} of 2
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
