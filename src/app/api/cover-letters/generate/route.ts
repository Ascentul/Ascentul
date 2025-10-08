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
    let projects: any[] = []
    let applications: any[] = []

    try {
      profile = await client.query(api.users.getUserByClerkId, { clerkId: userId })
    } catch (error) {
      console.error('Failed to load career profile for letter generation', error)
    }

    // Fetch user's projects to demonstrate accomplishments
    try {
      projects = await client.query(api.projects.getUserProjects, { clerkId: userId }) || []
    } catch (error) {
      console.error('Failed to load projects for letter generation', error)
    }

    // Fetch recent applications to understand career trajectory
    try {
      applications = await client.query(api.applications.getUserApplications, { clerkId: userId }) || []
      // Get the 5 most recent applications
      applications = applications.slice(0, 5)
    } catch (error) {
      console.error('Failed to load applications for letter generation', error)
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
      if (profile.university_name) profileSummary.push(`University: ${profile.university_name}`)
      if (profile.major) profileSummary.push(`Major: ${profile.major}`)
      if (profile.graduation_year) profileSummary.push(`Graduation year: ${profile.graduation_year}`)
    }

    // Add projects summary
    if (projects.length > 0) {
      profileSummary.push('\n--- Projects & Experience ---')
      projects.slice(0, 5).forEach((project: any, idx: number) => {
        const projLines: string[] = []
        projLines.push(`Project ${idx + 1}: ${project.title}`)
        if (project.role) projLines.push(`  Role: ${project.role}`)
        if (project.company) projLines.push(`  Company: ${project.company}`)
        if (project.description) projLines.push(`  Description: ${project.description}`)
        if (project.technologies?.length) projLines.push(`  Technologies: ${project.technologies.join(', ')}`)
        profileSummary.push(projLines.join('\n'))
      })
    }

    // Add recent applications context
    if (applications.length > 0) {
      profileSummary.push('\n--- Recent Job Applications (for context) ---')
      applications.forEach((app: any, idx: number) => {
        profileSummary.push(`${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`)
      })
    }

    const userProfileSummary = profileSummary.length
      ? profileSummary.join('\n')
      : 'No additional career profile data provided.'

    // Generate cover letter using OpenAI with graceful fallback
    const prompt = `You are creating a comprehensive, tailored cover letter for a job application.

Company: ${companyName}
Role: ${position}
Job Description:
${jobDescription}

Candidate's Career Profile (ground truth - use this data to personalize the letter):
${userProfileSummary}

Instructions:
- Produce a COMPREHENSIVE cover letter that includes: a greeting, strong opening paragraph, at least 3-4 detailed body paragraphs, and a compelling closing paragraph with signature.
- The cover letter should be thorough and detailed, aiming for 400-600 words in total.
- Analyze the job description carefully and identify at least 10-12 key requirements or desired qualifications from the posting.
- For each key requirement, explain how the candidate's background (from their profile, projects, or experience) demonstrates that qualification.
- Use specific examples from the candidate's projects, experience, and skills to demonstrate fit.
- Weave in the candidate's verified career profile details wherever relevant. Do not invent facts. If specific information is missing, focus on the strengths that ARE documented.
- Highlight technical skills, project experience, and relevant accomplishments with concrete details.
- Address why the candidate is specifically interested in this company and role (if career goals suggest alignment).
- Keep the tone professional, confident, enthusiastic, and specific to the role and company.
- Make the letter compelling and substantive - avoid generic statements.
- Return only the final cover letter text, ready for the user to send.

Structure your response as a complete, professional cover letter with:
1. Opening paragraph (introduce yourself and express interest)
2. Body paragraph 1 (discuss most relevant experience and how it aligns with the role)
3. Body paragraph 2 (highlight specific projects, skills, and accomplishments)
4. Body paragraph 3 (explain what makes you a great cultural and technical fit)
5. Closing paragraph (express enthusiasm and call to action)

Remember: Be specific, be thorough, and make every sentence count. Use concrete examples from the candidate's profile.`

    let generatedContent: string | null = null
    let usedFallback = false
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional career coach and expert cover letter writer with 15+ years of experience. You generate compelling, personalized, and comprehensive cover letters that highlight relevant skills, experience, and cultural fit. Your letters are detailed, substantive, and help candidates stand out from the competition."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
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

      // Build a more comprehensive fallback
      const paragraphs: string[] = []

      // Opening
      paragraphs.push('Dear Hiring Manager,')
      paragraphs.push('')

      const currentRole = profile?.current_position
        ? `As a ${profile.current_position}${profile.current_company ? ` at ${profile.current_company}` : ''}, I am`
        : 'I am'
      paragraphs.push(`${currentRole} excited to apply for the ${position} role at ${companyName}. Your job description aligns perfectly with my professional background, skills, and career aspirations.`)
      paragraphs.push('')

      // Experience paragraph
      if (profile?.current_position || profile?.experience_level) {
        const expLevel = profile?.experience_level || 'experienced professional'
        const industry = profile?.industry ? ` in the ${profile.industry} sector` : ''
        paragraphs.push(`With my background as a ${expLevel}${industry}, I bring valuable expertise that directly addresses the requirements outlined in your posting. ${profile?.bio || ''}`)
        paragraphs.push('')
      }

      // Skills paragraph
      if (profile?.skills) {
        paragraphs.push(`My technical and professional skills include ${profile.skills}. I am confident that this diverse skill set will enable me to make immediate contributions to ${companyName} and help drive the success of your team.`)
        paragraphs.push('')
      }

      // Projects paragraph
      if (projects.length > 0) {
        const topProject = projects[0]
        paragraphs.push(`In my recent work, I ${topProject.description || `led the ${topProject.title} project`}${topProject.company ? ` at ${topProject.company}` : ''}. This experience has prepared me to take on similar challenges and deliver meaningful results in the ${position} role.`)
        paragraphs.push('')
      }

      // Career goals paragraph
      if (profile?.career_goals) {
        paragraphs.push(`My career goals include ${profile.career_goals}, and I see this position at ${companyName} as an excellent opportunity to advance toward these objectives while contributing meaningfully to your organization.`)
        paragraphs.push('')
      }

      // Closing
      paragraphs.push(`I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to ${companyName}'s continued success. Thank you for considering my application, and I look forward to the possibility of speaking with you soon.`)
      paragraphs.push('')
      paragraphs.push('Sincerely,')
      paragraphs.push(profileName)

      generatedContent = paragraphs.join('\n')
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
