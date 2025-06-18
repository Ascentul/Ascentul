import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Environment variables with validation
const ENV = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || ""
}

// Create Supabase admin client
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
  }
} catch (error) {
  console.error("❌ Error initializing Supabase client:", error)
}

// Authentication helper function
async function verifySupabaseToken(authHeader) {
  if (!supabaseAdmin) {
    return { error: "Server configuration error", status: 500 }
  }

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Authentication required", status: 401 }
  }

  const token = authHeader.split(" ")[1]

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token)

    if (error || !data.user) {
      return { error: "Invalid or expired authentication token", status: 401 }
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single()

    if (userError || !userData) {
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

    // Verify authentication
    const authResult = await verifySupabaseToken(req.headers.authorization)

    if (authResult.error) {
      return res.status(authResult.status).json({
        error: authResult.error,
        message: "Please log in to access universities"
      })
    }

    // Check if user is admin
    const user = authResult.user
    if (
      user.user_type !== "admin" &&
      user.role !== "admin" &&
      user.role !== "super_admin"
    ) {
      return res.status(403).json({
        error: "Unauthorized",
        message: "Admin privileges required to access universities"
      })
    }

    // Handle GET request - fetch all universities
    if (req.method === "GET") {
      try {
        const { data: universities } = await supabaseAdmin
          .from("universities")
          .select("*")
          .order("created_at", { ascending: false })

        // Map to frontend format
        const mappedUniversities =
          universities?.map((university) => ({
            ...university,
            studentCount: 0,
            adminCount: 0,
            licensePlan:
              university.subscription_tier === "basic"
                ? "Starter"
                : university.subscription_tier === "premium"
                ? "Pro"
                : university.subscription_tier === "enterprise"
                ? "Enterprise"
                : "Basic",
            licenseSeats: 100,
            licenseUsed: 0,
            licenseStart: university.created_at,
            licenseEnd: null,
            status:
              university.subscription_status === "active"
                ? "Active"
                : "Inactive",
            slug: university.domain,
            adminEmail: null
          })) || []

        return res.status(200).json(mappedUniversities)
      } catch (error) {
        console.error("Error fetching universities:", error)
        return res.status(500).json({ message: "Error fetching universities" })
      }
    }

    // Handle POST request - create new university
    if (req.method === "POST") {
      try {
        const { name, licensePlan, licenseSeats, adminEmail, domain, country } =
          req.body

        if (!name || !domain || !country) {
          return res
            .status(400)
            .json({ message: "Name, domain, and country are required" })
        }

        // Map frontend fields to backend schema
        const subscription_tier =
          licensePlan?.toLowerCase() === "starter"
            ? "basic"
            : licensePlan?.toLowerCase() === "pro"
            ? "premium"
            : licensePlan?.toLowerCase() === "enterprise"
            ? "enterprise"
            : "basic"

        const { data: university, error } = await supabaseAdmin
          .from("universities")
          .insert({
            name,
            domain,
            country,
            subscription_tier,
            subscription_status: "active"
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating university:", error)
          return res.status(500).json({ message: "Error creating university" })
        }

        // Return with frontend mapping
        const response = {
          ...university,
          studentCount: 0,
          adminCount: 0,
          licensePlan: licensePlan || "Starter",
          licenseSeats: licenseSeats || 100,
          licenseUsed: 0,
          licenseStart: university.created_at,
          licenseEnd: null,
          status: "Active",
          slug: university.domain,
          adminEmail: adminEmail || null
        }

        return res.status(201).json(response)
      } catch (error) {
        console.error("Error creating university:", error)
        return res.status(500).json({ message: "Error creating university" })
      }
    }

    // Method not allowed
    return res.status(405).json({ message: "Method not allowed" })
  } catch (error) {
    console.error("Universities API Error:", error)
    return res.status(500).json({
      error: "Internal server error",
      message: error.message
    })
  }
}
