#!/usr/bin/env node

/**
 * Script to create admin accounts in Supabase
 * This script creates both the Supabase Auth user and the database record
 */

import { createClient } from "@supabase/supabase-js"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase credentials in environment variables")
  console.error("Required: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const adminAccounts = [
  {
    email: "admin@careertracker.io",
    password: "admin123",
    name: "System Administrator",
    user_type: "admin",
    role: "super_admin"
  },
  {
    email: "admin@university.edu",
    password: "password",
    name: "University Administrator",
    user_type: "university_admin",
    role: "university_admin"
  },
  {
    email: "admin@example.com",
    password: "changeme123",
    name: "Admin User",
    user_type: "admin",
    role: "admin"
  }
]

async function checkExistingAccounts() {
  console.log("🔍 Checking existing accounts...\n")

  // Check Supabase Auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers()

  // Check database users
  const { data: dbUsers } = await supabase
    .from("users")
    .select("id, email, user_type, role, name")
    .in("user_type", ["admin", "university_admin"])

  console.log("📧 Supabase Auth Users:")
  if (authUsers.users.length === 0) {
    console.log("  (none found)")
  } else {
    authUsers.users.forEach((user) => {
      console.log(`  - ${user.email} (ID: ${user.id})`)
    })
  }

  console.log("\n💾 Database Admin Users:")
  if (!dbUsers || dbUsers.length === 0) {
    console.log("  (none found)")
  } else {
    dbUsers.forEach((user) => {
      console.log(`  - ${user.email} (${user.user_type}/${user.role})`)
    })
  }

  return { authUsers: authUsers.users, dbUsers: dbUsers || [] }
}

async function createAdminAccount(accountData) {
  const { email, password, name, user_type, role } = accountData

  console.log(`\n🔨 Creating admin account: ${email}`)

  try {
    // Check if auth user already exists
    const { data: existingAuthUsers } = await supabase.auth.admin.listUsers()
    const existingAuthUser = existingAuthUsers.users.find(
      (u) => u.email === email
    )

    let authUserId

    if (existingAuthUser) {
      console.log("  ⚠️  Auth user already exists, using existing...")
      authUserId = existingAuthUser.id
    } else {
      // Step 1: Create user in Supabase Auth
      console.log("  📧 Creating Supabase Auth user...")
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email,
          password,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            name,
            user_type,
            role
          }
        })

      if (authError) {
        throw authError
      }

      authUserId = authData.user.id
      console.log("  ✅ Supabase Auth user created")
    }

    // Step 2: Check if database record exists
    const { data: existingDbUser } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single()

    if (existingDbUser) {
      console.log("  ⚠️  Database record already exists, updating...")

      // Update existing record to ensure it has the right role
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update({
          user_type,
          role,
          needs_username: false,
          onboarding_completed: true,
          email_verified: true
        })
        .eq("email", email)
        .select()
        .single()

      if (updateError) {
        console.error("  ❌ Update error:", updateError)
        throw updateError
      }

      console.log("  ✅ Database record updated")
    } else {
      // Create new database record
      console.log("  💾 Creating database record...")
      const userData = {
        id: authUserId,
        username: `admin_${authUserId.slice(0, 8)}`,
        password: "supabase-auth", // Placeholder since Supabase handles auth
        name,
        email,
        user_type,
        role,
        needs_username: false,
        onboarding_completed: true,
        email_verified: true,
        subscription_plan:
          user_type === "university_admin" ? "university" : "premium",
        subscription_status: "active",
        xp: 0,
        level: 1,
        rank: "Administrator",
        created_at: new Date().toISOString()
      }

      const { data: dbData, error: dbError } = await supabase
        .from("users")
        .insert(userData)
        .select()
        .single()

      if (dbError) {
        console.error("  ❌ Database error:", dbError)
        throw dbError
      }

      console.log("  ✅ Database record created")
    }

    console.log(`  🎉 Admin account ready: ${email}`)

    return {
      success: true,
      email,
      id: authUserId
    }
  } catch (error) {
    console.error(`  ❌ Failed to create ${email}:`, error.message)
    return {
      success: false,
      email,
      error: error.message
    }
  }
}

async function main() {
  console.log("🚀 Setting up Supabase admin accounts...\n")

  // First check what already exists
  await checkExistingAccounts()

  console.log("\n" + "=".repeat(60))

  const results = []

  for (const account of adminAccounts) {
    const result = await createAdminAccount(account)
    results.push(result)
  }

  console.log("\n📊 Summary:")
  console.log("=".repeat(50))

  const successful = results.filter((r) => r.success)
  const failed = results.filter((r) => !r.success)

  if (successful.length > 0) {
    console.log("\n✅ Successfully processed:")
    successful.forEach((r) => {
      console.log(`  - ${r.email}`)
    })
  }

  if (failed.length > 0) {
    console.log("\n❌ Failed to process:")
    failed.forEach((r) => {
      console.log(`  - ${r.email}: ${r.error}`)
    })
  }

  console.log(
    `\n🎯 Total: ${successful.length}/${results.length} accounts ready`
  )

  if (successful.length > 0) {
    console.log("\n🔑 Login credentials:")
    console.log("=".repeat(50))
    adminAccounts.forEach((account) => {
      if (successful.find((r) => r.email === account.email)) {
        console.log(`Email: ${account.email}`)
        console.log(`Password: ${account.password}`)
        console.log(`Role: ${account.role}`)
        console.log("---")
      }
    })

    console.log("\n🌐 Access URLs:")
    console.log("- System Admin: http://localhost:3000/admin/")
    console.log("- University Admin: http://localhost:3000/university-admin/")
    console.log("- Login Page: http://localhost:3000/sign-in")

    console.log("\n💡 Next steps:")
    console.log("1. Go to http://localhost:3000/sign-in")
    console.log("2. Use any of the email/password combinations above")
    console.log("3. You'll be redirected to the appropriate admin portal")
  }
}

// Run the script
main().catch(console.error)
