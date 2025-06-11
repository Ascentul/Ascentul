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
      console.log(`Login successful - redirecting to ${redirectPath}`)

      // Use setTimeout to avoid React state update warning
      setTimeout(() => {
        window.location.href = redirectPath
      }, 0)
    } catch (error) {
      toast({
        title: "Login failed",
        description:
          error instanceof Error
            ? error.message
            : "Please check your credentials and try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoginLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Forms */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">
            <span className="text-primary text-4xl">Ascentul</span>
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Login Type Toggle */}
              <div className="mb-6">
                <Label className="mb-2 block">Login Type</Label>
                <ToggleGroup
                  type="single"
                  value={loginType}
                  onValueChange={(value) =>
                    value && setLoginType(value as "regular" | "university")
                  }
                  className="bg-gray-100 rounded-md p-1 justify-stretch"
                >
                  <ToggleGroupItem
                    value="regular"
                    className={`flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${
                      loginType === "regular"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>Regular Login</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="university"
                    className={`flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${
                      loginType === "university"
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    <School className="h-4 w-4 mr-2" />
                    <span>University Login</span>
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      placeholder={
                        loginType === "university"
                          ? "Enter your university email"
                          : "Enter your email"
                      }
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoginLoading}
                  >
                    {isLoginLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    {loginType === "university"
                      ? "Sign In to University Portal"
                      : "Sign In"}
                  </Button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        Or
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    disabled={isLoginLoading}
                    onClick={async () => {
                      setIsLoginLoading(true)
                      try {
                        const { error } =
                          await supabaseClient.auth.signInWithOtp({
                            email: loginEmail,
                            options: {
                              emailRedirectTo: `${window.location.origin}/auth/callback`
                            }
                          })

                        if (error) {
                          throw new Error(error.message)
                        }

                        toast({
                          title: "Magic link sent!",
                          description: "Check your inbox for a sign-in link."
                        })
                      } catch (error) {
                        toast({
                          title: "Failed to send magic link",
                          description:
                            error instanceof Error
                              ? error.message
                              : "Please check your email address and try again.",
                          variant: "destructive"
                        })
                      } finally {
                        setIsLoginLoading(false)
                      }
                    }}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    Send Magic Link
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <div className="text-center">
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{" "}
                <Link href="/sign-up" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:w-1/2 lg:flex bg-primary p-8">
        <div className="m-auto max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">
            Elevate Your Career Journey
          </h1>

          <p className="text-xl mb-8">
            Ascentul is your AI-powered career hub — built to help you stay
            organized, apply smarter, and grow with confidence.
          </p>

          <div className="space-y-4">
            <FeatureItem
              icon="✓"
              text="Job application tracking that keeps you on top of every opportunity"
            />
            <FeatureItem
              icon="✓"
              text="Career goal setting and progress tracking to build long-term momentum"
            />
            <FeatureItem
              icon="✓"
              text="Smart resume and cover letter builder with AI-powered suggestions"
            />
            <FeatureItem
              icon="✓"
              text="Personalized career coaching to guide your next move"
            />
          </div>
        </div>
      </div>
    </div>
  )
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
