import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { ConvexHttpClient } from 'convex/browser'

function createConvexClient(): ConvexHttpClient | null {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!convexUrl) return null
  return new ConvexHttpClient(convexUrl)
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = createConvexClient()
    if (!client) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    }

    const conversations = await client.query(api.ai_coach.getConversations, {
      clerkId: userId
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const client = createConvexClient()
    if (!client) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    }

    const newConversation = await client.mutation(api.ai_coach.createConversation, {
      clerkId: userId,
      title
    })

    return NextResponse.json(newConversation, { status: 201 })
  } catch (error) {
    console.error('Error creating conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
