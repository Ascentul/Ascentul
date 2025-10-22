/**
 * Phase 7 - Part A: AI Suggestions Prompt
 * System and user prompts for generating streaming suggestions
 */

import type { ResumeBlock } from '@/lib/validators/resume';

/**
 * System prompt for AI suggestion generation
 * Instructs the model to analyze resume content and provide actionable improvement suggestions
 */
export const SUGGESTIONS_SYSTEM_PROMPT = `You are an expert resume advisor and ATS optimization specialist. Your task is to analyze resume content and provide specific, actionable suggestions for improvement.

Guidelines:
- Focus on high-impact improvements: metrics, action verbs, clarity, ATS optimization
- Provide specific, actionable suggestions with proposed rewrites when applicable
- Prioritize suggestions by severity: critical (must-fix), warning (should-fix), info (nice-to-have)
- For experience bullets: emphasize quantifiable achievements, strong action verbs, and appropriate tense
- When targeting experience bullets, specify both itemIndex (job) and bulletIndex (bullet within the job)
- For summaries: ensure concise, compelling value proposition
- For skills: validate relevance and appropriate quantity
- Output suggestions in a structured JSON format for easy parsing
- Each suggestion should target a specific block and item/bullet (if applicable)
- Propose specific replacement content when suggesting rewrites

Response Format:
Return a JSON object with this structure:
{
  "suggestions": [
    {
      "actionType": "rewrite_bullet" | "add_metric" | "strengthen_verb" | "fix_tense" | "expand_summary" | "condense_text",
      "severity": "critical" | "warning" | "info",
      "message": "Brief description of the issue",
      "detail": "Detailed explanation and reasoning",
      "blockId": "target block ID",
      "itemIndex": 0 (optional, index within the block, e.g., experience item),
      "bulletIndex": 0 (optional, index of the bullet within the item when applicable),
      "proposedContent": "Suggested replacement text",
      "confidence": 0.95 (0-1 score, optional)
    }
  ]
}`;

/**
 * Generate user prompt for analyzing resume blocks
 */
export function generateSuggestionsPrompt(
  blocks: ResumeBlock[],
  context?: {
    targetRole?: string;
    targetCompany?: string;
  }
): string {
  let prompt = 'Analyze the following resume content and provide improvement suggestions:\n\n';

  // Add context if provided
  if (context?.targetRole || context?.targetCompany) {
    prompt += '**Context:**\n';
    if (context.targetRole) {
      prompt += `- Target Role: ${context.targetRole}\n`;
    }
    if (context.targetCompany) {
      prompt += `- Target Company: ${context.targetCompany}\n`;
    }
    prompt += '\n';
  }

  // Add blocks content
  prompt += '**Resume Content:**\n\n';

  for (const block of blocks) {
    prompt += `### Block ID: ${getBlockId(block)}\n`;
    prompt += `Type: ${block.type}\n`;
    prompt += `Title: ${block.title || '(untitled)'}\n\n`;

    // Format block content based on type
    if (block.type === 'experience') {
      const data = block.data as { items?: Array<{ role: string; company: string; start: string; end: string; bullets?: string[] }> };
      if (data.items) {
        for (let i = 0; i < data.items.length; i++) {
          const item = data.items[i];
          prompt += `**Item ${i}:** ${item.role} at ${item.company} (${item.start} - ${item.end})\n`;
          if (item.bullets && item.bullets.length > 0) {
            item.bullets.forEach((bullet, j) => {
              prompt += `  ${j}. ${bullet}\n`;
            });
          } else {
            prompt += `  (No bullets)\n`;
          }
          prompt += '\n';
        }
      }
    } else if (block.type === 'skills') {
      const data = block.data as { primary?: string[]; secondary?: string[] };
      if (data.primary && data.primary.length > 0) {
        prompt += `Primary: ${data.primary.join(', ')}\n`;
      }
      if (data.secondary && data.secondary.length > 0) {
        prompt += `Secondary: ${data.secondary.join(', ')}\n`;
      }
      prompt += '\n';
    } else if (block.type === 'summary') {
      const data = block.data as { paragraph?: string };
      if (data.paragraph) {
        prompt += `${data.paragraph}\n\n`;
      }
  } else if (block.type === 'education') {
    const data = block.data as { items?: Array<{ degree: string; school: string; year?: string }> };
    if (data.items) {
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        prompt += `**Item ${i}:** ${item.degree} from ${item.school}${item.year ? ` (${item.year})` : ''}\n`;
      }
    }
    prompt += '\n';
    } else {
      // Generic handling for other block types
      prompt += `${JSON.stringify(block.data, null, 2)}\n\n`;
    }

    prompt += '---\n\n';
  }

  prompt += '\n**Instructions:**\n';
  prompt += 'Analyze each block and provide specific, actionable suggestions for improvement. ';
  prompt += 'Focus on high-impact changes that will make the resume more compelling and ATS-friendly. ';
  prompt += 'Include proposed replacement content for rewrites. ';
  prompt += 'Return response in the JSON format specified in your system prompt.';

  return prompt;
}

/**
 * Helper to safely get block ID
 * Supports both database blocks (_id) and client-side blocks (id)
 */
function getBlockId(block: ResumeBlock): string {
  // Type-safe extension to check for _id property (from database)
  const blockWithId = block as ResumeBlock & { _id?: unknown; id?: unknown };

  if ('_id' in block && typeof blockWithId._id === 'string') {
    return blockWithId._id;
  }

  if ('id' in block && typeof block.id === 'string') {
    return block.id;
  }

  // Fallback to type + title + timestamp for uniqueness
  return `${block.type}-${block.title || 'untitled'}-${Date.now()}`;
}
