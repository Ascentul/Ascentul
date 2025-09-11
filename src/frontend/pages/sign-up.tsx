import { useState } from "react"
import { useLocation, Link } from "wouter"
import { useUser } from "@/lib/useUserData"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Loader2, Mail, Lock, User, UserCircle, School } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import supabaseClient from "@/lib/supabase-auth"

export default function SignUpPage() {
  const [, setLocation] = useLocation()
  const { user, login, isLoading } = useUser()
  const { toast } = useToast()

  // Form state for registration
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [isRegisterLoading, setIsRegisterLoading] = useState(false)
  const [accountType, setAccountType] = useState<"regular" | "university">(
    "regular"
  )
  const [universityName, setUniversityName] = useState("")
  const [studentId, setStudentId] = useState("")

  // Redirect if user is already logged in
  if (user) {
    if (user.userType === "regular") {
      setLocation("/dashboard")
    } else if (
      user.userType === "university_student" ||
      user.userType === "university_admin"
    ) {
      setLocation("/university")
    } else if (user.userType === "admin" || user.userType === "staff") {
      setLocation("/admin")
    } else {
      setLocation("/dashboard")
    }
    return null
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsRegisterLoading(true)

    try {
      // Step 1: Sign up with Supabase Auth
      const { data: authData, error: authError } =
        await supabaseClient.auth.signUp({
          email: registerEmail,
          password: registerPassword,
          options: {
            data: {
              name: registerName,
              userType:
                accountType === "university" ? "university_student" : "regular",
              xp: 0,
              level: 1,
              rank: "Beginner",
              onboardingCompleted: false,
              universityName:
                accountType === "university" ? universityName : undefined,
              studentId: accountType === "university" ? studentId : undefined
            }
          }
        })

      // If there's an auth error, throw it
      if (authError) {
        throw new Error(authError.message || "Registration failed")
      }

      // Step 2: Create or update user record in the database
      // This will be synchronized with the auth user through Supabase's RLS policies
      const userData = {
        id: authData.user?.id,
        username: `user_${authData.user?.id?.slice(0, 8)}`, // Temporary username
        email: registerEmail,
        name: registerName,
        password: "supabase-auth", // Placeholder as we're using Supabase Auth
        user_type:
          accountType === "university" ? "university_student" : "regular",
        needs_username: true,
        onboarding_completed: false,
        xp: 0,
        level: 1,
        rank: "Beginner",
        subscription_status: "inactive",
        subscription_plan: accountType === "university" ? "university" : "free"
      }

      // Add university-specific fields if applicable
      if (accountType === "university") {
        userData.university_name = universityName
        userData.student_id = studentId
      }

      const { data: newUserData, error: userError } = await supabaseClient
        .from("users")
        .upsert(userData)
        .select()
        .single()

      if (userError) {
        // If user table insert fails, we should clean up the auth user
        console.error("Error creating user record:", userError)
        throw new Error(userError.message || "Error completing registration")
      }

      toast({
        title: "Registration successful!",
        description: `Your ${
          accountType === "university" ? "university" : "regular"
        } account has been created and you are now logged in.`
      })

      // University users should go to standard onboarding for now, then to university dashboard
      // TODO: Create dedicated university onboarding flow
      const redirectPath = "/onboarding"

}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-primary-foreground">{text}</div>
    </div>
  )
}
