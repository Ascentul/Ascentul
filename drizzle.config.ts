import { config } from "dotenv"
config({ path: ".env" })

if (!process.env.DATABASE_URL) {
  console.warn(
    "DATABASE_URL not set - Drizzle migrations will not be available. Using Supabase directly instead."
  )
}

export default {
  schema: "./src/utils/schema.ts",
  out: "./migrations",
  dialect: "postgresql" as const,
  dbCredentials: {
    url:
      process.env.DATABASE_URL ||
      "postgresql://placeholder:placeholder@localhost:5432/placeholder"
  }
}
