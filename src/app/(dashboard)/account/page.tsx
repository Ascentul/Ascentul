'use client'

import React, { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'

// Import UI components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles,
  Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, Users, Settings
} from 'lucide-react'

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

// Password change form schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>

// Profile sections for completion tracking
const profileSections = [
  { id: 'work-history', title: 'Work History', icon: Building, completed: false },
  { id: 'education', title: 'Education', icon: GraduationCap, completed: false },
  { id: 'achievements', title: 'Achievements', icon: Trophy, completed: false },
  { id: 'skills', title: 'Skills', icon: BookOpen, completed: false },
  { id: 'certifications', title: 'Certifications', icon: Award, completed: false },
  { id: 'languages', title: 'Languages', icon: Languages, completed: false },
  { id: 'summary', title: 'Career Summary', icon: Users, completed: false },
  { id: 'location', title: 'Location Preferences', icon: MapPin, completed: false },
]

export default function AccountPage() {
  const { user: clerkUser } = useUser()
  const { user: userProfile, signOut } = useAuth()
  const { toast } = useToast()
  const updateUser = useMutation(api.users.updateUser)

  // State for dialogs
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [prices, setPrices] = useState<{ monthly?: { unit_amount: number; currency: string }; annual?: { unit_amount: number; currency: string } }>({})
  const [isPortalLoading, setIsPortalLoading] = useState(false)

  // Calculate profile completion
  const completedSections = profileSections.filter(section => section.completed).length
  const completionPercentage = (completedSections / profileSections.length) * 100

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || clerkUser?.firstName || '',
      email: userProfile?.email || clerkUser?.emailAddresses[0]?.emailAddress || '',
    },
  })

  // Password form
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })
  
  // Stripe: Payment Links for upgrade
  const openPaymentLink = (interval: 'monthly' | 'annual') => {
    try {
      setIsCheckoutLoading(true)
      const monthlyUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_MONTHLY
      const annualUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ANNUAL
      const base = interval === 'monthly' ? monthlyUrl : annualUrl
      if (base) {
        const url = new URL(base)
        // Help Stripe link the session to the current user for webhook reconciliation
        const email = userProfile?.email || clerkUser?.emailAddresses?.[0]?.emailAddress
        if (email) url.searchParams.set('prefilled_email', email)
        if (clerkUser?.id) url.searchParams.set('client_reference_id', clerkUser.id)
        window.location.href = url.toString()
        return
      }
      toast({ title: 'Payment link not configured', description: 'Please contact support.', variant: 'destructive' })
    } finally {
      setIsCheckoutLoading(false)
    }
  }

  // Fetch dynamic pricing from Stripe via API route
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch('/api/stripe/prices', { method: 'GET' })
        if (!res.ok) return
        const data = await res.json()
        setPrices(data || {})
      } catch (e) {
        // Silently fail; we can still show upgrade without amount
      }
    }
    fetchPrices()
  }, [])

  const formatAmount = (cents?: number, currency?: string) => {
    if (typeof cents !== 'number' || !currency) return ''
    try {
      return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(cents / 100)
    } catch {
      return `$${(cents / 100).toFixed(2)}`
    }
  }

  // Stripe: Open billing portal
  const handleManageBilling = async () => {
    try {
      setIsPortalLoading(true)
      const res = await fetch('/api/stripe/portal', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data?.url) {
        window.location.href = data.url
        return
      }
      throw new Error(data?.error || 'Failed to open billing portal')
    } catch (e) {
      console.error(e)
      toast({ title: 'Billing portal error', description: 'Please try again later.', variant: 'destructive' })
    } finally {
      setIsPortalLoading(false)
    }
  }
  
  const handleProfileUpdate = async (data: ProfileFormValues) => {
    setIsLoading(true)
    try {
      if (!clerkUser) throw new Error('No user found')

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          name: data.name,
          email: data.email,
        },
      })

      // Update Clerk user info if name changed
      if (data.name !== clerkUser.firstName) {
        await clerkUser.update({
          firstName: data.name.split(' ')[0],
          lastName: data.name.split(' ').slice(1).join(' ') || undefined,
        })
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'success',
      })
      setIsEditingProfile(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async (data: PasswordChangeFormValues) => {
    setIsLoading(true)
    try {
      if (!clerkUser) throw new Error('No user found')

      await clerkUser.updatePassword({
        newPassword: data.newPassword,
        currentPassword: data.currentPassword,
      })

      toast({
        title: 'Password changed',
        description: 'Your password has been changed successfully.',
        variant: 'success',
      })
      setIsChangingPassword(false)
      passwordForm.reset()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to change password. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSubscriptionBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'premium':
        return 'default'
      case 'pro':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!clerkUser || !userProfile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading your profile...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
              <CardDescription>
                Update your personal information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <p className="text-sm text-muted-foreground">{userProfile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <p className="text-sm text-muted-foreground capitalize">{userProfile.role}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Member Since</label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(userProfile.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsEditingProfile(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Career Profile Completion */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Career Profile Completion
              </CardTitle>
              <CardDescription>
                Complete your career profile to get better recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Profile Completion</span>
                  <span>{Math.round(completionPercentage)}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {profileSections.map((section) => {
                  const IconComponent = section.icon
                  return (
                    <div key={section.id} className="flex items-center gap-2 p-2 rounded-lg border">
                      <IconComponent className="h-4 w-4" />
                      <span className="text-sm flex-1">{section.title}</span>
                      {section.completed ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Plan
              </CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Current Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    You are currently on the {userProfile.subscription_plan} plan
                  </p>
                </div>
                <Badge variant={getSubscriptionBadgeVariant(userProfile.subscription_plan)}>
                  {userProfile.subscription_plan.charAt(0).toUpperCase() + userProfile.subscription_plan.slice(1)}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Status</h3>
                  <p className="text-sm text-muted-foreground">
                    Your subscription is {userProfile.subscription_status}
                  </p>
                </div>
                <Badge variant={userProfile.subscription_status === 'active' ? 'default' : 'destructive'}>
                  {userProfile.subscription_status}
                </Badge>
              </div>
              {userProfile.subscription_plan === 'free' ? (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Upgrade to Premium</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get access to advanced features, unlimited resumes, and priority support.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => openPaymentLink('monthly')} disabled={isCheckoutLoading}>
                      {isCheckoutLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>
                      ) : (
                        `Upgrade Monthly ${prices.monthly ? `- ${formatAmount(prices.monthly.unit_amount, prices.monthly.currency)}/mo` : ''}`
                      )}
                    </Button>
                    <Button variant="secondary" onClick={() => openPaymentLink('annual')} disabled={isCheckoutLoading}>
                      {isCheckoutLoading ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting...</>
                      ) : (
                        `Upgrade Annual ${prices.annual ? `- ${formatAmount(prices.annual.unit_amount, prices.annual.currency)}/yr` : ''}`
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-2">Manage Billing</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Update payment methods, view invoices, or change your plan.
                  </p>
                  <Button variant="outline" onClick={handleManageBilling} disabled={isPortalLoading}>
                    {isPortalLoading ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Opening...</>
                    ) : (
                      'Open Billing Portal'
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Change your account password
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setIsChangingPassword(true)}>
                    Change Password
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Sign Out</h3>
                    <p className="text-sm text-muted-foreground">
                      Sign out of your account on this device
                    </p>
                  </div>
                  <Button variant="outline" onClick={signOut}>
                    Sign Out
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information
            </DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <FormField
                control={profileForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditingProfile(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
              <FormField
                control={passwordForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your current password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter your new password" {...field} />
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters and include uppercase, lowercase, and a number.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={passwordForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Confirm your new password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsChangingPassword(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Changing...</> : 'Change Password'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
