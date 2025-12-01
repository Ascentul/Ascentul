/**
 * Seed sample applications for testing the Applications Journey component
 * Run with: npx ts-node scripts/seed-sample-applications.ts
 * Or via Convex: npx convex run scripts/seed-sample-applications
 */

import { api } from "../convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("NEXT_PUBLIC_CONVEX_URL not set. Please check your .env.local file.");
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// Sample companies and job titles for realistic data
const sampleApplications = [
  // Saved roles (Prospect stage)
  { company: "Google", job_title: "Software Engineer", status: "saved" as const },
  { company: "Meta", job_title: "Frontend Developer", status: "saved" as const },
  { company: "Apple", job_title: "iOS Developer", status: "saved" as const },
  { company: "Netflix", job_title: "Senior Engineer", status: "saved" as const },
  
  // Applied
  { company: "Microsoft", job_title: "Full Stack Developer", status: "applied" as const },
  { company: "Amazon", job_title: "SDE II", status: "applied" as const },
  { company: "Stripe", job_title: "Backend Engineer", status: "applied" as const },
  { company: "Airbnb", job_title: "Software Engineer", status: "applied" as const },
  { company: "Uber", job_title: "Mobile Developer", status: "applied" as const },
  
  // Interview stage
  { company: "Spotify", job_title: "Data Engineer", status: "interview" as const },
  { company: "Twitter", job_title: "Backend Developer", status: "interview" as const },
  { company: "LinkedIn", job_title: "Software Engineer", status: "interview" as const },
  
  // Offer stage
  { company: "Salesforce", job_title: "Platform Engineer", status: "offer" as const },
];

async function seedApplications(clerkId: string) {
  console.log(`\n🚀 Seeding ${sampleApplications.length} sample applications for user: ${clerkId}\n`);
  
  for (const app of sampleApplications) {
    try {
      const id = await client.mutation(api.applications.createApplication, {
        clerkId,
        company: app.company,
        job_title: app.job_title,
        status: app.status,
        source: "Job Board",
        notes: `Sample application for ${app.company} - ${app.job_title}`,
      });
      console.log(`✅ Created: ${app.company} - ${app.job_title} (${app.status})`);
    } catch (error: any) {
      console.error(`❌ Failed to create ${app.company}: ${error.message}`);
    }
  }
  
  console.log("\n✨ Done seeding sample applications!");
  console.log("\nApplication funnel summary:");
  console.log("  📌 Saved: 4");
  console.log("  📤 Applied: 5");
  console.log("  💬 Interview: 3");
  console.log("  🏆 Offer: 1");
}

// Get clerkId from command line argument
const clerkId = process.argv[2];

if (!clerkId) {
  console.error("\n❌ Error: Please provide your Clerk ID as an argument");
  console.error("\nUsage: npx ts-node scripts/seed-sample-applications.ts <clerk_id>");
  console.error("\nYou can find your Clerk ID in the browser console or Clerk dashboard.");
  process.exit(1);
}

seedApplications(clerkId).catch(console.error);
