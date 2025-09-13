import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, userId } = auth

    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Error fetching projects' }, { status: 500 })
    }

    return NextResponse.json({ projects })
  } catch (error) {
    console.error('Error fetching projects:', error)
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
    const { title, description, technologies, github_url, live_url, image_url } = body

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: userId,
        title,
        description,
        technologies: technologies || [],
        github_url,
        live_url,
        image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error creating project' }, { status: 500 })
    }

    return NextResponse.json({ project }, { status: 201 })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}