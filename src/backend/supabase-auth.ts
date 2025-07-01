import { Request, Response, NextFunction } from "express"
import { supabase, supabaseAdmin } from "./supabase"
import { User } from "../types/database"
import { ENV } from "../config/env"

// Add type for augmenting Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User | null
      userId?: string // Keep as string since Supabase uses UUIDs
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

    console.log("Authenticated Supabase user ID:", data.user.id)

    // Get detailed user information from database using UUID
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id) // Use UUID directly, no conversion needed
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)

      // If user doesn't exist in our database but has valid Supabase auth,
      // create a user record
      if (userError?.code === "PGRST116") {
        console.log("Creating user record for authenticated Supabase user")

        const { data: newUserData, error: createError } = await supabaseAdmin
          .from("users")
          .insert({
            id: data.user.id, // Use the Supabase UUID
            email: data.user.email,
            name:
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "User",
            username: `user_${data.user.id.slice(0, 8)}`,
            user_type: "regular",
            needs_username: true,
            onboarding_completed: false
          })
          .select()
          .single()

        if (createError) {
          console.error("Error creating user record:", createError)
          return res
            .status(500)
            .json({ message: "Error setting up user account" })
        }

        // Use the newly created user data
        req.user = newUserData as unknown as User
        req.userId = data.user.id // Keep as UUID string

        console.log("Created new user record for:", data.user.email)
        return next()
      }

      return res.status(500).json({ message: "Error loading user data" })
    }

    // Attach the user to the request
    req.user = userData as unknown as User
    req.userId = data.user.id // Keep as UUID string

    console.log("Successfully authenticated user:", userData.email)
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
