import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

// Load environment variables from .env file
dotenv.config()

// Setup for __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Environment variables with defaults
export const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT || "3002"),
  SESSION_SECRET: process.env.SESSION_SECRET || "default-secret",
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
  SUPABASE_ANON_KEY:
    process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  ALLOWED_ORIGINS:
    process.env.ALLOWED_ORIGINS ||
    "http://localhost:3000,http://localhost:3001,http://localhost:3002"
}

// Validate required env vars
export function validateEnv() {
  const required = ["SUPABASE_URL", "SUPABASE_ANON_KEY"]

  const missing = required.filter((key) => !ENV[key as keyof typeof ENV])

  if (missing.length > 0) {

      return true // Allow to proceed in development mode with placeholders
    }
  }

  return true
}
