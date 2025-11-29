import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { fetchQuery, fetchMutation } from 'convex/nextjs'

export async function GET() {
  try {
    const authResult = await auth()
    const { userId } = authResult
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await authResult.getToken({ template: 'convex' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })
    }

    const conversations = await fetchQuery(
      api.ai_coach.getConversations,
      { clerkId: userId },
      { token }
    )

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await auth()
    const { userId } = authResult
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = await authResult.getToken({ template: 'convex' })
    if (!token) {
      return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const newConversation = await fetchMutation(
      api.ai_coach.createConversation,
      { clerkId: userId, title },
      { token }
    )

    return NextResponse.json(newConversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
