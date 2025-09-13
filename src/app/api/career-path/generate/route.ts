import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase, userId } = auth

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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

    const generatedPath = completion.choices[0]?.message?.content

    if (!generatedPath) {
      return NextResponse.json({ error: 'Failed to generate career path' }, { status: 500 })
    }

    // Save the generated career path
    const { data: careerPath, error } = await supabase
      .from('career_paths')
      .insert({
        user_id: userId,
        current_role: currentRole,
        target_role: targetRole,
        skills,
        experience,
        timeframe,
        generated_path: generatedPath,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error saving career path' }, { status: 500 })
    }

    return NextResponse.json({ 
      careerPath,
      generatedPath 
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating career path:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}