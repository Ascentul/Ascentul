'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import {
  Building2,
  Users,
  UserCheck,
  GraduationCap,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Activity,
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Briefcase,
  Loader2,
  Edit,
  Plus,
  Search,
  Trash2,
  TestTube2,
  AlertTriangle
} from 'lucide-react'

export default function UniversityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user: clerkUser } = useUser()
  const { user, isAdmin } = useAuth()
  const { toast } = useToast()

  const universityId = params.id as Id<"universities">
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'university_admin' | 'advisor'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'advisors' | 'analytics'>('overview')
  const [isTogglingTest, setIsTogglingTest] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [skipQueries, setSkipQueries] = useState(false) // Skip queries during deletion

  // Edit state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editForm, setEditForm] = useState<{
    name: string
    slug: string
    license_plan: 'Starter' | 'Basic' | 'Pro' | 'Enterprise'
    license_seats: number
    status: 'active' | 'expired' | 'trial' | 'suspended'  // Only statuses settable via edit dialog
    admin_email?: string
  } | null>(null)

  // Grant account state
  const [showGrantDialog, setShowGrantDialog] = useState(false)
  const [isGranting, setIsGranting] = useState(false)
  const [grantError, setGrantError] = useState<string | null>(null)
  const [grantSuccess, setGrantSuccess] = useState(false)
  const [grantForm, setGrantForm] = useState({
    userEmail: '',
    makeAdmin: false,
    sendInviteEmail: true
  })

  // Mutations for test toggle, archive, restore, and delete
  const toggleTestUniversity = useMutation(api.universities.toggleTestUniversity)
  const archiveUniversity = useMutation(api.universities.archiveUniversity)
  const restoreUniversity = useMutation(api.universities.restoreUniversity)
  const hardDeleteUniversity = useMutation(api.universities.hardDeleteUniversity)
  const updateUniversity = useMutation(api.universities.updateUniversity)
  const assignUniversityToUser = useMutation(api.universities.assignUniversityToUser)

  // Query university details
  const university = useQuery(
    api.universities.getUniversity,
    universityId && !skipQueries ? { universityId } : 'skip'
  )

  // Query users in this university
  const universityUsers = useQuery(
    api.users.getUsersByUniversity,
    universityId && clerkUser?.id && !skipQueries ? { clerkId: clerkUser.id, universityId } : 'skip'
  )

  // Query real analytics data for this university
  const universityAnalytics = useQuery(
    api.analytics.getSingleUniversityAnalytics,
    universityId && clerkUser?.id && !skipQueries ? { clerkId: clerkUser.id, universityId } : 'skip'
  )

  // Filter users based on search and filters
  const filteredUsers = universityUsers?.filter(user => {
    if (roleFilter !== 'all' && user.role !== roleFilter && !(roleFilter === 'student' && user.role === 'user')) {
      return false
    }
    if (statusFilter !== 'all') {
      const isActive = user.subscription_status === 'active'
      if (statusFilter === 'active' && !isActive) return false
      if (statusFilter === 'inactive' && isActive) return false
    }
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search)
      )
    }
    return true
  }) || []

  // Separate users by role
  const students = universityUsers?.filter(u => u.role === 'user') || []
  const advisors = universityUsers?.filter(u => u.role === 'university_admin') || []
  const activeStudents = students.filter(s => s.subscription_status === 'active')

  const role = user?.role
  const canAccess = role === 'super_admin'

  const handleToggleTest = async (isTest: boolean) => {
    setIsTogglingTest(true)
    try {
      await toggleTestUniversity({ universityId, isTest })
      toast({
        title: isTest ? 'Marked as test university' : 'Removed test designation',
        description: isTest
          ? 'This university can now be hard deleted.'
          : 'Hard delete is no longer available for this university.',
      })
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsTogglingTest(false)
    }
  }

  const handleArchive = async () => {
    setIsDeleting(true)
    try {
      await archiveUniversity({ universityId })
      toast({
        title: 'University archived',
        description: 'The university has been archived. All data is preserved.',
      })
      router.push('/admin/universities')
    } catch (error) {
      toast({
        title: 'Failed to archive',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleRestore = async () => {
    setIsDeleting(true)
    try {
      await restoreUniversity({
        universityId,
        reason: "Restored via admin UI"
      })
      toast({
        title: 'University restored',
        description: 'The university has been restored and is now active.',
      })
      // Stay on same page to see updated status
    } catch (error) {
      toast({
        title: 'Failed to restore',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleHardDelete = async () => {
    setIsDeleting(true)
    try {
      // FIRST: Stop all queries immediately to prevent race conditions
      setSkipQueries(true)

      // SECOND: Navigate away to unmount component
      router.replace('/admin/universities')

      // THIRD: Perform the actual deletion
      await hardDeleteUniversity({ universityId })

      toast({
        title: 'University permanently deleted',
        description: 'All associated data has been permanently removed.',
      })
    } catch (error) {
      toast({
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
      // If there was an error, we might need to go back
      // but the navigation already happened, so user is on the list page
    } finally {
      setIsDeleting(false)
    }
  }

  const handleOpenEdit = () => {
    if (university) {
      setEditForm({
        name: university.name,
        slug: university.slug,
        license_plan: university.license_plan as any,
        license_seats: university.license_seats,
        status: university.status as any,
        admin_email: university.admin_email
      })
      setShowEditDialog(true)
    }
  }

  const handleSaveEdit = async () => {
    if (!editForm) return
    setIsSaving(true)
    try {
      await updateUniversity({
        universityId,
        updates: {
          name: editForm.name,
          slug: editForm.slug,
          license_plan: editForm.license_plan,
          license_seats: editForm.license_seats,
          status: editForm.status,
          admin_email: editForm.admin_email,
        },
      })
      toast({
        title: 'University updated',
        description: 'Changes have been saved successfully.',
      })
      setShowEditDialog(false)
    } catch (error) {
      toast({
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleGrantAccount = async () => {
    if (!grantForm.userEmail.trim() || !university) return
    setIsGranting(true)
    setGrantError(null)
    setGrantSuccess(false)
    try {
      await assignUniversityToUser({
        userEmail: grantForm.userEmail,
        universitySlug: university.slug,
        makeAdmin: grantForm.makeAdmin,
        sendInviteEmail: grantForm.sendInviteEmail
      })
      setGrantSuccess(true)
      setTimeout(() => {
        setGrantForm({ userEmail: '', makeAdmin: false, sendInviteEmail: true })
        setShowGrantDialog(false)
        setGrantSuccess(false)
      }, 1500)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to grant access.'
      setGrantError(errorMessage)
    } finally {
      setIsGranting(false)
    }
  }

  const handleSuspend = async () => {
    if (!university) return
    const newStatus = university.status === 'suspended' ? 'active' : 'suspended'
    try {
      await updateUniversity({
        universityId,
        updates: { status: newStatus },
      })
      toast({
        title: newStatus === 'suspended' ? 'University suspended' : 'University reactivated',
        description: newStatus === 'suspended'
          ? 'The university has been suspended.'
          : 'The university is now active again.',
      })
    } catch (error) {
      toast({
        title: 'Failed to update status',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Only admins can access university details.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!university || !universityUsers) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      {/* Header */}
      <div className="space-y-4">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/universities')}
          className="w-fit"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Universities
        </Button>

        {/* Title and Actions */}
        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              {/* University Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-6 w-6 text-primary flex-shrink-0" />
                  <h1 className="text-2xl font-bold tracking-tight truncate">
                    {university.name}
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {university.status === 'active' ? (
                    <Badge variant="default" className="bg-green-600">Active</Badge>
                  ) : university.status === 'suspended' ? (
                    <Badge variant="secondary" className="bg-orange-600 text-white">Suspended</Badge>
                  ) : university.status === 'deleted' ? (
                    <Badge variant="destructive">Deleted</Badge>
                  ) : (
                    <Badge variant="secondary">{university.status}</Badge>
                  )}
                  <Badge variant="outline">{university.license_plan} Plan</Badge>
                  {university.is_test && (
                    <Badge variant="outline" className="text-amber-600 border-amber-600">
                      <TestTube2 className="h-3 w-3 mr-1" />
                      Test
                    </Badge>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2">
                {/* Primary Actions Row */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenEdit}
                    disabled={university.status === 'deleted'}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowGrantDialog(true)}
                    disabled={university.status === 'deleted' || university.status === 'suspended'}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Grant Access
                  </Button>

                  {university.status !== 'deleted' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant={university.status === 'suspended' ? 'default' : 'outline'}
                          size="sm"
                        >
                          {university.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {university.status === 'suspended' ? 'Reactivate University' : 'Suspend University'}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {university.status === 'suspended'
                              ? 'This will reactivate the university and restore normal access for all users.'
                              : 'This will suspend the university. Users will lose access until the university is reactivated.'}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleSuspend}>
                            {university.status === 'suspended' ? 'Reactivate' : 'Suspend'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>

                {/* Secondary Actions Row */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 border rounded-lg px-3 py-1.5 bg-muted/30">
                    <TestTube2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <Label htmlFor="test-toggle" className="text-xs cursor-pointer">Test Mode</Label>
                    <Switch
                      id="test-toggle"
                      checked={university.is_test ?? false}
                      onCheckedChange={handleToggleTest}
                      disabled={isTogglingTest || university.status === 'deleted'}
                    />
                  </div>

                  {/* Archive Button - for active/trial/expired/suspended universities */}
                  {university.status !== 'archived' && university.status !== 'deleted' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Archive
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            Archive University - Permanent Action
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                              <p className="font-semibold text-amber-900 mb-1">⚠️ This is a permanent action</p>
                              <p className="text-sm text-amber-800">
                                Unlike <strong>Suspend</strong> (which is temporary), archiving is intended for universities that <strong>won't be returning</strong>. This should only be used when a contract has ended or the university has permanently stopped using the platform.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="font-medium">What happens when you archive:</p>
                              <ul className="text-sm space-y-1 list-disc list-inside">
                                <li>✓ All data is <strong>preserved</strong> (users, applications, goals, metrics)</li>
                                <li>✓ University becomes inactive immediately</li>
                                <li>✓ Removed from active university lists</li>
                                <li>✓ No longer counts toward "active" metrics</li>
                                <li>✓ Can be restored with admin approval (rare)</li>
                              </ul>
                            </div>

                            <p className="text-sm font-medium bg-blue-50 border border-blue-200 rounded p-2">
                              💡 <strong>Need temporary suspension?</strong> Use the <strong>Suspend</strong> button instead. It's easier to reactivate.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleArchive} className="bg-amber-600 hover:bg-amber-700">
                            Yes, Archive University
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {/* Restore Button - only for archived universities */}
                  {university.status === 'archived' && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="default"
                          size="sm"
                          disabled={isDeleting}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Restore from Archive
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Restore University from Archive</AlertDialogTitle>
                          <AlertDialogDescription className="space-y-3">
                            <p>This will restore the university and make it active again.</p>

                            <div className="bg-blue-50 border border-blue-200 rounded p-3">
                              <p className="text-sm text-blue-900">
                                The university will be reactivated with "active" status. All preserved data (users, applications, goals) will remain intact and accessible.
                              </p>
                            </div>

                            <p className="text-sm text-muted-foreground">
                              This action is logged for audit purposes. Make sure the university has a valid reason to return to the platform.
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleRestore} className="bg-green-600 hover:bg-green-700">
                            Restore University
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}

                  {university.is_test && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isDeleting}
                        >
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Hard Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Permanently Delete Test University
                          </AlertDialogTitle>
                          <AlertDialogDescription className="space-y-2">
                            <p className="font-semibold text-destructive">This action cannot be undone!</p>
                            <p className="text-sm bg-amber-50 border border-amber-200 rounded p-2">
                              <strong>Test University Only:</strong> This action is only available because this university is marked as a test university.
                            </p>
                            <p>This will permanently delete:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>The university record</li>
                              <li>All student memberships and profiles</li>
                              <li>All advisor assignments</li>
                              <li>All departments and courses</li>
                              <li>All pending invitations</li>
                            </ul>
                            <p className="mt-2">User accounts will be unlinked and marked as test users. Applications and goals will have their university_id cleared but will be preserved.</p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleHardDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Permanently Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{universityUsers.length}</div>
            <p className="text-xs text-muted-foreground">All users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <GraduationCap className="h-4 w-4" />
              Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-green-600">{activeStudents.length} active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <UserCheck className="h-4 w-4" />
              Advisors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{advisors.length}</div>
            <p className="text-xs text-muted-foreground">University admins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              License Seats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {universityUsers.length}/{university.license_seats}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((universityUsers.length / university.license_seats) * 100)}% utilized
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <Activity className="h-4 w-4" />
              MAU
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.floor(activeStudents.length * 0.65)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly active users</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different sections */}
      <Card>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <CardHeader>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
              <TabsTrigger value="advisors">Advisors ({advisors.length})</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">University Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-xs text-muted-foreground">Website</Label>
                    <p className="font-medium">{university.website || 'Not set'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">License Plan</Label>
                    <p className="font-medium capitalize">{university.license_plan}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">License Start</Label>
                    <p className="font-medium">
                      {new Date(university.license_start).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">License End</Label>
                    <p className="font-medium">
                      {university.license_end ?
                        new Date(university.license_end).toLocaleDateString() :
                        'Ongoing'
                      }
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Feature Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Resume Builder</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.84)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Job Applications</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.53)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Cover Letters</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.37)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Career Goals</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.64)}% users</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Projects</span>
                    <Badge variant="outline">{Math.floor(students.length * 0.21)}% users</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {students.length === 0 ? (
              <div className="text-center py-12">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No students enrolled yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers
                    .filter(u => u.role === 'user')
                    .map((student) => (
                      <TableRow key={student._id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Image
                              src={student.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name || 'User')}&background=0C29AB&color=fff`}
                              alt={student.name}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                            {student.name}
                          </div>
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge variant={student.subscription_status === 'active' ? 'default' : 'secondary'}>
                            {student.subscription_status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(student.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">View</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="advisors" className="space-y-4">
            {advisors.length === 0 ? (
              <div className="text-center py-12">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No advisors assigned yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {advisors.map((advisor) => (
                    <TableRow key={advisor._id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Image
                            src={advisor.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(advisor.name || 'User')}&background=0C29AB&color=fff`}
                            alt={advisor.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                          {advisor.name}
                        </div>
                      </TableCell>
                      <TableCell>{advisor.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline">University Admin</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(advisor.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline">View</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              {!universityAnalytics ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Engagement Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Daily Active Users</span>
                        <span className="font-medium">{universityAnalytics.engagement.dau}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Weekly Active Users</span>
                        <span className="font-medium">{universityAnalytics.engagement.wau}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Monthly Active Users</span>
                        <span className="font-medium">{universityAnalytics.engagement.mau}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Avg. Session Duration</span>
                        <span className="font-medium text-muted-foreground">Not tracked</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Success Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Applications Submitted</span>
                        <span className="font-medium">{universityAnalytics.success.applicationsSubmitted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Interviews Scheduled</span>
                        <span className="font-medium">{universityAnalytics.success.interviewsScheduled}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Offers Received</span>
                        <span className="font-medium">{universityAnalytics.success.offersReceived}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Placement Rate</span>
                        <span className="font-medium text-green-600">{universityAnalytics.success.placementRate}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Edit University Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit University</DialogTitle>
            <DialogDescription>Update university settings and licensing.</DialogDescription>
          </DialogHeader>
          {editForm && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-sm font-medium">Slug</Label>
                <Input value={editForm.slug} onChange={e => setEditForm({ ...editForm, slug: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <Select value={editForm.license_plan} onValueChange={(v: any) => setEditForm({ ...editForm, license_plan: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Starter">Starter</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                      <SelectItem value="Enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium">Seats</Label>
                  <Input
                    type="number"
                    value={editForm.license_seats}
                    onChange={e => setEditForm({ ...editForm, license_seats: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={editForm.status} onValueChange={(v: any) => setEditForm({ ...editForm, status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Admin Email</Label>
                <Input
                  type="email"
                  value={editForm.admin_email || ''}
                  onChange={e => setEditForm({ ...editForm, admin_email: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
              ) : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grant University Account Dialog */}
      <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Grant University Account</DialogTitle>
            <DialogDescription>
              Grant access to {university?.name} for an existing user.
            </DialogDescription>
          </DialogHeader>
          {grantSuccess ? (
            <div className="rounded-lg bg-green-50 p-4 border border-green-200">
              <p className="text-sm font-medium text-green-900">Access granted successfully!</p>
              <p className="text-sm text-green-800 mt-1">
                {grantForm.sendInviteEmail ? 'Invitation email has been sent.' : 'No invitation email was sent.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {grantError && (
                <div className="rounded-lg bg-red-50 p-4 border border-red-200">
                  <p className="text-sm font-medium text-red-900">Error</p>
                  <p className="text-sm text-red-800 mt-1">{grantError}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">User Email Address</Label>
                <Input
                  value={grantForm.userEmail}
                  onChange={e => setGrantForm({ ...grantForm, userEmail: e.target.value })}
                  placeholder="Enter user's email address"
                  type="email"
                  disabled={isGranting}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="makeAdmin"
                  checked={grantForm.makeAdmin}
                  onChange={e => setGrantForm({ ...grantForm, makeAdmin: e.target.checked })}
                  className="rounded"
                  disabled={isGranting}
                />
                <Label htmlFor="makeAdmin" className="text-sm font-medium">
                  Make this user a University Admin
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sendInviteEmail"
                  checked={grantForm.sendInviteEmail}
                  onChange={e => setGrantForm({ ...grantForm, sendInviteEmail: e.target.checked })}
                  className="rounded"
                  disabled={isGranting}
                />
                <Label htmlFor="sendInviteEmail" className="text-sm font-medium">
                  Send invite email
                </Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGrantDialog(false)} disabled={isGranting}>Cancel</Button>
            <Button
              onClick={handleGrantAccount}
              disabled={isGranting || !grantForm.userEmail.trim() || grantSuccess}
            >
              {isGranting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Granting...</>
              ) : 'Grant Access'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}