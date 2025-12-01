import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';

import { ClerkPublicMetadata } from '@/types/clerk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Check role synchronization status between Clerk and Convex
 *
 * POST /api/admin/users/check-role-sync
 * Body: { email: string }
 * Returns: Diagnostic information about role sync status
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 });
    }

    // Verify caller is super_admin
    const client = await clerkClient();
    const caller = await client.users.getUser(userId);
    const callerRole = (caller.publicMetadata as ClerkPublicMetadata)?.role;

    if (callerRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Forbidden - Only super admins can run diagnostics' },
        { status: 403 },
      );
    }

    if (!convexUrl) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user in Clerk by email
    const clerkUsers = await client.users.getUserList({
      emailAddress: [email],
    });

    if (!clerkUsers.data || clerkUsers.data.length === 0) {
      return NextResponse.json({ error: 'User not found in Clerk' }, { status: 404 });
    }

    if (clerkUsers.data.length > 1) {
      return NextResponse.json(
        { error: 'Multiple users found with this email. Please use Clerk ID instead.' },
        { status: 400 },
      );
    }

    const clerkUser = clerkUsers.data[0];
    const clerkRole = (clerkUser.publicMetadata as ClerkPublicMetadata)?.role || null;

    // Find user in Convex
    const convex = new ConvexHttpClient(convexUrl);
    const convexToken = await authResult.getToken({ template: 'convex' });
    if (convexToken) {
      convex.setAuth(convexToken);
    }
    const convexUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: clerkUser.id,
    });

    if (!convexUser) {
      return NextResponse.json({
        user: null,
        clerkData: {
          id: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || 'no-email',
        },
        mismatch: true,
        clerkRole,
        convexRole: null,
        lastSync: null,
        issues: ['User exists in Clerk but not in Convex database'],
        suggestions: [
          'User may not have completed sign-up',
          'Check webhook configuration',
          'Manually create user in Convex',
        ],
      });
    }

    const convexRole = convexUser.role || null;
    const mismatch = clerkRole !== convexRole;

    const issues: string[] = [];
    const suggestions: string[] = [];

    if (mismatch) {
      issues.push(`Role mismatch: Clerk has "${clerkRole}", Convex has "${convexRole}"`);
      issues.push(
        'Authorization decisions use Clerk role, but UI may show incorrect role from Convex',
      );

      if (!clerkRole) {
        suggestions.push('Set role in Clerk publicMetadata - this is the source of truth');
        suggestions.push('After setting in Clerk, webhook will sync to Convex');
      } else if (!convexRole) {
        suggestions.push('Convex role is missing - webhook may have failed');
        suggestions.push('Use "Sync to Convex" to update database with Clerk role');
      } else {
        suggestions.push('Recommended: Sync from Convex to Clerk to preserve existing role');
        suggestions.push('Alternative: Sync from Clerk to Convex if Clerk role is correct');
      }
    } else {
      suggestions.push('Roles are in sync - no action needed');
    }

    return NextResponse.json({
      user: convexUser,
      clerkData: {
        id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || 'no-email',
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
      },
      mismatch,
      clerkRole,
      convexRole,
      lastSync: convexUser.updated_at || null,
      issues,
      suggestions,
    });
  } catch (error) {
    console.error('[API] Role sync check error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Diagnostic failed',
      },
      { status: 500 },
    );
  }
}
