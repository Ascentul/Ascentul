import { Request, Response, NextFunction } from "express"
import { supabaseAdmin } from "./supabase"
import { storage } from "./storage"
import { User } from "../types/database"
import { ENV } from "../config/env"

// Add type for augmenting Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User | null
      userId?: number // Use numeric DB user ID consistently
    }
  }
}

/**
 * Middleware to verify Supabase JWT token and attach user to request
 */
export async function verifySupabaseToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Get the Authorization header
    const authHeader = req.headers.authorization

    // Check if the header exists and starts with "Bearer "
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication required" })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]

    // Verify the JWT with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      return res
        .status(401)
        .json({ message: "Invalid or expired authentication token" })
    }

    console.log("Authenticated Supabase auth user:", data.user.email)

    // Align with DB: look up app user by email to get numeric ID
    const email = data.user.email
    if (!email) {
      return res.status(401).json({ message: "Authenticated user has no email" })
    }

    const appUser = await storage.getUserByEmail(email)
    if (!appUser) {
      console.error("No matching app user found for email:", email)
      return res.status(403).json({ message: "User not provisioned in app" })
    }

    // Attach the app user and numeric userId
    req.user = appUser
    req.userId = appUser.id

    console.log("Successfully authenticated app user:", appUser.email)
    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res
      .status(500)
      .json({ message: "Internal server error during authentication" })
  }
}

/**
 * No special handling for development mode - always require proper authentication
 */

/**
 * Middleware to check if user is an admin
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" })
  }

  if (req.user.role !== "admin" && req.user.role !== "super_admin") {
    return res.status(403).json({
      error: "Forbidden",
      message: "Admin privileges required to access this resource"
    })
  }

  next()
}

/**
 * Middleware to check if user is a staff member
 */
export function requireStaff(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" })
  }

  if (
    req.user.role !== "staff" &&
    req.user.role !== "admin" &&
    req.user.role !== "super_admin"
  ) {
    return res.status(403).json({
      error: "Forbidden",
      message: "Staff privileges required to access this resource"
    })
  }

  next()
}

/**
 * Middleware to check if user is a university admin
 */
export function requireUniversityAdmin(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" })
  }

  if (
    req.user.role !== "university_admin" &&
    req.user.role !== "admin" &&
    req.user.role !== "super_admin"
  ) {
    return res.status(403).json({
      error: "Forbidden",
      message: "University admin privileges required to access this resource"
    })
  }

  next()
}

/**
 * Helper function to check if a user is an admin
 */
export function isAdmin(user: User | null | undefined): boolean {
  return Boolean(user && (user.role === "admin" || user.role === "super_admin"))
}

/**
 * Helper function to check if a user is staff
 */
export function isStaff(user: User | null | undefined): boolean {
  return Boolean(user && (user.role === "staff" || isAdmin(user)))
}

/**
 * Helper function to check if a user is a university admin
 */
export function isUniversityAdmin(user: User | null | undefined): boolean {
  return Boolean(user && (user.role === "university_admin" || isAdmin(user)))
}
