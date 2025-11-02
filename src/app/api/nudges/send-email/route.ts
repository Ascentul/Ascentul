/**
 * API Route: Send Nudge Email
 *
 * Called by Convex dispatch action to send nudge emails
 * (Convex can't import Node.js modules directly)
 */

import { NextRequest, NextResponse } from 'next/server'
import { sendNudgeEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    // Verify internal request (optional security check)
    const internalKey = request.headers.get('X-Convex-Internal-Key')
    if (
      process.env.CONVEX_INTERNAL_KEY &&
      internalKey !== process.env.CONVEX_INTERNAL_KEY
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { email, name, nudge } = body

    // Validate required fields
    if (!email || !name || !nudge) {
      return NextResponse.json(
        { error: 'Missing required fields: email, name, nudge' },
        { status: 400 }
      )
    }

    // Send email
    const result = await sendNudgeEmail(email, name, nudge)

    return NextResponse.json({
      success: true,
      messageId: result.id,
    })
  } catch (error) {
    console.error('[API] Send nudge email error:', error)

    // Don't expose internal errors to client
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    )
  }
}
