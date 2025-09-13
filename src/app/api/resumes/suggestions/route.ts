import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function heuristicSuggestions(resumeText: string, jobDescription: string) {
  const text = (resumeText || '').slice(0, 4000)
  const jd = (jobDescription || '').slice(0, 4000)
  const mostCommon = (s: string) => {
    const tokens = (s.match(/[A-Za-z][A-Za-z0-9+.#-]{3,}/g) || []).map(t => t.toLowerCase())
    const counts = new Map<string, number>()
    for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1)
    return Array.from(counts.entries()).sort((a,b)=>b[1]-a[1]).map(([k])=>k)
  }
  const jdCommon = mostCommon(jd).slice(0, 30)
  const resumeSet = new Set(mostCommon(text))
  const recommendedSkills = jdCommon.filter(k => !resumeSet.has(k)).slice(0, 10)
  const improvedSummary = `Experienced professional. Tailor your summary to emphasize: ${recommendedSkills.slice(0,5).join(', ')}.`
  return { improvedSummary, recommendedSkills }
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json()
    if (!resumeText) return NextResponse.json({ error: 'Missing resumeText' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey })
        const prompt = `Improve the RESUME SUMMARY and list RECOMMENDED SKILLS to add based on the JOB DESCRIPTION. Return JSON with { improvedSummary: string, recommendedSkills: string[] }.
RESUME TEXT:\n${resumeText}\n\nJOB DESCRIPTION:\n${jobDescription || ''}`
        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Return JSON only. No markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        })
        const content = response.choices[0]?.message?.content || '{}'
        const parsed = JSON.parse(content)
        return NextResponse.json(parsed)
      } catch (e) {
        // fallback
        return NextResponse.json(heuristicSuggestions(resumeText, jobDescription || ''))
      }
    }

    return NextResponse.json(heuristicSuggestions(resumeText, jobDescription || ''))
  } catch (e) {
    console.error('suggestions error', e)
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}
