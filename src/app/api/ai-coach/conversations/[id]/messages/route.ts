import { NextRequest, NextResponse } from 'next/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import OpenAI from 'openai'
import { fetchQuery, fetchMutation } from 'convex/nextjs'
import { requireConvexToken } from '@/lib/convex-auth'

/**
 * Helper to get a mock OpenAI instance for testing
 * Returns null if OpenAI is not mocked
 */
const getMockOpenAIInstance = (): OpenAI | null => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockApi = (OpenAI as any).mock as {
    results?: Array<{ value?: OpenAI }>
    instances?: OpenAI[]
  } | undefined

  if (!mockApi) return null

  const fromResults = mockApi.results?.find((r) => r.value)?.value
  if (fromResults) return fromResults

  if (mockApi.instances && mockApi.instances.length > 0) {
    return mockApi.instances[0]
  }

  return null
}

/**
 * Creates an OpenAI client, using mock if available (for testing)
 */
const createOpenAIClient = (): OpenAI | null => {
  const mocked = getMockOpenAIInstance()
  if (mocked) return mocked

  if (!process.env.OPENAI_API_KEY) return null

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, token } = await requireConvexToken()

    const { id } = await params
    const conversationId = id

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const messages = await fetchQuery(
      api.ai_coach.getMessages,
      {
        clerkId: userId,
        conversationId: conversationId as Id<'ai_coach_conversations'>
      },
      { token }
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    const message = error instanceof Error ? error.message : 'Failed to fetch messages'
    const status = message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, token } = await requireConvexToken()

    const { id } = await params
    const conversationId = id
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    // Get conversation history for context
    const existingMessages = await fetchQuery(
      api.ai_coach.getMessages,
      {
        clerkId: userId,
        conversationId: conversationId as Id<'ai_coach_conversations'>
      },
      { token }
    ) as Array<{ isUser: boolean; message: string }>

    // Fetch user context data for personalized coaching
    let userContext = ''
    try {
      const [userProfile, goals, applications, resumes, coverLetters, projects] = await Promise.all([
        fetchQuery(api.users.getUserByClerkId, { clerkId: userId }, { token }) as Promise<Record<string, unknown> | null>,
        fetchQuery(api.goals.getUserGoals, { clerkId: userId }, { token }) as Promise<Array<Record<string, unknown>>>,
        fetchQuery(api.applications.getUserApplications, { clerkId: userId }, { token }) as Promise<Array<Record<string, unknown>>>,
        fetchQuery(api.resumes.getUserResumes, { clerkId: userId }, { token }) as Promise<Array<Record<string, unknown>>>,
        fetchQuery(api.cover_letters.getUserCoverLetters, { clerkId: userId }, { token }) as Promise<Array<Record<string, unknown>>>,
        fetchQuery(api.projects.getUserProjects, { clerkId: userId }, { token }) as Promise<Array<Record<string, unknown>>>
      ])

      // Build user context summary
      const contextParts: string[] = []

      if (userProfile) {
        contextParts.push('--- USER PROFILE ---')
        if (userProfile.name) contextParts.push(`Name: ${userProfile.name}`)
        if (userProfile.email) contextParts.push(`Email: ${userProfile.email}`)
        if (userProfile.current_position) contextParts.push(`Current Position: ${userProfile.current_position}`)
        if (userProfile.current_company) contextParts.push(`Current Company: ${userProfile.current_company}`)
        if (userProfile.industry) contextParts.push(`Industry: ${userProfile.industry}`)
        if (userProfile.experience_level) contextParts.push(`Experience Level: ${userProfile.experience_level}`)
        if (userProfile.location) contextParts.push(`Location: ${userProfile.location}`)
        if (userProfile.skills) contextParts.push(`Skills: ${userProfile.skills}`)
        if (userProfile.bio) contextParts.push(`Bio: ${userProfile.bio}`)
        if (userProfile.career_goals) contextParts.push(`Career Goals: ${userProfile.career_goals}`)
        if (userProfile.education) contextParts.push(`Education: ${userProfile.education}`)
        if (userProfile.university_name) contextParts.push(`University: ${userProfile.university_name}`)
        if (userProfile.major) contextParts.push(`Major: ${userProfile.major}`)
        if (userProfile.graduation_year) contextParts.push(`Graduation Year: ${userProfile.graduation_year}`)
      }

      if (goals && goals.length > 0) {
        contextParts.push('\n--- CAREER GOALS ---')
        goals.slice(0, 5).forEach((goal, idx: number) => {
          contextParts.push(`${idx + 1}. ${goal.title} (Status: ${goal.status})`)
          if (goal.description) contextParts.push(`   Description: ${goal.description}`)
          if (goal.target_date) contextParts.push(`   Target Date: ${new Date(goal.target_date as number).toLocaleDateString()}`)
        })
      }

      if (applications && applications.length > 0) {
        contextParts.push('\n--- RECENT JOB APPLICATIONS ---')
        applications.slice(0, 8).forEach((app, idx: number) => {
          contextParts.push(`${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`)
          // NOTE: app.notes intentionally excluded from AI context for privacy
          // Notes may contain sensitive information (rejection reasons, personal circumstances)
        })
      }

      if (resumes && resumes.length > 0) {
        contextParts.push('\n--- RESUMES ---')
        resumes.slice(0, 3).forEach((resume, idx: number) => {
          contextParts.push(`${idx + 1}. ${resume.title} (Source: ${resume.source || 'manual'})`)
        })
      }

      if (coverLetters && coverLetters.length > 0) {
        contextParts.push('\n--- COVER LETTERS ---')
        coverLetters.slice(0, 3).forEach((letter, idx: number) => {
          contextParts.push(`${idx + 1}. ${letter.name || 'Untitled'} - ${letter.job_title} at ${letter.company_name}`)
        })
      }

      if (projects && projects.length > 0) {
        contextParts.push('\n--- PROJECTS & EXPERIENCE ---')
        projects.slice(0, 5).forEach((project, idx: number) => {
          contextParts.push(`${idx + 1}. ${project.title} (${project.type || 'personal'})`)
          if (project.role) contextParts.push(`   Role: ${project.role}`)
          if (project.company) contextParts.push(`   Company: ${project.company}`)
          if (project.description) contextParts.push(`   Description: ${project.description}`)
          if (project.technologies && Array.isArray(project.technologies)) {
            contextParts.push(`   Technologies: ${(project.technologies as string[]).join(', ')}`)
          }
        })
      }

      userContext = contextParts.join('\n')
    } catch (error) {
      console.error('Error fetching user context:', error)
      userContext = 'Unable to load user context data.'
    }

    let aiResponse: string

    const openaiClient = createOpenAIClient()

    if (openaiClient) {
      // Validate that the OpenAI client is properly configured
      if (!openaiClient.chat?.completions?.create) {
        console.error('OpenAI client is not properly configured')
        return NextResponse.json(
          { error: 'AI service is not available' },
          { status: 503 }
        )
      }
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
        existingMessages.forEach((msg) => {
          messages.push({
            role: msg.isUser ? 'user' : 'assistant',
            content: msg.message
          })
        })

        // Add current message
        messages.push({
          role: 'user',
          content: content
        })

        const completion = await openaiClient.chat.completions.create({
          model: 'gpt-4o',
          messages: messages,
          temperature: 0.7,
          max_tokens: 1500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })

        const choiceContent = completion?.choices?.[0]?.message?.content
        aiResponse = choiceContent || 'I apologize, but I was unable to generate a response. Please try again.'
      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
        aiResponse = 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
      }
    } else {
      aiResponse = `Thank you for your question: "${content}". I'm currently unable to access my AI capabilities. Please ensure the OpenAI API is properly configured, or try again later.`
    }

    // Save both messages to the database
    const newMessages = await fetchMutation(
      api.ai_coach.addMessages,
      {
        clerkId: userId,
        conversationId: conversationId as Id<'ai_coach_conversations'>,
        userMessage: content,
        aiMessage: aiResponse
      },
      { token }
    )

    return NextResponse.json(newMessages, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    const message = error instanceof Error ? error.message : 'Failed to send message'
    const status = message === 'Unauthorized' || message === 'Failed to obtain auth token' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
