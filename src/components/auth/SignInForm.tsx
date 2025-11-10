'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

interface SignInFormProps {
  onForgotPassword: () => void
}

export function SignInForm({ onForgotPassword }: SignInFormProps) {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const { toast } = useToast()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isLoaded) return

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password')
      return
    }

    try {
      setSubmitting(true)
      const result = await signIn.create({ identifier: email, password })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast({
          title: 'Welcome back!',
          description: 'You have been successfully signed in.',
        })
        router.replace('/dashboard')
      } else if (result.status === 'needs_second_factor') {
        // Handle 2FA requirement - redirect to Clerk's built-in 2FA flow
        toast({
          title: 'Two-factor authentication required',
          description: 'Please complete two-factor authentication to continue.',
        })
        // Clerk will handle the 2FA flow through their components
        router.push('/sign-in/factor-one')
      } else if (result.status === 'needs_identifier') {
        setError('Additional identifier required. Please try signing in again.')
      } else {
        // Handle any other incomplete statuses
        console.warn('Unexpected sign-in status:', result.status)
        setError(`Sign in incomplete (${result.status}). Please try again or contact support if the issue persists.`)
      }
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string; longMessage?: string }>; message?: string }
      const code = clerkError?.errors?.[0]?.code
      if (code === 'session_exists') {
        router.replace('/dashboard')
        return
      } else if (code === 'form_identifier_not_found') {
        setError('No account found with this email address. Please check your email or sign up.')
      } else if (code === 'form_password_incorrect') {
        setError('Incorrect password. Please try again or reset your password.')
      } else if (code === 'too_many_requests') {
        setError('Too many failed attempts. Please wait a moment before trying again.')
      } else {
        const msg = clerkError?.errors?.[0]?.longMessage || clerkError?.message || 'Sign in failed'
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="border-neutral-200/80 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-semibold text-zinc-900">Welcome back</CardTitle>
        <p className="text-sm text-zinc-600">Sign in to continue your career journey</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-700">Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue"
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-zinc-700">Password</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-brand-blue hover:bg-transparent hover:underline"
                onClick={onForgotPassword}
              >
                Forgot password?
              </Button>
            </div>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 active:bg-black/95 focus-visible:ring-2 focus-visible:ring-black/20 shadow-md hover:shadow-lg transition-all"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-zinc-200">
          <div className="text-center">
            <p className="text-sm text-zinc-600">
              Don't have an account?{' '}
              <Link href="/sign-up" className="text-brand-blue hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
