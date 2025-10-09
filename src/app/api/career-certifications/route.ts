import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null

type Skill = { name: string; level: 'basic' | 'intermediate' | 'advanced' }

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const role = String(body?.role || '')
    const level = String(body?.level || '')
    const skills: Skill[] = Array.isArray(body?.skills) ? body.skills : []
    if (!role) return NextResponse.json({ error: 'role is required' }, { status: 400 })

    // Try OpenAI for recommendations
    if (openai) {
      try {
        const prompt = `Recommend 4 relevant professional certifications for a role. Return strictly JSON: { certifications: Array<{ name: string; provider: string; difficulty: 'beginner'|'intermediate'|'advanced'; estimatedTimeToComplete: string; relevance: 'highly relevant'|'relevant'|'somewhat relevant' }> }
Role: ${role}
Level: ${level}
Skills: ${skills.map((s) => `${s.name}(${s.level})`).join(', ')}`
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          temperature: 0.4,
          messages: [
            { role: 'system', content: 'Respond with strictly valid JSON that matches the requested schema.' },
            { role: 'user', content: prompt },
          ],
        })
        const content = completion.choices[0]?.message?.content || ''
        try {
          const parsed = JSON.parse(content)
          if (Array.isArray(parsed?.certifications)) return NextResponse.json(parsed)
        } catch {}
      } catch {}
    }

    // Fallback mock data
    const mock = {
      certifications: [
        { name: `${role} Foundations`, provider: 'Coursera', difficulty: 'beginner', estimatedTimeToComplete: '4-6 weeks', relevance: 'highly relevant' },
        { name: `${role} Intermediate`, provider: 'edX', difficulty: 'intermediate', estimatedTimeToComplete: '6-8 weeks', relevance: 'relevant' },
        { name: 'Project Management Basics', provider: 'PMI', difficulty: 'beginner', estimatedTimeToComplete: '3-4 weeks', relevance: 'somewhat relevant' },
        { name: 'Cloud Practitioner', provider: 'AWS', difficulty: 'beginner', estimatedTimeToComplete: '2-4 weeks', relevance: 'relevant' },
      ],
    }
    return NextResponse.json(mock)
  } catch (error: any) {
    console.error('POST /api/career-certifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
