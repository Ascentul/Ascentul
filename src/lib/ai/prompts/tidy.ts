import { z } from 'zod';
import { aiResumeResponseSchema, type ResumeBlock } from './generate';

/**
 * System prompt for auto-tidying resume content
 */
export const AUTO_TIDY_SYSTEM_PROMPT = `You are an expert resume editor specializing in improving clarity, impact, and ATS optimization.

Your task is to improve existing resume content by:

## Improvement Guidelines:

### Content Quality:
1. **Strengthen action verbs**: Replace weak verbs with stronger alternatives (e.g., "helped" → "led", "worked on" → "developed")
2. **Quantify achievements**: Add or improve metrics (%, $, #, time saved, etc.)
3. **Improve clarity**: Make sentences more concise and impactful
4. **Remove redundancy**: Eliminate unnecessary words and repetition
5. **Fix grammar**: Correct any grammatical errors or awkward phrasing
6. **Enhance keywords**: Add relevant industry keywords for ATS optimization

### Formatting:
1. **Consistent tense**: Use present tense for current roles, past tense for previous
2. **Parallel structure**: Ensure bullets follow similar grammatical patterns
3. **Professional tone**: Maintain formal, professional language
4. **Appropriate length**: Keep bullets concise (1-2 lines max)

### What NOT to change:
1. **Don't invent facts**: Only improve existing content, don't add fabricated information
2. **Don't remove context**: Keep company names, dates, and core responsibilities
3. **Don't change meaning**: Preserve the original intent and truthfulness
4. **Don't over-optimize**: Keep content natural and readable

## Output Format:

Return the ENTIRE resume with ALL blocks, even if some blocks don't need changes. Maintain the exact structure and order of blocks.

Output ONLY valid JSON matching this schema - no markdown, no code blocks, no explanations.`;

/**
 * Generate tidy prompt from existing blocks
 */
export function generateTidyPrompt(blocks: ResumeBlock[]): string {
  const sections: string[] = [];

  sections.push('## Current Resume Content');
  sections.push('');
  sections.push('Please review and improve the following resume content:');
  sections.push('');

  blocks.forEach((block, index) => {
    sections.push(`### Block ${index + 1}: ${block.type.toUpperCase()}`);
    sections.push('');

    switch (block.type) {
      case 'header':
        sections.push(`Name: ${block.data.fullName}`);
        if (block.data.title) sections.push(`Title: ${block.data.title}`);
        if (block.data.contact.email) sections.push(`Email: ${block.data.contact.email}`);
        if (block.data.contact.phone) sections.push(`Phone: ${block.data.contact.phone}`);
        if (block.data.contact.location) sections.push(`Location: ${block.data.contact.location}`);
        if (block.data.contact.links?.length) {
          sections.push('Links:');
          block.data.contact.links.forEach((link: any) => {
            sections.push(`  - ${link.label}: ${link.url}`);
          });
        }
        break;

      case 'summary':
        sections.push('Summary:');
        sections.push(block.data.paragraph);
        break;

      case 'experience':
        sections.push('Positions:');
        block.data.items.forEach((item: any, i: number) => {
          sections.push(`\nPosition ${i + 1}:`);
          sections.push(`  Role: ${item.role}`);
          sections.push(`  Company: ${item.company}`);
          sections.push(`  Dates: ${item.start} - ${item.end}`);
          if (item.bullets?.length) {
            sections.push('  Achievements:');
            item.bullets.forEach((bullet: string) => {
              sections.push(`    • ${bullet}`);
            });
          }
        });
        break;

      case 'education':
        sections.push('Education:');
        block.data.items.forEach((item: any, i: number) => {
          sections.push(`\nEntry ${i + 1}:`);
          sections.push(`  Degree: ${item.degree}`);
          sections.push(`  School: ${item.school}`);
          sections.push(`  Graduation: ${item.end}`);
          if (item.details?.length) {
            sections.push('  Details:');
            item.details.forEach((detail: string) => {
              sections.push(`    • ${detail}`);
            });
          }
        });
        break;

      case 'skills':
        sections.push('Primary Skills:');
        sections.push(block.data.primary.join(', '));
        if (block.data.secondary?.length) {
          sections.push('\nSecondary Skills:');
          sections.push(block.data.secondary.join(', '));
        }
        break;

      case 'projects':
        sections.push('Projects:');
        block.data.items.forEach((item: any, i: number) => {
          sections.push(`\nProject ${i + 1}:`);
          sections.push(`  Name: ${item.name}`);
          sections.push(`  Description: ${item.description}`);
          if (item.bullets?.length) {
            sections.push('  Details:');
            item.bullets.forEach((bullet: string) => {
              sections.push(`    • ${bullet}`);
            });
          }
        });
        break;

      case 'custom':
        sections.push(`Heading: ${block.data.heading}`);
        sections.push('Content:');
        block.data.bullets.forEach((bullet: string) => {
          sections.push(`  • ${bullet}`);
        });
        break;
    }

    sections.push('');
  });

  sections.push('---');
  sections.push('');
  sections.push('## Instructions');
  sections.push('');
  sections.push('Improve this resume following the guidelines above. Focus on:');
  sections.push('1. Strengthening action verbs and impact');
  sections.push('2. Adding or improving quantifiable metrics');
  sections.push('3. Improving clarity and conciseness');
  sections.push('4. Fixing any grammar or style issues');
  sections.push('5. Enhancing ATS keywords naturally');
  sections.push('');
  sections.push('Return ALL blocks in the same order with improvements applied.');
  sections.push('Output ONLY the JSON object - no explanations, no markdown code blocks.');

  return sections.join('\n');
}

/**
 * Validate tidy response
 */
export const tidyResponseSchema = aiResumeResponseSchema;

export type TidyResponse = z.infer<typeof tidyResponseSchema>;
