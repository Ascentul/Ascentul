import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export interface SessionData {
  id: string
  userId: string
  sessionStart: string
  sessionEnd?: string
  durationMs?: number
  ipAddress?: string
  userAgent?: string
  featuresUsed: string[]
  pagesVisited: string[]
}

export class SessionTrackingService {
  private static instance: SessionTrackingService
  private activeSessions: Map<string, string> = new Map() // userId -> sessionId

  private constructor() {}

  static getInstance(): SessionTrackingService {
    if (!SessionTrackingService.instance) {
      SessionTrackingService.instance = new SessionTrackingService()
    }
    return SessionTrackingService.instance
  }

  /**
   * Start a new user session
   */
  async startSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<string | null> {
    try {
      // End any existing active session for this user
      await this.endActiveSession(userId)

      // Create new session
      const { data, error } = await supabase
        .from('user_sessions')
        .insert({
          user_id: userId,
          ip_address: ipAddress,
          user_agent: userAgent,
          features_used: [],
          pages_visited: []
        })
        .select('id')
        .single()

      if (error) {
        console.error('Error starting session:', error)
        return null
      }

      const sessionId = data.id
      this.activeSessions.set(userId, sessionId)

      // Update user's login count and last login
      await this.updateUserLoginStats(userId)
