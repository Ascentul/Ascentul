import { useState, useEffect } from 'react';
import { useUser } from '@/lib/useUserData';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  initialTab?: 'login' | 'signup';
}

export default function LoginDialog({ open, onOpenChange, onSuccess, initialTab = 'login' }: LoginDialogProps) {
  const { login } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>(initialTab);
  // Remove account type restriction (allow all user types to login)
  
  // Set active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Form state for login (using email instead of username)
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Form state for signup
  const [signupUsername, setSignupUsername] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupName, setSignupName] = useState('');
  const [isSignupLoading, setIsSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem('auth-logout');
      
      // Use the login function from useUser hook, passing email instead of username
      const result = await login(loginEmail, loginPassword);
      const user = result.user;
      
      toast({
        title: "Login successful!",
        description: "You have been logged in successfully.",
      });
      
      // Check if user needs onboarding first
      if (user.needsUsername || !user.onboardingCompleted) {
        console.log("User needs onboarding - redirecting to onboarding flow");
        window.location.href = '/onboarding';
        return;
      }
      
      // Use redirect path from result if provided
      if (result.redirectPath) {
        console.log("Using server-provided redirect path:", result.redirectPath);
        window.location.href = result.redirectPath;
        return;
      }
      
      // Otherwise, redirect based on user role first, then fall back to userType
      if (user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin') {
        console.log("Redirecting admin user to admin dashboard. Role:", user.role, "Type:", user.userType);
        window.location.href = '/admin';
      } else if (user.role === 'staff' || user.userType === 'staff') {
        console.log("Redirecting staff user to staff dashboard. Role:", user.role, "Type:", user.userType);
        window.location.href = '/staff-dashboard';
      } else if (user.role === 'university_admin' || user.userType === 'university_admin') {
        console.log("Redirecting university admin to university dashboard. Role:", user.role, "Type:", user.userType);
        window.location.href = '/university-admin/dashboard';
      } else if (user.role === 'university_user' || user.userType === 'university_student') {
        console.log("Redirecting university student to career dashboard. Role:", user.role, "Type:", user.userType);
        window.location.href = '/career-dashboard';
      } else {
        console.log("Redirecting regular user to dashboard. Role:", user.role, "Type:", user.userType);
        window.location.href = '/dashboard';
      }
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Login error:", error);
      
      // Ensure we have a valid error message
      let errorMessage = "Please check your credentials and try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignupLoading(true);
    
    try {
      // Generate a temporary username from the email
      // This will be updated during the onboarding flow
      const tempUsername = `user_${Date.now().toString().slice(-6)}`;
      
      // Make a direct API call for registration - ensure we're using the correct endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signupUsername || tempUsername, // Use provided username or fallback to temporary
          password: signupPassword,
          email: signupEmail,
          name: signupName,
          userType: 'regular', // Default to regular account type
          needsUsername: !signupUsername, // Only flag if we're using a temporary username
        }),
      });
      
      // Handle the response carefully to avoid XML parsing errors
      let data;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          // Handle non-JSON responses
          const text = await response.text();
          data = { message: text || "Registration failed with a non-JSON response" };
        }
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        // If JSON parsing fails, create a fallback data object
        data = { message: "Failed to parse server response" };
      }
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created successfully. You've been logged in.",
      });
      
      // Redirect to onboarding flow for new users
      window.location.href = '/onboarding';
      
      if (onSuccess) {
        onSuccess();
      }
      
      onOpenChange(false);
    } catch (error) {
      console.error("Registration error:", error);
      
      // Ensure we have a valid error message
      let errorMessage = "Please check your information and try again.";
      if (error instanceof Error) {
        errorMessage = error.message || errorMessage;
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSignupLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            CareerTracker.io
          </DialogTitle>
          <DialogDescription className="text-center">
            Access your personal career management platform
          </DialogDescription>
        </DialogHeader>

        <Tabs 
          defaultValue="login" 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as 'login' | 'signup')} 
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoginLoading}>
                  {isLoginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full Name</Label>
                <Input
                  id="signup-name"
                  placeholder="Enter your full name"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                />
              </div>
              {/* Username field moved to onboarding flow */}
              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                />
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isSignupLoading}>
                  {isSignupLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Create Account
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>


        <DialogFooter className="sm:justify-start">
          <div className="text-xs text-muted-foreground mt-4">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}