import { Pool, neonConfig } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"
import ws from "ws"
import * as schema from "../utils/schema"
import { supabase, supabaseAdmin } from "./supabase"
import { ENV, validateEnv } from "../config/env"

// First validate that Supabase environment variables are set
const isSupabaseValid = validateEnv()

// Only throw in production mode; in development we'll use placeholders
if (!isSupabaseValid && ENV.NODE_ENV === "production") {
  throw new Error(
    "Supabase connection details (SUPABASE_URL, SUPABASE_ANON_KEY) must be set."
  )
}

console.log("Using Supabase as the primary database connection")

// For backward compatibility, maintain the Neon DB connection if DATABASE_URL is provided
let pool: Pool | undefined
let db: ReturnType<typeof drizzle> | undefined

if (ENV.DATABASE_URL) {
  try {
    neonConfig.webSocketConstructor = ws
    pool = new Pool({ connectionString: ENV.DATABASE_URL })
    db = drizzle({ client: pool, schema })
    console.log("Also connected to Neon database as a secondary connection")
  } catch (error) {
    console.warn("Could not connect to Neon database:", error)
    console.log("Proceeding with Supabase only")
  }
}

// This ensures backward compatibility with existing code
export { pool, db, supabase, supabaseAdmin }

// Check database connection
export async function checkDatabaseConnection() {
  try {
    // First try to check Supabase connection
    const { data, error } = await supabase
      .from("users")
      .select("count(*)", { count: "exact" })

    if (error) {
      console.error("Supabase connection failed:", error)

      // If Supabase fails, try Neon DB if available
      if (ENV.DATABASE_URL && db) {
        const result = await pool!.query("SELECT NOW()")
        console.log("Neon DB connection successful:", result.rows[0])
        return true
      }

      if (ENV.NODE_ENV === "production") {
        throw error
      } else {
        console.warn(
          "⚠️ Continuing in development mode without a working database connection"
        )
        return true // In development, we'll proceed even with errors
      }
    }

    console.log("✅ Supabase connection successful")
    return true
  } catch (error) {
    console.error("All database connections failed:", error)

    if (ENV.NODE_ENV === "production") {
      return false
    } else {
      console.warn(
        "⚠️ Continuing in development mode without a working database connection"
      )
      return true // In development, we'll proceed even with errors
    }
  }
}
