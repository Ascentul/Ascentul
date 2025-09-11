import React, { useState, useEffect } from "react"
import { useLocation, useRoute } from "wouter"
import { useUser } from "@/lib/useUserData"
import { apiRequest } from "@/lib/queryClient"
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
import StepDiscordInvite from "./onboarding/StepDiscordInvite"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/hooks/use-toast"
import { queryClient } from "@/lib/queryClient"

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
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Media",
  "Government",
  "Non-profit",
  "Construction",
  "Agriculture",
  "Transportation",
  "Energy",
  "Entertainment",
  "Legal",
  "Consulting",
  "Marketing",
  "Real Estate",
  "Hospitality",
  "Automotive",
  "Telecommunications",
  "Other"
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

export default function OnboardingFlow() {
  const { user, isLoading, refetchUser } = useUser()
  const [, setLocation] = useLocation()

  // Check if user is authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      // Redirect to sign in if not authenticated
      setLocation("/sign-in")
    }
  }, [user, isLoading, setLocation])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // If no user after loading is complete, show a message (this is a fallback)
  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Redirecting to sign in...
      </div>
    )
  }

  // If the user needs to set a username, we start at step 0 (username selection)
  // Otherwise, start at step 1 (career stage)
  const needsUsername = user?.needsUsername || false
  const [step, setStep] = useState<number>(needsUsername ? 0 : 1)
  const [data, setData] = useState<OnboardingData>(defaultOnboardingData)
  const [progress, setProgress] = useState<number>(needsUsername ? 15 : 25)

  // Username state
  const [username, setUsername] = useState<string>("")
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  )
  const [usernameChecking, setUsernameChecking] = useState<boolean>(false)
  const [usernameError, setUsernameError] = useState<string>("")
  const [isSavingOnboarding, setIsSavingOnboarding] = useState<boolean>(false)
  const { toast } = useToast()

  // Update progress bar based on current step and check if user needs to set username
  useEffect(() => {
    // We don't need to check user data here anymore as we get it from useUser() hook
    // The useEffect is only needed for updating progress bar

    // If the user needs to set a username, we'll add a step (so 5 steps total including Discord)
    // Without username: 5 steps total [career, details, interests, discord, plan]
    if (needsUsername) {
      setProgress(Math.floor((step / 6) * 100)) // 6 steps total (0, 1, 2, 3, 4, 5)
    } else {
      setProgress(Math.floor((step / 5) * 100)) // 5 steps total (1, 2, 3, 4, 5)
    }
  }, [step, needsUsername])

  const handleCareerStageSelect = (stage: CareerStage) => {
    // If selecting the same career stage again, do nothing
    if (data.careerStage === stage) {
      return
    }

    // Update the career stage
    setData({
      ...data,
      careerStage: stage,
      // Reset relevant stage-specific data when changing career stage
      studentInfo:
        stage !== "student"
          ? defaultOnboardingData.studentInfo
          : data.studentInfo,
      professionalInfo:
        stage === "student"
          ? defaultOnboardingData.professionalInfo
          : data.professionalInfo
    })

    // Move to step 2
    setStep(2)
  }

  const handleStudentInfoChange = (key: string, value: any) => {

}
