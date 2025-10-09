import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'

function mockPath(jobTitle: string) {
  const baseId = jobTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)
  return {
    id: `${baseId}-path`,
    name: `${jobTitle} Path`,
    nodes: [
      {
        id: `${baseId}-entry`,
        title: `Junior ${jobTitle}`,
        level: 'entry',
        salaryRange: '$60,000 - $85,000',
        yearsExperience: '0-2 years',
        skills: [
          { name: 'Foundations', level: 'basic' },
          { name: 'Collaboration', level: 'basic' },
        ],
        description: `Entry-level ${jobTitle.toLowerCase()} responsibilities with focus on learning and delivery.`,
        growthPotential: 'high',
        icon: 'braces',
      },
      {
        id: `${baseId}-mid`,
        title: `Mid-Level ${jobTitle}`,
        level: 'mid',
        salaryRange: '$85,000 - $120,000',
        yearsExperience: '2-5 years',
        skills: [
          { name: 'Problem Solving', level: 'intermediate' },
          { name: 'Stakeholder Communication', level: 'intermediate' },
        ],
        description: `Owns features, mentors juniors, and contributes to roadmap as a ${jobTitle}.`,
        growthPotential: 'high',
        icon: 'cpu',
      },
      {
        id: `${baseId}-senior`,
        title: `Senior ${jobTitle}`,
        level: 'senior',
        salaryRange: '$120,000 - $160,000',
        yearsExperience: '5-8 years',
        skills: [
          { name: 'System Design', level: 'advanced' },
          { name: 'Leadership', level: 'intermediate' },
        ],
        description: `Leads complex initiatives and sets best practices for ${jobTitle.toLowerCase()} work.`,
        growthPotential: 'medium',
        icon: 'database',
      },
      {
        id: `${baseId}-lead`,
        title: `Lead ${jobTitle}`,
        level: 'lead',
        salaryRange: '$150,000 - $190,000',
        yearsExperience: '8-12 years',
        skills: [
          { name: 'Architecture', level: 'advanced' },
          { name: 'Team Leadership', level: 'intermediate' },
        ],
        description: `Drives strategy and delivery for teams focused on ${jobTitle.toLowerCase()} outcomes.`,
        growthPotential: 'medium',
        icon: 'briefcase',
      },
    ],
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const jobTitle = String(body?.jobTitle || '').trim()
    if (!jobTitle) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })

    // Try OpenAI, fall back to mock
    let client: OpenAI | null = null
    if (process.env.OPENAI_API_KEY) {
      try { client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) } catch { client = null }
    }
    if (client) {
      const prompt = `You are a career path analyst specializing in mapping realistic career progressions across industries.
Given the target role "${jobTitle}", output a clear, data-backed career path that shows which roles typically lead to that target role, including titles that represent logical, real-world progressions rather than simple seniority prefixes.

Follow these rules:
1. Identify 3-5 distinct stages that reflect the natural professional evolution toward the target role.
2. Include title, salary range, years of experience, and growth outlook (high / medium / low) for each stage.
3. Each stage should be a different role, not just "Junior/Mid/Senior" of the same title.
4. Prioritize accuracy for common industries.

Return JSON with the following TypeScript shape without extra commentary:
{
  paths: [
    {
      id: string,
      name: string,
      nodes: Array<{
        id: string,
        title: string, // Use realistic, distinct job titles for each stage
        level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive',
        salaryRange: string,
        yearsExperience: string,
        skills: Array<{ name: string; level: 'basic' | 'intermediate' | 'advanced' }>,
        description: string,
        growthPotential: 'low' | 'medium' | 'high',
        icon: string // short identifier like 'braces' | 'cpu' | 'database' | 'briefcase' | 'user' | 'award' | 'linechart' | 'layers' | 'graduation' | 'lightbulb' | 'book'
      }>
    }
  ]
}`
      const models = ['gpt-4o', 'gpt-4o-mini']
      for (const model of models) {
        try {
          const completion = await client.chat.completions.create({
            model,
            temperature: 0.5,
            messages: [
              { role: 'system', content: 'You produce strictly valid JSON for apps to consume.' },
              { role: 'user', content: prompt },
            ],
          })
          const content = completion.choices[0]?.message?.content || ''
          try {
            const parsed = JSON.parse(content)
            if (Array.isArray(parsed?.paths)) {
              // Save first path to Convex (best-effort)
              try {
                const url = process.env.NEXT_PUBLIC_CONVEX_URL
                if (url) {
                  const clientCv = new ConvexHttpClient(url)
                  const mainPath = parsed.paths[0]
                  await clientCv.mutation(api.career_paths.createCareerPath, {
                    clerkId: userId,
                    target_role: String(mainPath?.name || jobTitle),
                    current_level: undefined,
                    estimated_timeframe: undefined,
                    steps: { source: 'job', path: mainPath, usedModel: model },
                    status: 'active',
                  })
                }
              } catch {}
              return NextResponse.json({ ...parsed, usedModel: model, usedFallback: false })
            }
          } catch {
            // continue to next model
          }
        } catch {
          // try next model
        }
      }
    }

    // Mock fallback + save
    const mock = mockPath(jobTitle)
    try {
      const url = process.env.NEXT_PUBLIC_CONVEX_URL
      if (url) {
        const clientCv = new ConvexHttpClient(url)
        await clientCv.mutation(api.career_paths.createCareerPath, {
          clerkId: userId,
          target_role: String(mock?.name || jobTitle),
          current_level: undefined,
          estimated_timeframe: undefined,
          steps: { source: 'job', path: mock, usedModel: 'mock' },
          status: 'active',
        })
      }
    } catch {}
    return NextResponse.json({ paths: [mock] , usedFallback: true })
  } catch (error: any) {
    console.error('POST /api/career-path/generate-from-job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
