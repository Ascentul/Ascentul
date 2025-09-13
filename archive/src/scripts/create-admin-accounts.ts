import { supabaseAdmin } from "../backend/supabase"
import { ENV, validateEnv } from "../config/env"
import bcrypt from "bcrypt"

// Validate environment variables
const isValid = validateEnv()

if (!isValid) {
  console.error(
    "Required environment variables are missing. Please check your .env file."
  )
  process.exit(1)
}

// Test admin accounts to create
const adminAccounts = [
  {
    email: "superadmin@ascentul.io",
    password: "SuperAdmin123!",
    name: "Super Administrator",
    username: "superadmin",
    role: "super_admin",
    user_type: "admin",
    university_id: null,
    university_name: null
  },
  {
    email: "universityadmin@harvard.edu",
    password: "UniAdmin123!",
    name: "Harvard University Admin",
    username: "harvard_admin",
    role: "university_admin", 
    user_type: "university_admin",
    university_id: 1,
    university_name: "Harvard University"
  },
  {
    email: "universityadmin@stanford.edu",
    password: "UniAdmin123!",
    name: "Stanford University Admin",
    username: "stanford_admin",
    role: "university_admin",
    user_type: "university_admin", 
    university_id: 2,
    university_name: "Stanford University"
  },
  {
    email: "universityadmin@mit.edu",
    password: "UniAdmin123!",
    name: "MIT University Admin",
    username: "mit_admin",
    role: "university_admin",
    user_type: "university_admin",
    university_id: 3,
    university_name: "Massachusetts Institute of Technology"
  }
]

// Function to create a Supabase Auth user
async function createSupabaseAuthUser(email: string, password: string) {
  try {
