#!/usr/bin/env node

/**
 * Quick script to manually update template thumbnailUrls in Convex
 * Run this via: CONVEX_DEPLOYMENT=<your-deployment> node scripts/update-template-urls.mjs
 */

import { ConvexHttpClient } from "convex/browser";

const deploymentUrl = process.env.NEXT_PUBLIC_CONVEX_URL || process.env.CONVEX_URL;

if (!deploymentUrl) {
  console.error('❌ Error: NEXT_PUBLIC_CONVEX_URL or CONVEX_URL environment variable is required');
  console.error('\nUsage:');
  console.error('  NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud node scripts/update-template-urls.mjs');
  process.exit(1);
}

console.log(`🔄 Connecting to Convex: ${deploymentUrl}\n`);

const client = new ConvexHttpClient(deploymentUrl);

async function updateTemplates() {
  try {
    // Query existing templates
    console.log('📋 Fetching existing templates...');
    const templates = await client.query('builder_templates:listTemplatesAll', {});

    if (!templates || !Array.isArray(templates)) {
      console.error('❌ Error: Failed to fetch templates or received invalid data');
      process.exit(1);
    }

    console.log(`Found ${templates.length} templates:\n`);

    templates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name}`);
      console.log(`   Current URL: ${template.thumbnailUrl || '(empty)'}`);

      if (template.thumbnailUrl && template.thumbnailUrl.endsWith('.png')) {
        const newUrl = template.thumbnailUrl.replace('.png', '.svg');
        console.log(`   New URL:     ${newUrl} ✨`);
      } else if (template.thumbnailUrl && template.thumbnailUrl.endsWith('.svg')) {
        console.log(`   Status:      Already using SVG ✅`);
      } else {
        console.log(`   Status:      No thumbnail`);
      }
      console.log('');
    });

    console.log('\n⚠️  NOTE: This script only reads data.');
    console.log('To update the database, you need to:');
    console.log('1. Run: npx convex dev (in another terminal)');
    console.log('2. Then run: npx convex run migrations/updateTemplatePreviews:updateTemplatePreviews');
    console.log('\nOR manually delete templates and let them re-seed with new URLs.');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateTemplates().catch((error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});
