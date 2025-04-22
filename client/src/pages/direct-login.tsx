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
  const [userData, setUserData] = useState<any>(null); // Store the user data here for redirects
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
    console.log('REDIRECTING TO DASHBOARD NOW');
    
    try {
      // Get redirect path from userData if available
      const redirectPath = userData?.redirectPath || '/dashboard';
      console.log(`Using redirectPath: ${redirectPath}`);
      
      // Use the most forceful redirect possible
      setTimeout(() => {
        console.log('EXECUTING IMMEDIATE REDIRECT');
        window.location.replace(redirectPath);
      }, 100);
      
      // Backup: try again after a short delay if not redirected
      setTimeout(() => {
        console.log('REDIRECT RETRY');
        document.location.href = '/dashboard';
      }, 800);
    } catch (error) {
      console.error('Redirect error:', error);
      // Final fallback
      window.location.href = '/dashboard';
    }
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
      
      let parsedData;
      
      try {
        // Always parse the JSON response first
        parsedData = await response.json();
        console.log('Parsed response data:', parsedData);
        
        if (!response.ok) {
          // If status is not OK, handle as error
          const message = parsedData?.message || `Error: ${response.statusText}`;
          setErrorMessage(message);
          setIsLoading(false);
          return;
        }
        
        // Store the user data in component state for redirection
        setUserData(parsedData);
        console.log('Login successful, user data:', parsedData);
      } catch (e) {
        console.error('Error parsing response:', e);
        setErrorMessage(`Error parsing response: ${response.statusText}`);
        setIsLoading(false);
        return;
      }
      
      // Store user data in localStorage with proper nesting handling
      localStorage.setItem('auth-user', JSON.stringify({
        id: parsedData.id || (parsedData.user && parsedData.user.id),
        username: parsedData.username || (parsedData.user && parsedData.user.username),
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