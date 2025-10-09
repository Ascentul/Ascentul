import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "convex/_generated/api";
import OpenAI from "openai";

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("Convex URL not configured");
  return new ConvexHttpClient(url);
}

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
  const match = letterBody.match(
    /(\n\n|^)((?:Sincerely|Best regards?|Regards|Thank you|Respectfully)[\s\S]*)$/i,
  );
  if (!match) {
    return {
      body: letterBody.trim(),
      closing: `Sincerely,\n${profileName || "Your Name"}`,
    };
  }

  const closing = match[2].trim();
  const body = letterBody.slice(0, match.index).trim();
  return { body, closing: closing || `Sincerely,\n${profileName || "Your Name"}` };
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

  const highlights = extractHighlights(jobDescription);
  const alignmentParagraph = (() => {
    if (highlights.length) {
      return `To make this draft actionable, I spell out how my recent wins address your focus on ${formatList(
        highlights,
      )}.`;
    }
    if (roleTitle || companyName) {
      return `I tailored this revision specifically to ${
        roleTitle ? `the ${roleTitle} role` : "the role"
      }${companyName ? ` at ${companyName}` : ""}, making sure every example connects back to the priorities in your description.`;
    }
    return "";
  })();

  const introParagraph = paragraphs.shift();
  const reorderedParagraphs = [
    alignmentParagraph || introParagraph || "",
    ...(alignmentParagraph && introParagraph
      ? [introParagraph, ...paragraphs]
      : paragraphs),
  ].filter(Boolean);

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
    const { userId } = getAuth(request);
    if (!userId)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const client = getClient();
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
      profile = await client.query(api.users.getUserByClerkId, {
        clerkId: userId,
      });
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
