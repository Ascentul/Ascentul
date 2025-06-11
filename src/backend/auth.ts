import { Request, Response, NextFunction } from "express"
import { storage } from "./storage"
import { supabaseAdmin } from "./supabase"
import { ENV } from "../config/env"
import {
  verifySupabaseToken,
  isAdmin as checkIsAdmin,
  isStaff as checkIsStaff,
  requireAdmin as supabaseRequireAdmin,
  requireStaff as supabaseRequireStaff
} from "./supabase-auth"
import { User } from "../utils/schema"

// Middleware to check if user is authenticated - use Supabase token verification
export function requireAuth(req: Request, res: Response, next: () => void) {
  verifySupabaseToken(req, res, next as any)
}

// Check if user is an admin - delegate to supabase-auth.ts helper
export function isAdmin(req: Request): boolean {
  // Use type assertion to deal with type compatibility issues
  return checkIsAdmin(req.user as any)
}

// Middleware to check if user is an admin - use the supabase-auth implementation
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  supabaseRequireAdmin(req, res, next)
}

// Dev Token Auth Bypass middleware
// Simplified to handle special cases in a cleaner way
export function devTokenAuthBypass(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // TEMPORARY: Special handling for reviews endpoints
  if (req.path.startsWith("/api/reviews")) {
    console.log(
      "ADMIN REVIEWS FIX: Redirecting to verifySupabaseToken with admin handling"
    )
    // Let verifySupabaseToken handle this - it has proper dev mode support
    return verifySupabaseToken(req, res, next)
  }

  // For development, let the verifySupabaseToken handle the dev mode
  if (ENV.NODE_ENV === "development") {
    console.log("DEV MODE: Redirecting to verifySupabaseToken")
    return verifySupabaseToken(req, res, next)
  }

  // If not a special case, continue to normal auth flow
  next()
}

// Standard authentication middleware - no fallback behavior
export function requireLoginFallback(
  req: Request,
  res: Response,
  next: () => void
) {
  // Simply use the standard verifySupabaseToken - no fallback behavior
  verifySupabaseToken(req, res, next as any)
}
