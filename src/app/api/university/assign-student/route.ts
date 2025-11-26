import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { ConvexHttpClient } from 'convex/browser';
// Workaround for "Type instantiation is excessively deep" error in Convex
const api: any = require('convex/_generated/api').api;
import { Id } from 'convex/_generated/dataModel';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { clerkId, email, role, departmentId } = body;

    if (!clerkId || !email) {
      return NextResponse.json(
        { error: 'Missing clerkId or email' },
        { status: 400 }
      );
    }

    // Get the admin's university info
    const adminUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: userId,
    });

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

    // Assign student in Convex
    const result = await convex.mutation(api.university_admin.assignStudentByEmail, {
      clerkId: userId,
      email: email,
      role: role || 'user',
      departmentId: departmentId as Id<'departments'> | undefined,
    });

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
  } catch (error: any) {
    console.error('Assign student error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
