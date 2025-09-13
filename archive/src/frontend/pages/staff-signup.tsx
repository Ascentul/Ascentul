import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export default function StaffSignupPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Form state
  const [registerName, setRegisterName] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
  const [registrationCode, setRegistrationCode] = useState(''); // For additional security
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }
    
    // Additional validation for staff members
    // This would be a special code provided by an admin
    // In a real system, this could be an invite token
    if (registrationCode !== 'STAFF2025') { // Simple placeholder security code
      toast({
        title: "Invalid registration code",
        description: "The staff registration code you entered is not valid.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRegisterLoading(true);
    
    try {
      // Create a staff user
      const response = await apiRequest('POST', '/api/staff/register', {
        name: registerName,
        username: registerUsername,
        email: registerEmail,
        password: registerPassword,
        registrationCode
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      toast({
        title: "Staff registration successful!",
        description: "Your staff account has been created. You can now log in.",
      });
      
      // Redirect to staff login page
      setLocation('/staff-login');
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error instanceof Error ? error.message : "Please check your details and try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Auth Forms */}
      <div className="w-full lg:w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h1 className="text-3xl font-bold mb-6 text-center">
            Staff Portal Registration
          </h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Create Staff Account</CardTitle>
              <CardDescription>
                Register as a new staff member
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-name">Full Name</Label>
                  <Input 
                    id="register-name" 
                    placeholder="Enter your full name" 
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-username">Username</Label>
                  <Input 
                    id="register-username" 
                    placeholder="Choose a username" 
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">Email</Label>
                  <Input 
                    id="register-email" 
                    type="email" 
                    placeholder="Enter your email" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Password</Label>
                  <Input 
                    id="register-password" 
                    type="password" 
                    placeholder="Create a password" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirm Password</Label>
                  <Input 
                    id="register-confirm-password" 
                    type="password" 
                    placeholder="Confirm your password" 
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-code">Staff Registration Code</Label>
                  <Input 
                    id="register-code" 
                    placeholder="Enter the staff registration code" 
                    value={registrationCode}
                    onChange={(e) => setRegistrationCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    This code is provided by administrators to authorize staff registration.
                  </p>
                </div>
                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                    {isRegisterLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Register as Staff
                  </Button>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/staff-login')}
                className="text-sm text-muted-foreground"
              >
                Already have an account? Sign in
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Right Side - Hero */}
      <div className="hidden lg:w-1/2 lg:flex bg-primary p-8">
        <div className="m-auto max-w-lg text-primary-foreground">
          <h1 className="text-5xl font-bold mb-6">
            CareerTracker.io Staff Portal
          </h1>
          
          <p className="text-xl mb-8">
            Create your staff account to access administrative tools and manage the platform. Help users succeed in their career journey.
          </p>
          
          <div className="space-y-4">
            <StaffFeature icon="✓" text="Help users achieve their career goals" />
            <StaffFeature icon="✓" text="Manage platform content and resources" />
            <StaffFeature icon="✓" text="Provide support to users when needed" />
            <StaffFeature icon="✓" text="Monitor and improve platform performance" />
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