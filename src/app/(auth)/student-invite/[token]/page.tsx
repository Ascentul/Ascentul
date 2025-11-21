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

      const signUpResponse = await signUp.create({
        emailAddress: email,
        password,
      });

      const clerkUserId = signUpResponse.createdUserId;
      if (!clerkUserId) {
        throw new Error('Failed to create account. Please try again.');
      }

      try {
        await acceptInvite({ token: params.token, clerkId: clerkUserId });
      } catch (inviteErr: any) {
        // TODO: Clean up Clerk account or log for manual cleanup
        console.error('Invite acceptance failed after account creation:', inviteErr);
        setError('Account created but invite acceptance failed. Please contact support.');
        return;
      }

      if (signUpResponse.createdSessionId) {
        await setActive({ session: signUpResponse.createdSessionId });
      }

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

          {!isSignedIn && (
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
