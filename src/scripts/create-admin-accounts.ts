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
    console.log(`Creating Supabase Auth user for: ${email}`)
    
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        created_by: "admin_script",
        created_at: new Date().toISOString()
      }
    })

    if (error) {
      console.error(`Error creating Supabase Auth user for ${email}:`, error)
      return null
    }

    console.log(`✅ Supabase Auth user created for ${email} with ID: ${data.user.id}`)
    return data.user
  } catch (error) {
    console.error(`Error creating Supabase Auth user for ${email}:`, error)
    return null
  }
}

// Function to create a database user record
async function createDatabaseUser(authUser: any, accountData: any) {
  try {
    console.log(`Creating database user record for: ${accountData.email}`)
    
    // Hash the password for database storage (even though Supabase handles auth)
    const hashedPassword = await bcrypt.hash(accountData.password, 10)
    
    const userRecord = {
      id: authUser.id, // Use the Supabase Auth UUID
      username: accountData.username,
      password: hashedPassword,
      name: accountData.name,
      email: accountData.email,
      user_type: accountData.user_type,
      role: accountData.role,
      university_id: accountData.university_id,
      university_name: accountData.university_name,
      xp: 0,
      level: 1,
      rank: "Admin",
      subscription_plan: "premium",
      subscription_status: "active",
      email_verified: true,
      onboarding_completed: true,
      created_at: new Date().toISOString()
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .insert(userRecord)
      .select()
      .single()

    if (error) {
      console.error(`Error creating database user for ${accountData.email}:`, error)
      return null
    }

    console.log(`✅ Database user record created for ${accountData.email}`)
    return data
  } catch (error) {
    console.error(`Error creating database user for ${accountData.email}:`, error)
    return null
  }
}

// Function to create universities if they don't exist
async function ensureUniversitiesExist() {
  console.log("Ensuring universities exist in database...")
  
  const universities = [
    { id: 1, name: "Harvard University", domain: "harvard.edu" },
    { id: 2, name: "Stanford University", domain: "stanford.edu" },
    { id: 3, name: "Massachusetts Institute of Technology", domain: "mit.edu" }
  ]

  for (const university of universities) {
    try {
      // Check if university exists
      const { data: existingUniversity } = await supabaseAdmin
        .from("universities")
        .select("id")
        .eq("id", university.id)
        .single()

      if (!existingUniversity) {
        // Create university
        const { error } = await supabaseAdmin
          .from("universities")
          .insert(university)

        if (error) {
          console.error(`Error creating university ${university.name}:`, error)
        } else {
          console.log(`✅ Created university: ${university.name}`)
        }
      } else {
        console.log(`University ${university.name} already exists`)
      }
    } catch (error) {
      console.error(`Error checking/creating university ${university.name}:`, error)
    }
  }
}

// Main function to create all admin accounts
async function createAdminAccounts() {
  try {
    console.log("🚀 Starting admin account creation process...")
    console.log(`Connected to Supabase: ${ENV.SUPABASE_URL}`)
    
    // Ensure universities exist first
    await ensureUniversitiesExist()
    
    console.log(`\nCreating ${adminAccounts.length} admin accounts...\n`)
    
    const results = []
    
    for (const account of adminAccounts) {
      console.log(`\n--- Creating account for ${account.email} ---`)
      
      // Check if user already exists in Supabase Auth
      try {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(user => user.email === account.email)
        
        if (existingUser) {
          console.log(`⚠️ Supabase Auth user already exists for ${account.email}`)
          
          // Check if database record exists
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", account.email)
            .single()
            
          if (!dbUser) {
            console.log(`Creating missing database record for ${account.email}`)
            await createDatabaseUser(existingUser, account)
          } else {
            console.log(`Database record already exists for ${account.email}`)
          }
          
          results.push({ email: account.email, status: "already_exists" })
          continue
        }
      } catch (error) {
        console.log(`Proceeding to create new user for ${account.email}`)
      }
      
      // Create Supabase Auth user
      const authUser = await createSupabaseAuthUser(account.email, account.password)
      
      if (!authUser) {
        results.push({ email: account.email, status: "auth_failed" })
        continue
      }
      
      // Create database user record
      const dbUser = await createDatabaseUser(authUser, account)
      
      if (!dbUser) {
        results.push({ email: account.email, status: "db_failed" })
        continue
      }
      
      results.push({ 
        email: account.email, 
        status: "success",
        authId: authUser.id,
        role: account.role
      })
    }
    
    // Print summary
    console.log("\n" + "=".repeat(60))
    console.log("📊 ADMIN ACCOUNT CREATION SUMMARY")
    console.log("=".repeat(60))
    
    results.forEach(result => {
      const statusEmoji = result.status === "success" ? "✅" : 
                         result.status === "already_exists" ? "⚠️" : "❌"
      console.log(`${statusEmoji} ${result.email} - ${result.status}`)
      if (result.role) {
        console.log(`   Role: ${result.role}`)
      }
    })
    
    console.log("\n📋 LOGIN CREDENTIALS:")
    console.log("-".repeat(40))
    adminAccounts.forEach(account => {
      console.log(`Email: ${account.email}`)
      console.log(`Password: ${account.password}`)
      console.log(`Role: ${account.role}`)
      console.log("-".repeat(40))
    })
    
    console.log("\n🎉 Admin account creation process completed!")
    
  } catch (error) {
    console.error("❌ Error in admin account creation process:", error)
    process.exit(1)
  }
}

// Run the script
createAdminAccounts()
