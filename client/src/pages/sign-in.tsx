import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SignIn() {
  const { toast } = useToast();
  
  // Pre-fill with test credentials
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Starting login process for:', email);
      
      // Make direct API request
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Important for cookies
      });
      
      if (!response.ok) {
        let errorMessage = 'Login failed';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || 'Login failed';
        } catch (e) {
          // If the response isn't JSON, use the status text
          errorMessage = `Login failed: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Login API success, received data:', data);
      
      // Show success message
      toast({
        title: "Login successful!",
        description: "Redirecting to dashboard...",
      });
      
      // Store authentication state in localStorage
      localStorage.setItem('auth-user', JSON.stringify({
        id: data.id || (data.user && data.user.id),
        authenticated: true,
        timestamp: new Date().toISOString()
      }));
      
      // For the most reliable navigation, use plain JavaScript to change the URL
      // This bypasses routing frameworks completely
      console.log('Authentication successful, redirecting to dashboard');
      
      // Force the navigation via document.location with hard-coded path
      // The server may provide redirectPath, but we're setting a fallback
      document.location.href = '/career-dashboard';
      
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials and try again.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">
          <span className="text-primary">CareerTracker</span>
        </h1>
        
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email"
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="Enter your password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="pt-2">
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Sign In
                </Button>
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Don't have an account? <Link href="/sign-up" className="text-primary hover:underline">Sign up</Link>
            </p>
            
            <div className="text-xs text-muted-foreground p-2 bg-gray-50 dark:bg-gray-900 rounded">
              <p className="font-semibold">Test Credentials:</p>
              <p>Email: test@example.com</p>
              <p>Password: testpassword</p>
              
              <div className="mt-3 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Having trouble logging in?</p>
                <div className="flex space-x-2">
                  <a 
                    href="/direct-login" 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Try Direct Login
                  </a>
                  <span className="text-xs text-muted-foreground">|</span>
                  <a 
                    href="/quick-login" 
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Use Quick Login (Bypass Auth)
                  </a>
                </div>
              </div>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}