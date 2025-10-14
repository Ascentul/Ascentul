interface GeneratePromptParams {
  targetRole: string;
  targetCompany?: string;
  profile: {
    fullName: string;
    title?: string;
    contact?: { email?: string; phone?: string; location?: string; links?: Array<{ label: string; url: string }> };
    experience?: Array<{ company: string; role: string; start: string; end?: string; bullets?: string[] }>;
    education?: Array<{ school: string; degree: string; end?: string; details?: string[] }>;
    skills?: { primary: string[]; secondary?: string[] };
    projects?: Array<{ name: string; description?: string; bullets?: string[] }>;
  };
  allowedBlocks: string[];
}

export function buildGeneratePrompt({
  targetRole,
  targetCompany,
  profile,
  allowedBlocks,
}: GeneratePromptParams): string {
  const companyInfo = targetCompany ? ` at ${targetCompany}` : "";

  return `Generate a professional resume for the following candidate applying for the role of "${targetRole}"${companyInfo}.

TARGET ROLE: ${targetRole}${targetCompany ? `\nTARGET COMPANY: ${targetCompany}` : ""}

ALLOWED BLOCKS: ${allowedBlocks.join(", ")}
You must include these block types in your output. Use sequential order numbers starting from 1.

CANDIDATE PROFILE:
${JSON.stringify(profile, null, 2)}

CONTENT RULES:
1. Header block (order: 1):
   - Use candidate's full name, title, and contact information
   - Include only available contact details

2. Summary block (order: 2):
   - Write a compelling 2-3 sentence professional summary
   - Highlight relevant experience and skills for the target role
   - Tailor to ${targetRole}${companyInfo}

3. Experience block (order: 3):
   - Include all relevant work experience from the profile
   - Write 4-6 strong bullet points per role
   - Start each bullet with an action verb
   - Quantify achievements with metrics (%, $, time, scale)
   - Tailor bullets to emphasize skills relevant to ${targetRole}
   - Use past tense for previous roles, present tense for current roles

4. Education block (order: 4):
   - List all education from the profile
   - Keep concise - school name, degree, and graduation year
   - Include 0-2 relevant details (GPA, honors, relevant coursework) only if impressive

5. Skills block (order: 5):
   - Group skills into logical categories (e.g., "Technical Skills", "Tools & Technologies")
   - Prioritize skills most relevant to ${targetRole}
   - Keep skills list focused and scannable

6. Projects block (order: 6, if applicable):
   - Only include if projects are highly relevant to ${targetRole}
   - Write 2-3 bullet points per project highlighting impact
   - Keep to 2-3 most impressive projects maximum

OUTPUT FORMAT:
Return a JSON object with a "blocks" array. Each block must have:
- type: one of the allowed block types
- order: sequential integer starting from 1
- data: object matching the schema for that block type

DATA SHAPE REQUIREMENTS:
- Summary blocks must set data.paragraph to the summary text (string).
- Experience blocks must set data.items to an array of roles. Each role object must include company (string), role (string), start (string), optional end (string when the role finished), optional location (string), and bullets (array of accomplishment strings).
- Education blocks must set data.items to an array. Each entry must include school (string), degree (string), end (string year or date), optional location (string), and optional details (array of strings).
- Skills blocks must provide data.primary (array of core skills) and optionally data.secondary (array of additional skills).

Ensure the JSON is valid and matches the schema exactly. Do not include any explanatory text outside the JSON.`;
}

// Legacy export for backward compatibility
export interface ProfileSnapshot {
  fullName: string;
  title?: string;
  contact: {
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{ label: string; url: string }>;
  };
  experience: Array<{
    company: string;
    role: string;
    location?: string;
    start: string;
    end: string;
    bullets?: string[];
  }>;
  education: Array<{
    school: string;
    degree: string;
    location?: string;
    end: string;
    details?: string[];
  }>;
  skills: {
    primary: string[];
    secondary?: string[];
  };
  projects?: Array<{
    name: string;
    description?: string;
    bullets?: string[];
  }>;
}
