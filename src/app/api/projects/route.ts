import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const projects = await convexServer.query(api.projects.getUserProjects, { clerkId: userId })
    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { title, description, technologies, github_url, live_url, image_url, role, start_date, end_date, company } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const projectId = await convexServer.mutation(api.projects.createProject, {
      clerkId: userId,
      title: String(title),
      role: role ? String(role) : undefined,
      start_date: start_date ? Number(start_date) : undefined,
      end_date: end_date ? Number(end_date) : undefined,
      company: company ? String(company) : undefined,
      url: live_url ? String(live_url) : github_url ? String(github_url) : undefined,
      description: description ? String(description) : undefined,
      type: 'personal',
      image_url: image_url ? String(image_url) : undefined,
      technologies: Array.isArray(technologies) ? technologies.map(String) : [],
    })

    return NextResponse.json({ projectId }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}