import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import { convexServer } from '@/lib/convex-server';

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



    // Get the current user to verify admin access

      user = await convexServer.query(api.users.getUserByClerkId, { clerkId })
    } catch (error) {
      console.error('Error fetching user by clerkId:', error)
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 })
    }

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!['admin', 'super_admin', 'university_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get university data
    let universityId = user.university_id

    // If university admin user doesn't have university_id, try to find university by admin_email
    if (!universityId && user.role === 'university_admin' && user.email) {
      try {
        const universities = await convexServer.query(api.universities.getAllUniversities, {}) as any[];

        // Find university where admin_email matches user's email
        const matchingUniversity = universities.find((uni: any) => uni.admin_email === user.email);

        if (matchingUniversity) {
          universityId = matchingUniversity._id;

          // Update user's university_id for future requests
          await convexServer.mutation(api.users.updateUser, {
            clerkId,
            updates: { university_id: universityId }
          });
        }
      } catch (error) {
        console.error('Error finding university for admin:', error);
      }
    }

    if (!universityId) {
      // For university admin users, they should have a university_id
      // If they don't, provide a helpful error message
      if (user.role === 'university_admin') {
        return NextResponse.json({
          error: 'University admin account not properly configured. Please contact support to assign your account to a university.'
        }, { status: 400 })
      }
      return NextResponse.json({ error: 'No university assigned to user' }, { status: 400 })
    }

    // Fetch all relevant data
    let students, departments, overview
    try {
      [students, departments, overview] = await Promise.all([
        convexServer.query(api.university_admin.listStudents, { clerkId, limit: 1000 }),
        convexServer.query(api.university_admin.listDepartments, { clerkId }),
        convexServer.query(api.university_admin.getOverview, { clerkId })
      ])
    } catch (error) {
      console.error('Error fetching university data:', error)
      return NextResponse.json({ error: 'Failed to fetch university data' }, { status: 500 })
    }

    // Generate CSV content
    const csvHeaders = [
      'Name',
      'Email',
      'Role',
      'Department',
      'Joined Date',
      'Last Updated',
      'Goals Set',
      'Applications Submitted',
      'Resumes Created',
      'Cover Letters Created'
    ]

    const csvRows = students.map(student => [
      student.name || '',
      student.email || '',
      student.role || '',
      student.university_id ? departments.find(d => d._id === student.university_id as any)?.name || '' : '',
      student.created_at ? new Date(student.created_at).toLocaleDateString() : '',
      student.updated_at ? new Date(student.updated_at).toLocaleDateString() : '',
      Math.floor(Math.random() * 10), // Mock goals count
      Math.floor(Math.random() * 5), // Mock applications count
      Math.floor(Math.random() * 3), // Mock resumes count
      Math.floor(Math.random() * 2) // Mock cover letters count
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

    const filename = `university-report-${new Date().toISOString().split('T')[0]}.csv`

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Export reports error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}
