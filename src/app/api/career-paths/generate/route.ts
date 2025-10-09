import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { ConvexHttpClient } from 'convex/browser'
import { api } from 'convex/_generated/api'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const profileData = body?.profileData || {}

    // Try OpenAI to generate a couple of tailored paths
    let client: OpenAI | null = null
    if (process.env.OPENAI_API_KEY) {
      try { client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) } catch { client = null }
    }
    if (client) {
      try {
        const prompt = `You are a career path analyst specializing in mapping realistic career progressions across industries.
Given this user's profile JSON, propose 2 realistic career paths that show which roles typically lead to their target role, including titles that represent logical, real-world progressions rather than simple seniority prefixes.

Follow these rules:
1. Identify 3-5 distinct stages that reflect the natural professional evolution toward the target role.
2. Include title, salary range, years of experience, and growth outlook (high / medium / low) for each stage.
3. Each stage should be a different role, not just "Junior/Mid/Senior" of the same title.
4. Prioritize accuracy for common industries.

Return strictly JSON with { paths: Path[] } where Path = { id: string; name: string; nodes: Node[] } and Node = { id: string; title: string (use realistic, distinct job titles for each stage); level: 'entry'|'mid'|'senior'|'lead'|'executive'; salaryRange: string; yearsExperience: string; skills: { name: string; level: 'basic'|'intermediate'|'advanced' }[]; description: string; growthPotential: 'low'|'medium'|'high'; icon: string }.

Profile JSON: ${JSON.stringify(profileData).slice(0, 4000)}
`;
        const completion = await client.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.5,
          messages: [
            { role: 'system', content: 'Respond with strictly valid JSON only.' },
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
                const first = parsed.paths[0]
                await clientCv.mutation(api.career_paths.createCareerPath, {
                  clerkId: userId,
                  target_role: String(first?.name || profileData?.currentRole || 'Career Path'),
                  current_level: undefined,
                  estimated_timeframe: undefined,
                  steps: { source: 'profile', path: first, usedModel: 'gpt-4o' },
                  status: 'active',
                })
              }
            } catch {}
            return NextResponse.json(parsed)
          }
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

    // Save mock first path (best-effort)
    try {
      const url = process.env.NEXT_PUBLIC_CONVEX_URL
      if (url) {
        const clientCv = new ConvexHttpClient(url)
        const first = mock.paths[0]
        await clientCv.mutation(api.career_paths.createCareerPath, {
          clerkId: userId,
          target_role: String(first?.name || base),
          current_level: undefined,
          estimated_timeframe: undefined,
          steps: { source: 'profile', path: first, usedModel: 'mock' },
          status: 'active',
        })
      }
    } catch {}

    return NextResponse.json(mock)
  } catch (error: any) {
    console.error('POST /api/career-paths/generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
