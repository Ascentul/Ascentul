import { auth, clerkClient } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';

import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';
import { ClerkPublicMetadata } from '@/types/clerk';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Validate a role transition
 *
 * POST /api/admin/users/validate-role
 * Body: { userId: string, currentRole: string, newRole: string, universityId?: string }
 * Returns: { valid: boolean, error?: string, warnings?: string[], requiredActions?: string[] }
 */
export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'admin',
    httpMethod: 'POST',
    httpPath: '/api/admin/users/validate-role',
  });

  const startTime = Date.now();
  log.info('Role validation request started', { event: 'request.start' });

  try {
    const authResult = await auth();
    const { userId } = authResult;

    if (!userId) {
      log.warn('User not authenticated', { event: 'auth.failed', errorCode: 'UNAUTHORIZED' });
      return NextResponse.json(
        { valid: false, error: 'Unauthorized - Please sign in' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    // Verify caller is super_admin
    const client = await clerkClient();
    const caller = await client.users.getUser(userId);
    const callerRole = (caller.publicMetadata as ClerkPublicMetadata)?.role;

    if (callerRole !== 'super_admin') {
      log.warn('Forbidden - not a super admin', {
        event: 'auth.forbidden',
        errorCode: 'FORBIDDEN',
      });
      return NextResponse.json(
        { valid: false, error: 'Forbidden - Only super admins can validate roles' },
        {
          status: 403,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    if (!convexUrl) {
      log.error('Missing NEXT_PUBLIC_CONVEX_URL', 'CONFIG_ERROR', {
        event: 'config.error',
      });
      return NextResponse.json(
        { valid: false, error: 'Server configuration error' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    const body = await request.json();
    const { userId: targetUserId, currentRole, newRole, universityId } = body;

    if (!targetUserId || !currentRole || !newRole) {
      return NextResponse.json({ valid: false, error: 'Missing required fields' }, { status: 400 });
    }

    // Validate universityId format if provided
    if (universityId !== undefined && universityId !== null) {
      if (typeof universityId !== 'string' || universityId.trim().length === 0) {
        return NextResponse.json(
          { valid: false, error: 'Invalid university ID: must be a non-empty string' },
          { status: 400 },
        );
      }

      // Basic format check: Convex IDs are alphanumeric with possible underscores
      if (!/^[a-z0-9_]+$/i.test(universityId)) {
        return NextResponse.json(
          { valid: false, error: 'Invalid university ID format: contains invalid characters' },
          { status: 400 },
        );
      }
    }

    // Use Convex query to validate (centralizes business logic)
    const convex = new ConvexHttpClient(convexUrl);
    const convexToken = await authResult.getToken({ template: 'convex' });
    if (convexToken) {
      convex.setAuth(convexToken);
    }

    const result = await convex.query(api.roleValidation.validateRoleTransition, {
      userId: targetUserId,
      currentRole,
      newRole,
      universityId:
        universityId && typeof universityId === 'string' && universityId.trim().length > 0
          ? (universityId as Id<'universities'>)
          : undefined,
    });

    const durationMs = Date.now() - startTime;
    log.info('Role validation completed', {
      event: 'admin.role_validated',
      clerkId: userId,
      httpStatus: 200,
      durationMs,
      extra: { valid: result.valid },
    });

    return NextResponse.json(result, {
      headers: { 'x-correlation-id': correlationId },
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Role validation error', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      {
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
