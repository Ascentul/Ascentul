import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export async function GET(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    const client = new ConvexHttpClient(url)
    const coverLetters = await client.query(api.cover_letters.getUserCoverLetters, { clerkId: userId })
    return NextResponse.json({ coverLetters })
  } catch (error) {
    console.error('Error fetching cover letters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    const client = new ConvexHttpClient(url)

    const body = await request.json()
    const { title, content, company_name, position, job_description } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const coverLetter = await client.mutation(api.cover_letters.createCoverLetter, {
      clerkId: userId,
      name: title,
      job_title: position ? String(position) : 'Position',
      company_name: company_name ? String(company_name) : undefined,
      template: 'standard',
      content: String(content),
      closing: 'Sincerely,',
    })

    return NextResponse.json({ coverLetter }, { status: 201 })
  } catch (error) {
    console.error('Error creating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}