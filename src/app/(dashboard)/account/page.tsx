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
  User, CreditCard, ShieldCheck, Edit, CheckCircle2, Loader2, Sparkles,
  Building, GraduationCap, Trophy, BookOpen, Award, Languages, MapPin, Users, Settings,
  Bell, Upload, Camera, Trash2, Download, AlertTriangle, Globe, Lock, Brain
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
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini')
  const [isSavingModel, setIsSavingModel] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)

  // Avatar mutations
  const generateAvatarUploadUrl = useMutation(api.avatar.generateAvatarUploadUrl)
  const updateUserAvatar = useMutation(api.avatar.updateUserAvatar)

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload an image file',
        variant: 'destructive',
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please upload an image smaller than 5MB',
        variant: 'destructive',
      })
      return
    }

    setIsUploadingAvatar(true)

    try {
      // Show preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Get upload URL from Convex
      const uploadUrl = await generateAvatarUploadUrl()

      // Upload file to Convex storage
      const uploadResult = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      })

      if (!uploadResult.ok) {
        throw new Error('Failed to upload image')
      }

      const { storageId } = await uploadResult.json()

      // Update user profile with new avatar
      if (clerkUser?.id) {
        await updateUserAvatar({
          clerkId: clerkUser.id,
          storageId,
        })

        toast({
          title: 'Avatar updated',
          description: 'Your profile picture has been updated successfully',
        })
      }
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      toast({
        title: 'Upload failed',
        description: error?.message || 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      })
      setPreviewUrl(null)
    } finally {
      setIsUploadingAvatar(false)
      // Reset file input
      e.target.value = ''
    }
  }

  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || clerkUser?.firstName || '',
      email: userProfile?.email || clerkUser?.emailAddresses[0]?.emailAddress || '',
      bio: userProfile?.bio || '',
      jobTitle: userProfile?.job_title || '',
      company: userProfile?.company || '',
      location: userProfile?.location || '',
      website: userProfile?.website || '',
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
          bio: data.bio || '',
          job_title: data.jobTitle || '',
          company: data.company || '',
          location: data.location || '',
          website: data.website || '',
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
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
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
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isUploadingAvatar}
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
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

          {/* AI Model Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model Configuration
              </CardTitle>
              <CardDescription>
                {userProfile?.role === 'super_admin' 
                  ? 'Configure which OpenAI model is used for AI features across the platform'
                  : 'Current AI model configuration for the platform'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!availableModels || !platformSettings ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading model information...</span>
                </div>
              ) : (
                <>
                  {userProfile?.role === 'super_admin' ? (
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
                  ) : (
                    <div className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Current Model</div>
                          <div className="text-sm text-muted-foreground">
                            {availableModels?.find(m => m.id === platformSettings.openai_model)?.name || 'Unknown Model'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
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
