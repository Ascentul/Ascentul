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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  User, Briefcase, MapPin, Calendar, Edit, CheckCircle2, Loader2, Settings, GraduationCap
} from 'lucide-react'

// Career profile form schema
const careerProfileFormSchema = z.object({
  currentPosition: z.string().optional(),
  currentCompany: z.string().optional(),
  location: z.string().optional(),
  industry: z.string().optional(),
  experienceLevel: z.enum(['entry', 'mid', 'senior', 'executive']).optional(),
  bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
  skills: z.string().optional(),
  careerGoals: z.string().max(300, "Career goals must be less than 300 characters").optional(),
})

type CareerProfileFormValues = z.infer<typeof careerProfileFormSchema>

export default function CareerProfilePage() {
  const { user: clerkUser } = useUser()
  const { user: userProfile } = useAuth()
  const { toast } = useToast()
  const updateUser = useMutation(api.users.updateUser)

  // State for editing
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Career profile form
  const careerProfileForm = useForm<CareerProfileFormValues>({
    resolver: zodResolver(careerProfileFormSchema),
    defaultValues: {
      currentPosition: '',
      currentCompany: '',
      location: '',
      industry: '',
      experienceLevel: 'mid',
      bio: '',
      skills: '',
      careerGoals: '',
    },
  })

  // Load user data into form when available
  useEffect(() => {
    if (userProfile) {
      const profile = userProfile as any
      careerProfileForm.reset({
        currentPosition: profile.current_position || '',
        currentCompany: profile.current_company || '',
        location: profile.location || '',
        industry: profile.industry || '',
        experienceLevel: (profile.experience_level as 'entry' | 'mid' | 'senior' | 'executive') || 'mid',
        bio: profile.bio || '',
        skills: profile.skills || '',
        careerGoals: profile.career_goals || '',
      })
    }
  }, [userProfile, careerProfileForm])

  const handleProfileUpdate = async (data: CareerProfileFormValues) => {
    setIsLoading(true)
    try {
      if (!clerkUser) throw new Error('No user found')

      await updateUser({
        clerkId: clerkUser.id,
        updates: {
          current_position: data.currentPosition,
          current_company: data.currentCompany,
          location: data.location,
          industry: data.industry,
          experience_level: data.experienceLevel,
          bio: data.bio,
          skills: data.skills,
          career_goals: data.careerGoals,
        } as any,
      })

      toast({
        title: 'Career Profile updated',
        description: 'Your career profile has been updated successfully.',
        variant: 'success',
      })
      setIsEditingProfile(false)
    } catch (error: any) {
      console.error('Profile update error:', error)
      toast({
        title: 'Error',
        description: error?.errors?.[0]?.message || 'Failed to update career profile. Please try again.',
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
          <p className="text-muted-foreground mb-4">Loading your career profile...</p>
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-4" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">Career Profile</h1>
        <p className="text-muted-foreground">
          Manage your professional profile and career information
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Career Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Profile Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Overview
              </CardTitle>
              <CardDescription>
                Your professional summary and key information
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
                  <label className="text-sm font-medium">Current Position</label>
                  <p className="text-sm text-muted-foreground">{(userProfile as any).current_position || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Current Company</label>
                  <p className="text-sm text-muted-foreground">{(userProfile as any).current_company || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <p className="text-sm text-muted-foreground">{(userProfile as any).location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Experience Level</label>
                  <Badge variant="secondary" className="capitalize">
                    {(userProfile as any).experience_level || 'Not specified'}
                  </Badge>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={() => setIsEditingProfile(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Career Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Professional Bio */}
          {(userProfile as any).bio && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional Bio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {(userProfile as any).bio}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {(userProfile as any).skills && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Skills & Expertise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {(userProfile as any).skills}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="details" className="space-y-6">
          {/* Career Goals */}
          {(userProfile as any).career_goals && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" />
                  Career Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {(userProfile as any).career_goals}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Account Information
              </CardTitle>
              <CardDescription>
                Account creation and role information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="text-sm font-medium">Subscription Plan</label>
                  <p className="text-sm text-muted-foreground">{userProfile.subscription_plan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Last Updated</label>
                  <p className="text-sm text-muted-foreground">
                    {userProfile.updated_at ? new Date(userProfile.updated_at).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Career Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Career Profile</DialogTitle>
            <DialogDescription>
              Update your professional information and career details
            </DialogDescription>
          </DialogHeader>
          <Form {...careerProfileForm}>
            <form onSubmit={careerProfileForm.handleSubmit(handleProfileUpdate)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={careerProfileForm.control}
                  name="currentPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Position</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Software Engineer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={careerProfileForm.control}
                  name="currentCompany"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Company</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={careerProfileForm.control}
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
                  control={careerProfileForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Technology" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={careerProfileForm.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <FormControl>
                      <select {...field} className="w-full px-3 py-2 text-sm border rounded-md">
                        <option value="entry">Entry Level</option>
                        <option value="mid">Mid Level</option>
                        <option value="senior">Senior Level</option>
                        <option value="executive">Executive Level</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={careerProfileForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professional Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your professional background and experience..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief professional summary (max 500 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={careerProfileForm.control}
                name="skills"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Skills & Expertise</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="List your key skills, technologies, and areas of expertise..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Separate skills with commas
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={careerProfileForm.control}
                name="careerGoals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Career Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="What are your short-term and long-term career objectives?"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your career aspirations and goals (max 300 characters)
                    </FormDescription>
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
    </div>
  )
}
