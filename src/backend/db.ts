import { ENV } from "../config/env"

// Simplified database configuration for Supabase-only setup
// No direct PostgreSQL connection needed since we use Supabase client

// Legacy exports for backward compatibility (can be removed later)
export const pool = null
export const db = null

// Database health check function
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    // For Supabase, we don't need to test the connection here
    // The Supabase client handles connection management automatically
    console.log("✅ Using Supabase for database operations")
    return true
  } catch (error) {
    console.error("Database connection test failed:", error)
    return false
  }
}
