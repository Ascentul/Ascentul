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

}
