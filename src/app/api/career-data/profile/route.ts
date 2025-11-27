import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper function to calculate years of experience from work history
function calculateExperienceYears(workHistory: any[]): number {
  if (!workHistory || !Array.isArray(workHistory) || workHistory.length === 0) {
    return 0
  }

  let totalMonths = 0
  const now = new Date()

  workHistory.forEach(job => {
    if (job.start_date) {
      const startDate = new Date(job.start_date)
      const endDate = job.is_current ? now : (job.end_date ? new Date(job.end_date) : startDate)

      const months = (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                    (endDate.getMonth() - startDate.getMonth())

      if (months > 0) {
        totalMonths += months
      }
    }
  })

  return Math.round(totalMonths / 12)
}

// Helper function to format education history
function formatEducationHistory(user: any): any[] {
  const education = []

  // First, check if there's a structured education_history
  if (user?.education_history && Array.isArray(user.education_history)) {
    user.education_history.forEach((edu: any) => {
      education.push({
        degree: edu.degree || 'Bachelor',
        field: edu.field_of_study || edu.major || 'General Studies',
        institution: edu.institution || 'University',
        graduationYear: edu.graduation_date || edu.end_date,
        gpa: edu.gpa,
      })
    })
  }

  // Fallback to basic education info if no structured history
  if (education.length === 0 && user?.university_name) {
    education.push({
      degree: 'Bachelor',
      field: user.major || 'General Studies',
      institution: user.university_name,
      graduationYear: user.graduation_date || user.graduation_year,
    })
  }

  // Default if no education info at all
  if (education.length === 0) {
    education.push({
      degree: 'Bachelor',
      field: 'General Studies',
      institution: 'University',
    })
  }

  return education
}

// Helper function to format work history
function formatWorkHistory(workHistory: any[]): any[] {
  if (!workHistory || !Array.isArray(workHistory) || workHistory.length === 0) {
    return []
  }

  return workHistory.map(job => ({
    title: job.role || job.title || 'Position',
    company: job.company || 'Company',
    startDate: job.start_date,
    endDate: job.is_current ? null : job.end_date,
    isCurrent: job.is_current || false,
    location: job.location,
    description: job.summary || job.description,
  }))
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let user: any = null
    let projects: any[] = []

    try {
      user = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId })
    } catch (userError) {
      console.error('Failed to fetch user profile:', {
        message: userError instanceof Error ? userError.message : 'Unknown error',
      })
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 503 })
    }

    try {
      projects = await convexServer.query(api.projects.getUserProjects, { clerkId: userId })
    } catch (projectError) {
      console.warn('Failed to fetch user projects:', {
        message: projectError instanceof Error ? projectError.message : 'Unknown error',
      })
      // projects are optional; continue with empty array
    }

    // Build a comprehensive profile from actual user data
    const profile = {
      name: user?.name || 'User',
      email: user?.email || undefined,
      phone: user?.phone_number || undefined,
      location: user?.location || undefined,
      linkedin_url: user?.linkedin_url || undefined,
      github_url: user?.github_url || undefined,
      currentRole: user?.current_position || user?.role || 'Professional',
      currentLevel: user?.experience_level || 'mid',
      skills: user?.skills || ['Communication', 'Problem Solving'],
      experienceYears: calculateExperienceYears(user?.work_history),
      education: formatEducationHistory(user),
      education_history: user?.education_history || [],
      workHistory: formatWorkHistory(user?.work_history),
      work_history: user?.work_history || [],
      achievements_history: user?.achievements_history || [],
      projects: projects,
      industry: user?.industry,
      bio: user?.bio,
      career_goals: user?.career_goals,
      current_position: user?.current_position,
      current_company: user?.current_company,
    }

    return NextResponse.json(profile)
  } catch (error: any) {
    console.error('GET /api/career-data/profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
