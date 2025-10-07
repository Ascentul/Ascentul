import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Get authentication from request
    const { userId } = getAuth(request)
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clerkId } = body

    if (!clerkId) {
      return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 })
    }

    // For additional security, verify the clerkId matches the authenticated user
    if (userId !== clerkId) {
      return NextResponse.json({ error: 'ClerkId mismatch' }, { status: 403 })
    }

    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    }

    // Initialize convex client
    const convex = new ConvexHttpClient(url)

    // Get the current user to verify admin access
    let user
    try {
      user = await convex.query(api.users.getUserByClerkId, { clerkId })
    } catch (error) {
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'super_admin', 'university_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    if (!user.university_id) {
      return NextResponse.json({ error: 'No university assigned to user' }, { status: 400 })
    }

    // Fetch all relevant data
    let students, departments
    try {
      [students, departments] = await Promise.all([
        convex.query(api.university_admin.listStudents, { clerkId, limit: 1000 }),
        convex.query(api.university_admin.listDepartments, { clerkId })
      ])
    } catch (error) {
      console.error('Error fetching data:', error)
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }

    // Generate CSV content
    const csvHeaders = [
      'Name',
      'Email',
      'Role',
      'Department',
      'Account Status',
      'Joined Date',
      'Last Active',
      'Subscription Plan'
    ]

    const csvRows = students.map((student: any) => [
      student.name || '',
      student.email || '',
      student.role || '',
      student.department_id
        ? departments.find((d: any) => d._id === student.department_id)?.name || 'Unknown'
        : 'Unassigned',
      student.account_status || 'active',
      student.created_at ? new Date(student.created_at).toLocaleDateString() : '',
      student.updated_at ? new Date(student.updated_at).toLocaleDateString() : 'Never',
      student.subscription_plan || 'university'
    ])

    // Escape CSV cells to handle commas and quotes
    const escapeCSV = (field: string | number) => {
      const stringField = String(field)
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`
      }
      return stringField
    }

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n')

    const filename = `university-data-export-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Export data error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
