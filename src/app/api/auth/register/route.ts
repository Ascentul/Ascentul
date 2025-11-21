import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create auth user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 400 }
      )
    }

    // Generate username from name (lowercase, no spaces, add random suffix if needed)
    const baseUsername = name.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
    const randomSuffix = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    const username = `${baseUsername}${randomSuffix}`

    // Create user profile in database (id must equal auth.user.id for RLS convenience)
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        username,
        email: data.user.email,
        name,
        user_type: 'regular',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating user profile:', profileError)
      
      // Handle duplicate email error
      if (profileError.code === '23505' && profileError.message?.includes('users_email_key')) {
        // Try linking to existing profile by email
        const { data: existingProfile } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single()

        if (existingProfile) {
          const { data: updatedProfile } = await supabase
            .from('users')
            .update({ id: data.user.id })
            .eq('email', email)
            .select()
            .single()

          if (updatedProfile) {
            return NextResponse.json({
              user: updatedProfile,
              message: 'Registration successful - linked to existing profile'
            }, { status: 201 })
          }
        }
        
        return NextResponse.json(
          { error: 'An account with this email already exists. Please try logging in instead.' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error creating user profile' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: userProfile,
      message: 'Registration successful'
    }, { status: 201 })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}