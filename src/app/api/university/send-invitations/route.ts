import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from 'convex/_generated/api';
import { sendUniversityInvitationEmail } from '@/lib/email';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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

    // Get the university admin's info to fetch university name
    const adminUser = await convex.query(api.users.getUserByClerkId, { clerkId: userId });

    if (!adminUser || !adminUser.university_id) {
      return NextResponse.json({ error: 'University admin not found' }, { status: 404 });
    }

    // Get the university details
    const university = await convex.query(api.universities.getUniversity, {
      universityId: adminUser.university_id
    });

    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 });
    }

    // Send invitation emails
    const results = await Promise.allSettled(
      emails.map(async (email: string) => {
        try {
          // Create invite link to sign-up page with email pre-filled
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.ascentful.io';
          const inviteLink = `${baseUrl}/sign-up?email=${encodeURIComponent(email)}&university=${encodeURIComponent(university.name)}`;

          await sendUniversityInvitationEmail(email, university.name, inviteLink);
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
