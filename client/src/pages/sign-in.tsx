import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, School, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  
  // Form state for login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [loginType, setLoginType] = useState<'regular' | 'university'>('regular');
  
  // Redirect if user is already logged in
  if (user) {
    if (user.userType === 'regular') {
      setLocation('/dashboard');
    } else {
      setLocation('/university');
    }
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem('auth-logout');
      
      // Use the login function from useUser hook with the appropriate login type
      // The university login type will be used to redirect to university-specific areas
      // We must use a type casting approach since the login function expects a specific type
      const loginTypeParam = loginType === 'university' ? 'university' : 'regular';
      // Pass the login type cast as any to avoid type errors with the login function
      const { user, redirectPath } = await login(loginEmail, loginPassword, loginTypeParam as any);
      
      toast({
        title: "Login successful!",
        description: "You have been logged in successfully.",
      });
      
      // ✅ Rely solely on the server-sent redirectPath for proper routing
      // The login function in useUserData.tsx handles redirection based on the server response
      console.log("Login successful - redirection will be handled by useUserData.tsx");
    } catch (error) {
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
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
            <span className="text-primary">Ascentul</span>
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
                  onValueChange={(value) => value && setLoginType(value as 'regular' | 'university')}
                  className="bg-gray-100 rounded-md p-1 justify-stretch"
                >
                  <ToggleGroupItem 
                    value="regular" 
                    className={`flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${loginType === 'regular' ? 'text-foreground' : 'text-muted-foreground'}`}
                  >
                    <User className="h-4 w-4 mr-2" />
                    <span>Regular Login</span>
                  </ToggleGroupItem>
                  <ToggleGroupItem 
                    value="university" 
                    className={`flex-1 data-[state=on]:bg-white data-[state=on]:shadow-sm rounded-sm ${loginType === 'university' ? 'text-foreground' : 'text-muted-foreground'}`}
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
                      placeholder={loginType === 'university' ? "Enter your university email" : "Enter your email"} 
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
                    {loginType === 'university' ? 'Sign In to University Portal' : 'Sign In'}
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