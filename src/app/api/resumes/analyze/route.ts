import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { evaluate } from '@/lib/ai-evaluation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'from',
  'that',
  'this',
  'into',
  'your',
  'have',
  'will',
  'must',
  'about',
  'their',
  'they',
  'them',
  'over',
  'such',
  'able',
  'each',
  'through',
  'within',
  'across',
  'while',
  'where',
  'when',
  'who',
  'what',
  'which',
  'been',
  'being',
  'were',
  'was',
  'are',
  'can',
  'not',
  'but',
  'you',
  'our',
  'your',
  'their',
  "it's",
  'its',
  'also',
  'able',
  'make',
  'made',
  'does',
  'done',
  'than',
  'then',
  'ever',
  'very',
  'some',
  'more',
  'most',
  'just',
  'like',
  'into',
  'were',
  'had',
  'has',
  'per',
  'via',
  'etc',
  'company',
  'companies',
  'job',
  'jobs',
  'role',
  'roles',
  'responsibility',
  'responsibilities',
  'position',
  'positions',
  'team',
  'teams',
  'among',
  'across',
]);

const highlightChecks: Array<{ keywords: string[]; message: string }> = [
  {
    keywords: ['lead', 'led', 'manage', 'managed', 'mentor', 'mentored', 'supervise'],
    message: 'Demonstrates leadership and team management experience.',
  },
  {
    keywords: [
      'implement',
      'implemented',
      'launch',
      'launched',
      'build',
      'built',
      'developed',
      'deliver',
      'delivered',
    ],
    message: 'Highlights hands-on experience delivering products or projects.',
  },
  {
    keywords: ['aws', 'azure', 'gcp', 'cloud', 'kubernetes', 'docker'],
    message: 'Includes modern cloud or infrastructure technology exposure.',
  },
  {
    keywords: ['python', 'javascript', 'typescript', 'java', 'react', 'node', 'sql', 'api'],
    message: 'Covers a broad technical skill set relevant to the role.',
  },
  {
    keywords: ['stakeholder', 'cross-functional', 'collaborate', 'communication', 'partner'],
    message: 'Mentioned collaboration with cross-functional stakeholders.',
  },
  {
    keywords: ['increase', 'decrease', 'reduced', 'grew', '%', 'roi', 'kpi', 'metric'],
    message: 'Uses metrics or KPIs to quantify impact.',
  },
  {
    keywords: ['customer', 'client', 'user', 'experience'],
    message: 'Emphasizes customer or user-focused outcomes.',
  },
  {
    keywords: ['bachelor', 'master', 'phd', 'certified', 'certification', 'degree'],
    message: 'References education credentials or certifications.',
  },
];

const formatLabel = (value: string) =>
  value
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const sanitizeTokens = (tokens: string[]) => {
  const seen = new Set<string>();
  const results: string[] = [];

  for (const raw of tokens) {
    if (!raw) continue;
    const lower = raw.toLowerCase();
    if (lower.length <= 3 || STOP_WORDS.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    results.push(formatLabel(lower));
  }

  return results;
};

const extractPhrases = (text: string, n = 2) => {
  const words = text.toLowerCase().match(/[a-zA-Z][a-zA-Z0-9+.#-]{2,}/g) || [];
  const phrases: string[] = [];
  for (let i = 0; i < words.length - n + 1; i++) {
    const slice = words.slice(i, i + n);
    if (slice.every((w) => w.length > 3 && !STOP_WORDS.has(w))) {
      phrases.push(slice.join(' '));
    }
  }
  return phrases;
};

const deriveHighlights = (resumeText: string) => {
  const lower = resumeText.toLowerCase();
  const highlights: string[] = [];

  for (const check of highlightChecks) {
    if (check.keywords.some((k) => lower.includes(k))) {
      highlights.push(check.message);
    }
  }

  if (highlights.length === 0) {
    highlights.push('Shows relevant experience aligned with the target role.');
  }

  return Array.from(new Set(highlights)).slice(0, 6);
};

function simpleAnalyze(resumeText: string, jobDescription: string) {
  const res = resumeText.toLowerCase();
  const jd = jobDescription.toLowerCase();

  const tokenize = (s: string) => sanitizeTokens(s.match(/[a-zA-Z][a-zA-Z0-9+.#-]{2,}/g) || []);

  const resumeTokens = tokenize(res);
  const jobTokens = tokenize(jd);

  const resumeTokenSet = new Set(resumeTokens);
  const jobTokenSet = new Set(jobTokens);

  const overlapKeywords = jobTokens.filter((t) => resumeTokenSet.has(t));
  const missingKeywords = jobTokens.filter((t) => !resumeTokenSet.has(t)).slice(0, 25);

  // Use phrases for richer strengths
  const jdPhrases = sanitizeTokens(extractPhrases(jd, 2).concat(extractPhrases(jd, 3)));
  const resumePhrases = new Set(
    sanitizeTokens(extractPhrases(res, 2).concat(extractPhrases(res, 3))),
  );
  const phraseOverlap = jdPhrases.filter((p) => resumePhrases.has(p)).slice(0, 10);

  const score = Math.round((overlapKeywords.length / Math.max(1, jobTokenSet.size)) * 100);

  const strengths = Array.from(new Set([...phraseOverlap, ...overlapKeywords])).slice(0, 12);
  const gaps = Array.from(new Set(missingKeywords)).slice(0, 12);

  // Generate more human-like suggestions based on missing keywords
  const suggestions = [];
  const lowerGapEntries = gaps.map((g) => g.toLowerCase());

  // Technical skills suggestions
  const techTerms = gaps.filter((g, idx) => {
    const lower = lowerGapEntries[idx];
    return (
      lower.includes('js') ||
      lower.includes('python') ||
      lower.includes('java') ||
      lower.includes('aws') ||
      lower.includes('sql') ||
      lower.includes('react') ||
      lower.includes('node') ||
      lower.includes('api')
    );
  });
  if (techTerms.length > 0) {
    suggestions.push(
      `Highlight your experience with ${techTerms.slice(0, 3).join(', ')} in your skills section or project descriptions.`,
    );
  }

  // Leadership/soft skills suggestions
  const leadershipTerms = gaps.filter((g, idx) => {
    const lower = lowerGapEntries[idx];
    return (
      lower.includes('lead') ||
      lower.includes('manage') ||
      lower.includes('team') ||
      lower.includes('mentor') ||
      lower.includes('collaborate')
    );
  });
  if (leadershipTerms.length > 0) {
    suggestions.push(
      `Add examples showing your leadership or teamwork experience to demonstrate collaborative skills.`,
    );
  }

  // Industry/domain suggestions
  const domainTerms = gaps.filter((g, idx) => {
    const lower = lowerGapEntries[idx];
    return (
      lower.includes('healthcare') ||
      lower.includes('finance') ||
      lower.includes('education') ||
      lower.includes('retail') ||
      lower.includes('saas') ||
      lower.includes('cloud')
    );
  });
  if (domainTerms.length > 0) {
    suggestions.push(
      `If you have ${domainTerms[0]} experience, emphasize it prominently to show domain knowledge.`,
    );
  }

  // Certifications/education suggestions
  const certTerms = gaps.filter((g, idx) => {
    const lower = lowerGapEntries[idx];
    return (
      lower.includes('certified') ||
      lower.includes('certification') ||
      lower.includes('degree') ||
      lower.includes('bachelor') ||
      lower.includes('master')
    );
  });
  if (certTerms.length > 0) {
    suggestions.push(
      `Include any relevant certifications or educational credentials in a dedicated section.`,
    );
  }

  // General suggestions for remaining gaps
  const remainingGaps = gaps
    .filter(
      (g) =>
        !techTerms.includes(g) &&
        !leadershipTerms.includes(g) &&
        !domainTerms.includes(g) &&
        !certTerms.includes(g),
    )
    .slice(0, 3);

  if (remainingGaps.length > 0) {
    suggestions.push(
      `Consider weaving in keywords like "${remainingGaps.join('", "')}" where they naturally fit your experience.`,
    );
  }

  // Always add quantification suggestion
  if (score < 70) {
    suggestions.push(
      `Use specific metrics and numbers to quantify your achievements (e.g., "increased sales by 25%", "managed team of 5").`,
    );
  }

  return {
    score,
    summary: `Estimated JD match: ${score}%. Found ${overlapKeywords.length} relevant keywords in common out of ${jobTokenSet.size}.`,
    strengths,
    gaps,
    suggestions: suggestions.slice(0, 6), // Limit to 6 suggestions
    strengthHighlights: deriveHighlights(resumeText),
  };
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json();

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey });
        const prompt = `You are an experienced career coach and resume expert. Analyze this resume against the job description and provide helpful, specific feedback.

Resume:
${resumeText}

Job Description:
${jobDescription}

Provide analysis in JSON format with:
- score: A number 0-100 indicating how well the resume matches the job
- summary: A brief 1-2 sentence overview of the match quality
- strengths: An array of 5-10 specific keywords/skills from the job description that are well-represented in the resume
- gaps: An array of 5-10 important keywords/skills from the job description that are missing or underrepresented
- suggestions: An array of 4-6 actionable, specific recommendations written in a friendly, conversational tone. Each suggestion should:
  * Be personalized and specific to this resume/job combo
  * Provide concrete examples or guidance
  * Sound like advice from a helpful colleague, not a robot
  * Focus on high-impact changes
  * Avoid generic phrases like "Consider adding evidence for X"

Example good suggestions:
- "Your project experience is strong, but try adding metrics like 'reduced load time by 40%' to make the impact more concrete."
- "The job emphasizes cross-functional collaboration - highlight any instances where you worked with marketing, sales, or design teams."
- "Since this role requires AWS experience, expand on your cloud infrastructure work in the Skills and Experience sections."

Keep suggestions practical, encouraging, and human.`;

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful career coach providing personalized resume feedback. Return only valid JSON without markdown formatting.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        });

        const content = response.choices[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);

        const cleanedStrengths = Array.isArray(parsed.strengths)
          ? sanitizeTokens(parsed.strengths as string[])
          : [];
        const cleanedGaps = Array.isArray(parsed.gaps)
          ? sanitizeTokens(parsed.gaps as string[])
          : [];

        const analysisResult = {
          ...parsed,
          strengths: cleanedStrengths.slice(0, 12),
          gaps: cleanedGaps.slice(0, 12),
          strengthHighlights:
            Array.isArray(parsed.strengthHighlights) && parsed.strengthHighlights.length > 0
              ? parsed.strengthHighlights.slice(0, 6)
              : deriveHighlights(resumeText),
        };

        // Evaluate AI-generated analysis (non-blocking for now)
        try {
          const evalResult = await evaluate({
            tool_id: 'resume-analysis',
            input: { resumeText, jobDescription },
            output: analysisResult,
          });

          if (!evalResult.passed) {
            console.warn('[AI Evaluation] Resume analysis failed evaluation:', {
              score: evalResult.overall_score,
              risk_flags: evalResult.risk_flags,
              explanation: evalResult.explanation,
            });
          }
        } catch (evalError) {
          // Don't block on evaluation failures
          console.error('[AI Evaluation] Error evaluating resume analysis:', evalError);
        }

        return NextResponse.json(analysisResult);
      } catch (e) {
        // Fallback to heuristic if OpenAI fails
        const result = simpleAnalyze(resumeText, jobDescription);
        return NextResponse.json(result);
      }
    }

    // No OpenAI key: heuristic analysis
    const result = simpleAnalyze(resumeText, jobDescription);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('analyze error', err);
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 });
  }
}
