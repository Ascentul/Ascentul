import session from "express-session"
import createMemoryStore from "memorystore"
import connectPgSimple from "connect-pg-simple"
import { pool, supabase } from "./db"
import { ENV } from "../config/env"

// Create a session store class for Supabase
class SupabaseSessionStore extends session.Store {
  async get(sid: string, callback: (err: any, session?: any) => void) {
    try {
      const { data, error } = await supabase
        .from("sessions")
        .select("sess")
        .eq("sid", sid)
        .single()

      if (error) {
        console.warn(`Session retrieval error for sid ${sid}:`, error)
        // Don't fail the operation, just return null session
        return callback(null, null)
      }

      if (!data) {
        return callback(null, null)
      }

      callback(null, data.sess)
    } catch (err) {
      console.error(`Unexpected error in session retrieval:`, err)
      // Don't fail the operation, return null for session in dev mode
      if (ENV.NODE_ENV === "development") {
        callback(null, null)
      } else {
        callback(err)
      }
    }
  }

  async set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const now = new Date()
      const expiresAt = new Date(
        now.getTime() + (session.cookie.maxAge || 86400000)
      )

      const { error } = await supabase.from("sessions").upsert(
        {
          sid,
          sess: session,
          expire: expiresAt.toISOString()
        },
        {
          onConflict: "sid"
        }
      )

      if (error) {
        console.warn(`Session storage error for sid ${sid}:`, error)
        // In development, don't fail if we can't store the session
        if (ENV.NODE_ENV === "development" && callback) {
          callback()
          return
        }
        throw error
      }

      if (callback) callback()
    } catch (err) {
      console.error(`Unexpected error in session storage:`, err)
      // In development, don't fail if we can't store the session
      if (ENV.NODE_ENV === "development" && callback) {
        callback()
      } else if (callback) {
        callback(err)
      }
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void) {
    try {
      const { error } = await supabase.from("sessions").delete().eq("sid", sid)

      if (error) {
        console.warn(`Session deletion error for sid ${sid}:`, error)
        // In development, don't fail if we can't delete the session
        if (ENV.NODE_ENV === "development" && callback) {
          callback()
          return
        }
        throw error
      }

      if (callback) callback()
    } catch (err) {
      console.error(`Unexpected error in session deletion:`, err)
      // In development, don't fail if we can't delete the session
      if (ENV.NODE_ENV === "development" && callback) {
        callback()
      } else if (callback) {
        callback(err)
      }
    }
  }
}

// Create a lightweight in-memory store for development mode
class SimpleMemoryStore extends session.Store {
  private sessions = new Map<string, { sess: any; expires: Date }>()

  constructor() {
    super()
    // Periodically clean up expired sessions
    setInterval(() => this.cleanup(), 15 * 60 * 1000) // 15 min interval
  }

  get(sid: string, callback: (err: any, session?: any) => void) {
    const sessionData = this.sessions.get(sid)
    if (!sessionData || sessionData.expires < new Date()) {
      if (sessionData) this.sessions.delete(sid) // Cleanup expired session
      return callback(null, null)
    }
    callback(null, sessionData.sess)
  }

  set(sid: string, session: any, callback?: (err?: any) => void) {
    try {
      const now = new Date()
      const expiresAt = new Date(
        now.getTime() + (session.cookie.maxAge || 86400000)
      )

      this.sessions.set(sid, {
        sess: session,
        expires: expiresAt
      })

      if (callback) callback()
    } catch (err) {
      if (callback) callback(err)
    }
  }

  destroy(sid: string, callback?: (err?: any) => void) {
    this.sessions.delete(sid)
    if (callback) callback()
  }

  private cleanup() {
    const now = new Date()
    for (const [sid, sessionData] of this.sessions.entries()) {
      if (sessionData.expires < now) {
        this.sessions.delete(sid)
      }
    }
  }
}

// Create a persistent session store
// Choose between Supabase, PostgreSQL, or in-memory store
let sessionStore: session.Store

// For development mode, use the lightweight in-memory store by default
if (ENV.NODE_ENV === "development") {
  sessionStore = new SimpleMemoryStore()
  console.log("✅ Using lightweight in-memory session store for development")
} else if (ENV.SUPABASE_URL && ENV.SUPABASE_ANON_KEY) {
  try {
    // Use Supabase session store
    sessionStore = new SupabaseSessionStore()
    console.log("✅ Using Supabase for session storage")
  } catch (error) {
    console.error("❌ Failed to create Supabase session store:", error)

    // Fall back to PostgreSQL if available
    if (ENV.DATABASE_URL && pool) {
      try {
        const PgStore = connectPgSimple(session)
        sessionStore = new PgStore({
          pool,
          tableName: "session",
          createTableIfMissing: true
        })
        console.log("✅ Fallback: Using PostgreSQL for session storage")
      } catch (pgError) {
        console.error("❌ Failed to create PostgreSQL session store:", pgError)
        sessionStore = fallbackToMemoryStore()
      }
    } else {
      sessionStore = fallbackToMemoryStore()
    }
  }
  // Then check for PostgreSQL as fallback
} else if (ENV.DATABASE_URL && pool) {
  try {
    // Use PostgreSQL session store
    const PgStore = connectPgSimple(session)
    sessionStore = new PgStore({
      pool,
      tableName: "session", // Default is "session"
      createTableIfMissing: true // Automatically create the session table
    })

    console.log("✅ Using PostgreSQL for session storage")
  } catch (error) {
    console.error("❌ Failed to create PostgreSQL session store:", error)
    sessionStore = fallbackToMemoryStore()
  }
} else {
  console.log("⚠️ No database configuration found")
  sessionStore = fallbackToMemoryStore()
}

function fallbackToMemoryStore(): session.Store {
  console.log(
    "⚠️ FALLING BACK to in-memory session store. Sessions will be lost on server restart!"
  )

  const MemoryStore = createMemoryStore(session)
  return new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  })
}

export { sessionStore }
