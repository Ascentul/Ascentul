import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function DirectLogin() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('testpassword');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);
  const { toast } = useToast();
  
  // Attempt auto-login on component mount
  useEffect(() => {
    const attemptAutoLogin = async () => {
      if (!autoLoginAttempted) {
        setAutoLoginAttempted(true);
        setIsLoading(true);
        
        try {
          console.log('Attempting auto-login with default credentials');
          await performLogin();
        } catch (error) {
          console.error('Auto-login failed:', error);
          setIsLoading(false);
        }
      }
    };
    
    // Execute auto-login attempt
    attemptAutoLogin();
  }, [autoLoginAttempted]);

  // Function to handle direct redirection to dashboard
  const redirectToDashboard = () => {
    window.location.replace('/career-dashboard');
  };

  // Function to handle AJAX login
  const performLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    
    try {
      console.log('Attempting AJAX login with:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password
        }),
        credentials: 'include' // Important for cookies
      });
      
      if (!response.ok) {
        let message = 'Login failed';
        try {
          const data = await response.json();
          message = data.message || 'Authentication failed';
        } catch (e) {
          message = `Error: ${response.statusText}`;
        }
        setErrorMessage(message);
        setIsLoading(false);
        return;
      }
      
      // Store authentication in localStorage for backup
      localStorage.setItem('auth-user', JSON.stringify({
        authenticated: true,
        timestamp: new Date().toISOString()
      }));
      
      toast({
        title: "Login successful!",
        description: "Redirecting to dashboard...",
      });
      
      // Redirect to dashboard
      setTimeout(redirectToDashboard, 500);
      
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage(error instanceof Error ? error.message : "Network error. Please try again.");
      setIsLoading(false);
    }
  };
  
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin();
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">
          <span className="text-primary">CareerTracker</span>
        </h1>
        
        <h2 className="text-xl font-bold mb-2">Direct Login</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your credentials below</p>
        
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
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-red-600 dark:text-red-400 text-sm mb-4">
              {errorMessage}
            </div>
          )}
          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Sign In
            </Button>
          </div>
        </form>
        
        <div className="mt-6 p-3 bg-gray-50 dark:bg-gray-800 rounded text-sm">
          <p className="font-semibold">Test Credentials:</p>
          <p>Email: test@example.com</p>
          <p>Password: testpassword</p>
        </div>
      </div>
    </div>
  );
}