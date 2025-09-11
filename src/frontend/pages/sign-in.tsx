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
import { Loader2, Mail, Lock, School, User } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import supabaseClient from "@/lib/supabase-auth"

export default function SignInPage() {
  const [, setLocation] = useLocation()
  const { user, login, isLoading } = useUser()
  const { toast } = useToast()

  // Form state for login
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isLoginLoading, setIsLoginLoading] = useState(false)
  const [loginType, setLoginType] = useState<"regular" | "university">(
    "regular"
  )

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoginLoading(true)

    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem("auth-logout")

      // Use Supabase auth to sign in
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword
      })

      if (error) {
        throw new Error(error.message || "Login failed")
      }

      // Fetch user profile from the database to determine redirect
      const { data: userData, error: userError } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", loginEmail)
        .single()

      if (userError) {
        console.error("Error fetching user data after login:", userError)
        // Continue anyway as auth was successful
      }

      toast({
        title: "Login successful!",
        description: "You have been logged in successfully."
      })

      // Determine redirect path based on user type
      const redirectPath =
        userData?.user_type === "university_student" ||
        userData?.user_type === "university_admin"
          ? "/university"
          : userData?.onboarding_completed
          ? "/dashboard"
          : "/onboarding"

      // Redirect to the appropriate page

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
