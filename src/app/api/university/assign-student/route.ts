import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { getErrorMessage } from '@/lib/errors';
import { convexServer } from '@/lib/convex-server';

/**
 * Assign a student to a university
 *
 * This endpoint:
 * 1. Assigns student in Convex database
 * 2. Syncs university_id to Clerk publicMetadata
 * 3. Ensures student gets premium access
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
    const { clerkId, email, role, departmentId } = body;

    if (!clerkId || !email) {
      return NextResponse.json(
        { error: 'Missing clerkId or email' },
        { status: 400 }
      );
    }

    // Validate departmentId format if provided
    if (departmentId !== undefined) {
      if (typeof departmentId !== 'string' || !departmentId.trim()) {
        return NextResponse.json(
          { error: 'Invalid or empty departmentId' },
          { status: 400 }
        );
      }
    }

    // Get the admin's university info
    const adminUser = await convexServer.query(
      api.users.getUserByClerkId,
      { clerkId: userId },
      token
    );

    if (!adminUser || !adminUser.university_id) {
      return NextResponse.json(
        { error: 'University admin not found or no university assigned' },
        { status: 404 }
      );
    }

    // Verify admin has permission
    if (!['super_admin', 'university_admin', 'advisor'].includes(adminUser.role)) {
      return NextResponse.json({
        error: 'Insufficient permissions. Only super admins, university admins, and advisors can assign students.'
      }, { status: 403 });
    }

    // Validate department ownership (if provided)
    if (departmentId !== undefined) {
      const department = await convexServer.query(
        api.departments.getDepartment,
        { departmentId: departmentId as Id<'departments'> },
        token
      );

      if (!department || department.university_id !== adminUser.university_id) {
        return NextResponse.json(
          { error: 'Department not found or access denied' },
          { status: 403 }
        );
      }
    }

    // Assign student in Convex
    // Note: This mutation should be idempotent - if the student is already assigned,
    // it should update rather than fail, to prevent issues on retry
    const result = await convexServer.mutation(
      api.university_admin.assignStudentByEmail,
      {
        clerkId: userId,
        email: email,
        role: role || 'user',
        departmentId: departmentId as Id<'departments'> | undefined,
      },
      token
    );

    // Sync to Clerk publicMetadata
    try {
      const client = await clerkClient();
      const users = await client.users.getUserList({
        emailAddress: [email],
      });

      if (users.data && users.data.length > 0) {
        const studentClerkUser = users.data[0];

        await client.users.updateUser(studentClerkUser.id, {
          publicMetadata: {
            ...studentClerkUser.publicMetadata,
            university_id: adminUser.university_id,
            role: role || 'user',
          },
        });

        console.log(`[Assign Student] Synced Clerk metadata for ${email}`);
      } else {
        console.log(`[Assign Student] User ${email} not found in Clerk - will sync on signup`);
      }
    } catch (clerkError) {
      console.error('[Assign Student] Failed to sync Clerk metadata:', clerkError);
      // Don't fail the request if Clerk sync fails - the webhook will handle it
    }

    return NextResponse.json({
      success: true,
      result,
      message: 'Student assigned successfully',
    });
  } catch (error: unknown) {
    console.error('Assign student error:', error);
    const message = getErrorMessage(error, 'Internal server error');
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
