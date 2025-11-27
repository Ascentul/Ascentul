"use client"

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSignUp, useAuth } from '@clerk/nextjs'
import type { SignUpCreateParams } from '@clerk/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'
import Image from 'next/image'
import { Mail, CheckCircle, ArrowLeft, Eye, EyeOff, Users, Zap, BookOpen, Shield, Check } from 'lucide-react'
import { calculatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthText, getPasswordStrengthTextColor, type PasswordStrength } from '@/utils/password-strength'

// Shared signup form component
interface SignUpFormData {
  firstName: string
  lastName: string
  email: string
  password: string
}

interface FormUI {
  showPassword: boolean
  acceptTerms: boolean
}

interface SignUpFormProps {
  formData: SignUpFormData
  setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>
  formUI: FormUI
  setFormUI: React.Dispatch<React.SetStateAction<FormUI>>
  error: string | null
  submitting: boolean
  onSubmit: (e: React.FormEvent) => void
}

function SignUpForm({
  formData,
  setFormData,
  formUI,
  setFormUI,
  error,
  submitting,
  onSubmit,
}: SignUpFormProps) {
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>(0)

  useEffect(() => {
    if (formData.password) {
      setPasswordStrength(calculatePasswordStrength(formData.password))
    } else {
      setPasswordStrength(0)
    }
  }, [formData.password])

  const updateFormData = (field: keyof SignUpFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const updateFormUI = (field: keyof FormUI, value: boolean) => {
    setFormUI(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700">First Name</Label>
          <Input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            placeholder="John"
            className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue"
            required
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium text-zinc-700">Last Name</Label>
          <Input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            placeholder="Doe"
            className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-700">Email</Label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => updateFormData('email', e.target.value)}
          placeholder="john@example.com"
          className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue"
          required
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium text-zinc-700">Password</Label>
        <div className="relative">
          <Input
            type={formUI.showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={(e) => updateFormData('password', e.target.value)}
            placeholder="Create a strong password"
            className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue pr-10"
            required
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => updateFormUI('showPassword', !formUI.showPassword)}
            aria-label={formUI.showPassword ? 'Hide password' : 'Show password'}
          >
            {formUI.showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </div>
        {formData.password && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                  style={{ width: `${(passwordStrength / 5) * 100}%` }}
                />
              </div>
              <span className={`text-xs font-medium ${getPasswordStrengthTextColor(passwordStrength)}`}>
                {getPasswordStrengthText(passwordStrength)}
              </span>
            </div>
          </div>
        )}
        <p className="text-xs text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="acceptTerms"
          checked={formUI.acceptTerms}
          onCheckedChange={(checked) => updateFormUI('acceptTerms', checked === true)}
          className="border-brand-blue data-[state=checked]:bg-brand-blue data-[state=checked]:border-brand-blue"
        />
        <label htmlFor="acceptTerms" className="text-xs text-muted-foreground">
          I agree to the{' '}
          <Link href="/terms" className="underline text-brand-blue hover:text-brand-blue/80">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline text-brand-blue hover:text-brand-blue/80">
            Privacy Policy
          </Link>
        </label>
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
        {submitting ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-xs text-zinc-500 text-center">
        No charges today. Cancel anytime.
      </p>
    </form>
  )
}

export default function Page() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, signUp, setActive } = useSignUp()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const { toast } = useToast()

  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [formData, setFormData] = useState<SignUpFormData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  })
  const [formUI, setFormUI] = useState<FormUI>({
    showPassword: false,
    acceptTerms: false,
  })
  const [verificationCode, setVerificationCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resending, setResending] = useState(false)

  // University invite data from URL parameters
  const [universityInvite, setUniversityInvite] = useState<{
    university: string | null
    email: string | null
  }>({
    university: null,
    email: null,
  })

  // Pre-fill email and university from URL parameters if provided
  useEffect(() => {
    const inviteEmail = searchParams.get('email')
    const university = searchParams.get('university')

    if (inviteEmail) {
      setFormData(prev => ({ ...prev, email: inviteEmail }))
    }

    if (university || inviteEmail) {
      setUniversityInvite({
        university: university,
        email: inviteEmail,
      })
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

    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (!formUI.acceptTerms) {
      setError('You must accept the Terms of Service and Privacy Policy to continue')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    try {
      setSubmitting(true)
      // Build signup params with university metadata if applicable
      const signUpParams: SignUpCreateParams = {
        emailAddress: formData.email.trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      }

      // Pass university invite data to Clerk for webhook processing
      // This happens when user signs up via university invitation link (URL params)
      if (universityInvite.university) {
        signUpParams.unsafeMetadata = {
          universityInvite: {
            universityName: universityInvite.university,
            inviteEmail: universityInvite.email || formData.email,
          }
        }
      }

      const result = await signUp.create(signUpParams)

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

        // University invitation signup: Show appropriate message
        // Note: Webhook processes university access asynchronously after user creation
        // Access will be available shortly, but not guaranteed at this exact moment
        if (universityInvite.university) {
          toast({
            title: "Email verified successfully!",
            description: `Setting up your ${universityInvite.university} account. This may take a few moments.`,
          })
        } else {
          toast({
            title: "Email verified successfully!",
            description: "Welcome to Ascentful!",
          })
        }
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
            <div className="flex items-center justify-center gap-3 mb-6">
              <Image
                src="/logo.png"
                alt="Ascentful logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
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
                    We've sent a verification code to <strong>{formData.email}</strong>
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
      <div className="flex items-center justify-center p-6 lg:p-10 bg-gradient-to-br from-zinc-50 to-zinc-100/50">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Image
              src="/logo.png"
              alt="Ascentful logo"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <h1 className="text-2xl font-semibold tracking-tight text-brand-blue">Ascentful</h1>
          </div>
          <Card className="border-neutral-200/80 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-zinc-900">Create your account</CardTitle>
              <p className="text-sm text-zinc-600">Start your career journey today</p>
            </CardHeader>
            <CardContent>
              <SignUpForm
                formData={formData}
                setFormData={setFormData}
                formUI={formUI}
                setFormUI={setFormUI}
                error={error}
                submitting={submitting}
                onSubmit={onSubmitSignUp}
              />

              <div className="mt-6 pt-6 border-t border-zinc-200">
                <div className="text-center">
                  <p className="text-sm text-zinc-600">
                    Already have an account?{' '}
                    <Link href="/sign-in" className="text-brand-blue hover:underline font-medium">
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
      <div className="hidden lg:flex items-center justify-center p-10 bg-brand-blue">
        <div className="max-w-md text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Take Control of<br />Your Career Growth</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-white/95">Get AI coaching that adapts to your goals</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-white/95">Build standout resumes and cover letters fast</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-white/95">Track goals and see your progress clearly</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-white/95">Discover opportunities that match your path</span>
            </div>
            <div className="flex items-start gap-3">
              <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span className="text-white/95">Keep all your career details in one place</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
