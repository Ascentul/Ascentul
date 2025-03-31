import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignInPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  const [loginType, setLoginType] = useState<'regular' | 'university'>('regular');
  
  // Form state for login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Redirect if user is already logged in
  if (user) {
    if (user.userType === 'regular') {
      setLocation('/');
    } else {
      setLocation('/university');
    }
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      // Pass loginType to the login function
      await login(loginUsername, loginPassword, loginType);
      
      // Redirect based on user type after successful login
      // This will happen automatically due to the user redirect above
      toast({
        title: "Login successful!",
        description: "You have been logged in successfully.",
      });
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
            {loginType === 'regular' ? 'Career Coach' : 'University Edition'}
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
            </CardContent>
            <CardFooter className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account? <Link href="/sign-up" className="text-primary hover:underline">Sign up</Link>
              </p>
            </CardFooter>
          </Card>
          
          <div className="mt-6">
            <div className="text-sm text-center mb-4">Choose account type:</div>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant={loginType === 'regular' ? "default" : "outline"} 
                onClick={() => setLoginType('regular')}
                className="flex flex-col items-center p-4 h-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Career App</span>
                <span className="text-xs mt-1">Regular Account</span>
              </Button>
              <Button 
                variant={loginType === 'university' ? "default" : "outline"} 
                onClick={() => setLoginType('university')}
                className="flex flex-col items-center p-4 h-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                  <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                </svg>
                <span>University</span>
                <span className="text-xs mt-1">Student & Admin</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Side - Hero */}
      <div className="hidden lg:w-1/2 lg:flex bg-primary p-8">
        <div className="m-auto max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">
            {loginType === 'regular' 
              ? 'Accelerate Your Career Journey' 
              : 'University Edition: Career Success Starts Here'}
          </h1>
          
          <p className="text-xl mb-8">
            {loginType === 'regular'
              ? 'Your all-in-one platform for career development, resume building, interview preparation, and professional growth.'
              : 'A specialized platform for university students and administrators to manage academic planning, learning modules, and career development.'}
          </p>
          
          <div className="space-y-4">
            {loginType === 'regular' ? (
              <>
                <FeatureItem icon="✓" text="AI-powered career coaching and goal tracking" />
                <FeatureItem icon="✓" text="Resume and cover letter builder with AI suggestions" />
                <FeatureItem icon="✓" text="Interactive interview preparation tools" />
                <FeatureItem icon="✓" text="Gamified learning with XP and achievements" />
              </>
            ) : (
              <>
                <FeatureItem icon="✓" text="Comprehensive academic planning tools" />
                <FeatureItem icon="✓" text="Structured learning modules for course work" />
                <FeatureItem icon="✓" text="Integration with university departments" />
                <FeatureItem icon="✓" text="Career planning tailored for students" />
              </>
            )}
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