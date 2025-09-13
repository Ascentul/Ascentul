export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: number
          username: string
          password: string
          name: string
          email: string
          user_type: string
          role: string | null
          university_id: number | null
          university_name: string | null
          xp: number | null
          level: number | null
          rank: string | null
          profile_image: string | null
          location: string | null
          remote_preference: string | null
          career_summary: string | null
          linkedin_url: string | null
          subscription_plan: string
          subscription_status: string
          subscription_cycle: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_expires_at: string | null
          needs_username: boolean | null
          onboarding_completed: boolean | null
          onboarding_data: Json | null
          email_verified: boolean | null
          verification_token: string | null
          verification_expires: string | null
          pending_email: string | null
          pending_email_token: string | null
          pending_email_expires: string | null
          password_last_changed: string | null
          created_at: string
        }
        Insert: {
          id?: number
          username: string
          password: string
          name: string
          email: string
          user_type?: string
          role?: string | null
          university_id?: number | null
          university_name?: string | null
          xp?: number | null
          level?: number | null
          rank?: string | null
          profile_image?: string | null
          location?: string | null
          remote_preference?: string | null
          career_summary?: string | null
          linkedin_url?: string | null
          subscription_plan?: string
          subscription_status?: string
          subscription_cycle?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          needs_username?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          email_verified?: boolean | null
          verification_token?: string | null
          verification_expires?: string | null
          pending_email?: string | null
          pending_email_token?: string | null
          pending_email_expires?: string | null
          password_last_changed?: string | null
          created_at?: string
        }
        Update: {
          id?: number
          username?: string
          password?: string
          name?: string
          email?: string
          user_type?: string
          role?: string | null
          university_id?: number | null
          university_name?: string | null
          xp?: number | null
          level?: number | null
          rank?: string | null
          profile_image?: string | null
          location?: string | null
          remote_preference?: string | null
          career_summary?: string | null
          linkedin_url?: string | null
          subscription_plan?: string
          subscription_status?: string
          subscription_cycle?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_expires_at?: string | null
          needs_username?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_data?: Json | null
          email_verified?: boolean | null
          verification_token?: string | null
          verification_expires?: string | null
          pending_email?: string | null
          pending_email_token?: string | null
          pending_email_expires?: string | null
          password_last_changed?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_university_id_fkey"
            columns: ["university_id"]
            referencedRelation: "universities"
            referencedColumns: ["id"]
          }
        ]
      }
      // Additional tables would be defined here similarly
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 