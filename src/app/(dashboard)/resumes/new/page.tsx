'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function NewResumePage() {
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { toast } = useToast()

  const [title, setTitle] = useState('My Resume')
  const [saving, setSaving] = useState(false)

  // Initial resume template
  const [resumeContent, setResumeContent] = useState({
    personalInfo: {
      name: clerkUser?.fullName || '',
      email: clerkUser?.primaryEmailAddress?.emailAddress || '',
      phone: '',
      location: '',
      linkedin: '',
      github: ''
    },
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: [],
    certifications: []
  })

  const createResumeMutation = useMutation(api.resumes.createResume)

  const handleSave = async () => {
    if (!clerkUser?.id) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create a resume',
        variant: 'destructive'
      })
      return
    }

    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a title for your resume',
        variant: 'destructive'
      })
      return
    }

    setSaving(true)
    try {
      const resumeId = await createResumeMutation({
        clerkId: clerkUser.id,
        title: title.trim(),
        content: resumeContent,
        source: 'manual' as any,
        visibility: 'private' as any
      })

      toast({
        title: 'Success',
        description: 'Resume created successfully!'
      })

      // Redirect to edit page
      router.push(`/resumes/${resumeId}/edit`)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create resume',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const updatePersonalInfo = (field: string, value: string) => {
    setResumeContent(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value
      }
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/resumes">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Create New Resume</h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Resume
            </>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resume Details</CardTitle>
          <CardDescription>
            Start with the basics. You can add more details after creating the resume.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resume Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Resume Title</Label>
            <Input
              id="title"
              placeholder="e.g., Software Engineer Resume"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              This title is for your reference only and won't appear on the resume
            </p>
          </div>

          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={resumeContent.personalInfo.name}
                  onChange={(e) => updatePersonalInfo('name', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={resumeContent.personalInfo.email}
                  onChange={(e) => updatePersonalInfo('email', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  placeholder="+1 (555) 123-4567"
                  value={resumeContent.personalInfo.phone}
                  onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="New York, NY"
                  value={resumeContent.personalInfo.location}
                  onChange={(e) => updatePersonalInfo('location', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin">LinkedIn URL (Optional)</Label>
                <Input
                  id="linkedin"
                  placeholder="linkedin.com/in/johndoe"
                  value={resumeContent.personalInfo.linkedin}
                  onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="github">GitHub URL (Optional)</Label>
                <Input
                  id="github"
                  placeholder="github.com/johndoe"
                  value={resumeContent.personalInfo.github}
                  onChange={(e) => updatePersonalInfo('github', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Professional Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary (Optional)</Label>
            <Textarea
              id="summary"
              placeholder="Brief overview of your professional background and key strengths..."
              value={resumeContent.summary}
              onChange={(e) => setResumeContent(prev => ({
                ...prev,
                summary: e.target.value
              }))}
              rows={4}
            />
            <p className="text-sm text-muted-foreground">
              You can add work experience, education, and skills after creating the resume
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Need help getting started?</p>
              <p className="text-sm text-muted-foreground">
                You can also generate a resume using AI or upload an existing one
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/resumes?tab=generate-ai">
                <Button variant="outline">Generate with AI</Button>
              </Link>
              <Link href="/resumes?tab=upload-analyze">
                <Button variant="outline">Upload Existing</Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}