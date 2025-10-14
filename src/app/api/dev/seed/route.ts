import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../../convex/_generated/api";
import crypto from 'crypto';

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

// Helper function for constant-time comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Seeding is only available in development" },
        { status: 403 }
      );
    }

    // Optional: Add API key protection even in development
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.DEV_SEED_API_KEY;

    if (expectedKey && !safeCompare(authHeader || '', `Bearer ${expectedKey}`)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!CONVEX_URL) {
      throw new Error("Convex URL not set");
    }

    const convex = new ConvexHttpClient(CONVEX_URL);

    // Check current state
    const before = await convex.query(api.devSeed.hasCatalog, {});
    const results: any = { before };

    // Seed templates if needed
    if (before.templates === 0) {
      results.templates = await convex.mutation(api.devSeed.seedTemplates, {});
    } else {
      results.templates = { inserted: 0, message: "Templates already exist" };
    }

    // Seed themes if needed
    if (before.themes === 0) {
      results.themes = await convex.mutation(api.devSeed.seedThemes, {});
    } else {
      results.themes = { inserted: 0, message: "Themes already exist" };
    }

    // Check final state
    results.after = await convex.query(api.devSeed.hasCatalog, {});

    return NextResponse.json(results);
  } catch (e: any) {
    console.error("Seed error:", e);
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "Seeding is only available in development" },
        { status: 403 }
      );
    }

    // Optional: Add API key protection even in development
    const authHeader = request.headers.get("authorization");
    const expectedKey = process.env.DEV_SEED_API_KEY;

    if (expectedKey && !safeCompare(authHeader || '', `Bearer ${expectedKey}`)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!CONVEX_URL) {
      throw new Error("Convex URL not set");
    }

    const convex = new ConvexHttpClient(CONVEX_URL);
    const catalog = await convex.query(api.devSeed.hasCatalog, {});

    return NextResponse.json(catalog);
  } catch (e: any) {
    console.error("Catalog check error:", e);
    return NextResponse.json(
      { error: "Failed to fetch catalog" },
      { status: 500 }
    );
  }
}
