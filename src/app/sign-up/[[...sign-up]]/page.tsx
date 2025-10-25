"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignUp, useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import { Mail, CheckCircle, ArrowLeft, Eye, EyeOff, Chrome, Users, Zap, BookOpen, Shield } from 'lucide-react'

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { toast } = useToast()

  const [tab, setTab] = useState<'regular' | 'university'>('regular')
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [resending, setResending] = useState(false)

  // University invitation parameters from URL
  const [universityInvite, setUniversityInvite] = useState<{
    email?: string
    university?: string
  }>({})


  // Password strength functions
  const calculatePasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.match(/[a-z]/)) strength += 1
    if (password.match(/[A-Z]/)) strength += 1
    if (password.match(/[0-9]/)) strength += 1
    if (password.match(/[^a-zA-Z0-9]/)) strength += 1
    return strength
  }

  const getPasswordStrengthColor = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return 'bg-red-500'
      case 2: return 'bg-orange-500'
      case 3: return 'bg-yellow-500'
      case 4: return 'bg-blue-500'
      case 5: return 'bg-green-500'
      default: return 'bg-gray-300'
    }
  }

  const getPasswordStrengthText = (strength: number) => {
    switch (strength) {
      case 0:
      case 1: return 'Very weak'
      case 2: return 'Weak'
      case 3: return 'Fair'
      case 4: return 'Good'
      case 5: return 'Strong'
      default: return ''
    }
  }

  // Check for university invitation parameters in URL
  useEffect(() => {
    const inviteEmail = searchParams.get('email')
    const inviteUniversity = searchParams.get('university')

    if (inviteEmail || inviteUniversity) {
      setUniversityInvite({
        email: inviteEmail || undefined,
        university: inviteUniversity || undefined,
      })

      // Pre-fill email and switch to university tab
      if (inviteEmail) {
        setEmail(inviteEmail)
        setTab('university')
      }
    }
  }, [searchParams])

  // If a session already exists, redirect to dashboard
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard')
    }
  }, [authLoaded, isSignedIn, router])

  const onSubmitSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isLoaded) return

    // Basic validation
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    // Check for university email if university tab is selected
    if (tab === 'university') {
      const universityDomains = ['.edu', '.ac.', 'university', 'college']
      const isUniversityEmail = universityDomains.some(domain => email.toLowerCase().includes(domain))
      if (!isUniversityEmail) {
        setError('Please use a valid university email address for University signup')
        return
      }
    }

    try {
      setSubmitting(true)
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      })

      if (result.status === 'missing_requirements') {
        // Send email verification
        await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
        setStep('verify')
        toast({
          title: "Verification email sent",
          description: "Please check your email and enter the verification code.",
        })
      } else if (result.status === 'complete') {
        // Sign up completed without email verification required
        await setActive({ session: result.createdSessionId })
        toast({
          title: "Account created successfully!",
          description: "Welcome to Ascentful!",
        })
        router.replace('/onboarding')
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      if (code === 'form_identifier_exists') {
        setError('An account with this email already exists. Please sign in instead.')
      } else if (code === 'form_password_pwned') {
        setError('This password has been found in a data breach. Please choose a different password.')
      } else if (code === 'form_password_too_common') {
        setError('This password is too common. Please choose a stronger password.')
      } else {
        const msg = err?.errors?.[0]?.longMessage || err?.message || 'Sign up failed'
        setError(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const onSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isLoaded) return

    if (!verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    try {
      setVerifying(true)
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode,
      })

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })

        // If this is a university invitation signup, link the student to their university
        if (universityInvite.email && universityInvite.university) {
          try {
            // Call API to activate pending university student account
            const response = await fetch('/api/university/activate-student', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                email: email,
                clerkId: result.createdUserId,
              }),
            })

            if (response.ok) {
              toast({
                title: "Welcome to your university!",
                description: `You now have premium access through ${universityInvite.university}`,
              })
            }
          } catch (activationError) {
            console.error('Failed to activate university student:', activationError)
            // Don't fail the signup if activation fails - user can still use the app
          }
        }

        toast({
          title: "Email verified successfully!",
          description: "Welcome to Ascentful!",
        })
        router.replace('/onboarding')
      } else {
        setError('Verification failed. Please try again.')
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      if (code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.')
      } else if (code === 'verification_expired') {
        setError('Verification code has expired. Please request a new one.')
      } else {
        const msg = err?.errors?.[0]?.longMessage || err?.message || 'Verification failed'
        setError(msg)
      }
    } finally {
      setVerifying(false)
    }
  }

  const resendVerificationCode = async () => {
    if (!isLoaded || resending) return

    try {
      setResending(true)
      setError(null)
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      toast({
        title: "Verification code sent",
        description: "A new verification code has been sent to your email.",
      })
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Failed to resend code'
      setError(msg)
    } finally {
      setResending(false)
    }
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
        {/* Left: Verification Form */}
        <div className="flex items-center justify-center p-6 lg:p-10 bg-white">
          <div className="w-full max-w-md">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold tracking-tight">Ascentful</h1>
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2 text-center justify-center">
                  <Mail className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl">Verify your email</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    We've sent a verification code to <strong>{email}</strong>
                  </p>
                </div>

                <form onSubmit={onSubmitVerification} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      maxLength={6}
                      className="text-center text-lg tracking-widest"
                      required
                    />
                  </div>

                  {error && (
                    <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      {error}
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={verifying}>
                    {verifying ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify Email'
                    )}
                  </Button>
                </form>

                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Didn't receive the code?
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resendVerificationCode}
                    disabled={resending}
                  >
                    {resending ? 'Sending...' : 'Resend code'}
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep('signup')}
                    className="text-muted-foreground"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to sign up
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right: Marketing Panel */}
        <div className="hidden lg:flex items-center justify-center bg-primary text-primary-foreground p-10">
          <div className="max-w-md">
            <h2 className="text-3xl font-bold mb-4">Almost there!</h2>
            <p className="opacity-90 mb-6">
              Just one more step to unlock your personalized career development journey.
            </p>
            <div className="flex items-center gap-3 text-sm opacity-90">
              <CheckCircle className="h-5 w-5" />
              <span>Secure email verification</span>
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
              <CardTitle className="text-xl">Create your account</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="regular">Personal Account</TabsTrigger>
                  <TabsTrigger value="university">University Account</TabsTrigger>
                </TabsList>

                <TabsContent value="regular" className="space-y-4">
                  <form onSubmit={onSubmitSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            setPasswordStrength(calculatePasswordStrength(e.target.value))
                          }}
                          placeholder="Create a strong password"
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
                      {password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              passwordStrength <= 2 ? 'text-red-600' :
                              passwordStrength <= 3 ? 'text-yellow-600' :
                              passwordStrength <= 4 ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {getPasswordStrengthText(passwordStrength)}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="acceptTerms" className="text-xs text-muted-foreground">
                        I agree to the{' '}
                        <Link href="/terms" className="underline text-primary">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline text-primary">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    {error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="university" className="space-y-4">
                  <form onSubmit={onSubmitSignUp} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder="John"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Doe"
                          required
                        />
                      </div>
                    </div>
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
                      <Label>Password</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value)
                            setPasswordStrength(calculatePasswordStrength(e.target.value))
                          }}
                          placeholder="Create a strong password"
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
                      {password && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                                style={{ width: `${(passwordStrength / 5) * 100}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${
                              passwordStrength <= 2 ? 'text-red-600' :
                              passwordStrength <= 3 ? 'text-yellow-600' :
                              passwordStrength <= 4 ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {getPasswordStrengthText(passwordStrength)}
                            </span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters long
                      </p>
                    </div>

                    <div className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        id="acceptTermsUniversity"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="mt-1"
                      />
                      <label htmlFor="acceptTermsUniversity" className="text-xs text-muted-foreground">
                        I agree to the{' '}
                        <Link href="/terms" className="underline text-primary">
                          Terms of Service
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline text-primary">
                          Privacy Policy
                        </Link>
                      </label>
                    </div>

                    {error && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                        {error}
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Creating account...' : 'Create University Account'}
                    </Button>
                  </form>

                  <div className="text-xs text-muted-foreground bg-blue-50 p-3 rounded-md">
                    <strong>University Account Benefits:</strong>
                    <ul className="mt-1 space-y-1">
                      <li>• Access to university-specific resources</li>
                      <li>• Connect with classmates and alumni</li>
                      <li>• Enhanced career services integration</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="mt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/sign-in" className="underline font-medium">
                      Sign in
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
          <h2 className="text-3xl font-bold mb-4">Start Your Career Journey</h2>
          <p className="opacity-90 mb-6">
            Join thousands of professionals and students who are accelerating their career growth with Ascentful.
          </p>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI-Powered Tools</h3>
                <p className="text-sm opacity-90">Get personalized career guidance and resume optimization</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Expert Resources</h3>
                <p className="text-sm opacity-90">Access professional templates and interview prep</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Network Building</h3>
                <p className="text-sm opacity-90">Connect with peers and industry professionals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure & Private</h3>
                <p className="text-sm opacity-90">Your data is protected with enterprise-grade security</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
