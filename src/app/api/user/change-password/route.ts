import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      )
    }

    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const client = clerkClient
    try {
      await client.users.verifyPassword({ userId, password: currentPassword })
    } catch (error: any) {
      console.error('Password verification failed:', error)
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 400 },
      )
    }

    await client.users.updateUser(userId, { password: newPassword })

    return NextResponse.json({
      message: 'Password updated successfully'
    })
  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
