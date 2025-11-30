/**
 * GDPR Account Deletion API Route
 *
 * Implements GDPR Article 17 (Right to Erasure / Right to be Forgotten)
 * Provides users with the ability to request account deletion with a 30-day grace period
 */

import { NextRequest, NextResponse } from "next/server";
import { api } from "convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import { requireConvexToken } from "@/lib/convex-auth";

export const dynamic = "force-dynamic";

/**
 * POST - Request account deletion
 */
export async function POST(request: NextRequest) {
  try {
    // Get authentication from request
    const { userId, token } = await requireConvexToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body for optional reason
    let body: { reason?: string; immediateDelete?: boolean } = {};
    try {
      body = await request.json();
    } catch {
      // Body is optional
    }

    // Request account deletion
    let result;
    try {
      result = await convexServer.mutation(
        api.gdpr.requestAccountDeletion,
        {
          reason: body.reason,
          immediateDelete: body.immediateDelete,
        },
        token
      );
    } catch (error: any) {
      console.error("Error requesting account deletion:", error);
      return NextResponse.json(
        { error: error.message || "Failed to request account deletion" },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("GDPR account deletion error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel a pending deletion request
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authentication from request
    const { userId, token } = await requireConvexToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cancel deletion request
    let result;
    try {
      result = await convexServer.mutation(
        api.gdpr.cancelAccountDeletion,
        {},
        token
      );
    } catch (error: any) {
      console.error("Error cancelling account deletion:", error);
      return NextResponse.json(
        { error: error.message || "Failed to cancel deletion request" },
        { status: 400 }
      );
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("GDPR cancel deletion error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET - Check deletion status
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, token } = await requireConvexToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get deletion status
    let status;
    try {
      status = await convexServer.query(
        api.gdpr.getDeletionStatus,
        {},
        token
      );
    } catch (error) {
      console.error("Error fetching deletion status:", error);
      return NextResponse.json(
        { error: "Failed to fetch deletion status" },
        { status: 500 }
      );
    }

    return NextResponse.json(status || { hasPendingDeletion: false }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
