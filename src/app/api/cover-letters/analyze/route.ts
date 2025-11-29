import { NextRequest, NextResponse } from "next/server";
import { api } from "convex/_generated/api";
import OpenAI from "openai";
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from "@/lib/convex-auth";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

type AnalysisResult = {
  summary: string;
  alignmentScore: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  optimizedLetter?: string;
};

const buildProfileSummary = (profile: any | null) => {
  if (!profile) return "No additional career profile data provided.";
  const lines: string[] = [];
  if (profile.current_position)
    lines.push(`Current position: ${profile.current_position}`);
  if (profile.current_company)
    lines.push(`Current company: ${profile.current_company}`);
  if (profile.experience_level)
    lines.push(`Experience level: ${profile.experience_level}`);
  if (profile.industry) lines.push(`Industry focus: ${profile.industry}`);
  if (profile.skills) lines.push(`Skills: ${profile.skills}`);
  if (profile.bio) lines.push(`Bio: ${profile.bio}`);
  if (profile.career_goals) lines.push(`Career goals: ${profile.career_goals}`);
  if (profile.education) lines.push(`Education: ${profile.education}`);
  return lines.length
    ? lines.join("\n")
    : "No additional career profile data provided.";
};

const normalizeText = (value?: string) =>
  (value || "").replace(/\r\n/g, "\n").replace(/\t/g, " ").trim();

const formatList = (items: string[]): string => {
  if (!items.length) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
};

const extractHighlights = (jobDescription?: string, max = 3): string[] => {
  const normalized = normalizeText(jobDescription);
  if (!normalized) return [];

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const bulletLines = lines
    .filter((line) => /^[-*•]/.test(line))
    .map((line) => line.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);

  const sourceLines =
    bulletLines.length > 0
      ? bulletLines
      : normalized
          .split(/(?<=[.!?])\s+/)
          .map((sentence) => sentence.trim())
          .filter((sentence) => sentence.length > 25);

  return sourceLines.slice(0, max).map((line) => {
    const words = line.split(/\s+/);
    return words.length <= 14
      ? line.replace(/\s+/g, " ")
      : `${words.slice(0, 14).join(" ")}...`;
  });
};

const extractGreeting = (letter: string, companyName?: string): {
  greeting: string;
  remainder: string;
} => {
  const match = letter.match(
    /^(Dear [^\n]+|Hello [^\n]+|Hi [^\n]+|To [^\n]+|Greetings[^\n]*)\n*/i,
  );
  if (!match) {
    const fallback =
      companyName && companyName.trim().length > 0
        ? `Dear ${companyName.trim()} Hiring Manager,`
        : "Dear Hiring Manager,";
    return { greeting: fallback, remainder: letter.trimStart() };
  }
  return {
    greeting: match[0].trim(),
    remainder: letter.slice(match[0].length).trimStart(),
  };
};

const extractClosing = (
  letterBody: string,
  profileName?: string,
): { body: string; closing: string } => {
  // Match closing signature at the end of the letter
  const match = letterBody.match(
    /\n\n((?:Sincerely|Best regards?|Regards|Thank you|Respectfully)[,\s]*(?:\n[^\n]*)*)\s*$/i,
  );

  if (!match) {
    // No closing found - only add one if we have a profile name and the letter doesn't already end with name/signature
    const endsWithSignature = /\n\n[A-Z][a-z]+(?: [A-Z][a-z]+)*\s*$/.test(letterBody);
    if (endsWithSignature) {
      // Letter already has a name at the end, don't add another closing
      return { body: letterBody.trim(), closing: '' };
    }
    return {
      body: letterBody.trim(),
      closing: profileName ? `Sincerely,\n${profileName}` : '',
    };
  }

  const closing = match[1].trim();
  const body = letterBody.slice(0, match.index).trim();

  // If the extracted closing already has the profile name or looks complete, use it as-is
  // Otherwise, only add name if we have profileName AND the closing doesn't already have a name
  const hasName = /\n[A-Z][a-z]+(?: [A-Z][a-z]+)*\s*$/.test(closing);
  const finalClosing = hasName || !profileName ? closing : `${closing}\n${profileName}`;

  return { body, closing: finalClosing };
};

const buildOptimizedFallbackLetter = ({
  coverLetter,
  jobDescription,
  profileName,
  roleTitle,
  companyName,
}: {
  coverLetter?: string;
  jobDescription?: string;
  profileName?: string;
  roleTitle?: string;
  companyName?: string;
}): string => {
  const normalizedLetter = normalizeText(coverLetter);
  const roleDescriptor = [
    roleTitle ? `the ${roleTitle} role` : null,
    companyName ? `at ${companyName}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  if (!normalizedLetter) {
    return [
      companyName
        ? `Dear ${companyName} Hiring Manager,`
        : "Dear Hiring Manager,",
      "",
      [
        "Thank you for considering my application.",
        roleDescriptor
          ? `I aligned this version to ${roleDescriptor}, highlighting impact and concrete wins.`
          : "I aligned this version to your stated requirements, highlighting impact and concrete wins.",
        "I showcase measurable achievements that mirror the responsibilities in the job description and explain how those experiences translate to your team.",
      ].join(" "),
      "",
      `Sincerely,\n${profileName || "Your Name"}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  const { greeting, remainder } = extractGreeting(
    normalizedLetter,
    companyName,
  );
  const { body, closing } = extractClosing(remainder, profileName);

  const paragraphs = body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  // Simply reorder paragraphs without adding meta-commentary
  const reorderedParagraphs = paragraphs.filter(Boolean);

  return [greeting, "", reorderedParagraphs.join("\n\n"), "", closing]
    .filter((section) => normalizeText(section).length > 0)
    .join("\n\n");
};

const fallbackAnalysis = (
  profileName: string | undefined,
  {
    roleTitle,
    companyName,
    coverLetter,
    jobDescription,
    optimize,
  }: {
    roleTitle?: string;
    companyName?: string;
    coverLetter?: string;
    jobDescription?: string;
    optimize?: boolean;
  },
): AnalysisResult => {
  const analysis: AnalysisResult = {
    summary:
      "We could not reach the analysis service, so here is a quick checklist based on the information you provided.",
    alignmentScore: 60,
    strengths: [
      "The letter is professional in tone and references the role explicitly.",
    ],
    gaps: [
      "Add concrete metrics or examples that match the job description requirements.",
      "Reference specific skills or achievements that align with the role.",
    ],
    recommendations: [
      "Emphasize quantifiable achievements that mirror the job description.",
      "Add a closing paragraph that reiterates how you will support the team.",
    ],
  };

  if (optimize) {
    analysis.optimizedLetter = buildOptimizedFallbackLetter({
      coverLetter,
      jobDescription,
      profileName,
      roleTitle,
      companyName,
    });
  }

  return analysis;
};

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await requireConvexToken();

    const { jobDescription, coverLetter, optimize, roleTitle, companyName } =
      (await request.json()) as {
        jobDescription?: string;
        coverLetter?: string;
        optimize?: boolean;
        roleTitle?: string;
        companyName?: string;
      };

    if (!jobDescription || !coverLetter) {
      return NextResponse.json(
        {
          error: "Job description and cover letter content are required",
        },
        { status: 400 },
      );
    }

    let profile: any | null = null;
    try {
      profile = await convexServer.query(
        api.users.getUserByClerkId,
        { clerkId: userId },
        token
      );
    } catch (error) {
      console.error("Failed to fetch career profile for analysis", error);
    }

    const profileSummary = buildProfileSummary(profile);
    const profileName = profile?.name as string | undefined;

    let analysis: AnalysisResult | null = null;

    if (openai) {
      const contextHeader = [
        companyName ? `Company: ${companyName}` : null,
        roleTitle ? `Target Role: ${roleTitle}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const prompt = `You are an honest career coach. Review the following cover letter against the job description and provide structured feedback.

${contextHeader ? `${contextHeader}\n\n` : ""}Job Description:
${jobDescription}

Candidate Cover Letter:
${coverLetter}

Career Profile (ground truth):
${profileSummary}

Instructions:
- Only use information present in the cover letter, job description, or career profile.
- Do not invent achievements or skills. If information is missing, call that out.
- Respond in JSON with keys: summary (string), alignmentScore (0-100 number), strengths (string array), gaps (string array), recommendations (string array).
${optimize ? "- Include optimizedLetter (string) that rewrites the cover letter truthfully using provided information." : ""}
`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content:
                "You are a meticulous career coach who only uses verified information to evaluate and improve cover letters.",
            },
            { role: "user", content: prompt },
          ],
          temperature: 0.2,
          max_tokens: 1200,
        });

        const raw = completion.choices[0]?.message?.content || "";
        try {
          const parsed = JSON.parse(raw);
          const sanitized: AnalysisResult = {
            summary: typeof parsed.summary === "string" ? parsed.summary : "",
            alignmentScore:
              typeof parsed.alignmentScore === "number"
                ? parsed.alignmentScore
                : Number.parseFloat(parsed.alignmentScore ?? "0") || 0,
            strengths: Array.isArray(parsed.strengths)
              ? parsed.strengths.map((item: unknown) => String(item))
              : [],
            gaps: Array.isArray(parsed.gaps)
              ? parsed.gaps.map((item: unknown) => String(item))
              : [],
            recommendations: Array.isArray(parsed.recommendations)
              ? parsed.recommendations.map((item: unknown) => String(item))
              : [],
          };

          if (optimize && typeof parsed.optimizedLetter === "string") {
            sanitized.optimizedLetter = parsed.optimizedLetter;
          }

          analysis = sanitized;
        } catch (parseError) {
          console.warn(
            "Failed to parse analysis JSON, returning structured fallback",
            parseError,
          );
        }
      } catch (error) {
        console.error("OpenAI analysis failed", error);
      }
    }

    if (!analysis) {
      analysis = fallbackAnalysis(profileName, {
        roleTitle,
        companyName,
        coverLetter,
        jobDescription,
        optimize,
      });
    }

    if (!optimize) {
      delete analysis.optimizedLetter;
    }

    return NextResponse.json({ analysis }, { status: 200 });
  } catch (error) {
    console.error("Error analyzing cover letter:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
