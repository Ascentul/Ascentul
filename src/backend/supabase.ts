import { createClient } from "@supabase/supabase-js"
import { ENV } from "../config/env"
import type { Database } from "../types/supabase"

// Log environment status
console.log("Supabase configuration status:")
console.log(`- SUPABASE_URL: ${ENV.SUPABASE_URL ? "set" : "missing"}`)
console.log(`- SUPABASE_ANON_KEY: ${ENV.SUPABASE_ANON_KEY ? "set" : "missing"}`)
console.log(
  `- SUPABASE_SERVICE_ROLE_KEY: ${
    ENV.SUPABASE_SERVICE_ROLE_KEY ? "set" : "missing"
  }`
)

// Default values for development (these should be replaced with actual values in .env)
const supabaseUrl =
  ENV.SUPABASE_URL || "https://placeholder-project.supabase.co"
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY || "placeholder-key"
const supabaseServiceRoleKey =
  ENV.SUPABASE_SERVICE_ROLE_KEY || "placeholder-service-key"

// Create Supabase client with better error handling
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  },
  global: {
    fetch: (...args) => {
      // For debugging, log the request URL (but not the headers which may contain auth tokens)
      if (ENV.NODE_ENV === "development") {
        console.log(`🔍 Supabase Request: ${args[0]}`)
      }
      return fetch(...args)
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    disableRealtimeSubscriptions: true
  }
})

// Log Supabase connection status
console.log("🔌 Supabase client initialized with URL:", supabaseUrl)
if (!ENV.SUPABASE_URL || !ENV.SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ WARNING: Missing Supabase credentials. Check your .env file."
  )
}

// Supabase admin client with service role for admin operations
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      },
      disableRealtimeSubscriptions: true
    }
  }
)

// Helper functions for common database operations
export const supabaseHelpers = {
  // Get a record by ID from a specific table
  async getById<T>(table: string, id: number | string): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error(`Error fetching ${table} with ID ${id}:`, error)
      return null
    }

    return data as T
  },

  // Get records for a specific user from a table
  async getByUserId<T>(table: string, userId: number | string): Promise<T[]> {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("user_id", userId)

    if (error) {
      console.error(`Error fetching ${table} for user ${userId}:`, error)
      return []
    }

    return data as T[]
  },

  // Insert a new record into a table
  async insert<T>(
    table: string,
    record: Record<string, any>
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .insert(record)
      .select()
      .single()

    if (error) {
      console.error(`Error inserting into ${table}:`, error)
      return null
    }

    return data as T
  },

  // Update a record in a table
  async update<T>(
    table: string,
    id: number | string,
    updates: Record<string, any>
  ): Promise<T | null> {
    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error(`Error updating ${table} with ID ${id}:`, error)
      return null
    }

    return data as T
  },

  // Delete a record from a table
  async delete(table: string, id: number | string): Promise<boolean> {
    const { error } = await supabase.from(table).delete().eq("id", id)

    if (error) {
      console.error(`Error deleting from ${table} with ID ${id}:`, error)
      return false
    }

    return true
  },

  // Execute a custom query
  async query<T>(
    table: string,
    query: (queryBuilder: any) => any
  ): Promise<T[]> {
    try {
      const result = await query(supabase.from(table).select("*"))

      if (result.error) {
        throw result.error
      }

      return result.data as T[]
    } catch (error) {
      console.error(`Error executing custom query on ${table}:`, error)
      return []
    }
  }
}
