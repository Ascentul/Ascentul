import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdminLoginPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  
  // Form state for login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Redirect if user is already logged in as admin - check both role and userType fields
  if (user && (user.role === 'super_admin' || user.role === 'admin' || user.userType === 'admin')) {
    console.log("Admin already logged in, redirecting to /admin. Role:", user.role, "Type:", user.userType);
    setLocation('/admin');
    return null;
  }
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoginLoading(true);
    
    try {
      // First clear any logout flag from localStorage
      localStorage.removeItem('auth-logout');
      
      // Use the login function from useUser hook with a special 'admin' indicator
      const result = await login(loginUsername, loginPassword, 'admin');
      const { user, redirectPath } = result;
      
      // Check if the logged-in user is an admin - this is a fallback
      // in case the server doesn't handle the login type correctly
      // Check both role and userType fields
      if (user.role !== 'super_admin' && user.role !== 'admin' && user.userType !== 'admin') {
        console.log("Access denied: Not an admin. Role:", user.role, "Type:", user.userType);
        toast({
          title: "Access denied",
          description: "You do not have admin privileges.",
          variant: "destructive",
        });
        
        // Logout and redirect to regular login
        localStorage.setItem('auth-logout', 'true');
        setLocation('/sign-in');
        return;
      }
      
      console.log("Admin login successful. Role:", user.role, "Type:", user.userType);
      
      toast({
        title: "Admin login successful!",
        description: "You have been logged in successfully.",
      });
      
      // For super_admin or admin roles, always ensure they go to /admin regardless of redirectPath
      if (user.role === 'super_admin' || user.role === 'admin') {
        console.log("Admin/Super Admin user detected - always redirecting to /admin");
        window.location.href = '/admin';
      }
      // For other roles, use the redirectPath from server if available
      else if (redirectPath) {
        console.log("Using server-provided redirect path:", redirectPath);
        window.location.href = redirectPath;
      } else {
        // If no redirectPath is provided, default to /admin
        console.log("No redirectPath provided, defaulting to /admin");
        window.location.href = '/admin';
      }
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
            Admin Portal
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Admin Sign In</CardTitle>
              <CardDescription>
                Enter your admin credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username">Username</Label>
                  <Input 
                    id="login-username" 
                    placeholder="Enter admin username" 
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
                    placeholder="Enter admin password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoginLoading}>
                    {isLoginLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Sign In as Admin
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
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
            CareerTracker.io Admin
          </h1>
          
          <p className="text-xl mb-8">
            Manage your platform, users, and content from the admin dashboard. Monitor statistics and make critical business decisions.
          </p>
          
          <div className="space-y-4">
            <AdminFeature icon="✓" text="User account and subscription management" />
            <AdminFeature icon="✓" text="Content and curriculum administration" />
            <AdminFeature icon="✓" text="Analytics and performance metrics" />
            <AdminFeature icon="✓" text="System configuration and maintenance" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminFeature({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="bg-primary-foreground text-primary font-bold rounded-full w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-primary-foreground">{text}</div>
    </div>
  );
}