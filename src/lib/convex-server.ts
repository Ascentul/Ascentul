/**
 * Server-side Convex client configuration
 *
 * Prefers server-only environment variables over client-exposed ones
 * to avoid coupling server concerns to NEXT_PUBLIC_* variables
 *
 * MIGRATION GUIDE FOR EXISTING API ROUTES:
 * =========================================
 *
 * Old pattern (inefficient, creates new client per request):
 * ```typescript
 * import { ConvexHttpClient } from 'convex/browser'
 *
 * function getClient() {
 *   const url = process.env.NEXT_PUBLIC_CONVEX_URL
 *   if (!url) throw new Error('Convex URL not configured')
 *   return new ConvexHttpClient(url)
 * }
 *
 * export async function GET() {
 *   const convex = getClient()
 *   const data = await convex.query(api.module.function)
 *   // ...
 * }
 * ```
 *
 * New pattern (efficient, uses singleton + server-only env var):
 * ```typescript
 * import { getConvexClient } from '@/lib/convex-server'
 *
 * export async function GET() {
 *   const convex = getConvexClient()
 *   const data = await convex.query(api.module.function)
 *   // ...
 * }
 * ```
 *
 * Benefits:
 * - ✅ Connection pooling (singleton pattern)
 * - ✅ Server-only env var (CONVEX_URL takes precedence)
 * - ✅ Consistent error handling
 * - ✅ Reduced memory overhead
 */

import { ConvexHttpClient } from 'convex/browser'

/**
 * Get Convex deployment URL for server-side usage
 *
 * Priority order:
 * 1. CONVEX_URL (server-only, recommended)
 * 2. NEXT_PUBLIC_CONVEX_URL (fallback, client-exposed)
 *
 * Note: CONVEX_DEPLOYMENT is intentionally NOT used here as it may contain
 * CLI-specific values like "dev:deployment-name" which are invalid HTTP URLs
 *
 * @throws {Error} If no Convex URL is configured
 */
export function getConvexUrl(): string {
  const url =
    process.env.CONVEX_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL

  if (!url) {
    throw new Error(
      'Missing Convex configuration. Set CONVEX_URL (server-only) or NEXT_PUBLIC_CONVEX_URL (client-exposed) environment variable.'
    )
  }

  // Validate URL format
  if (!url.startsWith('https://') && !url.startsWith('http://')) {
    throw new Error(
      `Invalid Convex URL format: "${url}". Must start with "https://" or "http://". ` +
      `If you see "dev:deployment-name", this is from CONVEX_DEPLOYMENT which is for CLI use only. ` +
      `Use NEXT_PUBLIC_CONVEX_URL instead.`
    )
  }

  return url
}

/**
 * Create server-side Convex HTTP client
 *
 * Use this singleton in API routes instead of creating new clients
 * to benefit from connection pooling and avoid environment variable parsing overhead
 */
let _convexClient: ConvexHttpClient | null = null

export function getConvexClient(): ConvexHttpClient {
  if (!_convexClient) {
    _convexClient = new ConvexHttpClient(getConvexUrl())
  }
  return _convexClient
}
