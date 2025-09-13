import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, userId } = auth

    const { data: coverLetters, error } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Error fetching cover letters' }, { status: 500 })
    }

    return NextResponse.json({ coverLetters })
  } catch (error) {
    console.error('Error fetching cover letters:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, userId } = auth

    const body = await request.json()
    const { title, content, company_name, position, job_description } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: userId,
        title,
        content,
        company_name,
        position,
        job_description,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error creating cover letter' }, { status: 500 })
    }

    return NextResponse.json({ coverLetter }, { status: 201 })
  } catch (error) {
    console.error('Error creating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}