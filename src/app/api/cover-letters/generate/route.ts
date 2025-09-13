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
    const { jobDescription, companyName, position, userProfile } = body

    if (!jobDescription || !companyName || !position) {
      return NextResponse.json({ 
        error: 'Job description, company name, and position are required' 
      }, { status: 400 })
    }

    // Generate cover letter using OpenAI
    const prompt = `Generate a professional cover letter for the following:

Company: ${companyName}
Position: ${position}
Job Description: ${jobDescription}

User Profile: ${userProfile || 'Professional with relevant experience'}

Create a compelling, personalized cover letter that highlights relevant skills and experience for this specific role. Keep it professional, concise, and engaging.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
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

    const generatedContent = completion.choices[0]?.message?.content

    if (!generatedContent) {
      return NextResponse.json({ error: 'Failed to generate cover letter' }, { status: 500 })
    }

    // Save the generated cover letter
    const { data: coverLetter, error } = await supabase
      .from('cover_letters')
      .insert({
        user_id: userId,
        title: `Cover Letter - ${companyName} ${position}`,
        content: generatedContent,
        company_name: companyName,
        position,
        job_description: jobDescription,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Error saving cover letter' }, { status: 500 })
    }

    return NextResponse.json({ 
      coverLetter,
      generatedContent 
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating cover letter:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}