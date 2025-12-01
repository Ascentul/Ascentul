'use client';

import { useSignIn } from '@clerk/nextjs';
import { ArrowLeft, Eye, EyeOff, KeyRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Clerk reset codes are 6 digits
const RESET_CODE_LENGTH = 6;

interface ResetPasswordFormProps {
  successMessage?: string;
  onBack: () => void;
}

export function ResetPasswordForm({ successMessage, onBack }: ResetPasswordFormProps) {
  const router = useRouter();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { toast } = useToast();

  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!isLoaded) return;

    if (!resetCode.trim() || !newPassword.trim()) {
      setError('Please enter both the reset code and new password');
      return;
    }

    if (!/^\d{6}$/.test(resetCode.trim())) {
      setError('Reset code must be 6 digits');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setResettingPassword(true);
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast({
          title: 'Password reset successful!',
          description: 'You have been signed in with your new password.',
        });
        router.replace('/dashboard');
      } else {
        setError('Password reset failed. Please try again.');
      }
    } catch (err: unknown) {
      const clerkError = err as {
        errors?: Array<{ code?: string; longMessage?: string }>;
        message?: string;
      };
      const code = clerkError?.errors?.[0]?.code;
      if (code === 'form_code_incorrect') {
        setError('Incorrect reset code. Please check your email and try again.');
      } else if (code === 'form_password_pwned') {
        setError(
          'This password has been found in a data breach. Please choose a different password.',
        );
      } else {
        const msg =
          clerkError?.errors?.[0]?.longMessage || clerkError?.message || 'Password reset failed';
        setError(msg);
      }
    } finally {
      setResettingPassword(false);
    }
  };

  return (
    <Card className="border-neutral-200/80 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 text-center justify-center">
          <KeyRound className="h-5 w-5 text-brand-blue" />
          <CardTitle className="text-2xl font-semibold text-zinc-900">
            Create new password
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {successMessage && (
          <div className="text-sm text-green-600 bg-green-50 p-3 rounded-xl border border-green-200">
            {successMessage}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-700">Reset Code</Label>
            <Input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="Enter code from email"
              maxLength={RESET_CODE_LENGTH}
              className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue text-center text-lg tracking-widest"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-700">New Password</Label>
            <div className="relative">
              <Input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Must be at least 8 characters long</p>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 active:bg-black/95 focus-visible:ring-2 focus-visible:ring-black/20 shadow-md hover:shadow-lg transition-all"
            disabled={resettingPassword}
          >
            {resettingPassword ? 'Resetting password...' : 'Reset Password'}
          </Button>
        </form>

        <div className="text-center">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
