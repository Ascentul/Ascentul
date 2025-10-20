#!/usr/bin/env node
/**
 * Validation script to ensure all template preview images exist.
 *
 * This script verifies that every preview image referenced in TEMPLATE_DEFINITIONS
 * exists in the public/previews directory. Run this before deployment to catch
 * missing assets early.
 *
 * Usage:
 *   node scripts/validate-preview-images.js
 *
 * Exit codes:
 *   0 - All preview images exist
 *   1 - One or more preview images are missing
 */

const fs = require('fs');
const path = require('path');

// Import template definitions from the actual source
// Note: Since src/lib/templates/index.ts is TypeScript/ESM, we parse it manually
// to avoid build/transpilation complexity in validation scripts
const templatesSourcePath = path.resolve(__dirname, '../src/lib/templates/index.ts');

/**
 * Extract template definitions using flexible field-based regex parsing.
 * This approach handles multi-line formatting, field reordering, and extra fields.
 *
 * IMPORTANT: This regex approach is more robust than single-line parsing, but still
 * has limitations. For production-grade parsing, consider using a TypeScript AST parser
 * like @typescript-eslint/typescript-estree.
 *
 * Current approach handles:
 * - Multi-line object formatting
 * - Fields in any order
 * - Additional fields between core fields
 * - Various whitespace/formatting styles
 * - Escaped quotes and apostrophes in field values (e.g., "Bob's Template", "Artist\"s Work")
 * - Other escape sequences (\n, \t, \\, etc.)
 *
 * Limitations:
 * - Won't handle computed property names
 * - Won't handle template literals in field values
 * - Won't handle comments within object definitions
 *
 * Regex explanation with backreferences:
 * (["'])                   - Capture group 1: Opening quote (single or double)
 * ((?:(?!\1)[^\\]|\\.)*)   - Capture group 2: Match content until closing quote
 *                            - (?!\1)[^\\]  - Any char except backslash, not followed by the opening quote
 *                            - \\.          - OR any escaped character
 * \1                       - Backreference to group 1: Closing quote MUST match opening quote
 *
 * This pattern correctly handles:
 * - "Bob's Template"       - Apostrophe inside double quotes (opening " matches closing ")
 * - 'Artist\'s Work'       - Escaped apostrophe (opening ' matches closing ')
 * - "Quote: \"Hello\""     - Escaped double quotes (opening " matches closing ")
 * - "Path\\file.png"       - Escaped backslash (opening " matches closing ")
 * - REJECTS: "Mixed'       - Mismatched quotes (opening " does NOT match closing ')
 *
 * Note: Group 2 contains the actual value (group 1 is the quote character)
 */
const idPattern = /id:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;
const slugPattern = /slug:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;
const namePattern = /name:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;
const previewPattern = /preview:\s*(["'])((?:(?!\1)[^\\]|\\.)*)\1/;

function extractTemplateDefinitions(source) {
  // Split source into object definitions using flexible pattern that handles multi-line
  // Matches opening brace to closing brace, allowing one level of nested braces.
  // Note: Will not correctly parse objects with deeper (2+ level) nested structures.
  const objectPattern = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/gs;
  const objects = source.match(objectPattern) || [];

  const templateDefinitions = [];

  for (const obj of objects) {
    const idMatch = idPattern.exec(obj);
    const slugMatch = slugPattern.exec(obj);
    const nameMatch = namePattern.exec(obj);
    const previewMatch = previewPattern.exec(obj);

    // Only include if all required fields are present
    if (idMatch && slugMatch && nameMatch && previewMatch) {
      templateDefinitions.push({
        id: idMatch[2],      // Group 2 contains the value (group 1 is the quote character)
        slug: slugMatch[2],
        name: nameMatch[2],
        preview: previewMatch[2],
      });
    }
  }

  return templateDefinitions;
}

function main() {
  let templatesSource;
  try {
    templatesSource = fs.readFileSync(templatesSourcePath, 'utf8');
  } catch (error) {
    console.error('❌ Failed to read template source file');
    console.error(`   Path: ${templatesSourcePath}`);
    console.error(`   Error: ${error.message}`);
    console.error('');
    console.error('   Possible causes:');
    console.error('   - File does not exist (check path)');
    console.error('   - Insufficient read permissions');
    console.error('   - File is locked by another process');
    process.exit(1);
  }

  const TEMPLATE_DEFINITIONS = extractTemplateDefinitions(templatesSource);

  if (TEMPLATE_DEFINITIONS.length === 0) {
    console.error('❌ Failed to extract template definitions from source file');
    console.error(`   Source: ${templatesSourcePath}`);
    console.error('   Possible causes:');
    console.error('   - Template definition format changed');
    console.error('   - File contains no template objects with required fields (id, slug, name, preview)');
    console.error('   - Nested objects or complex syntax not handled by regex parser');
    console.error('');
    console.error('   Consider upgrading to AST-based parsing:');
    console.error('   npm install --save-dev @typescript-eslint/typescript-estree');
    process.exit(1);
  }

  console.log(`📋 Found ${TEMPLATE_DEFINITIONS.length} template definition(s) in source\n`);

  const projectRoot = path.resolve(__dirname, '..');
  const previewsDir = path.join(projectRoot, 'public', 'previews');

  let hasErrors = false;
  const results = [];

  console.log('🔍 Validating template preview images...\n');

  for (const template of TEMPLATE_DEFINITIONS) {
    // Skip external URLs and empty previews
    if (!template.preview || /^(https?:)?\/\//.test(template.preview)) {
      results.push({ template, status: 'skipped', reason: 'external URL or empty' });
      continue;
    }

    const previewPath = path.join(previewsDir, template.preview);

    // Validate that the resolved path stays within previewsDir
    const normalizedPath = path.normalize(previewPath);
    const normalizedPreviewsDir = path.normalize(previewsDir);
    // Ensure the preview resolves to a file and not the directory itself
    if (path.basename(normalizedPath) === '' || normalizedPath === normalizedPreviewsDir) {
      results.push({
        template,
        status: 'error',
        reason: 'preview path resolves to directory instead of file',
        path: template.preview,
      });
      hasErrors = true;
      continue;
    }

    if (!normalizedPath.startsWith(normalizedPreviewsDir + path.sep)) {
      results.push({
        template,
        status: 'error',
        reason: 'path traversal attempt detected',
        path: template.preview,
      });
      hasErrors = true;
      continue;
    }

    const exists = fs.existsSync(previewPath);

    if (exists) {
      try {
        const stats = fs.statSync(previewPath);
        results.push({
          template,
          status: 'ok',
          path: previewPath,
          size: stats.size,
        });
      } catch (error) {
        results.push({
          template,
          status: 'error',
          reason: `cannot read file: ${error.message}`,
          path: previewPath,
        });
        hasErrors = true;
      }
    } else {
      results.push({
        template,
        status: 'missing',
        path: previewPath,
      });
      hasErrors = true;
    }
  }

  // Print results
  for (const result of results) {
    const templateName = `${result.template.name} (${result.template.slug})`;

    if (result.status === 'ok') {
      const sizeKB = (result.size / 1024).toFixed(2);
      console.log(`✓ ${templateName}`);
      console.log(`  ${result.template.preview} (${sizeKB} KB)`);
    } else if (result.status === 'missing') {
      console.error(`✗ ${templateName}`);
      console.error(`  Missing: ${result.template.preview}`);
      console.error(`  Expected path: ${result.path}`);
    } else if (result.status === 'skipped') {
      console.log(`⊘ ${templateName}`);
      console.log(`  Skipped: ${result.reason}`);
    } else if (result.status === 'error') {
      console.error(`✗ ${templateName}`);
      console.error(`  Error: ${result.reason}`);
      console.error(`  Path: ${result.path}`);
    }

    console.log('');
  }

  // Summary
  const okCount = results.filter(r => r.status === 'ok').length;
  const missingCount = results.filter(r => r.status === 'missing').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;
  const errorCount = results.filter(r => r.status === 'error').length;

  console.log('─'.repeat(60));
  console.log(`Summary: ${okCount} OK, ${missingCount} missing, ${skippedCount} skipped, ${errorCount} errors`);

  if (hasErrors) {
    console.error('\n❌ Validation failed: Some preview images are missing.');
    console.error('   Run `node scripts/generate-preview-pngs.js` to generate them.');
    process.exit(1);
  } else {
    console.log('\n✅ All preview images exist!');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  idPattern,
  slugPattern,
  namePattern,
  previewPattern,
  extractTemplateDefinitions,
  templatesSourcePath,
};
