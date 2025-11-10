'use client'

import React, { useState } from 'react'
import { useSignIn } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Mail, ArrowLeft, KeyRound } from 'lucide-react'

interface ForgotPasswordFormProps {
  onBack: () => void
  onSuccess: (email: string) => void
}

export function ForgotPasswordForm({
  onBack,
  onSuccess,
}: ForgotPasswordFormProps) {
  const { isLoaded, signIn } = useSignIn()

  const [email, setEmail] = useState('')
  const [sendingReset, setSendingReset] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
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
      onSuccess(email)
    } catch (err: unknown) {
      const clerkError = err as { errors?: Array<{ code?: string; longMessage?: string }>; message?: string }
      const code = clerkError?.errors?.[0]?.code
      if (code === 'form_identifier_not_found') {
        setError('No account found with this email address. Please check your email or sign up.')
      } else {
        const msg = clerkError?.errors?.[0]?.longMessage || clerkError?.message || 'Failed to send reset email'
        setError(msg)
      }
    } finally {
      setSendingReset(false)
    }
  }

  return (
    <Card className="border-neutral-200/80 bg-white/80 backdrop-blur-sm shadow-lg rounded-xl">
      <CardHeader className="space-y-1 pb-6">
        <div className="flex items-center gap-2 text-center justify-center">
          <KeyRound className="h-5 w-5 text-brand-blue" />
          <CardTitle className="text-2xl font-semibold text-zinc-900">Reset your password</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-zinc-600 mb-4">
            Enter your email address and we'll send you a code to reset your password.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-zinc-700">Email Address</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="h-11 rounded-xl bg-white placeholder:text-zinc-400 focus-visible:ring-brand-blue"
              required
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-xl border border-destructive/20">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-black text-white hover:bg-black/90 active:bg-black/95 focus-visible:ring-2 focus-visible:ring-black/20 shadow-md hover:shadow-lg transition-all"
            disabled={sendingReset}
          >
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
            onClick={onBack}
            className="text-muted-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to sign in
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
