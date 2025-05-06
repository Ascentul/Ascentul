import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StaffLoginPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  
  // Form state for login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Redirect if user is already logged in as staff or admin
  // Check both role and userType fields for consistent authorization
  if (user && (
    user.role === 'staff' || 
    user.role === 'admin' ||
    user.role === 'super_admin' ||
    user.userType === 'staff' || 
    user.userType === 'admin'
  )) {
    console.log("Staff login page: User already has staff access. Role:", user.role, "Type:", user.userType);
    setLocation('/staff-dashboard');
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem('auth-logout');
      
      // Use the login function from useUser hook with a special 'staff' indicator
      const result = await login(loginUsername, loginPassword, 'staff');
      const { user, redirectPath } = result;
      
      // Check if the logged-in user is staff or admin - this is a fallback
      // in case the server doesn't handle the login type correctly
      // Check both role and userType fields for consistent authorization
      if (!(
        user.role === 'staff' || 
        user.role === 'admin' || 
        user.role === 'super_admin' || 
        user.userType === 'staff' || 
        user.userType === 'admin'
      )) {
        console.log("Staff login denied - User has incorrect role/type. Role:", user.role, "Type:", user.userType);
        toast({
          title: "Access denied",
          description: "You do not have staff portal access privileges.",
          variant: "destructive",
        });
        
        // Logout and redirect to regular login
        localStorage.setItem('auth-logout', 'true');
        setLocation('/sign-in');
        return;
      }
      
      console.log("Staff login successful for user with role:", user.role, "type:", user.userType);
      
      toast({
        title: "Staff login successful!",
        description: "You have been logged in successfully.",
      });
      
      // ✅ Rely solely on the server-sent redirectPath for proper routing
      // The login function in useUserData.tsx handles redirection based on the server response
      console.log("Staff login successful - redirection will be handled by useUserData.tsx");
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
            Staff Portal
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Staff Sign In</CardTitle>
              <CardDescription>
                Enter your staff credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input 
                    id="login-username" 
                    placeholder="Enter staff username" 
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
                    placeholder="Enter staff password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In as Staff
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-2 items-center">
              <Button 
                variant="outline" 
                onClick={() => setLocation('/staff-signup')}
                className="text-sm w-full"
              >
                Create a staff account
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/sign-in')}
                className="text-sm text-muted-foreground"
              >
                Return to regular login
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Right Side - Hero */}
      <div className="hidden lg:w-1/2 lg:flex bg-primary p-8">
        <div className="m-auto max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">
            CareerTracker.io Staff
          </h1>
          
          <p className="text-xl mb-8">
            Access staff tools and resources to manage the platform and support users. Monitor system status and track key metrics.
          </p>
          
          <div className="space-y-4">
            <StaffFeature icon="✓" text="User account and subscription management" />
            <StaffFeature icon="✓" text="Content and curriculum administration" />
            <StaffFeature icon="✓" text="Support ticket management" />
            <StaffFeature icon="✓" text="System configuration and maintenance" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StaffFeature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-primary-foreground">{text}</div>
    </div>
  );
}