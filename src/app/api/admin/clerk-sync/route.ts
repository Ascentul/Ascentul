/**
 * Clerk Sync API Route
 * Handles Clerk account operations (ban/unban) for soft delete/restore
 * Called from Convex actions to sync account status with Clerk
 */

import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { NextRequest, NextResponse } from 'next/server';

import { deleteClerkUser, disableClerkUser, enableClerkUser } from '@/lib/clerkAdmin';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'admin',
    httpMethod: 'POST',
    httpPath: '/api/admin/clerk-sync',
  });

  const startTime = Date.now();
  log.info('Clerk sync request started', { event: 'request.start' });

  try {
    // Verify the request is from an authenticated admin
    const { userId } = await auth();

    if (!userId) {
      log.warn('User not authenticated', { event: 'auth.failed', errorCode: 'UNAUTHORIZED' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    let body: any;
    try {
      body = await request.json();
    } catch {
      log.warn('Invalid JSON in request body', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
      });
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const { action, clerkId } = body;

    // Validate required fields (fail fast before expensive operations)
    if (!action || !clerkId) {
      log.warn('Missing required fields', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        { error: 'Missing required fields: action, clerkId' },
        { status: 400, headers: { 'x-correlation-id': correlationId } },
      );
    }

    // CRITICAL: Verify super_admin role
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      log.error('Missing NEXT_PUBLIC_CONVEX_URL', 'CONFIG_ERROR', { event: 'config.error' });
      return NextResponse.json(
        { error: 'Server configuration error' },
        {
          status: 500,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Initialize authenticated Convex client
    const convex = new ConvexHttpClient(convexUrl);
    const authResult = await auth();
    const token = await authResult.getToken({ template: 'convex' });

    if (token) {
      convex.setAuth(token);
    }

    const adminUser = await convex.query(api.users.getUserByClerkId, {
      clerkId: userId,
    });

    if (!adminUser || adminUser.role !== 'super_admin') {
      log.warn('Forbidden - not a super admin', {
        event: 'auth.forbidden',
        errorCode: 'FORBIDDEN',
      });
      return NextResponse.json(
        { error: 'Forbidden: Super admin role required' },
        {
          status: 403,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Perform the requested action
    if (action === 'disable') {
      // Get target user info for audit log
      const targetUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: clerkId,
      });

      if (!targetUser) {
        log.warn('Target user not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
        return NextResponse.json(
          { error: 'Target user not found in database' },
          {
            status: 404,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }

      await disableClerkUser(clerkId);

      // Audit log: Clerk account disabled
      try {
        await convex.mutation(api.audit_logs.createAuditLog, {
          action: 'clerk_user_disabled',
          target_type: 'user',
          target_id: targetUser._id,
          target_email: targetUser.email,
          target_name: targetUser.name,
          performed_by_id: adminUser._id,
          performed_by_email: adminUser.email,
          performed_by_name: adminUser.name,
          reason: 'Clerk account disabled (ban) via sync API',
        });
      } catch (auditError) {
        log.warn('Failed to create audit log for Clerk disable', {
          event: 'audit.log_failed',
          errorCode: toErrorCode(auditError),
        });
        // Don't fail the operation if audit logging fails
      }

      const durationMs = Date.now() - startTime;
      log.info('Clerk user disabled', {
        event: 'admin.clerk_user_disabled',
        clerkId: userId,
        httpStatus: 200,
        durationMs,
        extra: { targetClerkId: clerkId },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Clerk user disabled successfully',
        },
        { headers: { 'x-correlation-id': correlationId } },
      );
    } else if (action === 'enable') {
      // Get target user info for audit log
      const targetUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: clerkId,
      });

      if (!targetUser) {
        log.warn('Target user not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
        return NextResponse.json(
          { error: 'Target user not found in database' },
          {
            status: 404,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }

      await enableClerkUser(clerkId);

      // Audit log: Clerk account enabled
      try {
        await convex.mutation(api.audit_logs.createAuditLog, {
          action: 'clerk_user_enabled',
          target_type: 'user',
          target_id: targetUser._id,
          target_email: targetUser.email,
          target_name: targetUser.name,
          performed_by_id: adminUser._id,
          performed_by_email: adminUser.email,
          performed_by_name: adminUser.name,
          reason: 'Clerk account enabled (unban) via sync API',
        });
      } catch (auditError) {
        log.warn('Failed to create audit log for Clerk enable', {
          event: 'audit.log_failed',
          errorCode: toErrorCode(auditError),
        });
        // Don't fail the operation if audit logging fails
      }

      const durationMs = Date.now() - startTime;
      log.info('Clerk user enabled', {
        event: 'admin.clerk_user_enabled',
        clerkId: userId,
        httpStatus: 200,
        durationMs,
        extra: { targetClerkId: clerkId },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Clerk user enabled successfully',
        },
        { headers: { 'x-correlation-id': correlationId } },
      );
    } else if (action === 'delete') {
      // Permanently delete Clerk user (only for hard delete of test users)

      // DEFENSE-IN-DEPTH: Verify the target user is a test user
      const targetUser = await convex.query(api.users.getUserByClerkId, {
        clerkId: clerkId,
      });

      if (!targetUser) {
        log.warn('User not found', { event: 'data.not_found', errorCode: 'NOT_FOUND' });
        return NextResponse.json(
          { error: 'User not found in database' },
          {
            status: 404,
            headers: { 'x-correlation-id': correlationId },
          },
        );
      }

      if (!targetUser.is_test_user) {
        log.warn('Attempted to delete non-test user', {
          event: 'auth.forbidden',
          errorCode: 'FORBIDDEN',
        });
        return NextResponse.json(
          { error: 'Forbidden: Permanent deletion only allowed for test users' },
          { status: 403, headers: { 'x-correlation-id': correlationId } },
        );
      }

      await deleteClerkUser(clerkId);

      // Audit log: Clerk account permanently deleted
      try {
        await convex.mutation(api.audit_logs.createAuditLog, {
          action: 'clerk_user_deleted',
          target_type: 'user',
          target_id: targetUser._id,
          target_email: targetUser.email,
          target_name: targetUser.name,
          performed_by_id: adminUser._id,
          performed_by_email: adminUser.email,
          performed_by_name: adminUser.name,
          reason: 'Clerk account permanently deleted via sync API (test user)',
          metadata: {
            isTestUser: true,
          },
        });
      } catch (auditError) {
        log.warn('Failed to create audit log for Clerk delete', {
          event: 'audit.log_failed',
          errorCode: toErrorCode(auditError),
        });
        // Don't fail the operation if audit logging fails
      }

      const durationMs = Date.now() - startTime;
      log.info('Clerk user permanently deleted', {
        event: 'admin.clerk_user_deleted',
        clerkId: userId,
        httpStatus: 200,
        durationMs,
        extra: { targetClerkId: clerkId, isTestUser: true },
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Clerk user permanently deleted',
        },
        { headers: { 'x-correlation-id': correlationId } },
      );
    } else {
      log.warn('Invalid action', {
        event: 'validation.failed',
        errorCode: 'BAD_REQUEST',
        extra: { action },
      });
      return NextResponse.json(
        { error: `Invalid action: ${action}` },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Clerk sync API error', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      {
        error: 'Failed to sync Clerk account',
        ...(process.env.NODE_ENV === 'development' && {
          details: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500, headers: { 'x-correlation-id': correlationId } },
    );
  }
}
