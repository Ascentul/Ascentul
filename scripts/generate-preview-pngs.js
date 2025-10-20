#!/usr/bin/env node

/**
 * Generate PNG preview images for resume templates
 *
 * This script:
 * 1. Validates that templates-config.json matches src/lib/templates/index.ts
 * 2. Creates missing SVG files for templates defined in templates-config.json
 * 3. Converts SVG previews to PNG format (340x440px)
 * 4. Optimizes file sizes for web delivery
 *
 * Configuration:
 * - Template definitions are loaded from scripts/templates-config.json
 * - This prevents drift between the script and canonical source definitions
 * - If templates are added/removed, update templates-config.json accordingly
 *
 * Requirements:
 * - Node.js 18+
 * - sharp package for image conversion
 *
 * Usage:
 *   npm install sharp
 *   node scripts/generate-preview-pngs.js [--skip-existing]
 *
 * Options:
 *   --skip-existing  Skip PNG generation for templates that already have PNG files
 *                    Default behavior is to regenerate all PNGs to ensure they reflect
 *                    the latest generateSVG() function changes
 */

const fs = require('fs');
const path = require('path');

const previewsDir = path.join(__dirname, '../public/previews');
const templatesConfigPath = path.join(__dirname, 'templates-config.json');
const templateDefsPath = path.join(__dirname, '../src/lib/templates/index.ts');

// XML escaping utility
const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

// Parse command line arguments
const args = process.argv.slice(2);
const skipExisting = args.includes('--skip-existing');

// Show help text
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/generate-preview-pngs.js [options]');
  console.log('\nOptions:');
  console.log('  --skip-existing  Skip PNG generation for templates that already have PNG files');
  console.log('                   Default behavior is to regenerate all PNGs to ensure they');
  console.log('                   reflect the latest generateSVG() function changes');
  console.log('  --help, -h       Show this help message');
  console.log('\nExamples:');
  console.log('  node scripts/generate-preview-pngs.js');
  console.log('  node scripts/generate-preview-pngs.js --skip-existing');
  process.exit(0);
}

// Fail on unknown arguments to prevent silent failures from typos
const validArgs = ['--skip-existing'];
const unknownArgs = args.filter(arg => !validArgs.includes(arg));
if (unknownArgs.length > 0) {
  console.error(`❌ Error: Unknown arguments: ${unknownArgs.join(', ')}`);
  console.error('   Run with --help to see available options\n');
  process.exit(1);
}

// Load template definitions from shared JSON configuration
// This prevents drift between the script and the canonical template definitions
let requiredTemplates;
try {
  const configData = fs.readFileSync(templatesConfigPath, 'utf8');
  requiredTemplates = JSON.parse(configData);

  // Validate structure to provide helpful errors for malformed configuration
  if (!Array.isArray(requiredTemplates)) {
    throw new Error('Configuration must be an array of template objects');
  }

  // Filter out documentation entries (objects with _comment or _schema fields)
  requiredTemplates = requiredTemplates.filter(t => !t._comment && !t._schema);

  if (requiredTemplates.length === 0) {
    throw new Error('Configuration array is empty - at least one template is required');
  }
  if (requiredTemplates.some(t => !t || typeof t !== 'object' || !t.slug)) {
    throw new Error('Each template must be an object with at least a "slug" property');
  }
  if (requiredTemplates.some(t => !t.name || !t.description || !t.color)) {
    throw new Error('Each template must have "slug", "name", "description", and "color" properties');
  }
  if (requiredTemplates.some(t => !/^#[0-9A-Fa-f]{6}$/.test(t.color))) {
    throw new Error('Each template "color" must be a valid hex color (e.g., "#3B82F6")');
  }
} catch (error) {
  console.error(`❌ Error loading templates-config.json: ${error.message}`);
  if (error.code === 'ENOENT') {
    console.error('File not found. Please ensure scripts/templates-config.json exists.');
  } else if (error instanceof SyntaxError) {
    console.error('Invalid JSON syntax. Please check the file format.');
  } else {
    console.error('Please ensure the configuration matches the expected structure:');
    console.error('[{ "slug": "template-slug", "name": "Template Name", "description": "...", "color": "#RRGGBB" }]');
  }
  process.exit(1);
}

/**
 * Validate that script config matches source definitions
 * Warns if templates are missing or extra compared to src/lib/templates/index.ts
 */
function validateTemplateSync() {
  try {
    const templateSource = fs.readFileSync(templateDefsPath, 'utf8');
    const slugsInSource = new Set();

    // Extract template slugs from TEMPLATE_DEFINITIONS array
    // Note: Simple regex extraction. May need update if source format changes significantly
    // (e.g., multi-line slug definitions, computed property names).
    const matches = templateSource.matchAll(/slug:\s*["'`]([^"'`]+)["'`]/g);
    for (const match of matches) {
      slugsInSource.add(match[1]);
    }

    const slugsInConfig = new Set(requiredTemplates.map(t => t.slug));

    // Check for missing templates in config
    const missingInConfig = [...slugsInSource].filter(s => !slugsInConfig.has(s));
    const extraInConfig = [...slugsInConfig].filter(s => !slugsInSource.has(s));

    if (missingInConfig.length > 0 || extraInConfig.length > 0) {
      console.warn('\n⚠️  Warning: Template configuration drift detected!');
      if (missingInConfig.length > 0) {
        console.warn(`   Missing in scripts/templates-config.json: ${missingInConfig.join(', ')}`);
      }
      if (extraInConfig.length > 0) {
        console.warn(`   Extra in scripts/templates-config.json: ${extraInConfig.join(', ')}`);
      }
      console.warn('   Please update scripts/templates-config.json to match src/lib/templates/index.ts\n');
    }
  } catch (error) {
    console.warn(`⚠️  Could not validate template sync: ${error.message}`);
  }
}

/**
 * Generate SVG preview for a template
 */
function generateSVG(template) {
  if (
    !template ||
    typeof template !== 'object' ||
    !template.slug ||
    !template.name ||
    !template.description ||
    !template.color ||
    !/^#[0-9A-Fa-f]{6}$/.test(template.color)
  ) {
    throw new Error('Invalid template object: missing required properties or invalid color format');
  }

  const safeName = escapeXml(template.name);
  const safeDescription = escapeXml(template.description);
  const safeTitle = 'JANE ANDERSON';
  const safeSubtitle = 'Product Designer • San Francisco, CA';

  return `<svg width="340" height="440" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="340" height="440" fill="#F9FAFB"/>

  <!-- Border -->
  <rect x="0.5" y="0.5" width="339" height="439" fill="none" stroke="#E5E7EB" stroke-width="1"/>

  <!-- Title area -->
  <rect x="0" y="0" width="340" height="80" fill="${template.color}" opacity="0.05"/>
  <text x="170" y="35" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#111827" text-anchor="middle" font-weight="600">
    ${safeName}
  </text>
  <text x="170" y="55" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#6B7280" text-anchor="middle">
    ${safeDescription}
  </text>

  <!-- Resume mockup content -->
  <g transform="translate(30, 100)">
    <!-- Header section -->
    <rect x="0" y="0" width="280" height="50" fill="${template.color}" opacity="0.1" rx="4"/>
    <text x="10" y="22" font-size="12" fill="#111827" font-weight="600">${safeTitle}</text>
    <text x="10" y="38" font-size="9" fill="#6B7280">${safeSubtitle}</text>

    <!-- Section 1 -->
    <text x="0" y="75" font-size="10" fill="${template.color}" font-weight="600">EXPERIENCE</text>
    <line x1="0" y1="80" x2="280" y2="80" stroke="#E5E7EB" stroke-width="1"/>

    <rect x="0" y="90" width="200" height="6" fill="#D1D5DB" rx="2"/>
    <rect x="0" y="100" width="180" height="4" fill="#E5E7EB" rx="1"/>
    <rect x="0" y="108" width="240" height="4" fill="#E5E7EB" rx="1"/>
    <rect x="0" y="116" width="220" height="4" fill="#E5E7EB" rx="1"/>

    <rect x="0" y="130" width="200" height="6" fill="#D1D5DB" rx="2"/>
    <rect x="0" y="140" width="190" height="4" fill="#E5E7EB" rx="1"/>
    <rect x="0" y="148" width="230" height="4" fill="#E5E7EB" rx="1"/>

    <!-- Section 2 -->
    <text x="0" y="180" font-size="10" fill="${template.color}" font-weight="600">EDUCATION</text>
    <line x1="0" y1="185" x2="280" y2="185" stroke="#E5E7EB" stroke-width="1"/>

    <rect x="0" y="195" width="180" height="6" fill="#D1D5DB" rx="2"/>
    <rect x="0" y="205" width="160" height="4" fill="#E5E7EB" rx="1"/>

    <!-- Section 3 -->
    <text x="0" y="235" font-size="10" fill="${template.color}" font-weight="600">SKILLS</text>
    <line x1="0" y1="240" x2="280" y2="240" stroke="#E5E7EB" stroke-width="1"/>

    <g transform="translate(0, 250)">
      <rect x="0" y="0" width="60" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="65" y="0" width="75" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="145" y="0" width="55" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="0" y="23" width="70" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
      <rect x="75" y="23" width="65" height="18" fill="${template.color}" opacity="0.15" rx="9"/>
    </g>
  </g>

  <!-- Watermark -->
  <text x="170" y="425" font-family="system-ui, -apple-system, sans-serif" font-size="8" fill="#9CA3AF" text-anchor="middle" opacity="0.5">
    Template Preview
  </text>
</svg>`;
}

/**
 * Convert SVG to PNG using sharp
 */
async function convertSvgToPng(svgPath, pngPath) {
  try {
    const sharp = require('sharp');
    const svgBuffer = await fs.promises.readFile(svgPath);

    await sharp(svgBuffer)
      .resize(340, 440)
      .png({ compressionLevel: 9 })
      .toFile(pngPath);

    return true;
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Error: sharp package is not installed');
      console.error('Please run: npm install sharp\n');
      process.exit(1);
    }
    throw error;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🎨 Generating template preview images...\n');

  // Validate template sync
  validateTemplateSync();

  // Ensure directory exists
  if (!fs.existsSync(previewsDir)) {
    fs.mkdirSync(previewsDir, { recursive: true });
    console.log('✓ Created previews directory\n');
  }

  // Step 1: Create missing SVG files
  console.log('Step 1: Creating SVG files...');
  for (const template of requiredTemplates) {
    const svgFilename = `${template.slug}.svg`;
    const svgPath = path.join(previewsDir, svgFilename);

    if (fs.existsSync(svgPath)) {
      console.log(`  ⏭️  ${svgFilename} already exists`);
    } else {
      const svg = generateSVG(template);
      fs.writeFileSync(svgPath, svg, 'utf8');
      console.log(`  ✓ Created ${svgFilename}`);
    }
  }

  // Step 2: Convert SVG to PNG
  console.log('\nStep 2: Converting SVG to PNG...');
  if (skipExisting) {
    console.log('  (Using --skip-existing flag: skipping existing PNG files)');
  }
  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const template of requiredTemplates) {
    const svgPath = path.join(previewsDir, `${template.slug}.svg`);
    const pngFilename = `${template.slug}.png`;
    const pngPath = path.join(previewsDir, pngFilename);

    // Skip existing PNGs if --skip-existing flag is set
    // Default: Always regenerate to ensure sync with generateSVG() changes
    if (skipExisting && fs.existsSync(pngPath)) {
      console.log(`  ⏭️  ${pngFilename} already exists (skipped)`);
      skippedCount++;
      successCount++;
      continue;
    }

    try {
      await convertSvgToPng(svgPath, pngPath);
      const stats = fs.statSync(pngPath);
      const sizeKB = (stats.size / 1024).toFixed(1);
      console.log(`  ✓ Created ${pngFilename} (${sizeKB} KB)`);
      successCount++;
    } catch (error) {
      console.error(`  ✗ Failed to create ${pngFilename}: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  if (errorCount === 0) {
    const generatedCount = successCount - skippedCount;
    if (skippedCount > 0) {
      console.log(`✅ Success! Generated ${generatedCount} PNG preview images (${skippedCount} skipped)`);
    } else {
      console.log(`✅ Success! Generated ${successCount} PNG preview images`);
    }
    console.log('\nNext steps:');
    console.log('1. Review the generated images in public/previews/');
    console.log('2. Replace with actual template screenshots for production');
    console.log('3. Remove the TODO comment from src/lib/templates/index.ts');
    if (!skipExisting) {
      console.log('\nTip: Use --skip-existing flag to skip regeneration of existing PNGs for faster runs');
    }
  } else {
    console.log(`⚠️  Completed with errors: ${successCount} succeeded, ${errorCount} failed`);
    process.exit(1);
  }
}

// Run the script
main().catch((error) => {
  console.error('\n❌ Unexpected error:', error.message);
  process.exit(1);
});
