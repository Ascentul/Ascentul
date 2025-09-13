import { NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'

// GET /api/achievements/user - list achievements earned by current user
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ userAchievements: [] })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('user_achievements')
    .select('id, achievement_id, earned_at, achievements:achievement_id (id, name, description, icon, xp_reward)')
    .eq('user_id', user.id)
    .order('earned_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ userAchievements: data ?? [] })
}
