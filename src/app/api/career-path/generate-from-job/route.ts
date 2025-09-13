import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

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
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const jobTitle = String(body?.jobTitle || '').trim()
    if (!jobTitle) return NextResponse.json({ error: 'jobTitle is required' }, { status: 400 })

    // Try OpenAI, fall back to mock
    if (openai) {
      try {
        const prompt = `Create a single structured JSON career path for the target job title "${jobTitle}".
Return JSON with the following TypeScript shape without extra commentary:
{
  paths: [
    {
      id: string,
      name: string,
      nodes: Array<{
        id: string,
        title: string,
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
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
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
            return NextResponse.json(parsed)
          }
        } catch {
          // fall through to mock
        }
      } catch (e) {
        // ignore and use mock
      }
    }

    return NextResponse.json({ paths: [mockPath(jobTitle)] })
  } catch (error: any) {
    console.error('POST /api/career-path/generate-from-job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
