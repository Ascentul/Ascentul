import express from "express"
import { z } from "zod"
import { storage } from "../storage"
import { supabase, supabaseAdmin } from "../db"
import { settingsService } from "../services/settingsService"

const router = express.Router()

// Schema for creating or updating a university - accepting frontend field names
const universitySchema = z.object({
  name: z.string().min(3, "University name must be at least 3 characters"),
  // Frontend fields
  licensePlan: z.enum(["Starter", "Basic", "Pro", "Enterprise"]).optional(),
  licenseSeats: z.number().min(1).optional(),
  licenseStart: z.string().or(z.date()).optional(),
  licenseEnd: z.string().or(z.date()).optional(),
  adminEmail: z.string().email().optional(),
  // Backend fields (optional for backwards compatibility)
  domain: z.string().optional(),
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  website: z.string().url("Please enter a valid website URL").optional(),
  logo_url: z.string().url("Please enter a valid logo URL").optional(),
  primary_color: z.string().default("#4A56E2"),
  subscription_tier: z.enum(["basic", "premium", "enterprise"]).optional(),
  subscription_status: z.enum(["active", "inactive", "suspended"]).optional()
})

// Get all universities
router.get("/", async (req, res) => {
  // Authentication and admin check is handled by middleware

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
        licensePlan:
          university.subscription_tier === "basic"
            ? "Starter"
            : university.subscription_tier === "premium"
            ? "Pro"
            : university.subscription_tier === "enterprise"
            ? "Enterprise"
            : "Basic",
        licenseSeats:
          university.license_seats ||
          (await settingsService.getDefaultLicenseSeats()), // Use actual value from database or settings default
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
  // Authentication and admin check is handled by middleware

  try {
    // Validate input
    const validatedData = universitySchema.parse(req.body)

    // Map frontend fields to backend schema
    const mappedData = {
      name: validatedData.name,
      domain:
        validatedData.domain ||
        validatedData.name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "") + ".edu",
      country: validatedData.country || "US",
      state: validatedData.state,
      city: validatedData.city,
      address: validatedData.address,
      website: validatedData.website,
      logo_url: validatedData.logo_url,
      primary_color: validatedData.primary_color || "#4A56E2",
      license_seats:
        validatedData.licenseSeats ||
        (await settingsService.getDefaultLicenseSeats()), // Use settings for default license seats
      license_used: 0, // New universities start with 0 used licenses
      subscription_tier:
        validatedData.subscription_tier ||
        (validatedData.licensePlan
          ? validatedData.licensePlan.toLowerCase() === "starter"
            ? "basic"
            : validatedData.licensePlan.toLowerCase() === "pro"
            ? "premium"
            : validatedData.licensePlan.toLowerCase() === "enterprise"
            ? "enterprise"
            : validatedData.licensePlan.toLowerCase() === "basic"
            ? "basic"
            : "basic"
          : "basic"),
      subscription_status: validatedData.subscription_status || "active",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Create the university
    const { data: university, error } = await supabaseAdmin
      .from("universities")
      .insert(mappedData)
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
      licensePlan:
        university.subscription_tier === "basic"
          ? "Starter"
          : university.subscription_tier === "premium"
          ? "Pro"
          : university.subscription_tier === "enterprise"
          ? "Enterprise"
          : "Basic",
      licenseSeats:
        university.license_seats ||
        (await settingsService.getDefaultLicenseSeats()), // Use actual value from database or settings default
      licenseUsed: university.license_used || 0, // Use actual value from database
      licenseStart: university.created_at,
      licenseEnd: null,
      status:
        university.subscription_status === "active" ? "Active" : "Inactive",
      slug: university.domain,
      adminEmail: validatedData.adminEmail || null
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
  // Authentication and admin check is handled by middleware

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
      licensePlan:
        university.subscription_tier === "basic"
          ? "Starter"
          : university.subscription_tier === "premium"
          ? "Pro"
          : university.subscription_tier === "enterprise"
          ? "Enterprise"
          : "Basic",
      licenseSeats:
        university.license_seats ||
        (await settingsService.getDefaultLicenseSeats()), // Use actual value from database or settings default
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
  // Authentication and admin check is handled by middleware

  try {
    const universityId = parseInt(req.params.id)
    if (isNaN(universityId)) {
      return res.status(400).json({ error: "Invalid university ID" })
    }

    // Validate input
    const validatedData = universitySchema.parse(req.body)

    // Map frontend fields to backend schema
    const updateData = {
      name: validatedData.name,
      domain: validatedData.domain,
      country: validatedData.country,
      state: validatedData.state,
      city: validatedData.city,
      address: validatedData.address,
      website: validatedData.website,
      logo_url: validatedData.logo_url,
      primary_color: validatedData.primary_color,
      license_seats: validatedData.licenseSeats, // Include license seats in update
      subscription_tier:
        validatedData.subscription_tier ||
        (validatedData.licensePlan
          ? validatedData.licensePlan.toLowerCase() === "starter"
            ? "basic"
            : validatedData.licensePlan.toLowerCase() === "pro"
            ? "premium"
            : validatedData.licensePlan.toLowerCase() === "enterprise"
            ? "enterprise"
            : validatedData.licensePlan.toLowerCase() === "basic"
            ? "basic"
            : "basic"
          : undefined),
      subscription_status: validatedData.subscription_status,
      updated_at: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    )

    // Update the university
    const { data: updatedUniversity, error: updateError } = await supabaseAdmin
      .from("universities")
      .update(updateData)
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
      licensePlan:
        updatedUniversity.subscription_tier === "basic"
          ? "Starter"
          : updatedUniversity.subscription_tier === "premium"
          ? "Pro"
          : updatedUniversity.subscription_tier === "enterprise"
          ? "Enterprise"
          : "Basic",
      licenseSeats:
        updatedUniversity.license_seats ||
        (await settingsService.getDefaultLicenseSeats()), // Use actual value from database or settings default
      licenseUsed: updatedUniversity.license_used || 0, // Use actual value from database
      licenseStart: updatedUniversity.created_at,
      licenseEnd: null,
      status:
        updatedUniversity.subscription_status === "active"
          ? "Active"
          : "Inactive",
      slug: updatedUniversity.domain,
      adminEmail: validatedData.adminEmail || null
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
  // Authentication and admin check is handled by middleware

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
  // Authentication and admin check is handled by middleware

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
  // Authentication and admin check is handled by middleware

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
