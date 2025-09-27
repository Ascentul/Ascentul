'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
<<<<<<< HEAD
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import {
  School,
  Users,
  Bell,
  Shield,
  Settings,
  Mail,
  Globe,
  Save,
  Plus,
  Trash2,
  ExternalLink
} from 'lucide-react'

interface UniversitySettings {
  university_name: string
  domain: string
  description: string
  website_url?: string
  contact_email: string
  logo_url?: string
  student_limit: number
  email_notifications: boolean
  weekly_reports: boolean
  student_signup_enabled: boolean
  auto_approve_students: boolean
  linkedin_integration: boolean
  custom_branding: boolean
}

interface AdminUser {
  _id: string
  email: string
  name?: string
  role: string
  last_active?: number
}

const initialSettings: UniversitySettings = {
  university_name: '',
  domain: '',
  description: '',
  website_url: '',
  contact_email: '',
  logo_url: '',
  student_limit: 500,
  email_notifications: true,
  weekly_reports: true,
  student_signup_enabled: true,
  auto_approve_students: false,
  linkedin_integration: false,
  custom_branding: false
}

export default function UniversitySettingsPage() {
  const { user } = useUser()
  const { toast } = useToast()
  const [settings, setSettings] = useState<UniversitySettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [addingAdmin, setAddingAdmin] = useState(false)

  // Mock data - replace with actual Convex queries
  const adminUsers: AdminUser[] = [
    {
      _id: '1',
      email: 'admin@university.edu',
      name: 'John Doe',
      role: 'university_admin',
      last_active: Date.now() - 86400000
    },
    {
      _id: '2',
      email: 'jane.smith@university.edu',
      name: 'Jane Smith',
      role: 'university_admin',
      last_active: Date.now() - 3600000
    }
  ]

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Settings saved",
        description: "University settings have been updated successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdminEmail.trim()) return

    setAddingAdmin(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      toast({
        title: "Admin added",
        description: `Invitation sent to ${newAdminEmail}`,
        variant: "success",
      })
      setNewAdminEmail('')
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add admin. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddingAdmin(false)
    }
  }

  const handleRemoveAdmin = async (adminId: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      toast({
        title: "Admin removed",
        description: "Admin user has been removed successfully.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove admin. Please try again.",
        variant: "destructive",
      })
    }
  }

  const formatLastActive = (timestamp?: number) => {
    if (!timestamp) return 'Never'
    const diff = Date.now() - timestamp
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days} day${days === 1 ? '' : 's'} ago`
    if (hours > 0) return `${hours} hour${hours === 1 ? '' : 's'} ago`
    return 'Just now'
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">University Settings</h1>
          <p className="text-muted-foreground">Manage your university configuration and preferences</p>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Admin Users
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                University Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="university_name">University Name *</Label>
                  <Input
                    id="university_name"
                    value={settings.university_name}
                    onChange={(e) => setSettings({ ...settings, university_name: e.target.value })}
                    placeholder="Harvard University"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Email Domain *</Label>
                  <Input
                    id="domain"
                    value={settings.domain}
                    onChange={(e) => setSettings({ ...settings, domain: e.target.value })}
                    placeholder="harvard.edu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Contact Email *</Label>
                  <Input
                    id="contact_email"
                    type="email"
                    value={settings.contact_email}
                    onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                    placeholder="admin@harvard.edu"
                  />
                </div>
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    value={settings.website_url}
                    onChange={(e) => setSettings({ ...settings, website_url: e.target.value })}
                    placeholder="https://harvard.edu"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  placeholder="Brief description of your university..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={settings.logo_url}
                    onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <Label htmlFor="student_limit">Student Limit</Label>
                  <Input
                    id="student_limit"
                    type="number"
                    value={settings.student_limit}
                    onChange={(e) => setSettings({ ...settings, student_limit: parseInt(e.target.value) || 0 })}
                    placeholder="500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveSettings} disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Admin Users
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="admin@university.edu"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleAddAdmin} disabled={addingAdmin}>
                  {addingAdmin ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Admin
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                {adminUsers.map((admin) => (
                  <div key={admin._id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{admin.name || admin.email}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {admin.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{admin.role}</Badge>
                      <div className="text-sm text-muted-foreground">
                        {formatLastActive(admin.last_active)}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveAdmin(admin._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email_notifications" className="text-base font-medium">
                    Email Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email notifications for important university activities
                  </p>
                </div>
                <Switch
                  id="email_notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, email_notifications: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly_reports" className="text-base font-medium">
                    Weekly Reports
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive weekly summary reports of student activity and progress
                  </p>
                </div>
                <Switch
                  id="weekly_reports"
                  checked={settings.weekly_reports}
                  onCheckedChange={(checked) => setSettings({ ...settings, weekly_reports: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="student_signup_enabled" className="text-base font-medium">
                    Student Signup
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Allow students to sign up using their university email domain
                  </p>
                </div>
                <Switch
                  id="student_signup_enabled"
                  checked={settings.student_signup_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, student_signup_enabled: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto_approve_students" className="text-base font-medium">
                    Auto-approve Students
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically approve student registrations from your domain
                  </p>
                </div>
                <Switch
                  id="auto_approve_students"
                  checked={settings.auto_approve_students}
                  onCheckedChange={(checked) => setSettings({ ...settings, auto_approve_students: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                External Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="linkedin_integration" className="text-base font-medium">
                    LinkedIn Integration
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Enable LinkedIn profile integration for students and career services
                  </p>
                </div>
                <Switch
                  id="linkedin_integration"
                  checked={settings.linkedin_integration}
                  onCheckedChange={(checked) => setSettings({ ...settings, linkedin_integration: checked })}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="custom_branding" className="text-base font-medium">
                    Custom Branding
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Apply your university's custom branding and colors
                  </p>
                </div>
                <Switch
                  id="custom_branding"
                  checked={settings.custom_branding}
                  onCheckedChange={(checked) => setSettings({ ...settings, custom_branding: checked })}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-base font-medium">API Endpoints</Label>
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">Student Data Export</span>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Configure
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-mono">Analytics Webhook</span>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
=======
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useMutation, useQuery } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Settings, Building, Users, Mail, Globe } from 'lucide-react'

export default function UniversitySettingsPage() {
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const [settings, setSettings] = useState({
    name: '',
    description: '',
    website: '',
    contactEmail: '',
    maxStudents: 0,
    licenseSeats: 0
  })

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to University Settings.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">University Settings</h1>
          <p className="text-muted-foreground">Manage your institution's configuration and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Institution Information
            </CardTitle>
            <CardDescription>Update your university's basic information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">University Name</Label>
              <Input
                id="name"
                placeholder="Enter university name"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your institution"
                rows={3}
                value={settings.description}
                onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                placeholder="https://university.edu"
                value={settings.website}
                onChange={(e) => setSettings(prev => ({ ...prev, website: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input
                id="contactEmail"
                type="email"
                placeholder="admin@university.edu"
                value={settings.contactEmail}
                onChange={(e) => setSettings(prev => ({ ...prev, contactEmail: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              License Management
            </CardTitle>
            <CardDescription>Configure student license settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maxStudents">Maximum Students</Label>
              <Input
                id="maxStudents"
                type="number"
                placeholder="1000"
                value={settings.maxStudents}
                onChange={(e) => setSettings(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="licenseSeats">License Seats</Label>
              <Input
                id="licenseSeats"
                type="number"
                placeholder="1000"
                value={settings.licenseSeats}
                onChange={(e) => setSettings(prev => ({ ...prev, licenseSeats: parseInt(e.target.value) || 0 }))}
              />
              <p className="text-xs text-muted-foreground">
                Number of licenses available for students
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Advanced Settings
          </CardTitle>
          <CardDescription>Additional configuration options</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Email Notifications</h4>
                  <p className="text-xs text-muted-foreground">Receive updates about student activity</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Data Export</h4>
                  <p className="text-xs text-muted-foreground">Download student and usage data</p>
                </div>
                <Button variant="outline" size="sm">Export</Button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">API Access</h4>
                  <p className="text-xs text-muted-foreground">Manage API keys and integrations</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">Security</h4>
                  <p className="text-xs text-muted-foreground">Configure security settings</p>
                </div>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline">Cancel</Button>
        <Button>Save Changes</Button>
      </div>
    </div>
  )
}
>>>>>>> 7d0ff6b7c4ca3dc303c1956e6edcb0af82c2b378
