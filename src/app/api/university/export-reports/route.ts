import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { clerkId } = body

    if (!clerkId) {
      return NextResponse.json({ error: 'Missing clerkId' }, { status: 400 })
    }

    // Get the current user to verify admin access
    const user = await convex.query(api.users.getUserByClerkId, { clerkId })
    if (!user || !['admin', 'super_admin', 'university_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get university data
    const universityId = user.university_id
    if (!universityId) {
      return NextResponse.json({ error: 'No university assigned' }, { status: 400 })
    }

    // Fetch all relevant data
    const [students, departments, overview] = await Promise.all([
      convex.query(api.university_admin.listStudents, { clerkId, limit: 1000 }),
      convex.query(api.university_admin.listDepartments, { clerkId }),
      convex.query(api.university_admin.getOverview, { clerkId })
    ])

    // Generate CSV content
    const csvHeaders = [
      'Name',
      'Email',
      'Role',
      'Department',
      'Joined Date',
      'Last Active',
      'Goals Set',
      'Applications Submitted',
      'Resumes Created',
      'Cover Letters Created'
    ]

    const csvRows = students.map(student => [
      student.name || '',
      student.email || '',
      student.role || '',
      student.department_id ? departments.find(d => d._id === student.department_id)?.name || '' : '',
      student.created_at ? new Date(student.created_at).toLocaleDateString() : '',
      student.last_active ? new Date(student.last_active).toLocaleDateString() : '',
      student.goals_count || 0,
      student.applications_count || 0,
      student.resumes_count || 0,
      student.cover_letters_count || 0
    ])

    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="university-report-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })

  } catch (error) {
    console.error('Export reports error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
