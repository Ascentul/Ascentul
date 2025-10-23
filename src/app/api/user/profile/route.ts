import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export async function PUT(request: NextRequest) {
  try {
    const { name, email } = await request.json()

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    const authResult = await auth()
    const { userId } = authResult
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    }

    const convex = new ConvexHttpClient(convexUrl)
    const token = await authResult.getToken({ template: 'convex' }).catch(() => null)
    if (token) {
      convex.setAuth(token)
    }

    await convex.mutation(api.users.updateUser, {
      clerkId: userId,
      updates: { name, email },
    })

    const updatedUser = await convex.query(api.users.getUserByClerkId, { clerkId: userId })

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
