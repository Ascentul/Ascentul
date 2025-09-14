import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function simpleAnalyze(resumeText: string, jobDescription: string) {
  const res = resumeText.toLowerCase()
  const jd = jobDescription.toLowerCase()

  const tokenize = (s: string) => Array.from(new Set(s.match(/[a-zA-Z][a-zA-Z0-9+.#-]{2,}/g) || []))
  const rTokens = tokenize(res)
  const jTokens = tokenize(jd)

  const rSet = new Set(rTokens)
  const inCommon = jTokens.filter(t => rSet.has(t))
  const missing = jTokens.filter(t => !rSet.has(t)).slice(0, 25)

  const score = Math.round((inCommon.length / Math.max(1, jTokens.length)) * 100)

  const strengths = inCommon.slice(0, 15)
  const gaps = missing.slice(0, 15)
  const suggestions = gaps.map(g => `Consider adding evidence for "${g}" if relevant (skills, tools, achievements).`)

  return {
    score,
    summary: `Estimated JD match: ${score}%. Found ${inCommon.length} keywords in common out of ${jTokens.length}.`,
    strengths,
    gaps,
    suggestions,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jobDescription } = await req.json()

    if (!resumeText || !jobDescription) {
      return NextResponse.json({ error: 'Missing resumeText or jobDescription' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey })
        const prompt = `You are a resume analyst. Compare the following resume text to the job description.
Return JSON with: score (0-100), summary (1-2 sentences), strengths (array), gaps (array), suggestions (array of actionable tips).
Resume:\n${resumeText}\n\nJob Description:\n${jobDescription}`

        const response = await client.chat.completions.create({
          model: 'gpt-5',
          messages: [
            { role: 'system', content: 'You produce concise JSON only. No markdown.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        })

        const content = response.choices[0]?.message?.content || '{}'
        const parsed = JSON.parse(content)
        return NextResponse.json(parsed)
      } catch (e) {
        // Fallback to heuristic if OpenAI fails
        const result = simpleAnalyze(resumeText, jobDescription)
        return NextResponse.json(result)
      }
    }

    // No OpenAI key: heuristic analysis
    const result = simpleAnalyze(resumeText, jobDescription)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('analyze error', err)
    return NextResponse.json({ error: 'Failed to analyze resume' }, { status: 500 })
  }
}
