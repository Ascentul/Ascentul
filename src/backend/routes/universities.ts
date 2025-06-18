import express from "express"
import { z } from "zod"
import { storage } from "../storage"
import { supabase, supabaseAdmin } from "../db"

const router = express.Router()

// Schema for creating or updating a university based on actual table structure
const universitySchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters"),
  domain: z.string().min(3, "Domain must be at least 3 characters"),
  country: z.string().min(2, "Country must be at least 2 characters"),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional(),
  logo_url: z.string().url("Please enter a valid logo URL").optional(),
  primary_color: z.string().default("#4A56E2"),
  subscription_tier: z
    .enum(["basic", "premium", "enterprise"])
    .default("basic"),
  subscription_status: z
    .enum(["active", "inactive", "suspended"])
    .default("active")
})

// Get all universities
router.get("/", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    console.log("Fetching universities from Supabase...")

    // Get all universities from the universities table
    const { data: universityList, error: universitiesError } =
      await supabaseAdmin
        .from("universities")
        .select("*")
        .eq("subscription_status", "active")
        .order("created_at", { ascending: false })

    if (universitiesError) {
      console.error("Error fetching universities:", universitiesError)
      return res.status(500).json({ error: "Failed to fetch universities" })
    }

    console.log(`Found ${universityList?.length || 0} universities`)

    // Get all users who have a university_id to count students and admins
    const { data: universityUsers, error: usersError } = await supabaseAdmin
      .from("users")
      .select("university_id, user_type")
      .not("university_id", "is", null)

    if (usersError) {
      console.error("Error fetching university users:", usersError)
      // Continue without user counts rather than failing completely
    }

    // Process the results to get university information with counts
    const universitiesWithCounts = (universityList || []).map((university) => {
      const studentCount =
        universityUsers?.filter(
          (user) =>
            user.university_id === university.id &&
            user.user_type === "university_student"
        ).length || 0

      const adminCount =
        universityUsers?.filter(
          (user) =>
            user.university_id === university.id &&
            user.user_type === "university_admin"
        ).length || 0

      return {
        ...university,
        studentCount,
        adminCount,
        // Map fields for frontend compatibility
        licensePlan: university.subscription_tier,
        licenseSeats: 100, // Default value since not in schema
        licenseUsed: studentCount + adminCount,
        licenseStart: university.created_at,
        licenseEnd: null,
        status:
          university.subscription_status === "active" ? "Active" : "Inactive",
        slug: university.domain,
        adminEmail: null
      }
    })

    console.log(
      "Returning universities with counts:",
      universitiesWithCounts.length
    )
    res.json(universitiesWithCounts)
  } catch (error) {
    console.error("Error fetching universities:", error)
    res.status(500).json({ error: "Failed to fetch universities" })
  }
})

// Create a university
router.post("/", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    // Validate input
    const validatedData = universitySchema.parse(req.body)

    // Create the university
    const { data: university, error } = await supabaseAdmin
      .from("universities")
      .insert({
        name: validatedData.name,
        domain: validatedData.domain,
        country: validatedData.country,
        state: validatedData.state,
        city: validatedData.city,
        address: validatedData.address,
        website: validatedData.website,
        logo_url: validatedData.logo_url,
        primary_color: validatedData.primary_color,
        subscription_tier: validatedData.subscription_tier,
        subscription_status: validatedData.subscription_status,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating university:", error)
      return res.status(500).json({ error: "Failed to create university" })
    }

    res.status(201).json({
      ...university,
      studentCount: 0,
      adminCount: 0,
      // Map fields for frontend compatibility
      licensePlan: university.subscription_tier,
      licenseSeats: 100,
      licenseUsed: 0,
      licenseStart: university.created_at,
      licenseEnd: null,
      status:
        university.subscription_status === "active" ? "Active" : "Inactive",
      slug: university.domain,
      adminEmail: null
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error("Error creating university:", error)
    res.status(500).json({ error: "Failed to create university" })
  }
})

// Get a specific university
router.get("/:id", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    const universityId = parseInt(req.params.id)
    if (isNaN(universityId)) {
      return res.status(400).json({ error: "Invalid university ID" })
    }

    // Get the university from the universities table
    const { data: university, error: universityError } = await supabaseAdmin
      .from("universities")
      .select("*")
      .eq("id", universityId)
      .single()

    if (universityError || !university) {
      console.error("Error fetching university:", universityError)
      return res.status(404).json({ error: "University not found" })
    }

    // Get count of students and admins
    const { data: universityUsers, error: usersError } = await supabaseAdmin
      .from("users")
      .select("user_type")
      .eq("university_id", universityId)

    if (usersError) {
      console.error("Error fetching university users:", usersError)
      // Continue without user counts rather than failing completely
    }

    let studentCount = 0
    let adminCount = 0

    universityUsers?.forEach((user) => {
      if (user.user_type === "university_student") {
        studentCount++
      } else if (user.user_type === "university_admin") {
        adminCount++
      }
    })

    res.json({
      ...university,
      studentCount,
      adminCount,
      // Map fields for frontend compatibility
      licensePlan: university.subscription_tier,
      licenseSeats: 100,
      licenseUsed: studentCount + adminCount,
      licenseStart: university.created_at,
      licenseEnd: null,
      status:
        university.subscription_status === "active" ? "Active" : "Inactive",
      slug: university.domain,
      adminEmail: null
    })
  } catch (error) {
    console.error("Error fetching university:", error)
    res.status(500).json({ error: "Failed to fetch university" })
  }
})

// Update a university
router.patch("/:id", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    const universityId = parseInt(req.params.id)
    if (isNaN(universityId)) {
      return res.status(400).json({ error: "Invalid university ID" })
    }

    // Validate input
    const validatedData = universitySchema.parse(req.body)

    // Update the university
    const { data: updatedUniversity, error: updateError } = await supabaseAdmin
      .from("universities")
      .update({
        name: validatedData.name,
        domain: validatedData.domain,
        country: validatedData.country,
        state: validatedData.state,
        city: validatedData.city,
        address: validatedData.address,
        website: validatedData.website,
        logo_url: validatedData.logo_url,
        primary_color: validatedData.primary_color,
        subscription_tier: validatedData.subscription_tier,
        subscription_status: validatedData.subscription_status,
        updated_at: new Date().toISOString()
      })
      .eq("id", universityId)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating university:", updateError)
      return res.status(500).json({ error: "Failed to update university" })
    }

    res.json({
      ...updatedUniversity,
      // Map fields for frontend compatibility
      licensePlan: updatedUniversity.subscription_tier,
      licenseSeats: 100,
      licenseUsed: 0,
      licenseStart: updatedUniversity.created_at,
      licenseEnd: null,
      status:
        updatedUniversity.subscription_status === "active"
          ? "Active"
          : "Inactive",
      slug: updatedUniversity.domain,
      adminEmail: null
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    console.error("Error updating university:", error)
    res.status(500).json({ error: "Failed to update university" })
  }
})

// Delete a university
router.delete("/:id", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    const universityId = parseInt(req.params.id)
    if (isNaN(universityId)) {
      return res.status(400).json({ error: "Invalid university ID" })
    }

    // Soft delete by setting status to "inactive"
    const { error } = await supabaseAdmin
      .from("universities")
      .update({
        subscription_status: "inactive",
        updated_at: new Date().toISOString()
      })
      .eq("id", universityId)

    if (error) {
      console.error("Error deleting university:", error)
      return res.status(500).json({ error: "Failed to delete university" })
    }

    res.json({ message: "University deleted successfully" })
  } catch (error) {
    console.error("Error deleting university:", error)
    res.status(500).json({ error: "Failed to delete university" })
  }
})

// Get university students
router.get("/:id/students", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    const universityId = parseInt(req.params.id)
    if (isNaN(universityId)) {
      return res.status(400).json({ error: "Invalid university ID" })
    }

    const { data: students, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, created_at")
      .eq("university_id", universityId)
      .eq("user_type", "university_student")

    if (error) {
      console.error("Error fetching university students:", error)
      return res.status(500).json({ error: "Failed to fetch students" })
    }

    res.json(students || [])
  } catch (error) {
    console.error("Error fetching university students:", error)
    res.status(500).json({ error: "Failed to fetch students" })
  }
})

// Get university admins
router.get("/:id/admins", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }

  const user = await storage.getUser(req.userId)
  if (!user || (user.userType !== "admin" && user.role !== "super_admin")) {
    return res.status(403).json({ error: "Unauthorized" })
  }

  try {
    const universityId = parseInt(req.params.id)
    if (isNaN(universityId)) {
      return res.status(400).json({ error: "Invalid university ID" })
    }

    const { data: admins, error } = await supabaseAdmin
      .from("users")
      .select("id, name, email, created_at")
      .eq("university_id", universityId)
      .eq("user_type", "university_admin")

    if (error) {
      console.error("Error fetching university admins:", error)
      return res.status(500).json({ error: "Failed to fetch admins" })
    }

    // Format the response to match the expected interface
    const formattedAdmins = (admins || []).map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      addedDate: admin.created_at
    }))

    res.json(formattedAdmins)
  } catch (error) {
    console.error("Error fetching university admins:", error)
    res.status(500).json({ error: "Failed to fetch admins" })
  }
})

export default router
