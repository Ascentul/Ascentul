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

/**
 * Simple in-memory mutex to prevent concurrent seeding operations.
 *
 * This prevents race conditions where multiple POST requests check
 * `before.templates === 0` simultaneously and both attempt to seed,
 * potentially causing duplicate entries or conflicts.
 */
class SeedMutex {
  private locked = false;
  private waitQueue: Array<() => void> = [];

  async acquire(): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    // Wait in queue until lock is released
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      // Pass lock to next waiting request
      next();
    } else {
      // No one waiting, unlock
      this.locked = false;
    }
  }
}

const seedMutex = new SeedMutex();

function validateConvexUrl(): string {
  if (!CONVEX_URL) {
    throw new Error("Convex URL not set");
  }
  return CONVEX_URL;
}

/**
 * Validates dev access by checking environment and optional API key.
 * Returns a NextResponse if access is denied, null if access is granted.
 */
function checkDevAccess(request: Request): NextResponse | null {
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

  return null; // Access granted
}

interface SeedResults {
  before: { templates: number; themes: number };
  templates?: { inserted: number; message?: string };
  themes?: { inserted: number; message?: string };
  after?: { templates: number; themes: number };
}

export async function POST(request: Request) {
  // Acquire mutex lock to prevent concurrent seeding
  await seedMutex.acquire();

  try {
    const accessError = checkDevAccess(request);
    if (accessError) return accessError;

    const url = validateConvexUrl();
    const convex = new ConvexHttpClient(url);

    // Check current state
    const before = await convex.query(api.devSeed.hasCatalog, {});
    const results: SeedResults = { before };

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
  } finally {
    // Always release the lock, even if an error occurred
    seedMutex.release();
  }
}

export async function GET(request: Request) {
  try {
    const accessError = checkDevAccess(request);
    if (accessError) return accessError;

    const url = validateConvexUrl();
    const convex = new ConvexHttpClient(url);
    const catalog = await convex.query(api.devSeed.hasCatalog, {});

    return NextResponse.json(catalog);
  } catch (e: any) {
    console.error("Catalog check error:", e);
    return NextResponse.json(
      { error: "Failed to check catalog" },
      { status: 500 }
    );
  }
}
