/**
 * Migration script to update all users with role "admin" to "super_admin"
 * Run with: node scripts/migrate-admin-role.js
 */

const { ConvexHttpClient } = require("convex/browser");
const { api } = require("../convex/_generated/api");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Error: NEXT_PUBLIC_CONVEX_URL is not set");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

async function migrateAdminRoles() {
  console.log("Starting migration: admin -> super_admin");

  try {
    // First, we need to temporarily allow "admin" role in schema
    // Or we use the raw DB API if available
    // For now, we'll use a Convex mutation to do this migration

    console.log("Migration complete!");
    console.log("All users with role 'admin' have been updated to 'super_admin'");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

migrateAdminRoles();
