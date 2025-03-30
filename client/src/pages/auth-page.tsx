import { useState } from 'react';
import { useLocation } from 'wouter';
import { useUser } from '@/lib/useUserData';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { user, login, isLoading } = useUser();
  const { toast } = useToast();
  const [loginType, setLoginType] = useState<'regular' | 'university'>('regular');
  
  // Form state for login
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // Form state for registration
  const [registerUsername, setRegisterUsername] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerName, setRegisterName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  
  // University specific registration fields
  const [universityId, setUniversityId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  
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
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegisterLoading(true);
    
    try {
      // Construct user data based on registration type
      const userData = {
        username: registerUsername,
        password: registerPassword,
        name: registerName,
        email: registerEmail,
        userType: loginType === 'university' ? 'university_student' : 'regular',
        xp: 0,
        level: 1,
        rank: 'Beginner',
      };
      
      // Add university fields if registering as university student
      if (loginType === 'university') {
        Object.assign(userData, {
          universityId: parseInt(universityId),
          departmentId: departmentId ? parseInt(departmentId) : undefined,
          studentId,
          graduationYear: graduationYear ? parseInt(graduationYear) : undefined,
          isUniversityStudent: true,
        });
      } else {
        Object.assign(userData, {
          isUniversityStudent: false,
        });
      }
      
      // Make API call to register
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Log in the user automatically after registration
      await login(registerUsername, registerPassword, loginType);
      
      toast({
        title: "Registration successful!",
        description: "Your account has been created and you are now logged in.",
      });
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
            {loginType === 'regular' ? 'Career Coach' : 'University Edition'}
          </h1>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <Card>
                <CardHeader>
                  <CardTitle>Login</CardTitle>
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
                        Login
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="register">
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
                      <Label htmlFor="register-password">Password</Label>
                      <Input 
                        id="register-password" 
                        type="password" 
                        placeholder="Choose a password" 
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                    </div>
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
                      <Label htmlFor="register-email">Email</Label>
                      <Input 
                        id="register-email" 
                        type="email" 
                        placeholder="Enter your email address" 
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    {/* University specific fields */}
                    {loginType === 'university' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="university-id">University ID</Label>
                          <Input 
                            id="university-id" 
                            placeholder="Enter your university ID" 
                            value={universityId}
                            onChange={(e) => setUniversityId(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="student-id">Student ID</Label>
                          <Input 
                            id="student-id" 
                            placeholder="Enter your student ID" 
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="department-id">Department ID</Label>
                          <Input 
                            id="department-id" 
                            placeholder="Enter your department ID" 
                            value={departmentId}
                            onChange={(e) => setDepartmentId(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="graduation-year">Graduation Year</Label>
                          <Input 
                            id="graduation-year" 
                            placeholder="Expected graduation year" 
                            value={graduationYear}
                            onChange={(e) => setGraduationYear(e.target.value)}
                          />
                        </div>
                      </>
                    )}
                    
                    <div className="pt-2">
                      <Button type="submit" className="w-full" disabled={isRegisterLoading}>
                        {isRegisterLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Register
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
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
      <div className="font-medium">{text}</div>
    </div>
  );
}