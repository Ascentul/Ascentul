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
 * ⚠️ CRITICAL LIMITATION - SERVERLESS INCOMPATIBLE ⚠️
 *
 * This mutex ONLY works in single-instance environments (local development).
 * In serverless/multi-instance deployments (Vercel, AWS Lambda, Kubernetes, etc.),
 * each request may be handled by a different instance with its own memory space.
 * Concurrent requests to different instances will BYPASS this lock entirely.
 *
 * Example failure scenario in Vercel:
 *   Request 1 → Lambda Instance A (mutex.locked = true)
 *   Request 2 → Lambda Instance B (mutex.locked = false) ❌ BYPASSED!
 *   Both check `before.templates === 0` and seed simultaneously → duplicates
 *
 * Production-ready solutions:
 *   1. Distributed lock (Redis/DynamoDB) - True cross-instance locking
 *   2. Idempotency tokens - No external dependencies, works with Convex
 *   3. Database constraints - Defense in depth (unique indexes)
 *   4. Single-use deployment script - Simplest for development
 *
 * See docs/DEV_SEED_CONCURRENCY.md for detailed implementation guides.
 *
 * TODO: Replace with idempotency-based solution before production deployment
 */
const MUTEX_TIMEOUT_MS = 30000;

class MutexTimeoutError extends Error {
  constructor(message = 'Mutex acquisition timeout') {
    super(message);
    this.name = 'MutexTimeoutError';
  }
}

class SeedMutex {
  private locked = false;
  private waitQueue: Array<{ resolve: () => void; reject: (error: Error) => void; timeoutId: NodeJS.Timeout }> = [];

  async acquire(timeoutMs: number = MUTEX_TIMEOUT_MS): Promise<void> {
    if (!this.locked) {
      this.locked = true;
      return;
    }

    // Wait in queue until lock is released
    return new Promise<void>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.waitQueue.findIndex((entry) => entry.resolve === resolve);
        if (index > -1) {
          this.waitQueue.splice(index, 1);
          reject(new MutexTimeoutError());
        }
      }, timeoutMs);

      this.waitQueue.push({ resolve, reject, timeoutId });
    });
  }

  release(): void {
    const next = this.waitQueue.shift();
    if (next) {
      // Pass lock to next waiting request
      clearTimeout(next.timeoutId);
      this.locked = true;
      next.resolve();
    } else {
      // No one waiting, unlock
      this.locked = false;
    }
  }
}

const seedMutex = new SeedMutex();

function validateConvexUrl(): string {
  if (!CONVEX_URL) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable is not set. " +
      "Please add it to your .env.local file."
    );
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
  try {
    // Validate access before acquiring mutex to prevent unauthorized requests from blocking the lock
    const accessError = checkDevAccess(request);
    if (accessError) return accessError;

    const url = validateConvexUrl();

    // Acquire mutex lock to prevent concurrent seeding (after validation)
    await seedMutex.acquire();

    try {
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
    } finally {
      // Always release the lock after seeding operations
      seedMutex.release();
    }
  } catch (e: any) {
    console.error("Seed error:", e);
    if (e instanceof MutexTimeoutError) {
      return NextResponse.json(
        {
          error: "Another seeding operation is currently running. Please wait and try again.",
        },
        {
          status: 503,
          headers: { 'Retry-After': String(Math.ceil(MUTEX_TIMEOUT_MS / 6000)) },
        }
      );
    }
    return NextResponse.json(
      { error: "Failed to seed database" },
      { status: 500 }
    );
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
