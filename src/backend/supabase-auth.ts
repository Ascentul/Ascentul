import { Request, Response, NextFunction } from "express"
import { supabase, supabaseAdmin } from "./supabase"
import { User } from "../utils/schema"
import { ENV } from "../config/env"

// Add type for augmenting Express Request
declare global {
  namespace Express {
    interface Request {
      user?: User | null
      userId?: string
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
      // Special handling for development environment
      if (ENV.NODE_ENV === "development") {
        console.log("DEV MODE: No auth token provided, using fallback user")
        return handleDevMode(req, next)
      }
      return res.status(401).json({ message: "Authentication required" })
    }

    // Extract the token
    const token = authHeader.split(" ")[1]

    // Verify the JWT with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      // Special handling for development environment
      if (ENV.NODE_ENV === "development") {
        console.log("DEV MODE: Invalid token, using fallback user")
        return handleDevMode(req, next)
      }
      return res
        .status(401)
        .json({ message: "Invalid or expired authentication token" })
    }

    // Get detailed user information from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (userError || !userData) {
      console.error("Error fetching user data:", userError)
      return res.status(500).json({ message: "Error loading user data" })
    }

    // Attach the user to the request
    req.user = userData as unknown as User
    req.userId = data.user.id

    next()
  } catch (error) {
    console.error("Authentication error:", error)
    return res
      .status(500)
      .json({ message: "Internal server error during authentication" })
  }
}

/**
 * Special handling for development mode
 */
async function handleDevMode(req: Request, next: NextFunction) {
  console.log("DEV MODE: Attempting to find fallback user...")

  // Try to get a valid demo user from the database - first try ID 2, then any user
  let userData

  // First try with ID 2
  const { data: user2Data, error: user2Error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", 2)
    .single()

  if (user2Data) {
    userData = user2Data
    console.log("DEV MODE: Found fallback user with ID 2:", user2Data.email)
  } else {
    console.log("DEV MODE: Could not find user with ID 2. Error:", user2Error)

    // Fallback to getting any user
    const { data: anyUserData, error: anyUserError } = await supabaseAdmin
      .from("users")
      .select("*")
      .limit(1)
      .single()

    if (anyUserData) {
      userData = anyUserData
      console.log(
        "DEV MODE: Found alternative fallback user:",
        anyUserData.email
      )
    } else {
      console.error("DEV MODE: Failed to find any users:", anyUserError)
    }
  }

  if (userData) {
    req.user = userData as unknown as User
    req.userId = userData.id.toString()
    console.log("DEV MODE: Using fallback user ID:", userData.id)
  } else {
    console.warn(
      "DEV MODE: Could not find any fallback user, authentication will likely fail"
    )
  }

  next()
}

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
