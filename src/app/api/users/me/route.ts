import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient()

    // Verify the JWT with Supabase
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 401 })
    }

    // Get detailed user information from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      return NextResponse.json({ error: 'Error loading user data' }, { status: 500 })
    }

    return NextResponse.json({ user: userData })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}