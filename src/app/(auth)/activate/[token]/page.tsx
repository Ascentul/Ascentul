'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSignUp } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface PageProps {
  params: { token: string };
}

export default function ActivateAccountPage({ params }: PageProps) {
  const router = useRouter();
  const { signUp, isLoaded: clerkLoaded, setActive } = useSignUp();
  const activateUserAccount = useMutation(api.admin_users.activateUserAccount);

  const [email, setEmail] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showTempPassword, setShowTempPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Check if the token is valid
  const userWithToken = useQuery(api.admin_users.getUserByActivationToken, {
    token: params.token,
  });

  useEffect(() => {
    if (userWithToken !== undefined) {
      if (userWithToken) {
        setTokenValid(true);
        setEmail(userWithToken.email);
      } else {
        setTokenValid(false);
      }
    }
  }, [userWithToken]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clerkLoaded) {
      setError('Authentication service is still loading. Please wait a moment.');
      return;
    }

    if (!signUp) {
      setError('Unable to initialize signup. Please refresh the page.');
      return;
    }

    // Validate passwords
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Check if temp password was provided by the user
    if (!userWithToken?.temp_password && !tempPassword) {
      setError('Please enter your temporary password from the activation email.');
      return;
    }

    // Verify temp password if user has one stored
    if (userWithToken?.temp_password && userWithToken.temp_password !== tempPassword) {
      setError('Incorrect temporary password. Please check your activation email.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Create Clerk account with the new password
      const signUpResponse = await signUp.create({
        emailAddress: email,
        password: newPassword,
      });

      // Step 2: If email verification is required, complete it automatically
      // since we know this email is valid (admin created the user)
      if (signUpResponse.status === 'missing_requirements') {
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });

        // For admin-created users, we can skip email verification
        // by using a special verification code or marking as verified
        // This would require backend configuration in Clerk
      }

      // Step 3: Get the Clerk user ID
      const clerkUserId = signUpResponse.createdUserId;

      if (!clerkUserId) {
        throw new Error('Failed to create user account. Please try again.');
      }

      // Step 4: Update the user record in Convex
      await activateUserAccount({
        activationToken: params.token,
        clerkId: clerkUserId,
      });

      // Step 5: Set the session as active
      if (signUpResponse.createdSessionId) {
        await setActive({ session: signUpResponse.createdSessionId });
      }

      // Step 6: Redirect based on user role
      const userRole = userWithToken?.role || 'user';

      // Show success message
      setError('');

      // Redirect to appropriate dashboard
      setTimeout(() => {
        switch (userRole) {
          case 'super_admin':
          case 'admin':
            router.push('/admin');
            break;
          case 'university_admin':
            router.push('/university');
            break;
          default:
            router.push('/dashboard');
        }
      }, 1500);

    } catch (err: any) {
      console.error('Activation error:', err);

      // Handle specific Clerk errors
      if (err.errors) {
        const clerkError = err.errors[0];
        if (clerkError?.code === 'form_identifier_exists') {
          setError('This email is already registered. Please sign in instead.');
        } else if (clerkError?.code === 'form_password_pwned') {
          setError('This password has been found in data breaches. Please choose a more secure password.');
        } else if (clerkError?.code === 'form_param_format_invalid') {
          setError('Invalid email format. Please check your email address.');
        } else {
          setError(clerkError?.message || 'Failed to create account. Please try again.');
        }
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while checking token
  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Verifying activation link...</p>
        </div>
      </div>
    );
  }

  // Show error if token is invalid or expired
  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invalid or Expired Link</CardTitle>
            <CardDescription>
              This activation link is invalid or has expired.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Activation links expire after 24 hours. Please contact your administrator to receive a new activation email.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => router.push('/sign-in')}
                variant="default"
                className="w-full"
              >
                Go to Sign In
              </Button>
              <Button
                onClick={() => router.push('/contact')}
                variant="outline"
                className="w-full"
              >
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Activate Your Account</CardTitle>
          <CardDescription>
            Set your password to complete your account activation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleActivate} className="space-y-4">
            {/* Email (readonly) */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-gray-50"
              />
            </div>

            {/* Temporary Password */}
            <div className="space-y-2">
              <Label htmlFor="tempPassword">Temporary Password</Label>
              <div className="relative">
                <Input
                  id="tempPassword"
                  type={showTempPassword ? 'text' : 'password'}
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                  placeholder="Enter the temporary password from your email"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowTempPassword(!showTempPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showTempPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Check your activation email for your temporary password
              </p>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Choose a strong password"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">
                Must be at least 8 characters long
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  required
                  disabled={isLoading}
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Activating Account...
                </>
              ) : (
                'Activate Account'
              )}
            </Button>

            {/* Help Text */}
            <div className="text-center text-sm text-gray-500">
              <p>Having trouble? <a href="/contact" className="text-primary hover:underline">Contact support</a></p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}