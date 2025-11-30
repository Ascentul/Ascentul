/**
 * GDPR Data Export API Route
 *
 * Implements GDPR Article 15 (Right of Access) and Article 20 (Right to Data Portability)
 * Provides users with a downloadable JSON file containing all their personal data
 */

import { NextRequest, NextResponse } from "next/server";
import { api } from "convex/_generated/api";
import { convexServer } from "@/lib/convex-server";
import { requireConvexToken } from "@/lib/convex-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    // Get authentication from request
    const { userId, token } = await requireConvexToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the user's data export
    let exportData;
    try {
      exportData = await convexServer.query(
        api.gdpr.getUserDataForExport,
        { clerkId: userId },
        token
      );
    } catch (error) {
      console.error("Error fetching user data for export:", error);
      return NextResponse.json(
        { error: "Failed to export user data" },
        { status: 500 }
      );
    }

    if (!exportData) {
      return NextResponse.json(
        { error: "No data found for user" },
        { status: 404 }
      );
    }

    // Format the JSON with proper indentation for readability
    const jsonContent = JSON.stringify(exportData, null, 2);

    // Generate filename with date
    const date = new Date().toISOString().split("T")[0];
    const filename = `personal-data-export-${date}.json`;

    // Return as downloadable JSON file
    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        // Security headers
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("GDPR data export error:", error);
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

// GET endpoint for checking export status / initiating from browser
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireConvexToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Return info about the export endpoint
    return NextResponse.json({
      message: "Use POST request to download your personal data",
      gdprArticles: ["Article 15 - Right of Access", "Article 20 - Right to Data Portability"],
      format: "JSON",
      instructions: "Submit a POST request to this endpoint to receive a downloadable JSON file containing all your personal data.",
    });
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
