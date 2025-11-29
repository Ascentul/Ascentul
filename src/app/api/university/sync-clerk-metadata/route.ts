import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { getErrorMessage } from '@/lib/errors';
import { convexServer } from '@/lib/convex-server';

/**
 * Sync university assignment to Clerk publicMetadata
 *
 * This endpoint ensures that when a university admin assigns a student,
 * the student's Clerk account is updated with university_id in publicMetadata.
 * This allows the subscription hook to properly recognize university students
 * and grant them premium access.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = await getToken({ template: 'convex' });
    if (!token) {
      return NextResponse.json({ error: 'Failed to obtain auth token' }, { status: 401 });
    }

    const body = await req.json();
    const { studentEmail, universityId } = body;

    if (!studentEmail || !universityId) {
      return NextResponse.json(
        { error: 'Missing studentEmail or universityId' },
        { status: 400 }
      );
    }

    // Verify the requester is a university admin
    const adminUser = await convexServer.query(api.users.getUserByClerkId, {
      clerkId: userId,
    }, token);

    if (!adminUser || !['super_admin', 'university_admin'].includes(adminUser.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify the admin belongs to this university (unless super_admin)
    if (adminUser.role !== 'super_admin' && adminUser.university_id !== universityId) {
      return NextResponse.json(
        { error: 'Cannot assign students to other universities' },
        { status: 403 }
      );
    }

    const client = await clerkClient();

    // Find the student by email in Clerk
    const users = await client.users.getUserList({
      emailAddress: [studentEmail],
    });

    if (!users.data || users.data.length === 0) {
      // Student doesn't have a Clerk account yet - they'll get the metadata when they sign up
      return NextResponse.json({
        success: true,
        message: 'Student not yet registered. Metadata will be set upon signup.',
        userFound: false,
      });
    }

    const studentClerkUser = users.data[0];

    // Update Clerk publicMetadata with university_id
    await client.users.updateUser(studentClerkUser.id, {
      publicMetadata: {
        ...studentClerkUser.publicMetadata,
        university_id: universityId,
        // Set role to 'user' if not already set (students are regular users with university plan)
        role: studentClerkUser.publicMetadata.role || 'user',
      },
    });

    console.log(`[Sync Clerk Metadata] Updated user ${studentEmail} with university_id: ${universityId}`);

    return NextResponse.json({
      success: true,
      message: 'Clerk metadata updated successfully',
      userFound: true,
    });
  } catch (error: unknown) {
    console.error('Sync Clerk metadata error:', error);
    const message = getErrorMessage(error, 'Internal server error');
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
