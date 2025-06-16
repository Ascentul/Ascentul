#!/usr/bin/env node

/**
 * Environment Variable Checker for Vercel Deployment
 * Run this to see what environment variables are available
 */

console.log("🔍 Environment Variables Check")
console.log("================================")

const requiredVars = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "VITE_SUPABASE_URL",
  "VITE_SUPABASE_ANON_KEY"
]

const optionalVars = ["NODE_ENV", "VERCEL", "VERCEL_ENV", "VERCEL_URL"]

console.log("✅ Required Variables:")
requiredVars.forEach((varName) => {
  const value = process.env[varName]
  const status = value ? "✅ SET" : "❌ MISSING"
  const preview = value ? `(${value.substring(0, 20)}...)` : ""
  console.log(`   ${varName}: ${status} ${preview}`)
})

console.log("\n📋 Optional/Info Variables:")
optionalVars.forEach((varName) => {
  const value = process.env[varName]
  const status = value ? "✅ SET" : "⚪ NOT SET"
  console.log(`   ${varName}: ${status} ${value || ""}`)
})

console.log("\n🔧 Environment Summary:")
console.log(`   Platform: ${process.env.VERCEL ? "Vercel" : "Local"}`)
console.log(`   Environment: ${process.env.NODE_ENV || "unknown"}`)

const missing = requiredVars.filter((varName) => !process.env[varName])
if (missing.length > 0) {
  console.log(`\n❌ Missing required variables: ${missing.join(", ")}`)
  console.log("\n📖 To fix this in Vercel:")
  console.log("   1. Go to your Vercel dashboard")
  console.log("   2. Select your project")
  console.log("   3. Go to Settings → Environment Variables")
  console.log("   4. Add each missing variable")
  console.log("   5. Redeploy your application")
} else {
  console.log("\n✅ All required environment variables are set!")
}
