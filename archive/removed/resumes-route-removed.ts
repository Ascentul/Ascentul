import { NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ resumes: [] })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('resumes')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ resumes: data ?? [] })
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    const body = await request.json().catch(() => ({} as any))
    const now = new Date().toISOString()
    const resume = {
      id: Math.floor(Math.random() * 1e9),
      user_id: 'mock',
      title: body?.title || 'Untitled Resume',
      content: body?.content || {},
      visibility: 'private',
      created_at: now,
      updated_at: now,
    }
    return NextResponse.json({ resume, mock: true }, { status: 201 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({} as any))
  const title = body?.title || 'Untitled Resume'
  const content = body?.content || {}

  const { data, error } = await supabase
    .from('resumes')
    .insert({ user_id: user.id, title, content })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort: award "Resume Ready" achievement
  try {
    const { data: ach } = await supabase
      .from('achievements')
      .select('id')
      .eq('name', 'Resume Ready')
      .single()
    if (ach?.id) {
      await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: ach.id })
    }
  } catch (_) {
    // ignore achievement errors
  }

  return NextResponse.json({ resume: data }, { status: 201 })
}
