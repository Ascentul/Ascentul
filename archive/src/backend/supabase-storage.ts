import { IStorage } from "./storage"
import { supabase, supabaseHelpers, supabaseAdmin } from "./supabase"
// Express session imports removed in Supabase auth migration
import { ENV } from "../config/env"
import {
  User,
  InsertUser,
  Skill,
  InsertSkill,
  Language,
  InsertLanguage
} from "../types/database"
import { settingsService } from "./services/settingsService"

// SupabaseStore class removed in Supabase auth migration

export class SupabaseStorage implements IStorage {
  constructor() {
    // Session store removed in Supabase auth migration
  }

  // Helper function to map snake_case database fields to camelCase for frontend
  private mapDatabaseUserToFrontend(dbUser: any): User {
    if (!dbUser) return dbUser

    const mappedUser = { ...dbUser }

    // Map snake_case to camelCase for ALL user fields
    if ("linkedin_url" in mappedUser) {
      mappedUser.linkedInUrl = mappedUser.linkedin_url
      delete mappedUser.linkedin_url
    }
    if ("career_summary" in mappedUser) {
      mappedUser.careerSummary = mappedUser.career_summary
      delete mappedUser.career_summary
    }
    if ("profile_image" in mappedUser) {
      mappedUser.profileImage = mappedUser.profile_image
      delete mappedUser.profile_image
    }
    if ("user_type" in mappedUser) {
      mappedUser.userType = mappedUser.user_type
      delete mappedUser.user_type
    }
    if ("subscription_plan" in mappedUser) {
      mappedUser.subscriptionPlan = mappedUser.subscription_plan
      delete mappedUser.subscription_plan
    }
    if ("subscription_status" in mappedUser) {
      mappedUser.subscriptionStatus = mappedUser.subscription_status
      delete mappedUser.subscription_status
    }
    if ("subscription_cycle" in mappedUser) {
      mappedUser.subscriptionCycle = mappedUser.subscription_cycle
      delete mappedUser.subscription_cycle
    }
    if ("stripe_customer_id" in mappedUser) {
      mappedUser.stripeCustomerId = mappedUser.stripe_customer_id
      delete mappedUser.stripe_customer_id
    }
    if ("stripe_subscription_id" in mappedUser) {
      mappedUser.stripeSubscriptionId = mappedUser.stripe_subscription_id
      delete mappedUser.stripe_subscription_id
    }
    if ("subscription_expires_at" in mappedUser) {
      mappedUser.subscriptionExpiresAt = mappedUser.subscription_expires_at
      delete mappedUser.subscription_expires_at
    }
    if ("email_verified" in mappedUser) {
      mappedUser.emailVerified = mappedUser.email_verified
      delete mappedUser.email_verified
    }
    if ("verification_token" in mappedUser) {
      mappedUser.verificationToken = mappedUser.verification_token
      delete mappedUser.verification_token
    }
    if ("verification_expires" in mappedUser) {
      mappedUser.verificationExpires = mappedUser.verification_expires
      delete mappedUser.verification_expires
    }
    if ("pending_email" in mappedUser) {
      mappedUser.pendingEmail = mappedUser.pending_email
      delete mappedUser.pending_email
    }
    if ("pending_email_token" in mappedUser) {
      mappedUser.pendingEmailToken = mappedUser.pending_email_token
      delete mappedUser.pending_email_token
    }
    if ("pending_email_expires" in mappedUser) {
      mappedUser.pendingEmailExpires = mappedUser.pending_email_expires
      delete mappedUser.pending_email_expires
    }
    if ("university_id" in mappedUser) {
      mappedUser.universityId = mappedUser.university_id
      delete mappedUser.university_id
    }
    if ("university_name" in mappedUser) {
      mappedUser.universityName = mappedUser.university_name
      delete mappedUser.university_name
    }
    if ("remote_preference" in mappedUser) {
      mappedUser.remotePreference = mappedUser.remote_preference
      delete mappedUser.remote_preference
    }
    if ("password_last_changed" in mappedUser) {
      mappedUser.passwordLastChanged = mappedUser.password_last_changed
      delete mappedUser.password_last_changed
    }
    if ("created_at" in mappedUser) {
      mappedUser.createdAt = mappedUser.created_at
      delete mappedUser.created_at
    }
    if ("needs_username" in mappedUser) {
      mappedUser.needsUsername = mappedUser.needs_username
      delete mappedUser.needs_username
    }
    if ("onboarding_completed" in mappedUser) {
      mappedUser.onboardingCompleted = mappedUser.onboarding_completed
      delete mappedUser.onboarding_completed
    }
    if ("onboarding_data" in mappedUser) {
      mappedUser.onboardingData = mappedUser.onboarding_data
      delete mappedUser.onboarding_data
    }

    return mappedUser as User
  }

  // ============ User Operations ============
  async getUser(id: number): Promise<User | undefined> {

      return false
    }
  }

  // ============ Networking Contacts Operations ============
  async getNetworkingContacts(
    userId: string,
    filters?: { query?: string; relationshipType?: string }
  ): Promise<any[]> {
    try {
