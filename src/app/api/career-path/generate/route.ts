import { NextRequest, NextResponse } from 'next/server'
import { api } from 'convex/_generated/api'
import OpenAI from 'openai'
import { convexServer } from '@/lib/convex-server';
import { requireConvexToken } from '@/lib/convex-auth';

export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { userId, token } = await requireConvexToken()
    const body = await request.json()
    const { currentRole, targetRole, skills, experience, timeframe } = body

    if (!currentRole || !targetRole) {
      return NextResponse.json({ 
        error: 'Current role and target role are required' 
      }, { status: 400 })
    }

    // Generate career path using OpenAI
    const prompt = `Generate a detailed career development path for:

Current Role: ${currentRole}
Target Role: ${targetRole}
Current Skills: ${skills || 'Not specified'}
Experience Level: ${experience || 'Not specified'}
Timeframe: ${timeframe || '2-3 years'}

Create a step-by-step career path with:
1. Key milestones and timeline
2. Skills to develop
3. Certifications or education needed
4. Networking opportunities
5. Potential intermediate roles
6. Action items for the next 6 months

Format as a structured plan with clear steps and timelines.`

    let generatedPath: string | null = null
    let usedFallback = false
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a senior career strategist with 15+ years of experience helping professionals advance their careers. Provide detailed, actionable career development plans."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      })
      generatedPath = completion.choices[0]?.message?.content || null
    } catch (error) {
      console.error('OpenAI API call failed:', error)
      generatedPath = null
    }

    if (!generatedPath) {
      usedFallback = true
      const timeframeText = timeframe || '2-3 years'
      generatedPath = `Career Development Plan\n\nCurrent Role: ${currentRole}\nTarget Role: ${targetRole}\nTimeframe: ${timeframeText}\n\nMilestones:\n1) Assess gaps and build a learning plan (0-3 months).\n2) Execute 2-3 impact projects and document outcomes (3-9 months).\n3) Expand ownership and mentorship responsibilities (9-18 months).\n4) Target interim role aligned with ${targetRole} (12-24 months).\n\nSkills to Develop:\n- Core competencies for ${targetRole}.\n- Communication, stakeholder management, and systems thinking.\n\nCertifications & Education:\n- Select 1-2 targeted courses/certifications relevant to ${targetRole}.\n\nNetworking:\n- Join relevant communities, attend events quarterly, and set monthly outreach goals.\n\nNext 6 Months:\n- Month 1-2: Define gaps, enroll in learning, set project goals.\n- Month 3-4: Deliver first project; collect measurable results.\n- Month 5-6: Deliver second project; refine portfolio and resume.\n`
    }

    // Save the generated career path with graceful degradation (Convex)
    let careerPath: unknown = null
    let saveWarning: string | undefined
    try {
      careerPath = await convexServer.mutation(
        api.career_paths.createCareerPath,
        {
          clerkId: userId,
          target_role: String(targetRole),
          current_level: undefined,
          estimated_timeframe: timeframe ? String(timeframe) : undefined,
          steps: { planText: generatedPath, inputs: { currentRole, targetRole, skills, experience, timeframe } },
          status: 'active',
        },
        token,
      )
    } catch (error) {
      console.error('Failed to save career path to Convex:', error)
      saveWarning = 'Career path generated but could not be saved.'
    }

    return NextResponse.json({
      careerPath,
      generatedPath,
      usedFallback,
      warning: saveWarning,
    }, { status: careerPath ? 201 : 200 })
  } catch (error) {
    console.error('Error generating career path:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
