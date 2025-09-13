import { NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'

// GET /api/contacts - list current user's contacts
export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ contacts: [] })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('networking_contacts')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contacts: data ?? [] })
}

// POST /api/contacts - create a contact
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    const body = await request.json().catch(() => ({} as any))
    const now = new Date().toISOString()
    const contact = {
      id: Math.floor(Math.random() * 1e9),
      user_id: 'mock',
      full_name: body.full_name ?? body.name ?? 'Unnamed',
      company: body.company ?? null,
      position: body.position ?? null,
      email: body.email ?? null,
      phone: body.phone ?? null,
      linkedin_url: body.linkedin_url ?? null,
      notes: body.notes ?? null,
      relationship_type: body.relationship_type ?? null,
      last_contact_date: body.last_contact_date ?? null,
      next_contact_date: body.next_contact_date ?? null,
      tags: body.tags ?? null,
      created_at: now,
      updated_at: now,
    }
    return NextResponse.json({ contact, mock: true }, { status: 201 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({} as any))
  const payload = {
    user_id: user.id,
    full_name: body.full_name ?? body.name ?? 'Unnamed',
    company: body.company ?? null,
    position: body.position ?? null,
    email: body.email ?? null,
    phone: body.phone ?? null,
    linkedin_url: body.linkedin_url ?? null,
    notes: body.notes ?? null,
    relationship_type: body.relationship_type ?? null,
    last_contact_date: body.last_contact_date ?? null,
    next_contact_date: body.next_contact_date ?? null,
    tags: body.tags ?? null,
  }

  const { data, error } = await supabase
    .from('networking_contacts')
    .insert(payload)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Best-effort: award "Networker" achievement
  try {
    const { data: ach } = await supabase
      .from('achievements')
      .select('id')
      .eq('name', 'Networker')
      .single()
    if (ach?.id) {
      await supabase
        .from('user_achievements')
        .insert({ user_id: user.id, achievement_id: ach.id })
    }
  } catch (_) {
    // ignore achievement errors
  }

  return NextResponse.json({ contact: data }, { status: 201 })
}
