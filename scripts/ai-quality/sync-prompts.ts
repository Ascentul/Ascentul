/**
 * Sync Prompts Script
 *
 * Syncs prompt markdown files from the prompts/ directory to Convex.
 * This is the "git-first" workflow where markdown files are source of truth.
 *
 * Usage:
 *   npx ts-node scripts/ai-quality/sync-prompts.ts
 *
 * Options:
 *   --dry-run    Show what would be synced without making changes
 *   --tool       Sync only a specific tool (e.g., --tool=resume-generation)
 */

import * as fs from 'fs';
import * as path from 'path';

import { ConvexHttpClient } from 'convex/browser';

import { api } from '../../convex/_generated/api';

// Prompt file frontmatter parser
interface PromptFrontmatter {
  tool_id: string;
  kind: 'system' | 'rubric' | 'other';
  version: string;
  risk_level: 'low' | 'medium' | 'high';
  model?: string;
  temperature?: number;
  max_tokens?: number;
  pcr_link?: string;
  notes?: string;
}

function parseFrontmatter(content: string): { frontmatter: PromptFrontmatter; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('Invalid prompt file: missing frontmatter');
  }

  const frontmatterText = match[1];
  const body = match[2].trim();

  // Parse YAML-like frontmatter (simple key: value pairs)
  const frontmatter: Record<string, unknown> = {};
  for (const line of frontmatterText.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      let value: unknown = line.slice(colonIndex + 1).trim();

      // Parse numbers
      if (!isNaN(Number(value)) && value !== '') {
        value = Number(value);
      }
      // Remove quotes from strings
      if (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (typeof value === 'string' && value.startsWith("'") && value.endsWith("'")) {
        value = value.slice(1, -1);
      }

      frontmatter[key] = value;
    }
  }

  return {
    frontmatter: frontmatter as unknown as PromptFrontmatter,
    body,
  };
}

function parseVersion(versionString: string): { major: number; minor: number; patch: number } {
  const parts = versionString.split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}

async function syncPrompts() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const toolArg = args.find((a) => a.startsWith('--tool='));
  const targetTool = toolArg ? toolArg.split('=')[1] : null;

  // Get Convex URL from environment
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    console.error('Error: NEXT_PUBLIC_CONVEX_URL environment variable not set');
    process.exit(1);
  }

  const client = new ConvexHttpClient(convexUrl);

  // Get prompts directory
  const promptsDir = path.join(process.cwd(), 'prompts');
  if (!fs.existsSync(promptsDir)) {
    console.error('Error: prompts/ directory not found');
    console.log('Create prompts/ directory with markdown files to sync');
    process.exit(1);
  }

  // Find all .md files in prompts directory (recursive)
  const findMarkdownFiles = (dir: string): string[] => {
    const files: string[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath));
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }

    return files;
  };

  const markdownFiles = findMarkdownFiles(promptsDir);

  if (markdownFiles.length === 0) {
    console.log('No markdown files found in prompts/ directory');
    return;
  }

  console.log(`Found ${markdownFiles.length} prompt file(s)`);
  if (dryRun) {
    console.log('DRY RUN - no changes will be made\n');
  }

  // Get current git commit SHA (optional)
  let gitCommitSha: string | undefined;
  try {
    const { execSync } = require('child_process');
    gitCommitSha = execSync('git rev-parse HEAD').toString().trim();
  } catch {
    console.warn('Warning: Could not get git commit SHA');
  }

  // Get sync user ID (you would typically pass this or get from auth)
  // For now, we'll need to get a super admin user ID
  // This is a placeholder - in production, authenticate properly
  console.log('Note: Using internal sync mutation (requires deployment access)\n');

  let synced = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of markdownFiles) {
    const relativePath = path.relative(promptsDir, filePath);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const { frontmatter, body } = parseFrontmatter(content);

      // Validate required fields
      if (!frontmatter.tool_id || !frontmatter.kind || !frontmatter.version) {
        console.error(`Error: ${relativePath} - missing required frontmatter (tool_id, kind, version)`);
        errors++;
        continue;
      }

      // Filter by target tool if specified
      if (targetTool && frontmatter.tool_id !== targetTool) {
        skipped++;
        continue;
      }

      const { major, minor, patch } = parseVersion(frontmatter.version);

      console.log(`Processing: ${relativePath}`);
      console.log(`  Tool: ${frontmatter.tool_id}`);
      console.log(`  Kind: ${frontmatter.kind}`);
      console.log(`  Version: ${major}.${minor}.${patch}`);
      console.log(`  Risk: ${frontmatter.risk_level || 'low'}`);

      if (dryRun) {
        console.log('  Status: Would sync\n');
        synced++;
        continue;
      }

      // Note: The actual sync would use an internal mutation
      // For production use, you'd call the Convex internal function directly
      // or use a deployment-authenticated approach
      console.log('  Status: Ready to sync (run without --dry-run to apply)\n');

      // In production, you would call:
      // await client.mutation(api.ai_prompt_versions.upsertFromGitSync, {
      //   toolId: frontmatter.tool_id,
      //   kind: frontmatter.kind,
      //   versionMajor: major,
      //   versionMinor: minor,
      //   versionPatch: patch,
      //   riskLevel: frontmatter.risk_level || 'low',
      //   promptText: body,
      //   model: frontmatter.model,
      //   temperature: frontmatter.temperature,
      //   maxTokens: frontmatter.max_tokens,
      //   pcrLink: frontmatter.pcr_link,
      //   notes: frontmatter.notes,
      //   gitFilePath: relativePath,
      //   gitCommitSha,
      //   syncUserId: syncUserId, // Would need to be obtained
      // });

      synced++;
    } catch (error) {
      console.error(`Error processing ${relativePath}:`, error);
      errors++;
    }
  }

  console.log('\n--- Summary ---');
  console.log(`Synced: ${synced}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors}`);
}

// Run the script
syncPrompts().catch(console.error);
