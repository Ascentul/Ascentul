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

export default router
