import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server';

export const dynamic = 'force-dynamic'

type CoverLetterSource = 'manual' | 'ai_generated' | 'ai_optimized' | 'pdf_upload'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const coverLetters = await convexServer.query(api.cover_letters.getUserCoverLetters, { clerkId: userId })
    return NextResponse.json({ coverLetters })
  } catch (error) {
    console.error('Error fetching cover letters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const { title, content, company_name, position, job_description, source } = body as {
      title?: string
      content?: string
      company_name?: string
      position?: string
      job_description?: string
      source?: string
    }

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const allowedSources = new Set<CoverLetterSource>(['manual', 'ai_generated', 'ai_optimized', 'pdf_upload'])

    const coverLetter = await convexServer.mutation(api.cover_letters.createCoverLetter, {
      clerkId: userId,
      name: title,
      job_title: position ? String(position) : 'Position',
      company_name: company_name ? String(company_name) : undefined,
      template: 'standard',
      content: String(content),
      closing: 'Sincerely,',
      source: allowedSources.has(source as CoverLetterSource) ? (source as CoverLetterSource) : 'manual',
    })

    return NextResponse.json({ coverLetter }, { status: 201 })
  } catch (error) {
    console.error('Error creating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
