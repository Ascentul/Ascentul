/**
 * Migrate Existing Prompts Script
 *
 * Extracts inline prompts from existing AI route handlers and creates
 * markdown files in the prompts/ directory.
 *
 * This is a one-time migration script to bootstrap the prompt versioning system.
 *
 * Usage:
 *   npx ts-node scripts/ai-quality/migrate-existing-prompts.ts
 *
 * Options:
 *   --dry-run    Show what would be created without making changes
 */

import * as fs from 'fs';
import * as path from 'path';

// Tool configurations with their route file paths
const AI_TOOL_ROUTES: Record<string, { file: string; description: string }> = {
  'resume-generation': {
    file: 'src/app/api/resumes/generate/route.ts',
    description: 'Generate tailored resumes from user profile and job description',
  },
  'resume-analysis': {
    file: 'src/app/api/resumes/analyze/route.ts',
    description: 'Analyze resume quality and provide improvement suggestions',
  },
  'resume-optimization': {
    file: 'src/app/api/resumes/optimize/route.ts',
    description: 'Optimize resume content for specific job descriptions',
  },
  'resume-suggestions': {
    file: 'src/app/api/resumes/suggestions/route.ts',
    description: 'Generate quick suggestions for resume improvements',
  },
  'resume-parse': {
    file: 'src/app/api/resumes/parse/route.ts',
    description: 'Extract structured data from uploaded resumes',
  },
  'cover-letter-generation': {
    file: 'src/app/api/cover-letters/generate/route.ts',
    description: 'Generate personalized cover letters',
  },
  'cover-letter-analysis': {
    file: 'src/app/api/cover-letters/analyze/route.ts',
    description: 'Analyze cover letter quality and relevance',
  },
  'ai-coach-response': {
    file: 'src/app/api/ai-coach/generate-response/route.ts',
    description: 'Generate career coaching responses',
  },
  'ai-coach-message': {
    file: 'src/app/api/ai-coach/conversations/[id]/messages/route.ts',
    description: 'Generate conversational AI coach messages',
  },
  'career-path-generation': {
    file: 'src/app/api/career-path/generate/route.ts',
    description: 'Generate personalized career paths',
  },
  'career-path-from-job': {
    file: 'src/app/api/career-path/generate-from-job/route.ts',
    description: 'Generate career path based on target job',
  },
  'career-paths-generation': {
    file: 'src/app/api/career-paths/generate/route.ts',
    description: 'Generate multiple career path options',
  },
  'career-certifications': {
    file: 'src/app/api/career-certifications/route.ts',
    description: 'Recommend relevant certifications',
  },
  'ai-evaluator': {
    file: 'src/lib/ai-evaluation/evaluator.ts',
    description: 'Internal tool for evaluating AI outputs',
  },
};

// Regex patterns to extract prompts from code
const PROMPT_PATTERNS = [
  // Template literal with systemPrompt or system
  /(?:systemPrompt|system)\s*[:=]\s*`([^`]+)`/g,
  // String with systemPrompt
  /(?:systemPrompt|system)\s*[:=]\s*["']([^"']+)["']/g,
  // Multi-line const with prompt
  /const\s+(?:systemPrompt|SYSTEM_PROMPT)\s*=\s*`([^`]+)`/g,
  // messages array with system role
  /{\s*role:\s*["']system["'],?\s*content:\s*`([^`]+)`/g,
];

function extractPromptFromFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  for (const pattern of PROMPT_PATTERNS) {
    const matches = content.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].length > 50) {
        // Assume real prompts are > 50 chars
        return match[1].trim();
      }
    }
  }

  return null;
}

function generatePromptMarkdown(
  toolId: string,
  promptText: string,
  description: string,
): string {
  const frontmatter = `---
tool_id: ${toolId}
kind: system
version: 1.0.0
risk_level: medium
notes: Migrated from inline code - review and adjust as needed
---`;

  return `${frontmatter}

${promptText}
`;
}

async function migratePrompts() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('AI Prompt Migration Script');
  console.log('==========================\n');

  if (dryRun) {
    console.log('DRY RUN - no files will be created\n');
  }

  const promptsDir = path.join(process.cwd(), 'prompts');

  // Create prompts directory if it doesn't exist
  if (!dryRun && !fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true });
    console.log('Created prompts/ directory\n');
  }

  let migrated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const [toolId, config] of Object.entries(AI_TOOL_ROUTES)) {
    const filePath = path.join(process.cwd(), config.file);
    const outputDir = path.join(promptsDir, toolId);
    const outputFile = path.join(outputDir, 'system.md');

    console.log(`Processing: ${toolId}`);
    console.log(`  Source: ${config.file}`);

    // Check if output already exists
    if (fs.existsSync(outputFile)) {
      console.log('  Status: Already migrated (skipped)\n');
      skipped++;
      continue;
    }

    // Extract prompt from source file
    const prompt = extractPromptFromFile(filePath);

    if (!prompt) {
      console.log('  Status: No prompt found (manual extraction needed)\n');
      notFound++;

      // Create placeholder file
      if (!dryRun) {
        if (!fs.existsSync(outputDir)) {
          fs.mkdirSync(outputDir, { recursive: true });
        }

        const placeholder = `---
tool_id: ${toolId}
kind: system
version: 1.0.0
risk_level: medium
notes: TODO - Extract prompt from ${config.file}
---

# ${config.description}

TODO: Extract the system prompt from the source file and paste it here.

Source file: ${config.file}
`;
        fs.writeFileSync(outputFile, placeholder);
        console.log(`  Created placeholder: prompts/${toolId}/system.md\n`);
      }
      continue;
    }

    console.log(`  Found prompt: ${prompt.slice(0, 80).replace(/\n/g, ' ')}...`);

    if (dryRun) {
      console.log('  Status: Would create prompt file\n');
      migrated++;
      continue;
    }

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate and write markdown
    const markdown = generatePromptMarkdown(toolId, prompt, config.description);
    fs.writeFileSync(outputFile, markdown);

    console.log(`  Created: prompts/${toolId}/system.md\n`);
    migrated++;
  }

  console.log('--- Summary ---');
  console.log(`Migrated: ${migrated}`);
  console.log(`Skipped (already exists): ${skipped}`);
  console.log(`Not found (needs manual): ${notFound}`);
  console.log(`Total tools: ${Object.keys(AI_TOOL_ROUTES).length}`);

  console.log('\n--- Next Steps ---');
  console.log('1. Review generated files in prompts/ directory');
  console.log('2. Manually extract prompts for "not found" tools');
  console.log('3. Adjust risk_level and add pcr_link where needed');
  console.log('4. Run sync-prompts.ts to upload to Convex');
}

// Run the script
migratePrompts().catch(console.error);
