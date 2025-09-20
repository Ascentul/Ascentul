"use client"

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn, useAuth } from '@clerk/nextjs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function Page() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const { isLoaded: authLoaded, isSignedIn } = useAuth()
  const [tab, setTab] = useState<'regular' | 'university'>('regular')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // If a session already exists, redirect to dashboard to avoid Clerk "session_exists" errors
  useEffect(() => {
    if (authLoaded && isSignedIn) {
      router.replace('/dashboard')
    }
  }, [authLoaded, isSignedIn, router])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isLoaded) return
    try {
      setSubmitting(true)
      const result = await signIn.create({ identifier: email, password })
      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId })
        router.replace('/dashboard')
      } else {
        setError('Additional verification required. Please continue in the next step.')
      }
    } catch (err: any) {
      const code = err?.errors?.[0]?.code
      if (code === 'session_exists') {
        // A session already exists; just proceed to the dashboard
        router.replace('/dashboard')
        return
      }
      const msg = err?.errors?.[0]?.longMessage || err?.message || 'Sign in failed'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
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
              <CardTitle className="text-xl">Sign In</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="w-full">
                <TabsList className="grid grid-cols-2 mb-4">
                  <TabsTrigger value="regular">Regular Login</TabsTrigger>
                  <TabsTrigger value="university">University Login</TabsTrigger>
                </TabsList>

                {/* Both tabs share the same form for now */}
                <TabsContent value="regular" className="space-y-4">
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                  <p className="text-sm text-center text-muted-foreground">
                    Don’t have an account?{' '}
                    <Link href="/sign-up" className="underline">Sign up</Link>
                  </p>
                </TabsContent>

                <TabsContent value="university" className="space-y-4">
                  <form onSubmit={onSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label>University Email</Label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@university.edu" required />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground">If your account is part of a university plan, you’ll be redirected to the University dashboard after sign-in.</p>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right: Marketing Panel */}
      <div className="hidden lg:flex items-center justify-center bg-primary text-primary-foreground p-10">
        <div className="max-w-md">
          <h2 className="text-3xl font-bold mb-4">Accelerate Your Career Journey</h2>
          <p className="opacity-90 mb-6">
            Your all-in-one platform for career development, resume building, interview preparation, and professional growth.
          </p>
          <ul className="space-y-3 text-sm">
            <li>✔ AI-powered career coaching and goal tracking</li>
            <li>✔ Resume and cover letter builder with AI suggestions</li>
            <li>✔ Interactive interview preparation tools</li>
            <li>✔ Gamified learning with XP and achievements</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
