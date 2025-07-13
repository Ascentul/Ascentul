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
    console.log(`handleStudentInfoChange: Setting ${key} to ${value}`)
    setData((prevData) => {
      const newData = {
        ...prevData,
        studentInfo: {
          ...prevData.studentInfo,
          [key]: value
        }
      }
      console.log("Updated student info:", newData.studentInfo)
      return newData
    })
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

  // Check if username is available
  const checkUsernameAvailability = async (username: string) => {
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters long")
      setUsernameAvailable(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError(
        "Username can only contain letters, numbers, and underscores"
      )
      setUsernameAvailable(false)
      return
    }

    setUsernameChecking(true)
    setUsernameError("")

    try {
      // Use apiRequest from queryClient for consistency with the rest of the app
      const response = await apiRequest(
        "GET",
        `/api/users/check-username?username=${username}`
      )
      const data = await response.json()

      if (response.ok) {
        setUsernameAvailable(data.available)
        if (!data.available) {
          setUsernameError("This username is already taken")
        }
      } else {
        setUsernameError(data.message || "Error checking username")
        setUsernameAvailable(false)
      }
    } catch (error) {
      console.error("Error checking username:", error)
      setUsernameError("Error checking username availability")
      setUsernameAvailable(false)
    } finally {
      setUsernameChecking(false)
    }
  }

  // Update username
  const updateUsername = async () => {
    if (!username || !usernameAvailable) return

    try {
      // Use apiRequest from queryClient for consistency with the rest of the app
      const response = await apiRequest("POST", "/api/users/update-username", {
        username
      })

      if (!response.ok) {
        const responseData = await response.json()
        throw new Error(responseData.message || "Failed to update username")
      }

      // Set username in onboarding data (fix: use the correct data state, not the API response)
      setData((prevData) => ({ ...prevData, username }))

      // Username is set, proceed with career stage selection
      setStep(1)

      toast({
        title: "Username set successfully",
        description: `You'll be known as @${username} on CareerTracker.io`
      })

      return true
    } catch (error) {
      console.error("Error updating username:", error)

      toast({
        title: "Failed to set username",
        description:
          error instanceof Error
            ? error.message
            : "Please try a different username",
        variant: "destructive"
      })

      return false
    }
  }

  const handleNext = async () => {
    if (needsUsername && step === 0) {
      // If username is needed, we handle it separately
      await updateUsername()
    } else if (step === 3) {
      // After interests selection, move to Discord invite
      setStep(4)
    } else if (step === 4) {
      // After Discord invite step, just proceed to plan selection step
      setStep(5)
    } else if (step === 5) {
      // When we're on the final step (Plan Selection)
      // Save onboarding data to user profile and wait for it to complete
      const success = await saveOnboardingData()

      if (success) {
        // We don't need to navigate anywhere here since step 5 is already
        // the plan selection step which is displayed in the component
        console.log("Successfully saved onboarding data")
      } else {
        // Show error toast if saving failed
        toast({
          title: "Error saving onboarding data",
          description:
            "There was an error saving your profile information. Please try again.",
          variant: "destructive"
        })
      }
    } else if ((needsUsername && step < 6) || (!needsUsername && step < 5)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > (needsUsername ? 0 : 1)) {
      setStep(step - 1)
    }
  }

  const saveOnboardingData = async () => {
    try {
      setIsSavingOnboarding(true)

      console.log("=== SAVING ONBOARDING DATA ===")
      console.log("Current data state:", JSON.stringify(data, null, 2))
      console.log("User type:", user?.userType)
      console.log("Student info:", data.studentInfo)

      // Use apiRequest from queryClient for consistency with the rest of the app
      const response = await apiRequest("PUT", "/api/users/profile", {
        onboardingCompleted: true,
        onboardingData: data
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error("Server response error:", errorData)
        throw new Error(errorData.message || "Failed to save onboarding data")
      }

      console.log("Onboarding data saved successfully")

      // Clear the cache to force a fresh fetch
      console.log("Clearing user cache and forcing refetch...")
      queryClient.removeQueries({ queryKey: ["/api/users/me"] })
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] })

      // Refresh user data to ensure the UI and route guards see the updated data
      const updatedUser = await refetchUser()

      console.log("Updated user data after refetch:", {
        onboardingCompleted: updatedUser?.onboardingCompleted,
        userType: updatedUser?.userType,
        needsUsername: updatedUser?.needsUsername
      })

      // Wait a bit more to ensure the cache is properly updated
      await new Promise((resolve) => setTimeout(resolve, 500))

      return true
    } catch (error) {
      console.error("Error saving onboarding data:", error)
      toast({
        title: "Error saving profile data",
        description:
          error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSavingOnboarding(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        // This is only shown if the user needs to set a username
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">Create your username</CardTitle>
              <CardDescription>
                Choose a unique username that will identify you on
                CareerTracker.io.
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
                        setUsername(e.target.value)
                        if (e.target.value.length >= 3) {
                          checkUsernameAvailability(e.target.value)
                        } else {
                          setUsernameAvailable(null)
                        }
                      }}
                      className={`pr-10 ${
                        usernameAvailable === true
                          ? "border-green-500 focus-visible:ring-green-500"
                          : usernameAvailable === false
                          ? "border-red-500 focus-visible:ring-red-500"
                          : ""
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
                    <p className="text-sm text-green-500 mt-1">
                      Username is available!
                    </p>
                  )}
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">
                    Username requirements:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          username.length >= 3
                            ? "bg-green-500"
                            : "bg-muted-foreground/30"
                        }`}
                      >
                        {username.length >= 3 && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      At least 3 characters long
                    </li>
                    <li className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          /^[a-zA-Z0-9_]+$/.test(username)
                            ? "bg-green-500"
                            : "bg-muted-foreground/30"
                        }`}
                      >
                        {/^[a-zA-Z0-9_]+$/.test(username) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      Only letters, numbers, and underscores
                    </li>
                    <li className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center ${
                          usernameAvailable === true
                            ? "bg-green-500"
                            : "bg-muted-foreground/30"
                        }`}
                      >
                        {usernameAvailable === true && (
                          <Check className="h-3 w-3 text-white" />
                        )}
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
        )

      case 1:
        return (
          <div className="space-y-6">
            <CardHeader>
              <CardTitle className="text-2xl">
                Where are you in your career?
              </CardTitle>
              <CardDescription>
                Help us personalize your experience by telling us about your
                current situation.
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
                    <CardTitle className="text-lg">
                      Early-Career Professional
                    </CardTitle>
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
                      <Target className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-lg">
                      Mid-to-Senior Career Professional
                    </CardTitle>
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
              <CardTitle className="text-2xl">
                Are you a college student, a graduate student, or an intern?
              </CardTitle>
              <CardDescription>
                This helps us tailor Ascentul to your specific educational journey.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Undergraduate Option */}
                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.studentInfo.isGraduateStudent === "undergraduate"
                      ? "border-primary"
                      : ""
                  }`}
                  onClick={() => {
                    handleStudentInfoChange("isCollegeStudent", true)
                    handleStudentInfoChange(
                      "isGraduateStudent",
                      "undergraduate"
                    )
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

                {/* Graduate Student Option */}
                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.studentInfo.isGraduateStudent === "graduate"
                      ? "border-primary"
                      : ""
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

                {/* Intern Option */}
                <Card
                  className={`cursor-pointer hover:bg-muted/50 ${
                    data.studentInfo.isGraduateStudent === "none" &&
                    data.studentInfo.isCollegeStudent
                      ? "border-primary"
                      : ""
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

              {/* Optional additional details if a student type is selected */}
              {data.studentInfo.isCollegeStudent && (
                <div className="mt-6 space-y-4 p-4 border rounded-lg bg-muted/20">
                  <div className="space-y-2">
                    <Label htmlFor="school">What school do you attend?</Label>
                    <Input
                      id="school"
                      placeholder="Enter your school name"
                      value={data.studentInfo.school}
                      onChange={(e) =>
                        handleStudentInfoChange("school", e.target.value)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grad-year">Expected graduation year</Label>
                    <Select
                      value={data.studentInfo.graduationYear}
                      onValueChange={(value) =>
                        handleStudentInfoChange("graduationYear", value)
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
              <CardTitle className="text-2xl">
                Tell us about your professional background
              </CardTitle>
              <CardDescription>
                This helps us tailor CareerTracker.io to your specific
                professional needs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">I work in:</Label>
                  <Select
                    value={data.professionalInfo.industry}
                    onValueChange={(value) =>
                      handleProfessionalInfoChange("industry", value)
                    }
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
                        data.professionalInfo.role === "team-member"
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() =>
                        handleProfessionalInfoChange("role", "team-member")
                      }
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
                        data.professionalInfo.role === "manager"
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() =>
                        handleProfessionalInfoChange("role", "manager")
                      }
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
                        data.professionalInfo.role === "director"
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() =>
                        handleProfessionalInfoChange("role", "director")
                      }
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
                        data.professionalInfo.role === "executive"
                          ? "border-primary"
                          : ""
                      }`}
                      onClick={() =>
                        handleProfessionalInfoChange("role", "executive")
                      }
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
                disabled={
                  !data.professionalInfo.industry || !data.professionalInfo.role
                }
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
              <CardTitle className="text-2xl">
                Which features are you most interested in?
              </CardTitle>
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
                        isSelected
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
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
                        <CardTitle className="text-base mt-2">
                          {feature.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground text-sm">
                          {feature.description}
                        </p>
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
              <Button
                onClick={handleNext}
                disabled={data.interests.length === 0}
              >
                Join Discord <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </div>
        )

      case 4:
        // Discord invite step
        return (
          <div className="space-y-6">
            <CardContent className="pt-6">
              <StepDiscordInvite onNext={handleNext} onSkip={handleNext} />
            </CardContent>
          </div>
        )

      case 5:
        // Plan selection step
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
                  <p className="text-sm text-muted-foreground mb-4">
                    Basic features for personal use
                  </p>
                  <p className="text-3xl font-bold mb-4">
                    $0
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
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
                        // Redirect based on user type using React Router navigation
                        const redirectUrl =
                          user?.userType === "university_student"
                            ? "/university"
                            : "/dashboard"
                        console.log(`Redirecting to: ${redirectUrl}`)
                        setLocation(redirectUrl)
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
                  <p className="text-sm text-muted-foreground mb-4">
                    Advanced features for career growth
                  </p>
                  <p className="text-3xl font-bold mb-4">
                    $9.99
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </p>
                  <ul className="space-y-2 mb-6">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">Everything in Free plan</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">
                        Unlimited AI career suggestions
                      </span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      <span className="text-sm">
                        Advanced network management
                      </span>
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
                        // Redirect based on user type using React Router navigation
                        const redirectUrl =
                          user?.userType === "university_student"
                            ? "/university"
                            : "/dashboard"
                        console.log(`Redirecting to: ${redirectUrl}`)
                        setLocation(redirectUrl)
                      }
                    }}
                    className="w-full bg-[#1333c2] hover:bg-[#0f2aae]"
                    disabled={isSavingOnboarding}
                  >
                    {isSavingOnboarding ? "Saving..." : "Start Pro Plan"}
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
    <div className="min-h-screen bg-muted/30 py-10">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold mb-2 text-[#0C29AB]">
            Welcome to Ascentul
          </h1>
          <p className="text-muted-foreground">
            Help us personalize your experience with a few questions
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span>
              Step {step} of {needsUsername ? "6" : "5"}
            </span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card className="w-full bg-card">{renderStep()}</Card>
      </div>
    </div>
  )
}
