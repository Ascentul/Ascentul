import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '../../../../../convex/_generated/api'
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
    const { jobDescription, companyName, position, userProfile } = body

    if (!jobDescription || !companyName || !position) {
      return NextResponse.json({ 
        error: 'Job description, company name, and position are required' 
      }, { status: 400 })
    }

    // Generate cover letter using OpenAI with graceful fallback
    const prompt = `Generate a professional cover letter for the following:

Company: ${companyName}
Position: ${position}
Job Description: ${jobDescription}

User Profile: ${userProfile || 'Professional with relevant experience'}

Create a compelling, personalized cover letter that highlights relevant skills and experience for this specific role. Keep it professional, concise, and engaging.`

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
      const userLine = userProfile ? `As a ${userProfile}, ` : ''
      generatedContent = `Dear Hiring Manager,\n\n${userLine}I am excited to apply for the ${position} role at ${companyName}. My background and experience align well with your needs.\n\nIn reviewing the job description, I noted several key requirements where I can contribute immediately. I have demonstrated success collaborating across teams, communicating clearly, and delivering high-quality results.\n\nI would welcome the opportunity to discuss how my skills can support ${companyName}'s goals. Thank you for your time and consideration.\n\nSincerely,\nYour Name`
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