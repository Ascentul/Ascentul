import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  bio?: string;
  job_title?: string;
  company?: string;
  skills?: string | string[];
  current_position?: string;
  current_company?: string;
  education?: string;
  university_name?: string;
  major?: string;
  graduation_year?: string;
  experience_level?: string;
  industry?: string;
  work_history?: any[];
  education_history?: any[];
  achievements_history?: any[];
  projects?: any[];
}

interface AnalysisResult {
  score?: number;
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  suggestions?: string[];
  strengthHighlights?: Array<{
    title: string;
    description: string;
  }>;
}

import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { originalResumeText, analysisRecommendations, jobDescription, userProfile } =
      await req.json();

    if (!originalResumeText) {
      return NextResponse.json({ error: 'Missing original resume text' }, { status: 400 });
    }

    if (!jobDescription) {
      return NextResponse.json({ error: 'Missing job description' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          error: 'OpenAI API key not configured. Resume optimization requires AI service.',
        },
        { status: 500 },
      );
    }

    try {
      const client = new OpenAI({ apiKey });

      // Build context about the analysis recommendations
      let recommendationsContext = '';
      if (analysisRecommendations) {
        const analysis = analysisRecommendations as AnalysisResult;

        if (analysis.summary) {
          recommendationsContext += `\n\nFit Analysis Summary:\n${analysis.summary}\n`;
        }

        if (analysis.gaps && analysis.gaps.length > 0) {
          recommendationsContext += `\nIdentified Gaps to Address:\n`;
          analysis.gaps.forEach((gap, idx) => {
            recommendationsContext += `${idx + 1}. ${gap}\n`;
          });
        }

        if (analysis.suggestions && analysis.suggestions.length > 0) {
          recommendationsContext += `\nSpecific Recommendations to Apply:\n`;
          analysis.suggestions.forEach((suggestion, idx) => {
            recommendationsContext += `${idx + 1}. ${suggestion}\n`;
          });
        }

        if (analysis.strengths && analysis.strengths.length > 0) {
          recommendationsContext += `\nExisting Strengths to Emphasize:\n`;
          analysis.strengths.forEach((strength, idx) => {
            recommendationsContext += `${idx + 1}. ${strength}\n`;
          });
        }
      }

      // Build optional context from user profile for additional data
      let profileContext = '';
      if (userProfile) {
        profileContext = `\n\nAdditional User Profile Data (use ONLY if missing from original resume):\n`;
        if (userProfile.linkedin_url) profileContext += `LinkedIn: ${userProfile.linkedin_url}\n`;
        if (userProfile.github_url) profileContext += `GitHub: ${userProfile.github_url}\n`;
        if (userProfile.phone) profileContext += `Phone: ${userProfile.phone}\n`;
      }

      const prompt = `You are a professional resume optimization expert. Your task is to OPTIMIZE an EXISTING resume, NOT to create a new one.

CRITICAL CONSTRAINTS - YOU MUST FOLLOW THESE RULES:

1. SOURCE OF TRUTH: The original resume text below is the ABSOLUTE SOURCE OF TRUTH. All work history, education, dates, companies, job titles, and achievements MUST come from this original resume.

2. PRESERVE FACTUAL ACCURACY:
   - DO NOT invent or fabricate any new jobs, companies, roles, dates, or degrees
   - DO NOT add the target job title or company from the job description as if it were past experience
   - DO NOT change dates, company names, or job titles
   - DO NOT add achievements or responsibilities that aren't reflected in the original resume
   - DO NOT create new education credentials

3. WHAT YOU SHOULD DO:
   - REWRITE existing bullet points to be more impactful and ATS-friendly
   - REFRAME existing experience to better align with job description keywords
   - REORDER sections or bullet points for better emphasis
   - IMPROVE phrasing, structure, and formatting
   - QUANTIFY achievements where the original suggests impact (e.g., "led team" → "led team of 5")
   - EMPHASIZE relevant skills and experiences that match the job description
   - Apply the specific recommendations from the fit analysis

4. WHAT YOU MUST NOT DO:
   - DO NOT pull the job title from the job description and add it as work experience
   - DO NOT pull the company name from the job description and add it as a past employer
   - DO NOT fabricate employment dates, project dates, or graduation dates
   - DO NOT invent new responsibilities or achievements
   - DO NOT add information that doesn't exist in the original resume

---

ORIGINAL RESUME (SOURCE OF TRUTH):
${originalResumeText}

---

TARGET JOB DESCRIPTION:
${jobDescription}

---

FIT ANALYSIS & RECOMMENDATIONS:
${recommendationsContext}

---

${profileContext}

---

Your task: Optimize the ORIGINAL RESUME above by applying the recommendations to better match the job description.

Return a JSON object with this structure:
{
  "personalInfo": {
    "name": "string (from original resume)",
    "email": "string (from original resume)",
    "phone": "string (from original resume or profile, optional)",
    "location": "string (from original resume, optional)",
    "linkedin": "string (from original resume or profile, only if available)",
    "github": "string (from original resume or profile, only if available)"
  },
  "summary": "Optimized professional summary based on original resume content, aligned with job requirements (3-4 sentences)",
  "skills": ["skill1", "skill2", ...] (from original resume, reordered/emphasized for job match),
  "experience": [
    {
      "title": "Job Title (MUST be from original resume)",
      "company": "Company Name (MUST be from original resume)",
      "startDate": "MM/YYYY (MUST be from original resume)",
      "endDate": "MM/YYYY or Present (MUST be from original resume)",
      "summary": "Brief paragraph summarizing the role and overall responsibilities (2-3 sentences, NO bullet point, plain text only)",
      "keyContributions": [
        "Specific achievement or contribution with metrics and impact (PLAIN TEXT - no bullet symbols like •, -, or *)",
        "Another key contribution demonstrating skills relevant to target role (PLAIN TEXT - no bullet symbols)",
        "Additional accomplishment highlighting technical or leadership abilities (PLAIN TEXT - no bullet symbols)"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree Name (MUST be from original resume)",
      "school": "School Name (MUST be from original resume)",
      "graduationYear": "YYYY (MUST be from original resume)"
    }
  ],
  "projects": [
    {
      "title": "Project Title (from original resume)",
      "role": "Your Role (from original resume, optional)",
      "company": "Company (from original resume, optional)",
      "startDate": "MM/YYYY (from original resume, optional)",
      "endDate": "MM/YYYY or Present (from original resume, optional)",
      "description": "Optimized project description based on original content",
      "technologies": ["tech1", "tech2", ...] (from original resume),
      "url": "Project URL (from original resume, optional)",
      "github_url": "GitHub URL (from original resume, optional)"
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title (from original resume)",
      "organization": "Organization Name (from original resume, optional)",
      "date": "Date (from original resume, optional)",
      "description": "Achievement description (from original resume)"
    }
  ]
}

FINAL REMINDER:
- The optimized resume must be TRUTHFUL and based ONLY on the original resume content
- NEVER add the job description's job title or company as work experience
- NEVER invent new employment, education, or project history
- Focus on making the EXISTING content more compelling and better aligned
- Only include "projects" and "achievements" sections if they exist in the original resume

CRITICAL FORMATTING RULES:
- Experience "summary" field: Plain paragraph text with NO bullet symbols
- Experience "keyContributions" array: Each item must be PLAIN TEXT without any bullet symbols (•, -, *, etc.)
- The UI will add bullet points automatically when rendering - do NOT include them in the JSON
- Clean any existing bullet symbols from the text before outputting`;

      const response = await client.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional resume optimization expert. You optimize EXISTING resumes while preserving factual accuracy. You NEVER invent or fabricate information. Output only valid JSON.',
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5, // Lower temperature for more conservative, factual optimization
      });

      const content = response.choices[0]?.message?.content || '{}';
      const resumeData = JSON.parse(content);

      // Clean up empty social links from AI response
      if (resumeData.personalInfo) {
        if (!resumeData.personalInfo.linkedin) delete resumeData.personalInfo.linkedin;
        if (!resumeData.personalInfo.github) delete resumeData.personalInfo.github;
      }

      return NextResponse.json({
        success: true,
        resume: resumeData,
      });
    } catch (aiError: any) {
      console.error('AI optimization error:', aiError);
      return NextResponse.json(
        {
          error: 'Failed to optimize resume with AI service',
          details: aiError.message,
        },
        { status: 500 },
      );
    }
  } catch (err: any) {
    console.error('optimize error', err);
    return NextResponse.json({ error: 'Failed to optimize resume' }, { status: 500 });
  }
}
