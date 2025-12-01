import { getAuth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { userId, sessionId } = getAuth(request);
  const cookieHeader = request.headers.get('cookie') || '';
  return NextResponse.json({
    userId: userId ?? null,
    sessionId: sessionId ?? null,
    hasCookies: cookieHeader.length > 0,
    cookiesPreview: cookieHeader.slice(0, 200),
  });
}
