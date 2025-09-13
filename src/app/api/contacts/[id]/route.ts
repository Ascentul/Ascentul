import { NextResponse } from 'next/server'
import { createClient, hasSupabaseEnv } from '@/lib/supabase/server'

// GET /api/contacts/[id]
export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Contact not found (mock)' }, { status: 404 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('networking_contacts')
    .select('*')
    .eq('id', Number(params.id))
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json({ contact: data })
}

// PUT /api/contacts/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Not implemented in mock mode' }, { status: 501 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({} as any))

  const { data, error } = await supabase
    .from('networking_contacts')
    .update(body)
    .eq('id', Number(params.id))
    .eq('user_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ contact: data })
}

// DELETE /api/contacts/[id]
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ error: 'Not implemented in mock mode' }, { status: 501 })
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('networking_contacts')
    .delete()
    .eq('id', Number(params.id))
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
