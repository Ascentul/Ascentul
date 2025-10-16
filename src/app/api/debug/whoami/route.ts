import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Debug endpoint to inspect identity values
 * GET /api/debug/whoami
 *
 * Returns Convex URL and identity information from Convex
 */
export async function GET() {
  try {
    // 1. Check authentication
    const authResult = await auth();
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json(
        {
          error: "Unauthorized",
          convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || null,
          whoami: {
            hasUser: false,
            subject: null,
            tokenIdentifier: null,
            name: null,
            email: null,
          },
        },
        { status: 401 }
      );
    }

    // 2. Initialize Convex client with auth token
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      return NextResponse.json(
        { error: "Convex URL not configured" },
        { status: 500 }
      );
    }

    const convex = new ConvexHttpClient(convexUrl);
    const token = await authResult.getToken({ template: "convex" });
    if (token) {
      convex.setAuth(token);
    } else {
      console.warn("Convex token unavailable for authenticated user:", userId);
      return NextResponse.json(
        {
          error: "Convex token unavailable",
          convexUrl,
          whoami: null,
        },
        { status: 500 }
      );
    }

    // 3. Call whoami query
    const whoami = await convex.query(api.debug.whoami, {});

    // 4. Return results
    return NextResponse.json({
      convexUrl,
      whoami,
    });
  } catch (error: any) {
    console.error("Whoami endpoint error:", error);
    return NextResponse.json(
      {
        error: error.message || "Internal server error",
        convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL || null,
        whoami: null,
      },
      { status: 500 }
    );
  }
}
