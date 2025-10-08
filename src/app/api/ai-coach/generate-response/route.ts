import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Convex URL not configured')
  return new ConvexHttpClient(url)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { query, conversationHistory = [] } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Fetch user context data for personalized coaching
    const client = getClient()
    let userContext = ''
    try {
      const [userProfile, goals, applications, resumes, coverLetters, projects] = await Promise.all([
        client.query(api.users.getUserByClerkId, { clerkId: userId }),
        client.query(api.goals.getUserGoals, { clerkId: userId }),
        client.query(api.applications.getUserApplications, { clerkId: userId }),
        client.query(api.resumes.getUserResumes, { clerkId: userId }),
        client.query(api.cover_letters.getUserCoverLetters, { clerkId: userId }),
        client.query(api.projects.getUserProjects, { clerkId: userId })
      ])

      // Build user context summary
      const contextParts: string[] = []

      if (userProfile) {
        contextParts.push('--- USER PROFILE ---')
        if (userProfile.name) contextParts.push(`Name: ${userProfile.name}`)
        if (userProfile.current_position) contextParts.push(`Current Position: ${userProfile.current_position}`)
        if (userProfile.current_company) contextParts.push(`Current Company: ${userProfile.current_company}`)
        if (userProfile.industry) contextParts.push(`Industry: ${userProfile.industry}`)
        if (userProfile.experience_level) contextParts.push(`Experience Level: ${userProfile.experience_level}`)
        if (userProfile.skills) contextParts.push(`Skills: ${userProfile.skills}`)
        if (userProfile.career_goals) contextParts.push(`Career Goals: ${userProfile.career_goals}`)
      }

      if (goals && goals.length > 0) {
        contextParts.push('\n--- CAREER GOALS ---')
        goals.slice(0, 5).forEach((goal: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${goal.title} (Status: ${goal.status})`)
        })
      }

      if (applications && applications.length > 0) {
        contextParts.push('\n--- RECENT JOB APPLICATIONS ---')
        applications.slice(0, 8).forEach((app: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`)
        })
      }

      if (projects && projects.length > 0) {
        contextParts.push('\n--- PROJECTS & EXPERIENCE ---')
        projects.slice(0, 5).forEach((project: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${project.title}`)
          if (project.description) contextParts.push(`   ${project.description}`)
        })
      }

      userContext = contextParts.join('\n')
    } catch (error) {
      console.error('Error fetching user context:', error)
      userContext = 'Unable to load user context data.'
    }

    let response: string

    if (openai) {
      try {
        // Build conversation context for the AI
        const systemPrompt = `You are an expert AI Career Coach. Your role is to provide personalized, actionable career advice based on the user's questions and background.

Key guidelines:
- Be supportive, encouraging, and professional
- Provide specific, actionable advice tailored to THIS user's profile, goals, and experience
- Consider current market trends and industry insights
- Help with career planning, skill development, job search strategies, interview preparation, and professional growth
- Reference the user's specific goals, applications, projects, and experience when relevant
- Ask clarifying questions when needed to provide better guidance
- Keep responses concise but comprehensive (aim for 2-4 paragraphs)
- Use a warm, approachable tone while maintaining professionalism

Always remember you're helping someone with their career development and professional growth.

${userContext ? `\n--- USER CONTEXT (Use this to personalize your advice) ---\n${userContext}\n` : ''}`

        const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
          {
            role: 'system',
            content: systemPrompt
          }
        ]

        // Add conversation history
        conversationHistory.forEach((msg: any) => {
          messages.push({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.message
          })
        })

        // Add current query
        messages.push({
          role: 'user',
          content: query
        })

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })

        response = completion.choices[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
        response = 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
      }
    } else {
      // Fallback response when OpenAI is not available
      response = `Thank you for your question about: "${query}". I'm currently unable to access my AI capabilities. Please ensure the OpenAI API is properly configured, or try again later.`
    }

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error generating AI response:', error)
    return NextResponse.json({ error: 'Failed to generate AI response' }, { status: 500 })
  }
}
