import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table - core user profiles
  users: defineTable({
    clerkId: v.string(), // Clerk user ID
    email: v.string(),
    name: v.string(),
    username: v.optional(v.string()),
    role: v.union(
      v.literal("user"),
      v.literal("student"), // University student with auto university plan
      v.literal("staff"),
      v.literal("university_admin"),
      v.literal("advisor"),
      v.literal("admin"),
      v.literal("super_admin"),
    ),
    // DEPRECATED: Subscription management moved to Clerk Billing (user.publicMetadata)
    // These fields are kept for historical data only - do not update manually
    subscription_plan: v.optional(v.union(
      v.literal("free"),
      v.literal("premium"),
      v.literal("university"),
    )),
    // DEPRECATED: Subscription status managed by Clerk Billing
    subscription_status: v.optional(v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due"),
    )),
    university_id: v.optional(v.id("universities")),
    department_id: v.optional(v.id("departments")),
    profile_image: v.optional(v.string()),
    cover_image: v.optional(v.string()),
    linkedin_url: v.optional(v.string()),
    github_url: v.optional(v.string()),
    bio: v.optional(v.string()),
    job_title: v.optional(v.string()),
    company: v.optional(v.string()),
    location: v.optional(v.string()),
    city: v.optional(v.string()),
    phone_number: v.optional(v.string()),
    website: v.optional(v.string()),
    skills: v.optional(v.string()), // Comma-separated skills
    current_position: v.optional(v.string()),
    current_company: v.optional(v.string()),
    education: v.optional(v.string()),
    education_history: v.optional(
      v.array(
        v.object({
          id: v.string(),
          school: v.optional(v.string()),
          degree: v.optional(v.string()),
          field_of_study: v.optional(v.string()),
          start_year: v.optional(v.string()),
          end_year: v.optional(v.string()),
          is_current: v.optional(v.boolean()),
          description: v.optional(v.string()),
        }),
      ),
    ),
    work_history: v.optional(
      v.array(
        v.object({
          id: v.string(),
          role: v.optional(v.string()),
          company: v.optional(v.string()),
          start_date: v.optional(v.string()),
          end_date: v.optional(v.string()),
          is_current: v.optional(v.boolean()),
          location: v.optional(v.string()),
          summary: v.optional(v.string()),
        }),
      ),
    ),
    achievements_history: v.optional(
      v.array(
        v.object({
          id: v.string(),
          title: v.optional(v.string()),
          description: v.optional(v.string()),
          date: v.optional(v.string()),
          organization: v.optional(v.string()),
        }),
      ),
    ),
    university_name: v.optional(v.string()),
    major: v.optional(v.string()),
    graduation_year: v.optional(v.string()),
    dream_job: v.optional(v.string()),
    career_goals: v.optional(v.string()),
    experience_level: v.optional(v.string()),
    industry: v.optional(v.string()),
    stripe_customer_id: v.optional(v.string()),
    stripe_subscription_id: v.optional(v.string()),
    onboarding_completed: v.optional(v.boolean()),
    completed_tasks: v.optional(v.array(v.string())), // Array of completed onboarding task IDs
    // Account activation fields
    account_status: v.optional(
      v.union(
        v.literal("pending_activation"),
        v.literal("active"),
        v.literal("suspended"),
      ),
    ),
    activation_token: v.optional(v.string()),
    activation_expires_at: v.optional(v.number()),
    temp_password: v.optional(v.string()), // Encrypted temporary password for admin-created accounts
    created_by_admin: v.optional(v.boolean()),
    // Password reset fields
    password_reset_token: v.optional(v.string()),
    password_reset_expires_at: v.optional(v.number()),
    // University admin notes (visible only to university admins, not to students)
    university_admin_notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_university", ["university_id"])
    .index("by_department", ["department_id"])
    .index("by_role", ["role"]),

  // Universities table for institutional licensing
  universities: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.optional(v.string()),
    website: v.optional(v.string()),
    contact_email: v.optional(v.string()),
    license_plan: v.union(
      v.literal("Starter"),
      v.literal("Basic"),
      v.literal("Pro"),
      v.literal("Enterprise"),
    ),
    license_seats: v.number(),
    license_used: v.number(),
    max_students: v.optional(v.number()),
    license_start: v.number(), // timestamp
    license_end: v.optional(v.number()), // timestamp
    status: v.union(
      v.literal("active"),
      v.literal("expired"),
      v.literal("trial"),
      v.literal("suspended"),
    ),
    admin_email: v.optional(v.string()),
    created_by_id: v.optional(v.id("users")),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  // University departments
  departments: defineTable({
    university_id: v.id("universities"),
    name: v.string(),
    code: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_university", ["university_id"])
    .index("by_name", ["name"]),

  // University courses (learning modules)
  courses: defineTable({
    university_id: v.id("universities"),
    department_id: v.optional(v.id("departments")),
    title: v.string(),
    category: v.optional(v.string()),
    level: v.optional(v.string()),
    published: v.boolean(),
    enrollments: v.optional(v.number()),
    completion_rate: v.optional(v.number()), // 0-100
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_university", ["university_id"])
    .index("by_department", ["department_id"]),

  // Projects table for portfolio functionality
  projects: defineTable({
    user_id: v.id("users"),
    title: v.string(),
    role: v.optional(v.string()),
    start_date: v.optional(v.number()), // timestamp
    end_date: v.optional(v.number()), // timestamp
    company: v.optional(v.string()),
    url: v.optional(v.string()),
    github_url: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.string(), // default: 'personal'
    image_url: v.optional(v.string()),
    technologies: v.array(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_created_at", ["created_at"]),

  // Cover letters table
  cover_letters: defineTable({
    user_id: v.id("users"),
    name: v.string(),
    job_title: v.string(),
    company_name: v.optional(v.string()),
    template: v.string(), // default: 'standard'
    content: v.optional(v.string()),
    closing: v.string(), // default: 'Sincerely,'
    source: v.optional(
      v.union(
        v.literal("manual"),
        v.literal("ai_generated"),
        v.literal("ai_optimized"),
        v.literal("pdf_upload"),
      ),
    ),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_created_at", ["created_at"]),

  // Support tickets table
  support_tickets: defineTable({
    user_id: v.id("users"),
    subject: v.string(),
    category: v.string(), // default: 'general'
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    department: v.string(), // default: 'support'
    contact_person: v.optional(v.string()),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("resolved"),
      v.literal("closed"),
    ),
    ticket_type: v.string(), // default: 'regular'
    assigned_to: v.optional(v.id("users")),
    resolution: v.optional(v.string()),
    resolved_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_status", ["status"])
    .index("by_created_at", ["created_at"]),

  // Career paths table for generated career paths
  career_paths: defineTable({
    user_id: v.id("users"),
    target_role: v.string(),
    current_level: v.optional(v.string()),
    estimated_timeframe: v.optional(v.string()),
    steps: v.any(), // JSON data
    status: v.string(), // default: 'active'
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_status", ["status"]),

  // Interview stages linked to applications
  interview_stages: defineTable({
    user_id: v.id("users"),
    application_id: v.id("applications"),
    title: v.string(),
    scheduled_at: v.optional(v.number()),
    outcome: v.union(
      v.literal("pending"),
      v.literal("scheduled"),
      v.literal("passed"),
      v.literal("failed"),
    ),
    location: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_application", ["application_id"])
    .index("by_user", ["user_id"])
    .index("by_scheduled_at", ["scheduled_at"]),

  // Job searches table to track user job searches
  job_searches: defineTable({
    user_id: v.id("users"),
    keywords: v.optional(v.string()),
    location: v.optional(v.string()),
    remote_only: v.boolean(),
    results_count: v.number(),
    search_data: v.any(), // JSON data
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_created_at", ["created_at"]),

  // Resumes table
  resumes: defineTable({
    user_id: v.id("users"),
    title: v.string(),
    content: v.any(), // JSON data
    visibility: v.union(v.literal("private"), v.literal("public")),
    source: v.optional(v.union(
      v.literal("manual"),
      v.literal("ai_generated"),
      v.literal("ai_optimized"),
      v.literal("pdf_upload"),
    )), // Source of resume creation
    // Analysis data
    extracted_text: v.optional(v.string()), // Text extracted from uploaded PDF/DOCX
    job_description: v.optional(v.string()), // Job description for analysis
    analysis_result: v.optional(v.any()), // Analysis results (score, strengths, gaps, suggestions)
    ai_suggestions: v.optional(v.any()), // AI-generated suggestions (summary, skills)
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_user", ["user_id"]),

  // Applications table
  applications: defineTable({
    user_id: v.id("users"),
    company: v.string(),
    job_title: v.string(),
    status: v.union(
      v.literal("saved"),
      v.literal("applied"),
      v.literal("interview"),
      v.literal("offer"),
      v.literal("rejected"),
    ),
    source: v.optional(v.string()),
    url: v.optional(v.string()),
    notes: v.optional(v.string()),
    applied_at: v.optional(v.number()),
    resume_id: v.optional(v.id("resumes")),
    cover_letter_id: v.optional(v.id("cover_letters")),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_status", ["status"]),

  // Followup actions table
  followup_actions: defineTable({
    user_id: v.id("users"),
    application_id: v.optional(v.id("applications")),
    contact_id: v.optional(v.id("networking_contacts")),
    type: v.string(), // default: 'follow_up'
    description: v.optional(v.string()),
    due_date: v.optional(v.number()),
    completed: v.boolean(),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_application", ["application_id"])
    .index("by_contact", ["contact_id"])
    .index("by_due_date", ["due_date"]),

  // Achievements table
  achievements: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    icon: v.optional(v.string()),
    category: v.string(), // default: 'general'
    points: v.number(),
    created_at: v.number(),
  }).index("by_category", ["category"]),

  // User achievements table for tracking user achievements
  user_achievements: defineTable({
    user_id: v.id("users"),
    achievement_id: v.id("achievements"),
    earned_at: v.number(),
    progress: v.number(), // default: 100
  })
    .index("by_user", ["user_id"])
    .index("by_achievement", ["achievement_id"])
    .index("by_user_achievement", ["user_id", "achievement_id"]),

  // Daily recommendations table
  daily_recommendations: defineTable({
    user_id: v.id("users"),
    text: v.string(),
    type: v.string(), // default: 'ai_generated'
    completed: v.boolean(),
    completed_at: v.optional(v.number()),
    priority: v.number(),
    related_entity_id: v.optional(v.string()),
    related_entity_type: v.optional(v.string()),
    notes: v.optional(v.string()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_created_at", ["created_at"])
    .index("by_completed", ["completed"])
    .index("by_type", ["type"]),

  // Networking contacts table (referenced in followup_actions)
  networking_contacts: defineTable({
    user_id: v.id("users"),
    name: v.string(),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    company: v.optional(v.string()),
    position: v.optional(v.string()),
    linkedin_url: v.optional(v.string()),
    notes: v.optional(v.string()),
    relationship: v.optional(v.string()),
    last_contact: v.optional(v.number()),
    saved: v.optional(v.boolean()), // For saved contacts filter
    tags: v.optional(v.array(v.string())), // Tags for organizing contacts
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_company", ["company"]),

  // Contact interactions table
  contact_interactions: defineTable({
    user_id: v.id("users"),
    contact_id: v.id("networking_contacts"),
    notes: v.optional(v.string()),
    interaction_date: v.number(),
    created_at: v.number(),
  })
    .index("by_contact", ["contact_id"])
    .index("by_user", ["user_id"])
    .index("by_interaction_date", ["interaction_date"]),

  // Goals table (referenced in achievements)
  goals: defineTable({
    user_id: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    target_date: v.optional(v.number()),
    status: v.union(
      v.literal("not_started"),
      v.literal("in_progress"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("paused"),
      v.literal("cancelled"),
    ),
    progress: v.number(), // 0-100
    checklist: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          completed: v.boolean(),
        }),
      ),
    ),
    completed_at: v.optional(v.number()),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_status", ["status"])
    .index("by_target_date", ["target_date"]),

  // AI Coach conversations table
  ai_coach_conversations: defineTable({
    user_id: v.id("users"),
    title: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_created_at", ["created_at"]),

  // AI Coach messages table
  ai_coach_messages: defineTable({
    conversation_id: v.id("ai_coach_conversations"),
    user_id: v.id("users"),
    is_user: v.boolean(),
    message: v.string(),
    timestamp: v.number(),
  })
    .index("by_conversation", ["conversation_id"])
    .index("by_user", ["user_id"])
    .index("by_timestamp", ["timestamp"]),

  // Platform settings table for system-wide configuration
  platform_settings: defineTable({
    setting_key: v.string(),
    setting_value: v.any(),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_setting_key", ["setting_key"]),

  // Stripe payments table for revenue tracking
  stripe_payments: defineTable({
    user_id: v.optional(v.id("users")),
    stripe_customer_id: v.string(),
    stripe_subscription_id: v.optional(v.string()),
    stripe_invoice_id: v.optional(v.string()),
    stripe_payment_intent_id: v.optional(v.string()),
    amount: v.number(), // Amount in cents
    currency: v.string(), // e.g., 'usd'
    status: v.union(
      v.literal("succeeded"),
      v.literal("pending"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    payment_type: v.union(
      v.literal("subscription"),
      v.literal("one_time"),
      v.literal("university_license"),
    ),
    plan_name: v.optional(v.string()), // e.g., 'premium', 'university'
    interval: v.optional(v.string()), // e.g., 'month', 'year'
    description: v.optional(v.string()),
    metadata: v.optional(v.any()), // Additional Stripe metadata
    payment_date: v.number(), // Timestamp of payment
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_customer", ["stripe_customer_id"])
    .index("by_subscription", ["stripe_subscription_id"])
    .index("by_payment_date", ["payment_date"])
    .index("by_status", ["status"]),

  // Stripe subscription events for churn tracking
  stripe_subscription_events: defineTable({
    user_id: v.optional(v.id("users")),
    stripe_customer_id: v.string(),
    stripe_subscription_id: v.string(),
    event_type: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("cancelled"),
      v.literal("renewed"),
      v.literal("trial_started"),
      v.literal("trial_ended"),
    ),
    subscription_status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("cancelled"),
      v.literal("past_due"),
      v.literal("trialing"),
    ),
    plan_name: v.optional(v.string()),
    amount: v.optional(v.number()), // Amount in cents
    event_date: v.number(), // Timestamp of event
    metadata: v.optional(v.any()),
    created_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_customer", ["stripe_customer_id"])
    .index("by_subscription", ["stripe_subscription_id"])
    .index("by_event_date", ["event_date"])
    .index("by_event_type", ["event_type"]),
});
