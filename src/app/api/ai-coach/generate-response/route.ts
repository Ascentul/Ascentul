import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { api } from 'convex/_generated/api'
import { convexServer } from '@/lib/convex-server'
import { buildUserContext } from '@/lib/ai-coach-helpers';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

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
    let userContext = ''
    try {
      const [userProfile, goals, applications, resumes, coverLetters, projects] = await Promise.all([
        convexServer.query(api.users.getUserByClerkId, { clerkId: userId }),
        convexServer.query(api.goals.getUserGoals, { clerkId: userId }),
        convexServer.query(api.applications.getUserApplications, { clerkId: userId }),
        convexServer.query(api.resumes.getUserResumes, { clerkId: userId }),
        convexServer.query(api.cover_letters.getUserCoverLetters, { clerkId: userId }),
        convexServer.query(api.projects.getUserProjects, { clerkId: userId })
      ])

      userContext = buildUserContext({
        userProfile,
        goals,
        applications,
        resumes,
        coverLetters,
        projects
      })
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
          model: process.env.OPENAI_MODEL || 'gpt-4o',
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
