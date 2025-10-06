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

const fallbackAnalysis = (
  profileName: string | undefined,
  roleTitle?: string,
  companyName?: string,
): AnalysisResult => ({
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
  optimizedLetter:
    roleTitle || companyName
      ? `Dear Hiring Manager,\n\nI am eager to contribute to ${companyName || "your organization"} in the ${roleTitle || "target"} position and will incorporate the most relevant evidence from my background in the next draft.\n\nSincerely,\n${profileName || "Your Name"}`
      : `Dear Hiring Manager,\n\nI am eager to contribute to your team and bring forward the experience outlined in my background. I will follow up with a tailored cover letter once I have reworked the examples to match your priorities.\n\nSincerely,\n${profileName || "Your Name"}`,
});

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
          model: "gpt-5",
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
      analysis = fallbackAnalysis(profileName, roleTitle, companyName);
      if (!optimize) {
        delete analysis.optimizedLetter;
      }
    } else if (!optimize) {
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
