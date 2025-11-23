'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useSignUp } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface PageProps {
  params: { token: string };
}

export default function StudentInvitePage({ params }: PageProps) {
  const router = useRouter();
  const invite = useQuery(api.students.validateInviteToken, { token: params.token });
  const acceptInvite = useMutation(api.students.acceptInvite);
  const { isSignedIn, userId } = useAuth();
  const { signUp, isLoaded: clerkLoaded, setActive } = useSignUp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [needsVerification, setNeedsVerification] = useState(false);

  const validInvite = useMemo(() => invite && invite.valid, [invite]);

  useEffect(() => {
    if (invite?.valid && invite.email) {
      setEmail(invite.email);
    }
  }, [invite]);

  const handleAcceptWithExistingAccount = async () => {
    if (!userId || !validInvite) return;
    try {
      setIsLoading(true);
      setError('');
      await acceptInvite({ token: params.token, clerkId: userId });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to accept invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkLoaded || !signUp || !validInvite) {
      setError('Please try again.');
      return;
    }

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Attempt email verification
      const verifyResponse = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      });

      // Get the Clerk user ID
      const clerkUserId = verifyResponse.createdUserId;
      if (!clerkUserId) {
        throw new Error('Failed to verify email. Please try again.');
      }

      // Accept the invite in Convex
      try {
        await acceptInvite({ token: params.token, clerkId: clerkUserId });
      } catch (inviteErr: any) {
        console.error('Invite acceptance failed after verification:', inviteErr);

        // Check if it's a retryable error
        const errorMessage = inviteErr.message || inviteErr.toString();
        if (errorMessage.includes('already has a student profile')) {
          // User already accepted the invite - this is OK, proceed to login
          console.log('User already has student profile, proceeding to dashboard');
        } else {
          // Non-retryable error - show helpful message
          setError(
            `Unable to link your account to the university: ${errorMessage}. ` +
            `Your account was created successfully. Please contact your university administrator ` +
            `or email support@ascentful.io for assistance with linking your account.`
          );
          return;
        }
      }

      // Set the session as active
      if (verifyResponse.createdSessionId) {
        await setActive({ session: verifyResponse.createdSessionId });
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Verification error:', err);
      if (err?.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.');
      } else {
        setError(err.message || 'Failed to verify email. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkLoaded || !signUp || !validInvite) {
      setError('Invite not ready. Please try again.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      // Step 1: Create the Clerk account
      const signUpResponse = await signUp.create({
        emailAddress: email,
        password,
      });

      // Step 2: Handle email verification if required
      if (signUpResponse.status === 'missing_requirements') {
        // Prepare email verification
        await signUp.prepareEmailAddressVerification({
          strategy: 'email_code',
        });

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

      // Step 4: Accept the invite in Convex
      try {
        await acceptInvite({ token: params.token, clerkId: clerkUserId });
      } catch (inviteErr: any) {
        console.error('Invite acceptance failed after account creation:', inviteErr);

        // Check if it's a retryable error
        const errorMessage = inviteErr.message || inviteErr.toString();
        if (errorMessage.includes('already has a student profile')) {
          // User already accepted the invite - this is OK, proceed to login
          console.log('User already has student profile, proceeding to dashboard');
        } else {
          // Non-retryable error - show helpful message
          setError(
            `Unable to link your account to the university: ${errorMessage}. ` +
            `Your account was created successfully. Please contact your university administrator ` +
            `or email support@ascentful.io for assistance with linking your account.`
          );
          return;
        }
      }

      // Step 5: Set the session as active
      if (signUpResponse.createdSessionId) {
        await setActive({ session: signUpResponse.createdSessionId });
      }

      // Step 6: Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      if (err?.errors?.[0]?.code === 'form_identifier_exists') {
        setError('This email already has an account. Please sign in and use the invite.');
      } else {
        setError(err.message || 'Unable to complete invite.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (invite === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-gray-600">Checking your invite…</p>
        </div>
      </div>
    );
  }

  if (!validInvite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Invite unavailable</CardTitle>
            <CardDescription>
              This invite is invalid, expired, or already used.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                Ask your university advisor or admin to send a new invite.
              </AlertDescription>
            </Alert>
            <Button onClick={() => router.push('/sign-in')} className="w-full">
              Go to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Join {invite.universityName}</CardTitle>
          <CardDescription>
            Create your student account for {invite.universityName || 'your university'}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSignedIn && (
            <div className="mb-4 space-y-2">
              <Alert>
                <AlertDescription>
                  You are signed in. Accept this invite with your current account?
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleAcceptWithExistingAccount}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? 'Accepting invite...' : 'Accept with current account'}
              </Button>
            </div>
          )}

          {!isSignedIn && !needsVerification && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} disabled className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Create password</Label>
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
                <p className="text-xs text-gray-500">Must be at least 8 characters long.</p>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating your account...
                  </>
                ) : (
                  'Create account & join'
                )}
              </Button>
            </form>
          )}

          {!isSignedIn && needsVerification && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <Alert>
                <AlertDescription>
                  We sent a 6-digit verification code to <strong>{email}</strong>. Please check your email and enter the code below.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="verificationCode">Verification Code</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
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

              <Button type="submit" className="w-full" disabled={isLoading || verificationCode.length !== 6}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Complete Signup'
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

          {!isSignedIn && (
            <p className="text-xs text-gray-500 mt-4 text-center">
              Already have an account? <a href="/sign-in" className="text-primary hover:underline">Sign in and click this link again.</a>
            </p>
          )}

          {error && isSignedIn && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
