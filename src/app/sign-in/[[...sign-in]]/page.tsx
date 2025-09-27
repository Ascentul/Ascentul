"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn, useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Eye, EyeOff, Mail, ArrowLeft, KeyRound } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<'regular' | 'university'>('regular')
  const [step, setStep] = useState<'signin' | 'forgot' | 'reset'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendingReset, setSendingReset] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // If a session already exists, redirect to dashboard to avoid Clerk "session_exists" errors
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard')
    }
  }, [authLoaded, isSignedIn, router])

  // Clear any cached authentication data on component mount
  useEffect(() => {
    // Clear localStorage and sessionStorage to prevent cached auth issues
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
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
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        })
        router.replace('/dashboard')
      } else {
        setError('Additional verification required. Please continue in the next step.')
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      if (code === 'session_exists') {
        // A session already exists; let AdminRedirect component handle routing
        router.replace('/dashboard')
        return
      } else if (code === 'form_identifier_not_found') {
        setError('No account found with this email address. Please check your email or sign up.')
      } else if (code === 'form_password_incorrect') {
        setError('Incorrect password. Please try again or reset your password.')
      } else if (code === 'too_many_requests') {
        setError('Too many failed attempts. Please wait a moment before trying again.')
      } else {
        const msg = err?.errors?.[0]?.longMessage || err?.message || 'Sign in failed'
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    if (!isLoaded) return

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    try {
      setSendingReset(true)
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: email,
      })
      setStep('reset')
      setSuccessMessage(`We've sent a password reset code to ${email}`)
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      if (code === 'form_identifier_not_found') {
        setError('No account found with this email address. Please check your email or sign up.')
      } else {
        const msg = err?.errors?.[0]?.longMessage || err?.message || 'Failed to send reset email'
        setError(msg)
      }
    } finally {
      setSendingReset(false)
    }
  }

  const onSubmitResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMessage(null)
    if (!isLoaded) return

    if (!resetCode.trim() || !newPassword.trim()) {
      setError('Please enter both the reset code and new password')
      return
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setResettingPassword(true)
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
        password: newPassword,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        toast({
          title: "Password reset successful!",
          description: "You have been signed in with your new password.",
        })
        router.replace('/dashboard')
      } else {
        setError('Password reset failed. Please try again.')
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      if (code === 'form_code_incorrect') {
        setError('Incorrect reset code. Please check your email and try again.')
      } else if (code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
      } else {
        const msg = err?.errors?.[0]?.longMessage || err?.message || 'Password reset failed'
        setError(msg)
      }
    } finally {
      setResettingPassword(false)
    }
  }

  // Forgot Password Step
  if (step === 'forgot') {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Ascentful</h1>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-center justify-center">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Reset your password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter your email address and we'll send you a code to reset your password.
                  </p>
                </div>

                <form onSubmit={onSubmitForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={sendingReset}>
                    {sendingReset ? (
                      <>
                        <Mail className="mr-2 h-4 w-4 animate-pulse" />
                        Sending reset code...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>
                </form>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep('signin')
                      setError(null)
                      setSuccessMessage(null)
                    }}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign in
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-primary text-primary-foreground p-10">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4">Forgot your password?</h2>
            <p className="opacity-90 mb-6">
              No worries! We'll help you reset it quickly and securely so you can get back to your career journey.
            </p>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <KeyRound className="h-5 w-5" />
              <span>Secure password reset process</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset Password Step
  if (step === 'reset') {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Ascentful</h1>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-center justify-center">
                  <KeyRound className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Create new password</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {successMessage && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                    {successMessage}
                  </div>
                )}

                <form onSubmit={onSubmitResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Reset Code</Label>
                    <Input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter code from email"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="pr-10"
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
                    <p className="text-xs text-muted-foreground">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={resettingPassword}>
                    {resettingPassword ? 'Resetting password...' : 'Reset Password'}
                  </Button>
                </form>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep('forgot')
                      setError(null)
                      setSuccessMessage(null)
                    }}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-primary text-primary-foreground p-10">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4">Almost there!</h2>
            <p className="opacity-90 mb-6">
              Enter the code we sent to your email and create a new secure password.
            </p>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <KeyRound className="h-5 w-5" />
              <span>Your account security is our priority</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Form */}
      <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">Ascentful</h1>
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Welcome back</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="regular">Personal Login</TabsTrigger>
                  <TabsTrigger value="university">University Login</TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="space-y-4">
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                          onClick={() => {
                            setStep('forgot')
                            setError(null)
                            setSuccessMessage(null)
                          }}
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
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
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
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="university" className="space-y-4">
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>University Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="student@university.edu"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Use your official university email address
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Password</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-primary hover:bg-transparent"
                          onClick={() => {
                            setStep('forgot')
                            setError(null)
                            setSuccessMessage(null)
                          }}
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
                          className="pr-10"
                          required
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
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
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="rememberMeUniversity"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <label htmlFor="rememberMeUniversity" className="text-sm text-muted-foreground">
                          Remember me
                        </label>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>

                  <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <strong>University Login:</strong> Access your university-specific dashboard and connect with your academic community.
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6 space-y-4">
                {/* Social Sign In Options */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="bg-white px-2 text-gray-500">Or sign in with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" className="w-full" disabled>
                    <Chrome className="h-4 w-4 mr-2" />
                    Google
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    <Users className="h-4 w-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <Link href="/sign-up" className="underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right: Marketing Panel */}
      <div className="hidden lg:flex items-center justify-center bg-primary text-primary-foreground p-10">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
          <p className="opacity-90 mb-6">
            Continue your career development journey with AI-powered tools and personalized insights.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm opacity-90">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Clock className="h-4 w-4" />
              </div>
              <span>Continue where you left off</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Users className="h-4 w-4" />
              </div>
              <span>Access your personalized dashboard</span>
            </div>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Shield className="h-4 w-4" />
              </div>
              <span>Secure, encrypted login</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}