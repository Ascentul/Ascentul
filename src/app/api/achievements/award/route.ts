import { NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'

// POST /api/achievements/award { achievement_id }
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    const body = await request.json().catch(() => ({} as any))
    const achievement_id = Number(body.achievement_id)
    if (!achievement_id) return NextResponse.json({ error: 'achievement_id is required' }, { status: 400 })
    return NextResponse.json({ userAchievement: { id: Math.floor(Math.random()*1e9), achievement_id, user_id: 'mock', earned_at: new Date().toISOString() }, mock: true }, { status: 201 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({} as any))
  const achievement_id = Number(body.achievement_id)
  if (!achievement_id) return NextResponse.json({ error: 'achievement_id is required' }, { status: 400 })

  // ensure achievement exists
  const { data: ach, error: achErr } = await supabase
    .from('achievements')
    .select('id')
    .eq('id', achievement_id)
    .single()
  if (achErr) return NextResponse.json({ error: 'Achievement not found' }, { status: 404 })

  // insert avoid duplicate via unique constraint
  const { data, error } = await supabase
    .from('user_achievements')
    .insert({ user_id: user.id, achievement_id })
    .select()
    .single()

  if (error) {
    if (error.message.includes('user_achievements_user_id_achievement_id_key')) {
      return NextResponse.json({ error: 'Already earned' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ userAchievement: data }, { status: 201 })
}
