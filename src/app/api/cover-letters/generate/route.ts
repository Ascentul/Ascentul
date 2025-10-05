import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Convex URL not configured')
  return new ConvexHttpClient(url)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const client = getClient()

    const body = await request.json()
    const { jobDescription, companyName, position } = body as {
      jobDescription?: string
      companyName?: string
      position?: string
    }

    if (!jobDescription || !companyName || !position) {
      return NextResponse.json({
        error: 'Job description, company name, and position are required',
      }, { status: 400 })
    }

    // Fetch the user career profile so generation stays grounded in real data
    let profile: any | null = null
    try {
      profile = await client.query(api.users.getUserByClerkId, { clerkId: userId })
    } catch (error) {
      console.error('Failed to load career profile for letter generation', error)
    }

    const profileSummary: string[] = []
    if (profile) {
      if (profile.current_position) profileSummary.push(`Current position: ${profile.current_position}`)
      if (profile.current_company) profileSummary.push(`Current company: ${profile.current_company}`)
      if (profile.industry) profileSummary.push(`Industry: ${profile.industry}`)
      if (profile.experience_level) profileSummary.push(`Experience level: ${profile.experience_level}`)
      if (profile.location) profileSummary.push(`Location: ${profile.location}`)
      if (profile.skills) profileSummary.push(`Skills: ${profile.skills}`)
      if (profile.bio) profileSummary.push(`Bio: ${profile.bio}`)
      if (profile.career_goals) profileSummary.push(`Career goals: ${profile.career_goals}`)
      if (profile.education) profileSummary.push(`Education: ${profile.education}`)
    }

    const userProfileSummary = profileSummary.length
      ? profileSummary.join('\n')
      : 'No additional career profile data provided.'

    // Generate cover letter using OpenAI with graceful fallback
    const prompt = `You are creating a tailored cover letter.

Company: ${companyName}
Role: ${position}
Job Description:
${jobDescription}

Career Profile (ground truth):
${userProfileSummary}

Instructions:
- Produce a complete cover letter that includes: a greeting, opening paragraph, at least two body paragraphs, and a closing paragraph with signature.
- Weave in the candidate's verified career profile details wherever relevant. Do not invent facts. If specific information is missing, acknowledge that briefly rather than fabricating it.
- Keep the tone professional, confident, and specific to the role and company.
- Return only the final cover letter text, ready for the user to send.`

    let generatedContent: string | null = null
    let usedFallback = false
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a professional career coach and expert cover letter writer. Generate compelling, personalized cover letters that highlight relevant skills and experience."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      })
      generatedContent = completion.choices[0]?.message?.content || null
    } catch (e) {
      // swallow and use fallback
      generatedContent = null
    }

    if (!generatedContent) {
      usedFallback = true
      const profileName = profile?.name || 'Your Name'
      const currentRoleLine = profile?.current_position
        ? `I currently serve as ${profile.current_position}${profile.current_company ? ` at ${profile.current_company}` : ''}. `
        : ''
      const bodyLine = profile?.skills
        ? `I am confident that my background in ${profile.skills} will translate well to the priorities you outlined.`
        : 'I am confident that my experience will translate well to the priorities you outlined.'
      generatedContent = `Dear Hiring Manager,\n\n${currentRoleLine || ''}I am excited to apply for the ${position} role at ${companyName}. Your description resonates strongly with my background and the impact I strive to deliver.\n\n${bodyLine}\n\nI would welcome the opportunity to learn more about how I can support ${companyName}'s goals and continue growing in this capacity.\n\nThank you for your consideration, and I look forward to the possibility of speaking with you soon.\n\nSincerely,\n${profileName}`
    }

    // Save the generated cover letter to Convex, degrade gracefully if persistence fails
    let coverLetter: any = null
    let saveWarning: string | undefined
    try {
      coverLetter = await client.mutation(api.cover_letters.createCoverLetter, {
        clerkId: userId,
        name: `Cover Letter - ${companyName} ${position}`,
        job_title: String(position),
        company_name: companyName ? String(companyName) : undefined,
        template: 'standard',
        content: generatedContent,
        closing: 'Sincerely,',
        source: 'ai_generated',
      })
    } catch {
      saveWarning = 'Cover letter generated but could not be saved.'
    }

    return NextResponse.json({
      coverLetter,
      generatedContent,
      usedFallback,
      warning: saveWarning,
    }, { status: coverLetter ? 201 : 200 })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
