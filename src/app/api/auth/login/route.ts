import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Get user profile from database
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (profileError) {
      console.error('Error fetching user profile:', profileError)
      // If user profile doesn't exist, create a basic one
      if (profileError.code === 'PGRST116') {
        const baseUsername = data.user.email?.split('@')[0] || 'user'
        const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
        const username = `${baseUsername}${randomSuffix}`

        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            username,
            email: data.user.email,
            name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
            user_type: 'regular',
            role: 'user',
            subscription_plan: 'free',
            subscription_status: 'active',
            created_at: new Date().toISOString()
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating user profile during login:', createError)
          return NextResponse.json(
            { error: 'Error creating user profile' },
            { status: 500 }
          )
        }

        return NextResponse.json({
          user: newProfile,
          session: data.session,
          message: 'Login successful'
        })
      }

      return NextResponse.json(
        { error: 'Error fetching user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: userProfile,
      session: data.session,
      message: 'Login successful'
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}