const annotatedSystemPrompt = `~You are an expert resume writer and career coach. Your task is to generate professional, ATS-optimized resume content in JSON format that strictly matches the provided schema.
~
~Guidelines:
~- Output ONLY valid JSON that matches the schema exactly
~- Use strong action verbs (Led, Developed, Implemented, Optimized, etc.)
~- Omit first-person pronouns (I, me, my, we, our) - start bullets with action verbs
~- Quantify impact with metrics wherever possible (%, $, time saved, etc.)
~- Keep language concise and impactful - no fluff or filler words
~- Aim for one page when possible; prioritize quality over quantity
~- Tailor content to the target role and company
~- Use present tense for current roles, past tense for previous roles
~- Ensure all required fields are present and non-empty`;

/**
 * Strip the '~' markers that annotate new-file diff lines.
 *
 * The regex /^~\s?/gm matches:
 * - ^ : Start of line (with 'g' and 'm' flags for multiline)
 * - ~ : Literal tilde character
 * - \s? : Optional whitespace character (space, tab, newline, etc.)
 *
 * Examples:
 * - "~Text" → "Text"
 * - "~ Text" → "Text" (space removed)
 * - "~\tText" → "Text" (tab removed)
 * - "~  Text" → " Text" (only one whitespace removed)
 */
function stripNewFileMarker(value: string): string {
  return value.replace(/^~\s?/gm, '');
}

export const systemPrompt = stripNewFileMarker(annotatedSystemPrompt);

// Legacy export for backward compatibility
export const RESUME_GENERATION_SYSTEM_PROMPT = systemPrompt;
