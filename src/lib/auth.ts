import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type AuthSuccess = {
  userId: string
  user: any
  supabase: SupabaseClient<any, 'public', any>
}

export type AuthError = {
  error: string
  status: number
}

export type AuthResult = AuthSuccess | AuthError

export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Authentication required', status: 401 }
  }

  const token = authHeader.split(' ')[1]
  const supabase = createClient()

  try {
    const { data, error } = await supabase.auth.getUser(token)

    if (error || !data.user) {
      return { error: 'Invalid or expired authentication token', status: 401 }
    }

    // Get user profile from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      return { error: 'Error loading user data', status: 500 }
    }

    return { 
      userId: data.user.id, 
      user: userData,
      supabase 
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: 'Internal server error during authentication', status: 500 }
  }
}