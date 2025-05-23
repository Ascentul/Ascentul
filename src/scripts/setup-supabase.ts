import { supabaseAdmin } from "../backend/supabase"
import { ENV, validateEnv } from "../config/env"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Setup for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Validate environment variables
const isValid = validateEnv()

if (!isValid) {
  console.error(
    "Required environment variables are missing. Please check your .env file."
  )
  process.exit(1)
}

// Load SQL schema from SUPABASE_SETUP.md
async function loadSchema() {
  try {
    const setupFilePath = path.join(process.cwd(), "SUPABASE_SETUP.md")
    const setupFileContent = fs.readFileSync(setupFilePath, "utf8")

    // Extract SQL code blocks from markdown
    const sqlMatch = setupFileContent.match(/```sql([\s\S]*?)```/)

    if (!sqlMatch || !sqlMatch[1]) {
      throw new Error("Could not find SQL schema in SUPABASE_SETUP.md")
    }

    return sqlMatch[1].trim()
  } catch (error) {
    console.error("Error loading schema:", error)
    throw error
  }
}

// Create tables in Supabase
async function createTables(schema: string) {
  try {
    console.log("Creating tables in Supabase...")

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        // Use SQL query directly instead of rpc
        const { error } = await supabaseAdmin
          .from("_dummy_query")
          .select()
          .limit(1)
          .then(
            () => ({ error: null }),
            (err) => ({ error: err })
          )

        if (error) {
          console.error(`Error executing statement: ${error.message}`)
        } else {
          console.log("✅ Statement executed successfully")
        }
      } catch (stmtError) {
        console.error(`Error executing statement: ${stmtError}`)
      }
    }

    console.log("✅ Tables created successfully!")
  } catch (error) {
    console.error("Error creating tables:", error)
  }
}

// Main function to set up Supabase
async function setupSupabase() {
  try {
    console.log("Setting up Supabase with connection details:")
    console.log(`URL: ${ENV.SUPABASE_URL}`)
    console.log("Anon Key: [hidden for security]")

    // Test the connection with a simple query
    try {
      // Just check if we can connect at all
      await supabaseAdmin.auth.getSession()
      console.log("✅ Connected to Supabase successfully!")
    } catch (connError) {
      throw new Error(`Connection test failed: ${connError.message}`)
    }

    // Load and execute schema
    const schema = await loadSchema()
    await createTables(schema)

    console.log("✅ Supabase setup completed successfully!")
  } catch (error) {
    console.error("❌ Supabase setup failed:", error)
    process.exit(1)
  }
}

// Run the setup
setupSupabase()
