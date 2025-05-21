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

    // Execute the SQL schema
    const { error } = await supabaseAdmin.rpc("pgexplain", { query: schema })

    if (error) {
      throw error
    }

    console.log("✅ Tables created successfully!")
  } catch (error) {
    console.error("Error creating tables:", error)

    // Fallback to individual statements
    console.log("Trying to execute statements individually...")

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabaseAdmin.rpc("pgexplain", {
          query: statement
        })

        if (error) {
          console.error(`Error executing statement: ${error.message}`)
        } else {
          console.log("✅ Statement executed successfully")
        }
      } catch (stmtError) {
        console.error(`Error executing statement: ${stmtError}`)
      }
    }
  }
}

// Main function to set up Supabase
async function setupSupabase() {
  try {
    console.log("Setting up Supabase with connection details:")
    console.log(`URL: ${ENV.SUPABASE_URL}`)
    console.log("Anon Key: [hidden for security]")

    // Test the connection
    const { data, error } = await supabaseAdmin
      .from("_schema")
      .select("*")
      .limit(1)

    if (error) {
      throw new Error(`Connection test failed: ${error.message}`)
    }

    console.log("✅ Connected to Supabase successfully!")

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
