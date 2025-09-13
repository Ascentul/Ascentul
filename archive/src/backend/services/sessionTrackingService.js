import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);
export class SessionTrackingService {
    static instance;
    activeSessions = new Map(); // userId -> sessionId
    constructor() { }
    static getInstance() {
        if (!SessionTrackingService.instance) {
            SessionTrackingService.instance = new SessionTrackingService();
        }
        return SessionTrackingService.instance;
    }
    /**
     * Start a new user session
     */
    async startSession(userId, ipAddress, userAgent) {
        try {
            // End any existing active session for this user
            await this.endActiveSession(userId);
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
                .single();
            if (error) {
                console.error('Error starting session:', error);
                return null;
            }
            const sessionId = data.id;
            this.activeSessions.set(userId, sessionId);
            // Update user's login count and last login
            await this.updateUserLoginStats(userId);

            return sessionId;
        }
        catch (error) {
            console.error('Error starting session:', error);
            return null;
        }
    }
    /**
     * End a user session
     */
    async endSession(userId, additionalFeatures, additionalPages) {
        try {
            const sessionId = this.activeSessions.get(userId);
            if (!sessionId) {

                return;
            }
            // Get current session data
            const { data: session, error: fetchError } = await supabase
                .from('user_sessions')
                .select('session_start, features_used, pages_visited')
                .eq('id', sessionId)
                .single();
            if (fetchError || !session) {
                console.error('Error fetching session:', fetchError);
                return;
            }
            // Calculate duration
            const sessionStart = new Date(session.session_start);
            const sessionEnd = new Date();
            const durationMs = sessionEnd.getTime() - sessionStart.getTime();
            // Merge additional features and pages
            const allFeatures = [...(session.features_used || []), ...(additionalFeatures || [])];
            const allPages = [...(session.pages_visited || []), ...(additionalPages || [])];
            // Update session with end time and duration
            const { error: updateError } = await supabase
                .from('user_sessions')
                .update({
                session_end: sessionEnd.toISOString(),
                duration_ms: durationMs,
                features_used: [...new Set(allFeatures)], // Remove duplicates
                pages_visited: [...new Set(allPages)], // Remove duplicates
                updated_at: sessionEnd.toISOString()
            })
                .eq('id', sessionId);
            if (updateError) {
                console.error('Error ending session:', updateError);
                return;
            }
            // Remove from active sessions
            this.activeSessions.delete(userId);
            // Update user's total session time
            await this.updateUserSessionStats(userId);

        }
        catch (error) {
            console.error('Error ending session:', error);
        }
    }
    /**
     * Track feature usage during an active session
     */
    async trackFeatureUsage(userId, featureName) {
        try {
            const sessionId = this.activeSessions.get(userId);
            if (!sessionId) {

                return;
            }
            // Get current features
            const { data: session, error: fetchError } = await supabase
                .from('user_sessions')
                .select('features_used')
                .eq('id', sessionId)
                .single();
            if (fetchError || !session) {
                console.error('Error fetching session for feature tracking:', fetchError);
                return;
            }
            // Add new feature if not already present
            const currentFeatures = session.features_used || [];
            if (!currentFeatures.includes(featureName)) {
                const updatedFeatures = [...currentFeatures, featureName];
                const { error: updateError } = await supabase
                    .from('user_sessions')
                    .update({
                    features_used: updatedFeatures,
                    updated_at: new Date().toISOString()
                })
                    .eq('id', sessionId);
                if (updateError) {
                    console.error('Error tracking feature usage:', updateError);
                    return;
                }

            }
        }
        catch (error) {
            console.error('Error tracking feature usage:', error);
        }
    }
    /**
     * Track page visit during an active session
     */
    async trackPageVisit(userId, pageName) {
        try {
            const sessionId = this.activeSessions.get(userId);
            if (!sessionId) {
                // Don't log for page visits as they happen frequently
                return;
            }
            // Get current pages
            const { data: session, error: fetchError } = await supabase
                .from('user_sessions')
                .select('pages_visited')
                .eq('id', sessionId)
                .single();
            if (fetchError || !session) {
                return;
            }
            // Add new page (allow duplicates to track frequency)
            const currentPages = session.pages_visited || [];
            const updatedPages = [...currentPages, pageName];
            const { error: updateError } = await supabase
                .from('user_sessions')
                .update({
                pages_visited: updatedPages,
                updated_at: new Date().toISOString()
            })
                .eq('id', sessionId);
            if (updateError) {
                console.error('Error tracking page visit:', updateError);
                return;
            }
        }
        catch (error) {
            console.error('Error tracking page visit:', error);
        }
    }
    /**
     * Get active session ID for a user
     */
    getActiveSessionId(userId) {
        return this.activeSessions.get(userId);
    }
    /**
     * End any active session for a user (cleanup)
     */
    async endActiveSession(userId) {
        const existingSessionId = this.activeSessions.get(userId);
        if (existingSessionId) {
            await this.endSession(userId);
        }
    }
    /**
     * Update user's login count and last login timestamp
     */
    async updateUserLoginStats(userId) {
        try {
            const { error } = await supabase
                .from('users')
                .update({
                login_count: supabase.raw('COALESCE(login_count, 0) + 1'),
                last_login: new Date().toISOString()
            })
                .eq('id', userId);
            if (error) {
                console.error('Error updating user login stats:', error);
            }
        }
        catch (error) {
            console.error('Error updating user login stats:', error);
        }
    }
    /**
     * Update user's total session time based on all completed sessions
     */
    async updateUserSessionStats(userId) {
        try {
            // Calculate total session time from all completed sessions
            const { data: sessions, error: fetchError } = await supabase
                .from('user_sessions')
                .select('duration_ms')
                .eq('user_id', userId)
                .not('duration_ms', 'is', null);
            if (fetchError) {
                console.error('Error fetching user sessions for stats:', fetchError);
                return;
            }
            const totalSessionTime = sessions?.reduce((total, session) => {
                return total + (session.duration_ms || 0);
            }, 0) || 0;
            // Update user's total session time
            const { error: updateError } = await supabase
                .from('users')
                .update({
                total_session_time: totalSessionTime
            })
                .eq('id', userId);
            if (updateError) {
                console.error('Error updating user session stats:', updateError);
            }
        }
        catch (error) {
            console.error('Error updating user session stats:', error);
        }
    }
    /**
     * Get user session analytics
     */
    async getUserSessionAnalytics(userId) {
        try {
            // Get session data
            const { data: sessions, error: sessionsError } = await supabase
                .from('user_sessions')
                .select('duration_ms, features_used, session_start')
                .eq('user_id', userId)
                .order('session_start', { ascending: false });
            if (sessionsError) {
                console.error('Error fetching session analytics:', sessionsError);
                return null;
            }
            // Get user data
            const { data: user, error: userError } = await supabase
                .from('users')
                .select('last_login, total_session_time, login_count')
                .eq('id', userId)
                .single();
            if (userError) {
                console.error('Error fetching user data:', userError);
                return null;
            }
            // Calculate analytics
            const completedSessions = sessions?.filter(s => s.duration_ms != null) || [];
            const totalSessions = user?.login_count || 0;
            const totalSessionTime = user?.total_session_time || 0;
            const averageSessionTime = totalSessions > 0 ? totalSessionTime / totalSessions : 0;
            // Get all unique features used
            const allFeatures = sessions?.reduce((features, session) => {
                return [...features, ...(session.features_used || [])];
            }, []) || [];
            const uniqueFeatures = [...new Set(allFeatures)];
            return {
                totalSessions,
                totalSessionTime,
                averageSessionTime,
                featuresUsed: uniqueFeatures,
                lastLogin: user?.last_login
            };
        }
        catch (error) {
            console.error('Error getting user session analytics:', error);
            return null;
        }
    }
}
export const sessionTracker = SessionTrackingService.getInstance();
