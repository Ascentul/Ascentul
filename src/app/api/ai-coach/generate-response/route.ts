import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI, { APIConnectionTimeoutError } from 'openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

/**
 * Parse timeout value from environment variable with validation
 * Returns defaultValue if parsing fails or results in NaN/negative number
 */
const parseTimeout = (value: string | undefined, defaultValue: number): number => {
  const parsed = parseInt(value || String(defaultValue), 10);
  return Number.isNaN(parsed) || parsed <= 0 ? defaultValue : parsed;
};

// Configurable timeout values (in milliseconds)
const CONVEX_TIMEOUT_MS = parseTimeout(process.env.CONVEX_TIMEOUT_MS, 10000);
const OPENAI_TIMEOUT_MS = parseTimeout(process.env.OPENAI_TIMEOUT_MS, 15000);

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Operation timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

type CoachWorkHistory = {
  role?: string;
  company?: string;
  start_date?: string;
  end_date?: string;
  is_current?: boolean;
  location?: string;
  summary?: string;
};

type CoachEducationHistory = {
  degree?: string;
  field_of_study?: string;
  institution?: string;
  start_date?: string;
  end_date?: string;
  graduation_date?: string;
  gpa?: string;
  activities?: string;
  is_current?: boolean;
};

type CoachUserProfile = {
  name?: string;
  current_position?: string;
  current_company?: string;
  industry?: string;
  experience_level?: string;
  skills?: string | string[];
  career_goals?: string;
  work_history?: CoachWorkHistory[];
  education_history?: CoachEducationHistory[];
} | null;

type CoachGoal = {
  title?: string;
  status?: string;
};

type CoachApplication = {
  job_title?: string;
  company?: string;
  status?: string;
};

type CoachProject = {
  title?: string;
  description?: string;
  company?: string;
};

type CoachResume = Record<string, unknown>;
type CoachCoverLetter = Record<string, unknown>;

type CoachUserContext = {
  userProfile: CoachUserProfile;
  goals: CoachGoal[];
  applications: CoachApplication[];
  resumes: CoachResume[];
  coverLetters: CoachCoverLetter[];
  projects: CoachProject[];
};

type CoachContextTuple = [
  CoachUserContext['userProfile'],
  CoachUserContext['goals'],
  CoachUserContext['applications'],
  CoachUserContext['resumes'],
  CoachUserContext['coverLetters'],
  CoachUserContext['projects'],
];

type CoachConversationMessage = {
  isUser: boolean;
  message: string;
};

type CoachRequestBody = {
  query?: string;
  conversationHistory?: CoachConversationMessage[];
};

function getClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL
  if (!url) throw new Error('Convex URL not configured')
  return new ConvexHttpClient(url)
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = (await request.json()) as Partial<CoachRequestBody>;
    const { query, conversationHistory = [] } = body;
    const history: CoachConversationMessage[] = Array.isArray(conversationHistory)
      ? (conversationHistory as CoachConversationMessage[])
      : [];

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    // Fetch user context data for personalized coaching
    const client = getClient()
    let userContext = ''
    try {
      const result = await withTimeout(
        Promise.all([
          client.query(api.users.getUserByClerkId, { clerkId: userId }),
          client.query(api.goals.getUserGoals, { clerkId: userId }),
          client.query(api.applications.getUserApplications, { clerkId: userId }),
          client.query(api.resumes.getUserResumes, { clerkId: userId }),
          client.query(api.cover_letters.getUserCoverLetters, { clerkId: userId }),
          client.query(api.projects.getUserProjects, { clerkId: userId }),
        ]) as Promise<CoachContextTuple>,
        CONVEX_TIMEOUT_MS,
        'Convex query timeout'
      );

      const [userProfile, goals, applications, resumes, coverLetters, projects] = result;

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
        goals.slice(0, 5).forEach((goal, idx) => {
          contextParts.push(`${idx + 1}. ${goal.title} (Status: ${goal.status})`)
        })
      }

      if (applications && applications.length > 0) {
        contextParts.push('\n--- RECENT JOB APPLICATIONS ---')
        applications.slice(0, 8).forEach((app, idx) => {
          contextParts.push(`${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`)
        })
      }

      if (projects && projects.length > 0) {
        contextParts.push('\n--- PROJECTS & EXPERIENCE ---')
        projects.slice(0, 5).forEach((project, idx) => {
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

${userContext ? `\n--- USER CONTEXT ---
Use the following context to better understand the candidate's background and tailor your advice accordingly.
Reference specific details from their profile, goals, applications, and projects when providing guidance.

${userContext}\n` : ''}`

        const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
          {
            role: 'system',
            content: systemPrompt
          }
        ]

        // Add conversation history
        history.forEach((msg) => {
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

        const completion = await openai.chat.completions.create(
          {
            model: 'gpt-4o',
            messages: messages,
            temperature: 0.7,
            max_tokens: 1500,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
          },
          {
            timeout: OPENAI_TIMEOUT_MS,
          }
        )

        response = completion.choices?.[0]?.message?.content || 'I apologize, but I was unable to generate a response. Please try again.'
      } catch (openaiError: unknown) {
        console.error('OpenAI API error:', openaiError)
        const isTimeoutError =
          openaiError instanceof APIConnectionTimeoutError ||
          (typeof openaiError === 'object' &&
            openaiError !== null &&
            'name' in openaiError &&
            (openaiError as { name?: unknown }).name === 'APIConnectionTimeoutError');

        if (isTimeoutError) {
          response = 'The AI is taking longer than expected to respond. Please try again.'
        } else {
          response = 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.'
        }
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
