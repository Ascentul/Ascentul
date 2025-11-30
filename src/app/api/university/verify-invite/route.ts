import { NextRequest, NextResponse } from 'next/server';
import { api } from 'convex/_generated/api';
import { convexServer } from '@/lib/convex-server';

/**
 * Verify a university invite token before signup.
 * Returns invite metadata (email, universityName, expiresAt) when valid.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const result = await convexServer.query(api.students.validateInviteToken, { token });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('[verify-invite] Error validating invite token:', error);
    return NextResponse.json({ error: 'Invite verification failed' }, { status: 500 });
  }
}
