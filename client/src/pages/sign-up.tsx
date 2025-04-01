import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, UserCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignUpPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  
  // Form state for registration
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
  // Redirect if user is already logged in
  if (user) {
    if (user.userType === 'regular') {
      setLocation('/');
    } else {
      setLocation('/university');
    }
    return null;
  }
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);
    
    try {
      // Construct user data
      const userData = {
        password: registerPassword,
        name: registerName,
        email: registerEmail,
        userType: 'regular', // Default to regular user
        xp: 0,
        level: 1,
        rank: 'Beginner',
        isUniversityStudent: false,
      };
      
      // Make API call to register
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const registerData = await registerResponse.json();
      
      if (!registerResponse.ok) {
        throw new Error(registerData.message || 'Registration failed');
      }
      
      // Log in the user automatically after registration with direct API call
      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: registerEmail,
          password: registerPassword
        }),
      });
      
      const loginData = await loginResponse.json();
      
      if (!loginResponse.ok) {
        throw new Error(loginData.message || 'Auto-login failed after registration');
      }
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created and you are now logged in.",
      });
      
      // Use the redirect path from the server response, or fall back to role-based redirection
      if (loginData.redirectPath) {
        window.location.href = loginData.redirectPath;
      } else {
        // Fall back to role-based redirection
        if (loginData.user.userType === 'regular') {
          window.location.href = '/dashboard';
        } else if (loginData.user.userType === 'university_student' || loginData.user.userType === 'university_admin') {
          window.location.href = '/university';
        } else if (loginData.user.userType === 'admin') {
          window.location.href = '/admin';
        } else if (loginData.user.userType === 'staff') {
          window.location.href = '/staff';
        } else {
          window.location.href = '/dashboard';
        }
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please check your information and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Forms */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">
            <span className="text-primary">CareerTracker.io</span>
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Create an account</CardTitle>
              <CardDescription>
                Enter your information to create a new account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <div className="relative">
                    <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="register-name" 
                      placeholder="Enter your full name" 
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="register-email" 
                      type="email" 
                      placeholder="Enter your email address" 
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="register-password" 
                      type="password" 
                      placeholder="Choose a password" 
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                    {isRegisterLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign Up
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Already have an account? <Link href="/sign-in" className="text-primary hover:underline">Sign in</Link>
              </p>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Right Side - Hero */}
      <div className="hidden lg:w-1/2 lg:flex bg-primary p-8">
        <div className="m-auto max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">
            Accelerate Your Career Journey
          </h1>
          
          <p className="text-xl mb-8">
            Your all-in-one platform for career development, resume building, interview preparation, and professional growth.
          </p>
          
          <div className="space-y-4">
            <FeatureItem icon="✓" text="AI-powered career coaching and goal tracking" />
            <FeatureItem icon="✓" text="Resume and cover letter builder with AI suggestions" />
            <FeatureItem icon="✓" text="Interactive interview preparation tools" />
            <FeatureItem icon="✓" text="Gamified learning with XP and achievements" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-primary-foreground">{text}</div>
    </div>
  );
}