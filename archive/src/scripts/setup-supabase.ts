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

    // Split the schema into individual statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0)

    for (const statement of statements) {
      try {
