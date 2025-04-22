import { useState, useEffect } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  
  // Form state for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // We'll handle redirection directly in the login function's success handler
  // This avoids React warnings about updating during render
  // The useUser hook already has redirection logic that uses document.location
  // for immediate navigation
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem('auth-logout');
      
      // Use the login function from useUser hook, which properly updates authentication state
      await login(loginEmail, loginPassword);
      
      toast({
        title: "Login successful!",
        description: "You have been logged in successfully.",
      });
      
      // Note: The login function in useUser already handles redirection
      // If it doesn't redirect automatically, uncomment the following:
      /*
      setTimeout(() => {
        document.location.href = '/career-dashboard';
      }, 500);
      */
      
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
      setIsLoginLoading(false);
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
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to access your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="login-email" 
                      type="email"
                      placeholder="Enter your email" 
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
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account? <Link href="/sign-up" className="text-primary hover:underline">Sign up</Link>
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