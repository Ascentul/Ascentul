import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get the current user from the session
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Update user profile in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ name, email })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user profile:', updateError)
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      )
    }

    // Update auth user email if it changed
    if (email !== user.email) {
      const { error: emailUpdateError } = await supabase.auth.admin.updateUserById(
        user.id,
        { email }
      )

      if (emailUpdateError) {
        console.error('Error updating auth email:', emailUpdateError)
        // Continue anyway, profile was updated
      }
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'Profile updated successfully'
    })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
