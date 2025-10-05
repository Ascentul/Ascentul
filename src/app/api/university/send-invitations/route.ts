import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { emails } = body;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'No emails provided' }, { status: 400 });
    }

    // Send activation emails via Clerk magic link
    const results = await Promise.allSettled(
      emails.map(async (email: string) => {
        try {
          // Use Clerk's magic link API to send activation email
          const response = await fetch('https://api.clerk.com/v1/magic_links', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email_address: email,
              redirect_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/university-activation`,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.errors?.[0]?.message || `Failed to send invitation to ${email}`);
          }

          return { email, success: true };
        } catch (error: any) {
          console.error(`Error sending invitation to ${email}:`, error);
          return { email, success: false, error: error.message };
        }
      })
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return NextResponse.json({
      success: true,
      total: emails.length,
      successful,
      failed,
      results: results.map(r => r.status === 'fulfilled' ? r.value : { email: 'unknown', success: false, error: 'Unknown error' }),
    });
  } catch (error: any) {
    console.error('Send invitations error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
