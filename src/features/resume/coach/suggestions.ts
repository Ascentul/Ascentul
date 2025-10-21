/**
 * Phase 6: Actionable Coach Suggestions
 *
 * Extends the existing suggestions system with actionable recommendations
 * that can be previewed and applied with one click.
 */

import type { EditorSnapshot, BlockId } from '../editor/types/editorTypes';
import type { SectionAnalysis } from './analyzeDocument';
import { analyzeDocument } from './analyzeDocument';

export type SuggestionActionType =
  | 'tighten-summary'
  | 'quantify-results'
  | 'fix-passive-voice'
  | 'trim-boilerplate'
  | 'add-metrics'
  | 'strengthen-verb';

export interface CoachSuggestion {
  id: string;
  blockId: BlockId;
  title: string;
  reason: string;
  actionType: SuggestionActionType;
  targetPath: string; // JSON path to the property (e.g., "props.paragraph" or "props.items.0.bullets.1")
  severity: 'high' | 'medium' | 'low';
  preview: (currentValue: any) => TextDiff;
}

export interface TextDiff {
  before: string;
  after: string;
  changes: DiffChange[];
}

export interface DiffChange {
  type: 'add' | 'remove' | 'unchanged';
  text: string;
}

/**
 * Create a simple text diff for preview
 * Uses basic word-level diffing
 */
export function createTextDiff(before: string, after: string): TextDiff {
  const beforeWords = before.split(/(\s+)/);
  const afterWords = after.split(/(\s+)/);

  const changes: DiffChange[] = [];
  let i = 0;
  let j = 0;

  while (i < beforeWords.length || j < afterWords.length) {
    if (i >= beforeWords.length) {
      // Remaining words are additions
      changes.push({ type: 'add', text: afterWords[j] });
      j++;
    } else if (j >= afterWords.length) {
      // Remaining words are removals
      changes.push({ type: 'remove', text: beforeWords[i] });
      i++;
    } else if (beforeWords[i] === afterWords[j]) {
      // Words match
      changes.push({ type: 'unchanged', text: beforeWords[i] });
      i++;
      j++;
    } else {
      // Words differ - check if it's a replacement or add/remove
      const beforeRest = beforeWords.slice(i).join('');
      const afterRest = afterWords.slice(j).join('');

      if (beforeRest.includes(afterWords[j])) {
        // Word was removed
        changes.push({ type: 'remove', text: beforeWords[i] });
        i++;
      } else if (afterRest.includes(beforeWords[i])) {
        // Word was added
        changes.push({ type: 'add', text: afterWords[j] });
        j++;
      } else {
        // Word was changed
        changes.push({ type: 'remove', text: beforeWords[i] });
        changes.push({ type: 'add', text: afterWords[j] });
        i++;
        j++;
      }
    }
  }

  return { before, after, changes };
}

/**
 * Generate actionable suggestions from document analysis
 */
export function getSuggestions(snapshot: EditorSnapshot): CoachSuggestion[] {
  const analysis = analyzeDocument(snapshot);
  const suggestions: CoachSuggestion[] = [];

  for (const section of analysis.sections) {
    const block = snapshot.blocksById[section.blockId];
    if (!block) continue;

    // Summary-specific suggestions
    if (section.blockType === 'summary') {
      const paragraph = block.props.paragraph as string;
      if (paragraph && section.tokenCount > 100) {
        suggestions.push({
          id: `${section.blockId}-tighten`,
          blockId: section.blockId,
          title: 'Tighten summary',
          reason: `Summary is ${section.tokenCount} tokens. Aim for under 100 tokens for better impact.`,
          actionType: 'tighten-summary',
          targetPath: 'props.paragraph',
          severity: 'medium',
          preview: (currentValue: string) => {
            // Simple tightening: remove filler words
            const tightened = currentValue
              .replace(/\b(very|really|quite|just|actually)\s+/gi, '')
              .replace(/\s{2,}/g, ' ')
              .trim();
            return createTextDiff(currentValue, tightened);
          },
        });
      }

      if (section.passiveVoiceRatio > 0.2 && paragraph) {
        suggestions.push({
          id: `${section.blockId}-passive`,
          blockId: section.blockId,
          title: 'Fix passive voice in summary',
          reason: `${Math.round(section.passiveVoiceRatio * 100)}% passive voice detected. Use active voice for stronger impact.`,
          actionType: 'fix-passive-voice',
          targetPath: 'props.paragraph',
          severity: 'high',
          preview: (currentValue: string) => {
            // Simple passive voice fix: convert common patterns
            const fixed = currentValue
              .replace(/\bresponsible for\s+/gi, 'manage ')
              .replace(/\btasked with\s+/gi, 'lead ')
              .replace(/\binvolved in\s+/gi, 'contribute to ');
            // Capitalize first letter if needed
            const result = fixed.charAt(0).toUpperCase() + fixed.slice(1);
            return createTextDiff(currentValue, result);
          },
        });
      }
    }

    // Experience-specific suggestions
    if (section.blockType === 'experience') {
      const items = block.props.items as any[];
      if (!items || !Array.isArray(items)) continue;

      items.forEach((item, itemIndex) => {
        if (!item.bullets || !Array.isArray(item.bullets)) return;

        item.bullets.forEach((bullet: string, bulletIndex: number) => {
          // Check for missing metrics
          if (!/(%|\$|x|\d+k\+|\d+\s*(hours?|days?|weeks?))/.test(bullet)) {
            suggestions.push({
              id: `${section.blockId}-${itemIndex}-${bulletIndex}-metrics`,
              blockId: section.blockId,
              title: 'Add metrics to bullet',
              reason: 'Bullet lacks quantifiable metrics. Add numbers, percentages, or time saved.',
              actionType: 'add-metrics',
              targetPath: `props.items.${itemIndex}.bullets.${bulletIndex}`,
              severity: 'high',
              preview: (currentValue: string) => {
                // Add placeholder metrics
                const withMetrics = currentValue + ' (e.g., 25% increase, $50K saved, 100 hours/month)';
                return createTextDiff(currentValue, withMetrics);
              },
            });
          }

          // Check for weak verbs
          const firstWord = bullet.split(/\s+/)[0]?.toLowerCase();
          const weakVerbs = ['helped', 'worked', 'did', 'made', 'was', 'were'];
          if (firstWord && weakVerbs.includes(firstWord)) {
            suggestions.push({
              id: `${section.blockId}-${itemIndex}-${bulletIndex}-verb`,
              blockId: section.blockId,
              title: 'Strengthen action verb',
              reason: `"${firstWord}" is a weak verb. Use stronger action verbs like "Led", "Developed", "Optimized".`,
              actionType: 'strengthen-verb',
              targetPath: `props.items.${itemIndex}.bullets.${bulletIndex}`,
              severity: 'high',
              preview: (currentValue: string) => {
                // Replace weak verb with strong verb
                const verbMap: Record<string, string> = {
                  helped: 'Supported',
                  worked: 'Collaborated',
                  did: 'Executed',
                  made: 'Created',
                  was: 'Served as',
                  were: 'Functioned as',
                };
                const strongVerb = verbMap[firstWord] || 'Led';

                // Escape regex special characters to prevent ReDoS attacks
                const escapedWord = firstWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const improved = currentValue.replace(new RegExp(`^${escapedWord}`, 'i'), strongVerb);
                return createTextDiff(currentValue, improved);
              },
            });
          }

          // Check for boilerplate
          const boilerplate = [
            'responsible for',
            'duties included',
            'tasked with',
            'handled',
          ];
          const hasBoilerplate = boilerplate.some(phrase =>
            bullet.toLowerCase().includes(phrase)
          );
          if (hasBoilerplate) {
            suggestions.push({
              id: `${section.blockId}-${itemIndex}-${bulletIndex}-boilerplate`,
              blockId: section.blockId,
              title: 'Remove boilerplate phrase',
              reason: 'Bullet contains boilerplate phrase. Use direct, action-oriented language.',
              actionType: 'trim-boilerplate',
              targetPath: `props.items.${itemIndex}.bullets.${bulletIndex}`,
              severity: 'medium',
              preview: (currentValue: string) => {
                // Remove boilerplate
                const trimmed = currentValue
                  .replace(/\bresponsible for\s+/gi, '')
                  .replace(/\bduties included\s+/gi, '')
                  .replace(/\btasked with\s+/gi, '')
                  .replace(/\bhandled\s+/gi, 'Managed ')
                  .trim();
                // Capitalize first letter
                const fixed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                return createTextDiff(currentValue, fixed);
              },
            });
          }
        });
      });
    }
  }

  // Sort by severity (high first)
  suggestions.sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  return suggestions;
}

/**
 * Get value at JSON path
 * Example: getValueAtPath(obj, "props.items.0.bullets.1")
 */
export function getValueAtPath(obj: any, path: string): any {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

/**
 * Set value at JSON path (immutably)
 * Returns a new object with the value updated
 */
export function setValueAtPath(obj: any, path: string, value: any): any {
  const parts = path.split('.');
  if (parts.length === 0) return value;

  const clone = Array.isArray(obj) ? [...obj] : { ...obj };
  let current: any = clone;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextArray = /^\d+$/.test(nextPart);

    if (current[part] === undefined) {
      current[part] = isNextArray ? [] : {};
    } else if (Array.isArray(current[part])) {
      current[part] = [...current[part]];
    } else if (typeof current[part] === 'object' && current[part] !== null) {
      current[part] = { ...current[part] };
    } else {
      // Path tries to traverse through a primitive value (string, number, boolean)
      const currentPath = parts.slice(0, i + 1).join('.');
      throw new Error(
        `Cannot set path "${path}": "${currentPath}" is a ${typeof current[part]} (${JSON.stringify(current[part])}), not an object or array`
      );
    }

    current = current[part];
  }

  current[parts[parts.length - 1]] = value;
  return clone;
}
