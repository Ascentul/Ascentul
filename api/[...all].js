import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Environment variables with validation (same as src/config/env.ts)
const ENV = {
  NODE_ENV: process.env.NODE_ENV || "production", // Default to production in Vercel
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

// Validate environment variables
function validateEnv() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY"
  ]
  const missing = required.filter((key) => !ENV[key])

  if (missing.length > 0) {
    console.error(
      `❌ Missing required environment variables: ${missing.join(", ")}`
    )
    console.error("Current env values:")
    console.error(`- SUPABASE_URL: ${ENV.SUPABASE_URL ? "SET" : "MISSING"}`)
    console.error(
      `- SUPABASE_ANON_KEY: ${ENV.SUPABASE_ANON_KEY ? "SET" : "MISSING"}`
    )
    console.error(
      `- SUPABASE_SERVICE_ROLE_KEY: ${
        ENV.SUPABASE_SERVICE_ROLE_KEY ? "SET" : "MISSING"
      }`
    )
    throw new Error("Environment validation failed")
  }

  console.log("✅ Environment validation passed")
  return true
}

// Validate environment on startup
validateEnv()

// Create Supabase admin client for token verification
const supabaseAdmin = createClient(
  ENV.SUPABASE_URL,
  ENV.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
)

// Authentication helper function
async function verifySupabaseToken(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Authentication required", status: 401 }
  }

  const token = authHeader.split(" ")[1]

  try {
    // Verify the JWT with Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      return { error: "Invalid or expired authentication token", status: 401 }
    }

    // Get detailed user information from database
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (userError || !userData) {
      // If user doesn't exist in our database but has valid Supabase auth, create a user record
      if (userError?.code === "PGRST116") {
        const { data: newUserData, error: createError } = await supabaseAdmin
          .from("users")
          .insert({
            id: data.user.id,
            email: data.user.email,
            name:
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "User",
            username: `user_${data.user.id.slice(0, 8)}`,
            user_type: "regular",
            needs_username: true,
            onboarding_completed: false
          })
          .select()
          .single()

        if (createError) {
          return { error: "Error setting up user account", status: 500 }
        }

        return { user: newUserData, userId: data.user.id }
      }

      return { error: "Error loading user data", status: 500 }
    }

    return { user: userData, userId: data.user.id }
  } catch (error) {
    console.error("Authentication error:", error)
    return { error: "Internal server error during authentication", status: 500 }
  }
}

// Remove the Express app routes since we're handling everything in the main handler function

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true)
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  )
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  )

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  // Get the API path
  const path = req.url.replace("/api", "") || "/"

  console.log(`API Request: ${req.method} ${path}`)

  try {
    // Route handling - check for nested routes first
    if (path.startsWith("/career-data/")) {
      const subPath = path.replace("/career-data/", "")

      if (subPath === "career-summary") {
        if (req.method === "PUT") {
          // Update career summary for authenticated user
          const authResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (authResult.error) {
            return res.status(authResult.status).json({
              error: authResult.error,
              message: "Please log in to update career summary"
            })
          }

          const userId = authResult.userId
          const { careerSummary } = req.body

          if (careerSummary === undefined) {
            return res.status(400).json({
              message: "Career summary is required",
              error: "Missing careerSummary field"
            })
          }

          try {
            // Update career summary in Supabase
            const { data: updatedUser, error } = await supabaseAdmin
              .from("users")
              .update({ career_summary: careerSummary })
              .eq("id", userId)
              .select()
              .single()

            if (error || !updatedUser) {
              console.error("Error updating career summary:", error)
              return res
                .status(500)
                .json({ message: "Error updating career summary" })
            }

            return res
              .status(200)
              .json({ careerSummary: updatedUser.career_summary })
          } catch (error) {
            console.error("Error updating career summary:", error)
            return res
              .status(500)
              .json({ message: "Error updating career summary" })
          }
        }
      }
    }

    // Handle simple routes
    switch (path) {
      case "/health":
        return res.status(200).json({
          status: "ok",
          timestamp: new Date().toISOString(),
          method: req.method,
          path: path
        })

      case "/users/me":
        // This endpoint requires authentication
        const authResult = await verifySupabaseToken(req.headers.authorization)

        if (authResult.error) {
          return res.status(authResult.status).json({
            error: authResult.error,
            message: "Please log in to access user information"
          })
        }

        // Map user data to expected format
        const user = authResult.user
        const mappedUser = {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          userType: user.user_type,
          role: user.role,
          universityId: user.university_id,
          universityName: user.university_name,
          isUniversityStudent: user.user_type === "university_student",
          needsUsername: user.needs_username,
          onboardingCompleted: user.onboarding_completed,
          xp: user.xp || 0,
          level: user.level || 1,
          rank: user.rank || "Beginner",
          profileImage: user.profile_image,
          subscriptionPlan: user.subscription_plan || "free",
          subscriptionStatus: user.subscription_status || "inactive",
          subscriptionCycle: user.subscription_cycle,
          stripeCustomerId: user.stripe_customer_id,
          stripeSubscriptionId: user.stripe_subscription_id,
          emailVerified: user.email_verified || false
        }

        return res.status(200).json(mappedUser)

      case "/career-data":
        if (req.method === "GET") {
          // Get career data for authenticated user
          const authResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (authResult.error) {
            return res.status(authResult.status).json({
              error: authResult.error,
              message: "Please log in to access career data"
            })
          }

          const userId = authResult.userId

          try {
            // Fetch career data from Supabase
            const { data: workHistory } = await supabaseAdmin
              .from("work_history")
              .select("*")
              .eq("user_id", userId)
              .order("start_date", { ascending: false })

            const { data: educationHistory } = await supabaseAdmin
              .from("education_history")
              .select("*")
              .eq("user_id", userId)
              .order("start_date", { ascending: false })

            const { data: skills } = await supabaseAdmin
              .from("user_skills")
              .select("*")
              .eq("user_id", userId)

            const { data: certifications } = await supabaseAdmin
              .from("certifications")
              .select("*")
              .eq("user_id", userId)

            const careerSummary = authResult.user.career_summary || ""
            const linkedInUrl = authResult.user.linkedin_url || ""

            return res.status(200).json({
              workHistory: workHistory || [],
              educationHistory: educationHistory || [],
              skills: skills || [],
              certifications: certifications || [],
              careerSummary,
              linkedInUrl
            })
          } catch (error) {
            console.error("Error fetching career data:", error)
            return res
              .status(500)
              .json({ message: "Error fetching career data" })
          }
        }
        break

      case "/job-applications":
        return res.status(200).json([])

      case "/resumes":
        if (req.method === "GET") {
          // Get resumes for authenticated user
          const authResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (authResult.error) {
            return res.status(authResult.status).json({
              error: authResult.error,
              message: "Please log in to access resumes"
            })
          }

          // For now, return empty array until resumes table is properly set up
          return res.status(200).json([])
        }
        break

      case "/recommendations/daily":
        if (req.method === "GET") {
          // Get daily recommendations for authenticated user
          const authResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (authResult.error) {
            return res.status(authResult.status).json({
              error: authResult.error,
              message: "Please log in to access recommendations"
            })
          }

          // For now, return empty array until recommendations are implemented
          return res.status(200).json([])
        }
        break

      case "/models":
        return res.status(200).json({ models: [] })

      case "/contacts/all-followups":
        return res.status(200).json([])

      case "/users/statistics":
        // User statistics endpoint
        const authResult = await verifySupabaseToken(req.headers.authorization)

        if (authResult.error) {
          return res.status(authResult.status).json({
            error: authResult.error,
            message: "Please log in to access statistics"
          })
        }

        // Return basic statistics
        return res.status(200).json({
          applications: 0,
          interviews: 0,
          offers: 0,
          connections: 0
        })

      case "/conversations":
        // AI Coach conversations endpoint
        const conversationsAuthResult = await verifySupabaseToken(
          req.headers.authorization
        )

        if (conversationsAuthResult.error) {
          return res.status(conversationsAuthResult.status).json({
            error: conversationsAuthResult.error,
            message: "Please log in to access conversations"
          })
        }

        return res.status(200).json([])

      default:
        return res.status(404).json({
          error: "API route not found",
          path: path,
          method: req.method
        })
    }
  } catch (error) {
    console.error("API Error:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
}
