'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const requestPasswordReset = useMutation(api.password_reset.requestPasswordReset);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await requestPasswordReset({ email: data.email });
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Password reset request failed:', err);
      setError(err?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription>
              We've sent password reset instructions to your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 p-4 rounded-lg border bg-blue-50 border-blue-200">
              <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-900">
                If an account exists with the email you provided, you'll receive a password reset
                link shortly. Please check your spam folder if you don't see it in your inbox.
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground text-center">Didn't receive the email?</p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setIsSuccess(false);
                  form.reset();
                }}
              >
                Try another email
              </Button>
            </div>

            <div className="pt-4 border-t">
              <Link href="/sign-in">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to sign in
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Forgot your password?</CardTitle>
          <CardDescription>
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg border bg-red-50 border-red-200 text-sm text-red-900">
                  {error}
                </div>
              )}

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="your.email@example.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
                style={{ backgroundColor: '#0C29AB' }}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <div className="pt-4 border-t">
                <Link href="/sign-in">
                  <Button variant="ghost" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </Link>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Remember your password?{' '}
                <Link href="/sign-in" className="text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
