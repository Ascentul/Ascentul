import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

export async function POST(request: NextRequest) {
  try {
    const { userId } = getAuth(request)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const profileData = body?.profileData || {}

    // Try OpenAI to generate a couple of tailored paths
    if (openai) {
      try {
        const prompt = `Given this user's profile JSON, propose 2 realistic career paths. Return strictly JSON with { paths: Path[] } where Path = { id: string; name: string; nodes: Node[] } and Node = { id: string; title: string; level: 'entry'|'mid'|'senior'|'lead'|'executive'; salaryRange: string; yearsExperience: string; skills: { name: string; level: 'basic'|'intermediate'|'advanced' }[]; description: string; growthPotential: 'low'|'medium'|'high'; icon: string }.
Profile JSON: ${JSON.stringify(profileData).slice(0, 4000)}
`;
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          temperature: 0.5,
          messages: [
            { role: 'system', content: 'Respond with strictly valid JSON only.' },
            { role: 'user', content: prompt },
          ],
        })
        const content = completion.choices[0]?.message?.content || ''
        try {
          const parsed = JSON.parse(content)
          if (Array.isArray(parsed?.paths)) return NextResponse.json(parsed)
        } catch {}
      } catch {}
    }

    // Fallback mock based on profile currentRole
    const base = String(profileData?.currentRole || 'Professional')
    const baseId = base.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const mock = {
      paths: [
        {
          id: `${baseId}-advancement`,
          name: `${base} Advancement`,
          nodes: [
            { id: `${baseId}-entry`, title: `Junior ${base}`, level: 'entry', salaryRange: '$55k-$80k', yearsExperience: '0-2 years', skills: [{ name: 'Foundations', level: 'basic' }], description: `Start your journey as a junior ${base}.`, growthPotential: 'high', icon: 'braces' },
            { id: `${baseId}-mid`, title: `Mid-Level ${base}`, level: 'mid', salaryRange: '$85k-$120k', yearsExperience: '2-5 years', skills: [{ name: 'Ownership', level: 'intermediate' }], description: `Own features and mentor juniors.`, growthPotential: 'high', icon: 'cpu' },
            { id: `${baseId}-senior`, title: `Senior ${base}`, level: 'senior', salaryRange: '$120k-$160k', yearsExperience: '5-8 years', skills: [{ name: 'System Design', level: 'intermediate' }], description: `Lead complex initiatives.`, growthPotential: 'medium', icon: 'database' },
          ],
        },
        {
          id: `${baseId}-leadership`,
          name: `${base} Leadership`,
          nodes: [
            { id: `${baseId}-lead`, title: `Lead ${base}`, level: 'lead', salaryRange: '$150k-$190k', yearsExperience: '8-12 years', skills: [{ name: 'Leadership', level: 'intermediate' }], description: `Drive team execution and quality.`, growthPotential: 'medium', icon: 'briefcase' },
            { id: `${baseId}-exec`, title: `Head of ${base}`, level: 'executive', salaryRange: '$200k-$300k+', yearsExperience: '12+ years', skills: [{ name: 'Strategy', level: 'advanced' }], description: `Set org-level strategy.`, growthPotential: 'low', icon: 'award' },
          ],
        },
      ],
    }

    return NextResponse.json(mock)
  } catch (error: any) {
    console.error('POST /api/career-paths/generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
