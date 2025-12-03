'use client';

import { useSignUp } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { api } from '../../../../../convex/_generated/api';

interface PageProps {
  params: { token: string };
}

export default function ActivateAccountPage({ params }: PageProps) {
  const router = useRouter();
  const { signUp, isLoaded: clerkLoaded, setActive } = useSignUp();
  const activateUserAccount = useMutation(api.admin_users.activateUserAccount);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

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

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkLoaded || !signUp || !tokenValid) {
      console.error('Verification pre-check failed:', {
        clerkLoaded,
        hasSignUp: !!signUp,
        tokenValid,
      });
      setError('Authentication not ready. Please refresh the page and try again.');
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('Attempting email verification with code length:', verificationCode.length);
      console.log('SignUp status before verification:', signUp.status);

      // Attempt email verification
      const verifyResponse = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      console.log('Verification response:', {
        status: verifyResponse.status,
        createdUserId: verifyResponse.createdUserId,
        createdSessionId: verifyResponse.createdSessionId,
      });

      // Check if verification was successful
      if (verifyResponse.status !== 'complete') {
        console.error('Verification not complete, status:', verifyResponse.status);
        throw new Error('Email verification incomplete. Please try again.');
      }

      // Get the Clerk user ID - try multiple sources
      let clerkUserId = verifyResponse.createdUserId || signUp.createdUserId;

      console.log('Clerk user ID (initial):', clerkUserId);
      console.log('SignUp object after verify:', {
        status: signUp.status,
        createdUserId: signUp.createdUserId,
        createdSessionId: signUp.createdSessionId,
      });

      // Set the session as active first - this may help retrieve the user ID
      const sessionId = verifyResponse.createdSessionId || signUp.createdSessionId;
      if (sessionId) {
        await setActive({ session: sessionId });

        // After setting session active, try to get userId from signUp again
        if (!clerkUserId) {
          // Small delay to allow session to fully activate
          await new Promise((resolve) => setTimeout(resolve, 500));
          clerkUserId = signUp.createdUserId;
          console.log('Clerk user ID (after session):', clerkUserId);
        }
      }

      if (!clerkUserId) {
        console.error('No createdUserId found after verification');
        // Redirect to sign-in - Clerk account was created, they just need to sign in
        // The webhook will handle syncing when they sign in
        setError('Account created successfully! Please sign in with your new password.');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
        return;
      }

      // Update the user record in Convex
      await activateUserAccount({
        activationToken: params.token,
        clerkId: clerkUserId,
      });

      // Redirect based on user role
      const userRole = userWithToken?.role || 'user';
      setTimeout(() => {
        switch (userRole) {
          case 'super_admin':
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
      console.error('Verification error:', err);
      console.error('Full error object:', JSON.stringify(err, null, 2));

      const errorCode = err?.errors?.[0]?.code;
      const errorMessage = err?.errors?.[0]?.message || err?.errors?.[0]?.longMessage;

      console.error('Error code:', errorCode);
      console.error('Error message:', errorMessage);

      if (errorCode === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.');
      } else if (errorCode === 'verification_expired') {
        setError('Verification code has expired. Click "Resend Code" to get a new one.');
      } else if (errorCode === 'verification_failed') {
        setError(
          'Verification failed. Please click "Resend Code" and try again with the new code.',
        );
      } else if (errorMessage) {
        setError(errorMessage);
      } else {
        setError(err.message || 'Failed to verify email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Step 1: Create Clerk account with the password
      console.log('Creating Clerk account for email:', email);
      const signUpResponse = await signUp.create({
        emailAddress: email,
        password: password,
      });

      console.log('SignUp create response:', {
        status: signUpResponse.status,
        missingFields: signUpResponse.missingFields,
        unverifiedFields: signUpResponse.unverifiedFields,
      });

      // Step 2: Handle email verification if required
      if (signUpResponse.status === 'missing_requirements') {
        console.log('Email verification required, preparing...');
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });
        console.log('Verification email sent successfully');

        // Show verification code input
        setNeedsVerification(true);
        setIsLoading(false);
        setError('');
        return;
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
      setSuccessMessage('Account activated successfully! Redirecting...');

      // Redirect to appropriate dashboard
      setTimeout(() => {
        switch (userRole) {
          case 'super_admin':
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
          setError(
            'This password has been found in data breaches. Please choose a more secure password.',
          );
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
            <CardDescription>This activation link is invalid or has expired.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Activation links expire after 24 hours. Please contact your administrator to receive
                a new activation email.
              </AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              <Button onClick={() => router.push('/sign-in')} variant="default" className="w-full">
                Go to Sign In
              </Button>
              <Button onClick={() => router.push('/contact')} variant="outline" className="w-full">
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
          <CardTitle>Set Your Password</CardTitle>
          <CardDescription>Create a password to activate your account</CardDescription>
        </CardHeader>
        <CardContent>
          {!needsVerification && (
            <form onSubmit={handleActivate} className="space-y-4">
              {/* Email (readonly) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-gray-50" />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Choose a strong password"
                    required
                    disabled={isLoading}
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500">Must be at least 8 characters long</p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
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

              {/* Success Alert */}
              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting Up Your Account...
                  </>
                ) : (
                  'Set Password & Activate'
                )}
              </Button>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-500">
                <p>
                  Having trouble?{' '}
                  <a href="/contact" className="text-primary hover:underline">
                    Contact support
                  </a>
                </p>
              </div>
            </form>
          )}

          {needsVerification && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <Alert>
                <AlertDescription>
                  We sent a 6-digit verification code to <strong>{email}</strong>. Please check your
                  email and enter the code below.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="Enter 6-digit code"
                  required
                  disabled={isLoading}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-gray-500">Enter the 6-digit code from your email.</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {successMessage && (
                <Alert>
                  <AlertDescription>{successMessage}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || verificationCode.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Complete Activation'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={async () => {
                  if (!signUp) return;
                  setIsLoading(true);
                  setError('');
                  setSuccessMessage('');
                  try {
                    await signUp.prepareEmailAddressVerification({
                      strategy: 'email_code',
                    });
                    setSuccessMessage('A new verification code has been sent to your email.');
                  } catch (err: any) {
                    setError('Failed to resend code. Please try again.');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
              >
                Resend Code
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
