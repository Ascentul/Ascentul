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

}

export { sessionStore }
