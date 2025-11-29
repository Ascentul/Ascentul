import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { api } from 'convex/_generated/api'
import { Id } from 'convex/_generated/dataModel'
import OpenAI from 'openai'
import { ConvexHttpClient } from 'convex/browser'

const createConvexClient = () => new (ConvexHttpClient as any)(process.env.NEXT_PUBLIC_CONVEX_URL as string)
const normalizeRef = (ref: any) => (typeof ref === 'string' ? { _name: ref } : ref)
const getMockOpenAIInstance = () => {
  const mockApi: any = (OpenAI as any).mock
  if (!mockApi) return null
  const fromResults = mockApi.results?.find((r: any) => r.value)?.value
  if (fromResults) return fromResults
  if (mockApi.instances && mockApi.instances.length > 0) {
    return mockApi.instances[0]
  }
  return null
}

const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) return null
  const mocked = getMockOpenAIInstance()
  if (mocked) return mocked
  return new (OpenAI as any)({ apiKey: process.env.OPENAI_API_KEY })
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversationId = params.id

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    }
    const client: any = createConvexClient()

    const messages = await client.query(
      normalizeRef((api.ai_coach as any).getMessages),
      {
        clerkId: userId,
        conversationId: conversationId as Id<'ai_coach_conversations'>
      }
    )

    return NextResponse.json(messages)
  } catch (error) {
    console.error('Error fetching conversation messages:', error)
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const conversationId = params.id
    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID is required' }, { status: 400 })
    }

    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!convexUrl) {
      return NextResponse.json({ error: 'Convex URL not configured' }, { status: 500 })
    }
    const client: any = createConvexClient()

    // Get conversation history for context
    const existingMessages = await client.query(
      normalizeRef((api.ai_coach as any).getMessages),
      {
        clerkId: userId,
        conversationId: conversationId as Id<'ai_coach_conversations'>
      }
    ) as Array<{ isUser: boolean; message: string }>

    // Fetch user context data for personalized coaching
    let userContext = ''
    try {
      const [userProfile, goals, applications, resumes, coverLetters, projects] = await Promise.all([
        client.query((api.users as any).getUserByClerkId, { clerkId: userId }) as Promise<Record<string, any> | null>,
        client.query((api.goals as any).getUserGoals, { clerkId: userId }) as Promise<any[]>,
        client.query((api.applications as any).getUserApplications, { clerkId: userId }) as Promise<any[]>,
        client.query((api.resumes as any).getUserResumes, { clerkId: userId }) as Promise<any[]>,
        client.query((api.cover_letters as any).getUserCoverLetters, { clerkId: userId }) as Promise<any[]>,
        client.query((api.projects as any).getUserProjects, { clerkId: userId }) as Promise<any[]>
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
        goals.slice(0, 5).forEach((goal: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${goal.title} (Status: ${goal.status})`)
          if (goal.description) contextParts.push(`   Description: ${goal.description}`)
          if (goal.target_date) contextParts.push(`   Target Date: ${new Date(goal.target_date).toLocaleDateString()}`)
        })
      }

      if (applications && applications.length > 0) {
        contextParts.push('\n--- RECENT JOB APPLICATIONS ---')
        applications.slice(0, 8).forEach((app: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`)
          if (app.notes) contextParts.push(`   Notes: ${app.notes}`)
        })
      }

      if (resumes && resumes.length > 0) {
        contextParts.push('\n--- RESUMES ---')
        resumes.slice(0, 3).forEach((resume: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${resume.title} (Source: ${resume.source || 'manual'})`)
        })
      }

      if (coverLetters && coverLetters.length > 0) {
        contextParts.push('\n--- COVER LETTERS ---')
        coverLetters.slice(0, 3).forEach((letter: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${letter.name || 'Untitled'} - ${letter.job_title} at ${letter.company_name}`)
        })
      }

      if (projects && projects.length > 0) {
        contextParts.push('\n--- PROJECTS & EXPERIENCE ---')
        projects.slice(0, 5).forEach((project: any, idx: number) => {
          contextParts.push(`${idx + 1}. ${project.title} (${project.type || 'personal'})`)
          if (project.role) contextParts.push(`   Role: ${project.role}`)
          if (project.company) contextParts.push(`   Company: ${project.company}`)
          if (project.description) contextParts.push(`   Description: ${project.description}`)
          if (project.technologies?.length) contextParts.push(`   Technologies: ${project.technologies.join(', ')}`)
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
        existingMessages.forEach((msg: any) => {
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
    const newMessages = await client.mutation(
      normalizeRef((api.ai_coach as any).addMessages),
      {
        clerkId: userId,
        conversationId: conversationId as Id<'ai_coach_conversations'>,
        userMessage: content,
        aiMessage: aiResponse
      }
    )

    return NextResponse.json(newMessages, { status: 201 })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}
