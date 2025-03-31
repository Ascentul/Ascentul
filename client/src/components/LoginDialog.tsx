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
  // Always use regular account type for the main login dialog
  const loginType = 'regular';
  
  // Set active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Form state for login
  const [loginUsername, setLoginUsername] = useState('');
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
      
      // Use the login function from useUser hook
      const user = await login(loginUsername, loginPassword, loginType);
      
      toast({
        title: "Login successful!",
        description: "You have been logged in successfully.",
      });
      
      // Redirect based on user type
      if (user.userType === 'regular') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/university';
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
      
      // Make a direct API call for registration
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: tempUsername, // Use temporary username
          password: signupPassword,
          email: signupEmail,
          name: signupName,
          userType: loginType,
          needsUsername: true, // Flag to indicate username needs to be set during onboarding
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created successfully. You've been logged in.",
      });
      
      // Redirect to onboarding flow for new regular users
      if (loginType === 'regular') {
        window.location.href = '/onboarding';
      } else {
        window.location.href = '/university';
      }
      
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
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  placeholder="Enter your username"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
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