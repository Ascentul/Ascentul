import { NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'

// GET /api/achievements - list all available achievements (public read)
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ achievements: [] })
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('id', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ achievements: data ?? [] })
}
