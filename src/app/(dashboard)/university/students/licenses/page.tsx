'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { ShieldCheck, Plus, Users, Zap, Crown, Star, CreditCard } from 'lucide-react'

export default function UniversityStudentLicensesPage() {
  const { user, isAdmin } = useAuth()
  const { user: clerkUser } = useUser()
  const { toast } = useToast()

  const canAccess = !!user && (isAdmin || user.subscription_plan === 'university' || user.role === 'university_admin')

  const students = useQuery(api.university_admin.listStudents, clerkUser?.id ? { clerkId: clerkUser.id, limit: 1000 } : 'skip') as any[] | undefined

  // Note: License updates will be handled through the API

  // Modal states
  const [licenseModalOpen, setLicenseModalOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // Form states
  const [licenseForm, setLicenseForm] = useState({
    licenseType: 'free',
    duration: '1'
  })
  const [loading, setLoading] = useState(false)

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You do not have access to manage student licenses.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!students) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  // Calculate license statistics
  const freeStudents = students.filter((s: any) => s.subscription_plan === 'free' || !s.subscription_plan).length
  const proStudents = students.filter((s: any) => s.subscription_plan === 'pro').length
  const totalStudents = students.length
  const proPercentage = totalStudents > 0 ? Math.round((proStudents / totalStudents) * 100) : 0

  // Handle license update
  const handleLicenseUpdate = async () => {
    if (!selectedStudent || !clerkUser?.id) return

    setLoading(true)
    try {
      // For now, just show a message that license updates would be processed
      // In a real implementation, you would call an API to update the license
      toast({
        title: 'Feature Coming Soon',
        description: `License update for ${selectedStudent.name} will be processed`,
        variant: 'default'
      })
      setLicenseModalOpen(false)
      setSelectedStudent(null)
      setLicenseForm({ licenseType: 'free', duration: '1' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update license',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Open license modal
  const openLicenseModal = (student: any) => {
    setSelectedStudent(student)
    setLicenseForm({
      licenseType: student.subscription_plan || 'free',
      duration: '1'
    })
    setLicenseModalOpen(true)
  }

  const getLicenseIcon = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Crown className="h-4 w-4 text-yellow-500" />
      default:
        return <Zap className="h-4 w-4 text-gray-400" />
    }
  }

  const getLicenseBadge = (plan: string) => {
    switch (plan) {
      case 'pro':
        return <Badge className="bg-yellow-100 text-yellow-800">Pro</Badge>
      default:
        return <Badge variant="secondary">Free</Badge>
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-6 w-6" /> Student Licenses
        </h1>
      </div>

      {/* License Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{totalStudents}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Free Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{freeStudents}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalStudents > 0 ? Math.round((freeStudents / totalStudents) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Pro Licenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Crown className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{proStudents}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalStudents > 0 ? Math.round((proStudents / totalStudents) * 100) : 0}% of total
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Upgrade Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Star className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{proPercentage}%</div>
            </div>
            <Progress value={proPercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Student Licenses</CardTitle>
          <CardDescription>Update individual student license types and durations</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground">No students found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Current License</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student: any) => (
                  <TableRow key={String(student._id)}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLicenseIcon(student.subscription_plan || 'free')}
                        {getLicenseBadge(student.subscription_plan || 'free')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openLicenseModal(student)}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Update License
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* License Information */}
      <Card>
        <CardHeader>
          <CardTitle>License Types</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-gray-400" />
                <h3 className="font-medium">Free License</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Basic career tools</li>
                <li>• Limited to 5 goals</li>
                <li>• Community support</li>
              </ul>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium">Pro License</h3>
              </div>
              <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                <li>• Unlimited goals</li>
                <li>• AI Career Coach</li>
                <li>• Premium templates</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Update License Modal */}
      <Dialog open={licenseModalOpen} onOpenChange={setLicenseModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Student License</DialogTitle>
            {selectedStudent && (
              <p className="text-sm text-muted-foreground">Updating license for {selectedStudent.name}</p>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="licenseType">License Type</Label>
              <Select value={licenseForm.licenseType} onValueChange={(value) => setLicenseForm(prev => ({ ...prev, licenseType: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free License</SelectItem>
                  <SelectItem value="pro">Pro License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="duration">Duration (Months)</Label>
              <Select value={licenseForm.duration} onValueChange={(value) => setLicenseForm(prev => ({ ...prev, duration: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Month</SelectItem>
                  <SelectItem value="3">3 Months</SelectItem>
                  <SelectItem value="6">6 Months</SelectItem>
                  <SelectItem value="12">1 Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLicenseModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleLicenseUpdate}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update License'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

