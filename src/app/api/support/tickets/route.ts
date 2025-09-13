import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, userId, user } = auth

    // Check if user is admin to see all tickets or just their own
    const isAdmin = user.role === 'super_admin' || user.role === 'university_admin'
    
    let query = supabase.from('support_tickets').select('*')
    
    if (!isAdmin) {
      query = query.eq('user_id', userId)
    }
    
    const { data: tickets, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Error fetching support tickets' }, { status: 500 })
    }

    return NextResponse.json({ tickets })
  } catch (error) {
    console.error('Error fetching support tickets:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, userId, user } = auth

    const body = await request.json()
    const { subject, description, issueType, source } = body

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
    }

    const { data: ticket, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: userId,
        user_email: user.email,
        subject,
        description,
        issue_type: issueType || 'Other',
        source: source || 'in-app',
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error creating support ticket' }, { status: 500 })
    }

    return NextResponse.json({ 
      ticket,
      message: 'Support ticket submitted successfully!'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating support ticket:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}