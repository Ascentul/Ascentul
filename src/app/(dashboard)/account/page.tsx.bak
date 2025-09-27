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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
<<<<<<< HEAD
  User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles,
  Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, Users, Settings,
  Bell, Upload, Camera, Trash2, Download, AlertTriangle, Globe, Lock
=======
  User, ShieldCheck, Edit, CheckCircle2, Loader2, Settings, Brain
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
} from 'lucide-react'

// Profile form schema
const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  jobTitle: z.string().max(100, "Job title must be 100 characters or less").optional(),
  company: z.string().max(100, "Company must be 100 characters or less").optional(),
  location: z.string().max(100, "Location must be 100 characters or less").optional(),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal('')),
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


export default function AccountPage() {
  const { user: clerkUser } = useUser()
  const { user: userProfile, signOut } = useAuth()
  const { toast } = useToast()
  const updateUser = useMutation(api.users.updateUser)
  const updatePlatformSettings = useMutation(api.platform_settings.updatePlatformSettings)
  const platformSettings = useQuery(api.platform_settings.getPlatformSettings)
  const availableModels = useQuery(api.platform_settings.getAvailableOpenAIModels)

  // State for dialogs and settings
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
<<<<<<< HEAD
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false)
  const [prices, setPrices] = useState<{ monthly?: { unit_amount: number; currency: string }; annual?: { unit_amount: number; currency: string } }>({})
  const [isPortalLoading, setIsPortalLoading] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')

  // Notification preferences state
  const [notifications, setNotifications] = useState({
    emailMarketing: true,
    emailUpdates: true,
    emailSecurity: true,
    pushNotifications: true,
    weeklyDigest: true,
    goalReminders: true,
  })

  // Calculate profile completion
  const completedSections = profileSections.filter(section => section.completed).length
  const completionPercentage = (completedSections / profileSections.length) * 100
=======
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [isSavingModel, setIsSavingModel] = useState(false)
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || clerkUser?.firstName || '',
      email: userProfile?.email || clerkUser?.emailAddresses[0]?.emailAddress || '',
      bio: '',
      jobTitle: '',
      company: '',
      location: '',
      website: '',
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
  
  // Load current OpenAI model setting from platform settings
  useEffect(() => {
    if (platformSettings) {
      setSelectedModel(platformSettings.openai_model)
    }
  }, [platformSettings])
  
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

      // Update Clerk user info if first/last changed
      const [first, ...rest] = data.name.trim().split(/\s+/)
      const newFirst = first || null
      const newLast = rest.join(' ') || null

      const currentFirst = clerkUser.firstName || null
      const currentLast = clerkUser.lastName || null

      if (newFirst !== currentFirst || newLast !== currentLast) {
        await clerkUser.update({
          firstName: newFirst,
          lastName: newLast,
        })
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.',
        variant: 'success',
      })
      setIsEditingProfile(false)
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error?.errors?.[0]?.message || 'Failed to update profile. Please try again.',
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

<<<<<<< HEAD
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file.',
        variant: 'destructive',
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsUploadingAvatar(true)
      setAvatarFile(file)

      // Create preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)

      // In a real implementation, you would upload to your storage service here
      // For now, we'll just simulate the upload
      await new Promise(resolve => setTimeout(resolve, 1500))

      toast({
        title: 'Avatar updated',
        description: 'Your profile picture has been updated successfully.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleSaveNotifications = async () => {
    try {
      setSavingNotifications(true)

      // In a real implementation, you would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: 'Preferences saved',
        description: 'Your notification preferences have been updated.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences.',
        variant: 'destructive',
      })
    } finally {
      setSavingNotifications(false)
    }
  }

  const handleSavePrivacy = async () => {
    try {
      setSavingPrivacy(true)

      // In a real implementation, you would save to your backend
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: 'Privacy settings saved',
        description: 'Your privacy settings have been updated.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save privacy settings.',
        variant: 'destructive',
      })
    } finally {
      setSavingPrivacy(false)
    }
  }

  const handleDataExport = async () => {
    try {
      // In a real implementation, you would generate and download user data
      const userData = {
        profile: {
          name: userProfile?.name,
          email: userProfile?.email,
          bio: userProfile?.bio,
          jobTitle: userProfile?.job_title,
          company: userProfile?.company,
          location: userProfile?.location,
          website: userProfile?.website,
        },
        settings: {
          notifications,
          privacy: privacySettings,
        },
        exportDate: new Date().toISOString(),
      }

      const dataStr = JSON.stringify(userData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)

      const link = document.createElement('a')
      link.href = url
      link.download = `ascentful-data-export-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: 'Data exported',
        description: 'Your data has been exported successfully.',
        variant: 'success',
      })
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'Failed to export your data. Please try again.',
        variant: 'destructive',
      })
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
=======
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

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

<<<<<<< HEAD
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
=======
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
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
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={previewUrl || userProfile.profile_image || clerkUser?.imageUrl} />
                  <AvatarFallback className="text-lg">
                    {userProfile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{userProfile.name}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="capitalize">{userProfile.role}</Badge>
                    <span className="text-xs text-muted-foreground">
                      Member since {new Date(userProfile.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button onClick={() => setIsEditingProfile(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" disabled={isUploadingAvatar}>
                    <Camera className="h-4 w-4 mr-2" />
                    {isUploadingAvatar ? 'Uploading...' : 'Change Avatar'}
                  </Button>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Personal Information</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Full Name</label>
                      <p className="text-sm text-muted-foreground">{userProfile.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email Address</label>
                      <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Bio</label>
                      <p className="text-sm text-muted-foreground">No bio added yet</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium">Professional Details</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium">Job Title</label>
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Company</label>
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Location</label>
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Website</label>
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current AI Model Information - For All Users */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Information
              </CardTitle>
              <CardDescription>
                Current AI model configuration for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
<<<<<<< HEAD
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
                <div className="space-y-6">
                  <div className="text-center mb-6">
                    <h4 className="text-xl font-semibold mb-2">Upgrade Your Plan</h4>
                    <p className="text-muted-foreground">
                      Unlock advanced features to accelerate your career growth
                    </p>
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    {/* Monthly Plan Card */}
                    <Card className="relative hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Monthly Plan</CardTitle>
                            <CardDescription>Perfect for getting started</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">
                              {prices.monthly ? formatAmount(prices.monthly.unit_amount, prices.monthly.currency) : '$9.99'}
                            </div>
                            <div className="text-sm text-muted-foreground">/month</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Unlimited AI-powered resume reviews</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Advanced career goal tracking</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Premium cover letter templates</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Priority customer support</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Interview preparation tools</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Advanced network management</span>
                          </li>
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => openPaymentLink('monthly')}
                          disabled={isCheckoutLoading}
                        >
                          {isCheckoutLoading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                          ) : (
                            'Choose Monthly Plan'
                          )}
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Annual Plan Card (Recommended) */}
                    <Card className="relative hover:shadow-lg transition-shadow border-primary">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                          BEST VALUE
                        </span>
                      </div>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">Annual Plan</CardTitle>
                            <CardDescription>Save 17% with annual billing</CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold">
                              {prices.annual ? formatAmount(prices.annual.unit_amount, prices.annual.currency) : '$99'}
                            </div>
                            <div className="text-sm text-muted-foreground">/year</div>
                            <div className="text-xs text-green-600 font-medium">Save $20/year</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <ul className="space-y-3">
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Everything in Monthly Plan</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">2 months free (17% savings)</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Exclusive career coaching sessions</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Annual progress reports</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">Early access to new features</span>
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm">VIP support channel</span>
                          </li>
                        </ul>
                        <Button
                          className="w-full"
                          onClick={() => openPaymentLink('annual')}
                          disabled={isCheckoutLoading}
                        >
                          {isCheckoutLoading ? (
                            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...</>
                          ) : (
                            'Choose Annual Plan'
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      🔒 Secure payment powered by Stripe
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cancel anytime • 30-day money-back guarantee
                    </p>
                  </div>
=======
              {!platformSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading model information...</span>
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Current Model</div>
                      <div className="text-sm text-muted-foreground">
                        {availableModels?.find(m => m.id === platformSettings.openai_model)?.name || 'Unknown Model'}
                      </div>
                    </div>
                    {userProfile?.role === 'super_admin' && (
                      <div className="text-xs text-muted-foreground">
                        Super Admin: Configure below ↓
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* OpenAI Model Configuration - Super Admin Only */}
          {userProfile?.role === 'super_admin' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  OpenAI Model Configuration
                </CardTitle>
                <CardDescription>
                  Configure which OpenAI model is used for AI features across the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!availableModels || !platformSettings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                    <span>Loading model options...</span>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {availableModels.map((model) => (
                        <div
                          key={model.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedModel === model.id
                              ? 'border-primary bg-primary/5'
                              : 'border-muted hover:border-muted-foreground/30'
                          }`}
                          onClick={() => setSelectedModel(model.id)}
                        >
                          <div className="flex-1">
                            <div className="font-medium">{model.name}</div>
                            <div className="text-sm text-muted-foreground">{model.description}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Max tokens: {model.max_tokens?.toLocaleString()} • Cost: ${model.cost_per_1k_tokens}/1K tokens
                            </div>
                          </div>
                          <div className="ml-3">
                            {selectedModel === model.id ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        onClick={async () => {
                          if (!clerkUser?.id) return

                          setIsSavingModel(true)
                          try {
                            await updatePlatformSettings({
                              clerkId: clerkUser.id,
                              settings: {
                                openai_model: selectedModel,
                              },
                            })

                            toast({
                              title: 'Model Updated',
                              description: `OpenAI model set to ${availableModels.find(m => m.id === selectedModel)?.name}`,
                              variant: 'success',
                            })
                          } catch (error) {
                            console.error('Error updating model:', error)
                            toast({
                              title: 'Error',
                              description: 'Failed to update OpenAI model. Please try again.',
                              variant: 'destructive',
                            })
                          } finally {
                            setIsSavingModel(false)
                          }
                        }}
                        disabled={isSavingModel || selectedModel === platformSettings.openai_model}
                      >
                        {isSavingModel ? (
                          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                        ) : (
                          'Save Model Preference'
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

<<<<<<< HEAD
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Email Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Marketing emails</label>
                      <p className="text-xs text-muted-foreground">Receive emails about new features and tips</p>
                    </div>
                    <Switch
                      checked={notifications.emailMarketing}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailMarketing: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Product updates</label>
                      <p className="text-xs text-muted-foreground">Get notified when we ship new features</p>
                    </div>
                    <Switch
                      checked={notifications.emailUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailUpdates: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Security alerts</label>
                      <p className="text-xs text-muted-foreground">Important security and account notifications</p>
                    </div>
                    <Switch
                      checked={notifications.emailSecurity}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, emailSecurity: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">App Notifications</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Push notifications</label>
                      <p className="text-xs text-muted-foreground">Receive push notifications in your browser</p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, pushNotifications: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Weekly digest</label>
                      <p className="text-xs text-muted-foreground">Weekly summary of your progress and achievements</p>
                    </div>
                    <Switch
                      checked={notifications.weeklyDigest}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, weeklyDigest: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Goal reminders</label>
                      <p className="text-xs text-muted-foreground">Reminders to help you stay on track with your goals</p>
                    </div>
                    <Switch
                      checked={notifications.goalReminders}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, goalReminders: checked }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Privacy & Data
              </CardTitle>
              <CardDescription>
                Manage your privacy settings and data preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-medium">Profile Visibility</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Public profile</label>
                      <p className="text-xs text-muted-foreground">Make your profile visible to other users</p>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Show activity status</label>
                      <p className="text-xs text-muted-foreground">Let others see when you're active</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Show career progress</label>
                      <p className="text-xs text-muted-foreground">Display your achievements and milestones</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Data Management</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Download your data</label>
                      <p className="text-xs text-muted-foreground">Get a copy of all your data</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDataExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Analytics tracking</label>
                      <p className="text-xs text-muted-foreground">Help us improve by sharing anonymous usage data</p>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium text-red-600">Danger Zone</h4>
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium text-red-900">Delete account</label>
                      <p className="text-xs text-red-700">Permanently delete your account and all data</p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSavePrivacy} disabled={savingPrivacy}>
                  {savingPrivacy ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {savingPrivacy ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
=======
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378

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
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
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
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={profileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about yourself..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description about yourself (max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Google" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. San Francisco, CA" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://yourwebsite.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
