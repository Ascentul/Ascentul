#!/usr/bin/env node
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!CONVEX_URL) {
  console.error("❌ CONVEX_URL not set. Make sure Convex dev server is running.");
  process.exit(1);
}

const convex = new ConvexHttpClient(CONVEX_URL);

async function seed() {
  try {
    console.log("🔍 Checking current catalog...");
    const before = await convex.query(api.devSeed.hasCatalog, {});
    console.log(`   Templates: ${before.templates}, Themes: ${before.themes}`);

    if (before.templates === 0) {
      console.log("\n📝 Seeding templates...");
      const result = await convex.mutation(api.devSeed.seedTemplates, {});
      console.log(`   ✅ ${result.message} (${result.inserted} templates)`);
    } else {
      console.log("\n📝 Templates already exist, skipping");
    }

    if (before.themes === 0) {
      console.log("\n🎨 Seeding themes...");
      const result = await convex.mutation(api.devSeed.seedThemes, {});
      console.log(`   ✅ ${result.message} (${result.inserted} themes)`);
    } else {
      console.log("\n🎨 Themes already exist, skipping");
    }

    console.log("\n🔍 Final catalog:");
    const after = await convex.query(api.devSeed.hasCatalog, {});
    console.log(`   Templates: ${after.templates}, Themes: ${after.themes}`);
    console.log("\n✨ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
