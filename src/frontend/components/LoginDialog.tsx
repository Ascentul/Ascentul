import { useState, useEffect } from "react"
import { useUser } from "@/lib/useUserData"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  initialTab?: "login" | "signup"
}

export default function LoginDialog({
  open,
  onOpenChange,
  onSuccess,
  initialTab = "login"
}: LoginDialogProps) {
  const { login } = useUser()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<"login" | "signup">(initialTab)
  // Remove account type restriction (allow all user types to login)

  // Set active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab)
    }
  }, [initialTab])

  // Form state for login (using email instead of username)
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [isLoginLoading, setIsLoginLoading] = useState(false)

  // Form state for signup
  const [signupUsername, setSignupUsername] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  const [signupEmail, setSignupEmail] = useState("")
  const [signupName, setSignupName] = useState("")
  const [isSignupLoading, setIsSignupLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoginLoading(true)

    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem("auth-logout")

      // Use the login function from useUser hook, passing email instead of username
      const result = await login(loginEmail, loginPassword)
      const user = result.user

      toast({
        title: "Login successful!",
        description: "You have been logged in successfully."
      })

      // Check if user needs onboarding first
      if (user.needsUsername || !user.onboardingCompleted) {

}
