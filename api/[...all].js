import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Environment variables with validation
const ENV = {
  NODE_ENV: process.env.NODE_ENV || "production",
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
    return { valid: false, missing }
  }

  console.log("✅ Environment validation passed")
  return { valid: true, missing: [] }
}

// Create Supabase admin client for token verification
let supabaseAdmin
try {
  if (ENV.SUPABASE_URL && ENV.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(
      ENV.SUPABASE_URL,
      ENV.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false
        }
      }
    )
    console.log("✅ Supabase client initialized successfully")
  } else {
    console.error(
      "❌ Cannot initialize Supabase client - missing URL or service role key"
    )
  }
} catch (error) {
  console.error("❌ Error initializing Supabase client:", error)
}

// Authentication helper function
async function verifySupabaseToken(authHeader) {
  if (!supabaseAdmin) {
    console.error("Supabase client not initialized")
    return { error: "Server configuration error", status: 500 }
  }

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

export default async function handler(req, res) {
  try {
    // Validate environment variables first
    const envValidation = validateEnv()
    if (!envValidation.valid) {
      return res.status(500).json({
        error: "Server configuration error",
        missing: envValidation.missing
      })
    }

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

    // Route handling with comprehensive coverage
    
    // USERNAME AVAILABILITY CHECK - Critical missing route
    if (path === "/users/check-username" && req.method === "GET") {
      try {
        const { username } = req.query

        if (!username || typeof username !== "string") {
          return res.status(400).json({ message: "Username parameter is required" })
        }

        // Check if the username is valid format
        if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
          return res.status(400).json({
            message: "Username must be at least 3 characters and can only contain letters, numbers, and underscores",
            available: false
          })
        }

        // Check if username already exists
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("username", username)
          .single()

        return res.status(200).json({ available: !existingUser })
      } catch (error) {
        console.error("Error checking username availability:", error)
        return res.status(500).json({ message: "Error checking username availability" })
      }
    }

    // UPDATE USERNAME - Critical for new user onboarding
    if (path === "/users/update-username" && req.method === "POST") {
      try {
        const authResult = await verifySupabaseToken(req.headers.authorization)
        if (authResult.error) {
          return res.status(authResult.status).json({
            error: authResult.error,
            message: "Please log in to update username"
          })
        }

        const { username } = req.body

        if (!username) {
          return res.status(400).json({ message: "Username is required" })
        }

        // Check if the username is valid format
        if (!/^[a-zA-Z0-9_]{3,}$/.test(username)) {
          return res.status(400).json({
            message: "Username must be at least 3 characters and can only contain letters, numbers, and underscores"
          })
        }

        // Check if username already exists
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("username", username)
          .single()

        if (existingUser) {
          return res.status(400).json({ message: "Username already taken" })
        }

        // Update the username and set needsUsername to false
        const { data: updatedUser, error } = await supabaseAdmin
          .from("users")
          .update({
            username,
            needs_username: false
          })
          .eq("id", authResult.userId)
          .select()
          .single()

        if (error || !updatedUser) {
          return res.status(500).json({ message: "Failed to update username" })
        }

        // Map user data to expected format
        const mappedUser = {
          id: updatedUser.id,
          username: updatedUser.username,
          name: updatedUser.name,
          email: updatedUser.email,
          userType: updatedUser.user_type,
          role: updatedUser.role,
          universityId: updatedUser.university_id,
          universityName: updatedUser.university_name,
          needsUsername: updatedUser.needs_username,
          onboardingCompleted: updatedUser.onboarding_completed,
          xp: updatedUser.xp || 0,
          level: updatedUser.level || 1,
          rank: updatedUser.rank || "Beginner",
          profileImage: updatedUser.profile_image,
          subscriptionPlan: updatedUser.subscription_plan || "free",
          subscriptionStatus: updatedUser.subscription_status || "inactive"
        }

        return res.status(200).json(mappedUser)
      } catch (error) {
        console.error("Error updating username:", error)
        return res.status(500).json({ message: "Error updating username" })
      }
    }

    // WORK HISTORY ROUTES - Critical for creating records
    if (path === "/career-data/work-history" && req.method === "POST") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to add work history"
        })
      }

      try {
        const workData = {
          ...req.body,
          user_id: authResult.userId
        }

        const { data, error } = await supabaseAdmin
          .from("work_history")
          .insert(workData)
          .select()
          .single()

        if (error) {
          console.error("Error creating work history:", error)
          return res.status(500).json({ message: "Error creating work history" })
        }

        return res.status(201).json(data)
      } catch (error) {
        console.error("Error creating work history:", error)
        return res.status(500).json({ message: "Error creating work history" })
      }
    }

    // EDUCATION HISTORY ROUTES
    if (path === "/career-data/education-history" && req.method === "POST") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to add education history"
        })
      }

      try {
        const educationData = {
          ...req.body,
          user_id: authResult.userId
        }

        const { data, error } = await supabaseAdmin
          .from("education_history")
          .insert(educationData)
          .select()
          .single()

        if (error) {
          console.error("Error creating education history:", error)
          return res.status(500).json({ message: "Error creating education history" })
        }

        return res.status(201).json(data)
      } catch (error) {
        console.error("Error creating education history:", error)
        return res.status(500).json({ message: "Error creating education history" })
      }
    }

    // CONTACTS ROUTES - Critical missing route for adding contacts
    if (path === "/contacts" && req.method === "POST") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to create contacts"
        })
      }

      try {
        const { 
          fullName, 
          email, 
          phone, 
          company, 
          position, 
          linkedinUrl, 
          relationshipType, 
          lastContactDate, 
          notes 
        } = req.body

        if (!fullName) {
          return res.status(400).json({ message: "Full name is required" })
        }

        const { data: contact, error } = await supabaseAdmin
          .from("networking_contacts")
          .insert({
            user_id: authResult.userId,
            full_name: fullName,
            email: email || null,
            phone: phone || null,
            company: company || null,
            position: position || null,
            linkedin_url: linkedinUrl || null,
            relationship_type: relationshipType || "professional",
            last_contact_date: lastContactDate || null,
            notes: notes || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating contact:", error)
          return res.status(500).json({ message: "Error creating contact" })
        }

        return res.status(201).json(contact)
      } catch (error) {
        console.error("Error creating contact:", error)
        return res.status(500).json({ message: "Error creating contact" })
      }
    }

    // UPDATE CONTACT - PUT /contacts/:id
    if (path.startsWith("/contacts/") && req.method === "PUT") {
      const pathParts = path.split("/")
      const contactId = parseInt(pathParts[2])
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" })
      }

      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to update contacts"
        })
      }

      try {
        const { 
          fullName, 
          email, 
          phone, 
          company, 
          position, 
          linkedinUrl, 
          relationshipType, 
          lastContactDate, 
          notes 
        } = req.body

        // First check if the contact belongs to the user
        const { data: existingContact } = await supabaseAdmin
          .from("networking_contacts")
          .select("id")
          .eq("id", contactId)
          .eq("user_id", authResult.userId)
          .single()

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        const { data: contact, error } = await supabaseAdmin
          .from("networking_contacts")
          .update({
            full_name: fullName,
            email: email || null,
            phone: phone || null,
            company: company || null,
            position: position || null,
            linkedin_url: linkedinUrl || null,
            relationship_type: relationshipType || "professional",
            last_contact_date: lastContactDate || null,
            notes: notes || null,
            updated_at: new Date().toISOString()
          })
          .eq("id", contactId)
          .eq("user_id", authResult.userId)
          .select()
          .single()

        if (error) {
          console.error("Error updating contact:", error)
          return res.status(500).json({ message: "Error updating contact" })
        }

        return res.status(200).json(contact)
      } catch (error) {
        console.error("Error updating contact:", error)
        return res.status(500).json({ message: "Error updating contact" })
      }
    }

    // DELETE CONTACT - DELETE /contacts/:id
    if (path.startsWith("/contacts/") && req.method === "DELETE") {
      const pathParts = path.split("/")
      const contactId = parseInt(pathParts[2])
      
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" })
      }

      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to delete contacts"
        })
      }

      try {
        // First check if the contact belongs to the user
        const { data: existingContact } = await supabaseAdmin
          .from("networking_contacts")
          .select("id")
          .eq("id", contactId)
          .eq("user_id", authResult.userId)
          .single()

        if (!existingContact) {
          return res.status(404).json({ message: "Contact not found" })
        }

        const { error } = await supabaseAdmin
          .from("networking_contacts")
          .delete()
          .eq("id", contactId)
          .eq("user_id", authResult.userId)

        if (error) {
          console.error("Error deleting contact:", error)
          return res.status(500).json({ message: "Error deleting contact" })
        }

        return res.status(200).json({ message: "Contact deleted successfully" })
      } catch (error) {
        console.error("Error deleting contact:", error)
        return res.status(500).json({ message: "Error deleting contact" })
      }
    }

    // SKILLS ROUTES
    if (path === "/career-data/skills" && req.method === "POST") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to add skills"
        })
      }

      try {
        const skillData = {
          ...req.body,
          user_id: authResult.userId
        }

        const { data, error } = await supabaseAdmin
          .from("user_skills")
          .insert(skillData)
          .select()
          .single()

        if (error) {
          console.error("Error creating skill:", error)
          return res.status(500).json({ message: "Error creating skill" })
        }

        return res.status(201).json(data)
      } catch (error) {
        console.error("Error creating skill:", error)
        return res.status(500).json({ message: "Error creating skill" })
      }
    }

    // CERTIFICATIONS ROUTES
    if (path === "/career-data/certifications" && req.method === "POST") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to add certifications"
        })
      }

      try {
        const certData = {
          ...req.body,
          user_id: authResult.userId
        }

        const { data, error } = await supabaseAdmin
          .from("certifications")
          .insert(certData)
          .select()
          .single()

        if (error) {
          console.error("Error creating certification:", error)
          return res.status(500).json({ message: "Error creating certification" })
        }

        return res.status(201).json(data)
      } catch (error) {
        console.error("Error creating certification:", error)
        return res.status(500).json({ message: "Error creating certification" })
      }
    }

    // ADMIN ANALYTICS ROUTES - For charts and stats
    if (path === "/admin/analytics" && req.method === "GET") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to access analytics"
        })
      }

      // Check if user has admin privileges
      if (!["admin", "super_admin", "university_admin"].includes(authResult.user.user_type)) {
        return res.status(403).json({ error: "Insufficient permissions" })
      }

      try {
        // Get user statistics
        const { data: userStats } = await supabaseAdmin
          .from("users")
          .select("user_type, created_at")

        // Process user growth data
        const userGrowth = userStats?.reduce((acc, user) => {
          const date = new Date(user.created_at).toISOString().split('T')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        }, {}) || {}

        const userGrowthArray = Object.entries(userGrowth).map(([date, count]) => ({
          date,
          users: count
        }))

        // Get user type distribution
        const userTypeDistribution = userStats?.reduce((acc, user) => {
          acc[user.user_type] = (acc[user.user_type] || 0) + 1
          return acc
        }, {}) || {}

        const analyticsData = {
          userGrowth: userGrowthArray,
          userTypeDistribution,
          totalUsers: userStats?.length || 0
        }

        return res.status(200).json(analyticsData)
      } catch (error) {
        console.error("Error fetching analytics:", error)
        return res.status(500).json({ message: "Error fetching analytics data" })
      }
    }

    // USER STATISTICS - Real data instead of dummy data
    if (path === "/users/statistics" && req.method === "GET") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to access statistics"
        })
      }

      try {
        const userId = authResult.userId

        // Get actual user statistics from database
        const { data: workHistory } = await supabaseAdmin
          .from("work_history")
          .select("id")
          .eq("user_id", userId)

        const { data: educationHistory } = await supabaseAdmin
          .from("education_history")
          .select("id")
          .eq("user_id", userId)

        const { data: skills } = await supabaseAdmin
          .from("user_skills")
          .select("id")
          .eq("user_id", userId)

        const { data: certifications } = await supabaseAdmin
          .from("certifications")
          .select("id")
          .eq("user_id", userId)

        // Return real statistics
        return res.status(200).json({
          workExperience: workHistory?.length || 0,
          education: educationHistory?.length || 0,
          skills: skills?.length || 0,
          certifications: certifications?.length || 0,
          applications: 0, // This would come from job applications table when implemented
          interviews: 0,
          offers: 0,
          connections: 0,
          monthlyXp: [] // Add empty array for chart compatibility
        })
      } catch (error) {
        console.error("Error fetching user statistics:", error)
        return res.status(500).json({
          workExperience: 0,
          education: 0,
          skills: 0,
          certifications: 0,
          applications: 0,
          interviews: 0,
          offers: 0,
          connections: 0,
          monthlyXp: []
        })
      }
    }

    // Handle nested routes for career data
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
        return res.status(405).json({ error: "Method not allowed" })
      }
      return res.status(404).json({ error: "Career data endpoint not found" })
    }

    // GOALS ROUTES - Critical missing routes
    if (path === "/goals" && req.method === "GET") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to access goals"
        })
      }

      try {
        const { data: goals } = await supabaseAdmin
          .from("goals")
          .select("*")
          .eq("user_id", authResult.userId)
          .order("created_at", { ascending: false })

        return res.status(200).json(goals || [])
      } catch (error) {
        console.error("Error fetching goals:", error)
        return res.status(500).json({ message: "Error fetching goals" })
      }
    }

    if (path === "/goals" && req.method === "POST") {
      const authResult = await verifySupabaseToken(req.headers.authorization)
      if (authResult.error) {
        return res.status(authResult.status).json({
          error: authResult.error,
          message: "Please log in to create goals"
        })
      }

      try {
        const goalData = {
          ...req.body,
          user_id: authResult.userId,
          status: req.body.status || "not_started"
        }

        const { data, error } = await supabaseAdmin
          .from("goals")
          .insert(goalData)
          .select()
          .single()

        if (error) {
          console.error("Error creating goal:", error)
          return res.status(500).json({ message: "Error creating goal" })
        }

        return res.status(201).json(data)
      } catch (error) {
        console.error("Error creating goal:", error)
        return res.status(500).json({ message: "Error creating goal" })
      }
    }

    // Individual goal operations (PUT, DELETE)
    if (path.startsWith("/goals/") && path !== "/goals/suggest") {
      const goalId = path.split("/goals/")[1]
      
      if (req.method === "PUT") {
        const authResult = await verifySupabaseToken(req.headers.authorization)
        if (authResult.error) {
          return res.status(authResult.status).json({
            error: authResult.error,
            message: "Please log in to update goals"
          })
        }

        try {
          const { data: goal } = await supabaseAdmin
            .from("goals")
            .select("*")
            .eq("id", goalId)
            .eq("user_id", authResult.userId)
            .single()

          if (!goal) {
            return res.status(404).json({ message: "Goal not found or access denied" })
          }

          const { data: updatedGoal, error } = await supabaseAdmin
            .from("goals")
            .update(req.body)
            .eq("id", goalId)
            .eq("user_id", authResult.userId)
            .select()
            .single()

          if (error) {
            console.error("Error updating goal:", error)
            return res.status(500).json({ message: "Error updating goal" })
          }

          return res.status(200).json(updatedGoal)
        } catch (error) {
          console.error("Error updating goal:", error)
          return res.status(500).json({ message: "Error updating goal" })
        }
      }

      if (req.method === "DELETE") {
        const authResult = await verifySupabaseToken(req.headers.authorization)
        if (authResult.error) {
          return res.status(authResult.status).json({
            error: authResult.error,
            message: "Please log in to delete goals"
          })
        }

        try {
          const { data: goal } = await supabaseAdmin
            .from("goals")
            .select("*")
            .eq("id", goalId)
            .eq("user_id", authResult.userId)
            .single()

          if (!goal) {
            return res.status(404).json({ message: "Goal not found or access denied" })
          }

          const { error } = await supabaseAdmin
            .from("goals")
            .delete()
            .eq("id", goalId)
            .eq("user_id", authResult.userId)

          if (error) {
            console.error("Error deleting goal:", error)
            return res.status(500).json({ message: "Error deleting goal" })
          }

          return res.status(204).send()
        } catch (error) {
          console.error("Error deleting goal:", error)
          return res.status(500).json({ message: "Error deleting goal" })
        }
      }
    }

    // GOAL SUGGESTIONS ROUTE
    if (path === "/goals/suggest" && req.method === "POST") {
      try {
        // For now, return basic goal suggestions until AI integration is set up
        const { currentPosition, desiredPosition, timeframe, skills } = req.body

        if (!currentPosition || !desiredPosition || !timeframe) {
          return res.status(400).json({ message: "Missing required fields" })
        }

        // Basic goal suggestions based on input
        const suggestions = [
          {
            title: `Develop ${desiredPosition} Skills`,
            description: `Build core competencies required for ${desiredPosition} role`,
            category: "skill_development",
            priority: "high",
            timeframe: timeframe
          },
          {
            title: "Network Building",
            description: `Connect with professionals in ${desiredPosition} field`,
            category: "networking",
            priority: "medium",
            timeframe: timeframe
          },
          {
            title: "Portfolio Development",
            description: `Create projects showcasing ${desiredPosition} capabilities`,
            category: "portfolio",
            priority: "high",
            timeframe: timeframe
          }
        ]

        return res.status(200).json(suggestions)
      } catch (error) {
        console.error("Error generating goal suggestions:", error)
        return res.status(500).json({ message: "Error generating goal suggestions" })
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
          const careerAuthResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (careerAuthResult.error) {
            return res.status(careerAuthResult.status).json({
              error: careerAuthResult.error,
              message: "Please log in to access career data"
            })
          }

          const userId = careerAuthResult.userId

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

            const careerSummary = careerAuthResult.user.career_summary || ""
            const linkedInUrl = careerAuthResult.user.linkedin_url || ""

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
          const resumesAuthResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (resumesAuthResult.error) {
            return res.status(resumesAuthResult.status).json({
              error: resumesAuthResult.error,
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
          const recommendationsAuthResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (recommendationsAuthResult.error) {
            return res.status(recommendationsAuthResult.status).json({
              error: recommendationsAuthResult.error,
              message: "Please log in to access recommendations"
            })
          }

          // For now, return empty array until recommendations are implemented
          return res.status(200).json([])
        }
        break

      case "/models":
        return res.status(200).json({ models: [] })

      case "/contacts":
        if (req.method === "GET") {
          const contactsAuthResult = await verifySupabaseToken(req.headers.authorization)
          if (contactsAuthResult.error) {
            return res.status(contactsAuthResult.status).json({
              error: contactsAuthResult.error,
              message: "Please log in to access contacts"
            })
          }

          try {
            const { data: contacts } = await supabaseAdmin
              .from("networking_contacts")
              .select("*")
              .eq("user_id", contactsAuthResult.userId)
              .order("created_at", { ascending: false })

            return res.status(200).json(contacts || [])
          } catch (error) {
            console.error("Error fetching contacts:", error)
            return res.status(500).json({ message: "Failed to fetch contacts" })
          }
        }
        break

      case "/contacts/need-followup":
        const needFollowupAuthResult = await verifySupabaseToken(req.headers.authorization)
        if (needFollowupAuthResult.error) {
          return res.status(needFollowupAuthResult.status).json({
            error: needFollowupAuthResult.error,
            message: "Please log in to access follow-ups"
          })
        }

        try {
          // Get contacts that need follow-up (have pending follow-ups that are due)
          const { data: contacts } = await supabaseAdmin
            .from("networking_contacts")
            .select(`
              *,
              followup_actions(*)
            `)
            .eq("user_id", needFollowupAuthResult.userId)

          const contactsNeedingFollowup = contacts?.filter(contact => {
            return contact.followup_actions?.some(followup => 
              !followup.completed && 
              followup.due_date && 
              new Date(followup.due_date) <= new Date()
            )
          }) || []

          return res.status(200).json(contactsNeedingFollowup)
        } catch (error) {
          console.error("Error fetching contacts needing follow-up:", error)
          return res.status(500).json({ message: "Failed to fetch contacts needing follow-up" })
        }

      case "/contacts/all-followups":
        const followupsAuthResult = await verifySupabaseToken(req.headers.authorization)
        if (followupsAuthResult.error) {
          return res.status(followupsAuthResult.status).json({
            error: followupsAuthResult.error,
            message: "Please log in to access follow-ups"
          })
        }

        try {
          // Get all contacts and their pending follow-ups
          const { data: contacts } = await supabaseAdmin
            .from("networking_contacts")
            .select("*")
            .eq("user_id", followupsAuthResult.userId)

          const allFollowUps = []

          if (contacts && contacts.length > 0) {
            for (const contact of contacts) {
              const { data: followUps } = await supabaseAdmin
                .from("followup_actions")
                .select("*")
                .eq("contact_id", contact.id)
                .eq("completed", false)
                .gte("due_date", new Date().toISOString())

              if (followUps) {
                followUps.forEach(followUp => {
                  allFollowUps.push({
                    ...followUp,
                    contact: {
                      id: contact.id,
                      fullName: contact.full_name,
                      company: contact.company,
                      email: contact.email,
                      phone: contact.phone
                    }
                  })
                })
              }
            }
          }

          // Sort by due date
          allFollowUps.sort((a, b) => 
            new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
          )

          return res.status(200).json(allFollowUps)
        } catch (error) {
          console.error("Error fetching follow-ups:", error)
          return res.status(500).json({ message: "Failed to fetch follow-ups" })
        }

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

      case "/achievements":
        // Achievements endpoint
        const achievementsAuthResult = await verifySupabaseToken(
          req.headers.authorization
        )

        if (achievementsAuthResult.error) {
          return res.status(achievementsAuthResult.status).json({
            error: achievementsAuthResult.error,
            message: "Please log in to access achievements"
          })
        }

        try {
          const { data: achievements } = await supabaseAdmin
            .from("achievements")
            .select("*")
            .eq("user_id", achievementsAuthResult.userId)

          return res.status(200).json(achievements || [])
        } catch (error) {
          console.error("Error fetching achievements:", error)
          return res.status(500).json({ message: "Error fetching achievements" })
        }

      case "/skill-stacker":
        // Skill Stacker endpoint
        if (req.method === "GET") {
          const skillStackerAuthResult = await verifySupabaseToken(
            req.headers.authorization
          )

          if (skillStackerAuthResult.error) {
            return res.status(skillStackerAuthResult.status).json({
              error: skillStackerAuthResult.error,
              message: "Please log in to access skill stacker"
            })
          }

          // Return empty array for now - can be expanded later
          return res.status(200).json([])
        }
        break

      default:
        return res.status(404).json({
          error: "API route not found",
          path: path,
          method: req.method,
          hint: "This route may not be implemented yet in the Vercel deployment. Available routes: /users/me, /career-data, /goals, /admin/analytics, /users/statistics"
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