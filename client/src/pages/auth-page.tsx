import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useUser } from '@/lib/useUserData';

// Form schemas
const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const [location] = useLocation();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>('login');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1]);
  const planParam = urlParams.get('plan') || 'free'; // Default to free
  const cycleParam = urlParams.get('cycle') || 'monthly'; // Default to monthly

  // If user is already logged in, redirect to dashboard or appropriate location
  useEffect(() => {
    if (user) {
      if (planParam === 'free') {
        navigate('/dashboard');
      } else {
        // Navigate to payment portal with the selected plan and cycle
        navigate(`/payment-portal/${planParam}?cycle=${cycleParam}`);
      }
    }
  }, [user, navigate, planParam, cycleParam]);

  // Login form
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  // Register form
  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/login', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }
      
      const userData = await response.json();
      
      toast({
        title: 'Login successful',
        description: `Welcome back, ${userData.name}!`,
      });

      // Redirect based on the plan
      if (planParam === 'free') {
        navigate('/dashboard');
      } else {
        navigate(`/payment-portal/${planParam}?cycle=${cycleParam}`);
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/auth/register', data);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const userData = await response.json();
      
      toast({
        title: 'Registration successful',
        description: `Welcome to CareerTracker, ${userData.name}!`,
      });

      // Redirect based on the plan
      if (planParam === 'free') {
        navigate('/onboarding');
      } else {
        navigate(`/payment-portal/${planParam}?cycle=${cycleParam}`);
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left Side - Auth Form */}
      <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold">
              {planParam === 'free' ? 'Get Started with CareerTracker' : 'Join CareerTracker Pro'}
            </h1>
            <p className="text-muted-foreground mt-2">
              {planParam === 'free' 
                ? 'Create an account to start your career journey'
                : `Subscribe to the ${planParam === 'pro' ? 'Pro' : 'University'} plan to unlock all features`}
            </p>
          </div>

          <Card>
            <CardHeader>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>
            <CardContent>
              <TabsContent value="login" className="mt-0">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter your password" 
                              {...field} 
                              disabled={isLoading} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Logging in...
                        </>
                      ) : (
                        <>
                          Login
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
              <TabsContent value="register" className="mt-0">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email" {...field} disabled={isLoading} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Create a password" 
                              {...field} 
                              disabled={isLoading} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden md:block md:w-1/2 bg-primary p-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="h-full flex flex-col justify-center max-w-lg mx-auto text-primary-foreground"
        >
          <h1 className="text-4xl font-bold mb-4">
            Accelerate Your Career Growth
          </h1>
          <p className="text-xl mb-8">
            {planParam === 'free' ? (
              'Join thousands of professionals using CareerTracker to organize their career journey and achieve their goals.'
            ) : planParam === 'pro' ? (
              'Unlock premium features designed to give you an edge in today\'s competitive job market.'
            ) : (
              'Special tools tailored for university students to prepare for career success after graduation.'
            )}
          </p>

          <div className="space-y-4">
            {planParam === 'free' ? (
              <>
                <FeatureItem text="Organize your career journey in one central platform" />
                <FeatureItem text="Track your progress with intuitive dashboards" />
                <FeatureItem text="Create professional resumes and cover letters" />
                <FeatureItem text="Prepare for interviews with confidence" />
              </>
            ) : planParam === 'pro' ? (
              <>
                <FeatureItem text="Unlimited resumes and cover letters with premium templates" />
                <FeatureItem text="Advanced AI career coach with personalized advice" />
                <FeatureItem text="Comprehensive interview tracking system" />
                <FeatureItem text="Priority support and exclusive resources" />
              </>
            ) : (
              <>
                <FeatureItem text="All Pro features included" />
                <FeatureItem text="Study planning and course management tools" />
                <FeatureItem text="Learning modules tailored to your program" />
                <FeatureItem text="Academic achievement integration with career planning" />
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// Helper component for feature items
function FeatureItem({ text }: { text: string }) {
  return (
    <div className="flex items-center">
      <div className="mr-3 h-6 w-6 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span>{text}</span>
    </div>
  );
}