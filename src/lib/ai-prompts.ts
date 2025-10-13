// System prompt for all AI resume generation tasks
export const RESUME_SYSTEM_PROMPT = `You are an expert resume writer and layout assistant. You will map a user Career Profile into a concise, achievement-focused resume with clear, quantified bullets.

Rules:
- Output strictly valid JSON that matches the provided JSON Schema.
- Use active verbs and quantify impact.
- Prefer 4 to 6 bullets per experience item.
- Avoid repetition. No fluff. No generic filler.
- Keep final length to one page unless asked otherwise.
- Do not include any text outside of the JSON.

JSON Schema:
{
  "type": "object",
  "properties": {
    "blocks": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": { "type": "string", "enum": ["header", "summary", "experience", "education", "skills", "projects", "custom"] },
          "data": { "type": "object" },
          "order": { "type": "number" }
        },
        "required": ["type", "data", "order"]
      }
    }
  },
  "required": ["blocks"]
}

Block Type Specifications:

header:
  data: { fullName: string, title: string, contact: { email?, phone?, location?, linkedin?, github?, website? } }

summary:
  data: { content: string }

experience:
  data: { items: [{ company: string, position: string, location?: string, startDate?: string, endDate?: string, current?: boolean, bullets: string[] }] }

education:
  data: { items: [{ institution: string, degree: string, field?: string, location?: string, startDate?: string, endDate?: string, gpa?: string, honors?: string[], coursework?: string[] }] }

skills:
  data: { primary: string[], secondary?: string[], categories?: Record<string, string[]> }

projects:
  data: { items: [{ name: string, description?: string, technologies?: string[], link?: string, github?: string, bullets?: string[], date?: string }] }

custom:
  data: { title: string, content?: string, items?: string[] }`;

// Template for initial resume generation
export function generateInitialResumePrompt(params: {
  targetRole: string;
  targetCompany?: string;
  careerProfile: any;
  allowedBlocks?: string[];
}): string {
  const { targetRole, targetCompany, careerProfile, allowedBlocks } = params;

  return `Target:
- Role: ${targetRole}
${targetCompany ? `- Company: ${targetCompany}` : ""}

Profile snapshot:
${JSON.stringify(careerProfile, null, 2)}

${allowedBlocks ? `Template limits:\n- Allowed blocks: ${allowedBlocks.join(", ")}` : ""}

Theme preferences:
- Keep language professional and concise.

Return JSON only, following the schema. Create:
- header with fullName, title (match targetRole), contact with links
- summary with 2 to 3 tight sentences tailored to targetRole
- experience with 2 to 3 most relevant roles, each with 4 to 6 quantified bullets
- skills grouped into primary and secondary mapped to targetRole
- education with the most relevant entry
- projects only if relevant to targetRole
- custom section only if it adds value

Set sequential integer "order" starting from 1.`;
}

// Template for job-specific tailoring
export function generateTailoringPrompt(params: {
  jobDescription: string;
  currentBlocks: any[];
}): string {
  const { jobDescription, currentBlocks } = params;

  return `Refine the resume for this job description. Keep JSON contract.

Job description:
${jobDescription}

Current blocks:
${JSON.stringify(currentBlocks, null, 2)}

Instructions:
- Keep length to one page.
- Rewrite bullets to mirror role scope and required skills without copying phrasing.
- Insert missing keywords naturally.
- Remove irrelevant bullets.

Return JSON only.`;
}

// Template for auto-tidy improvements
export function generateAutoTidyPrompt(params: {
  currentBlocks: any[];
}): string {
  const { currentBlocks } = params;

  return `Improve clarity and compactness while preserving meaning. Keep JSON contract.

Rules:
- Replace weak verbs with strong action verbs.
- Consolidate overlapping bullets.
- Ensure each bullet includes action, task, impact, and metric when possible.
- Trim filler.

Current blocks:
${JSON.stringify(currentBlocks, null, 2)}`;
}

// Template for validation error correction
export function generateCorrectionPrompt(params: {
  validationErrors: string;
  badJson: string;
}): string {
  const { validationErrors, badJson } = params;

  return `You produced JSON that failed validation. Fix the structure to match the schema. Do not change content unless necessary to pass validation.

Validation errors:
${validationErrors}

Your last JSON:
${badJson}`;
}

// Helper to extract JSON from AI response
export function extractJSONFromResponse(response: string): any {
  // Try to find JSON in code blocks
  const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (codeBlockMatch) {
    return JSON.parse(codeBlockMatch[1]);
  }

  // Try to find raw JSON
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]);
  }

  // If no JSON found, try parsing the entire response
  return JSON.parse(response);
}
