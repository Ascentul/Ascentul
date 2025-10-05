import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface UserProfile {
  name?: string
  email?: string
  phone?: string
  location?: string
  linkedin_url?: string
  github_url?: string
  bio?: string
  job_title?: string
  company?: string
  skills?: string
  current_position?: string
  current_company?: string
  education?: string
  university_name?: string
  major?: string
  graduation_year?: string
  experience_level?: string
  industry?: string
}

function generateBasicResume(jobDescription: string, userProfile?: UserProfile) {
  // Extract key requirements from job description
  const jdLower = jobDescription.toLowerCase()
  const hasReact = jdLower.includes('react')
  const hasNode = jdLower.includes('node') || jdLower.includes('backend')
  const hasPython = jdLower.includes('python')
  const hasAI = jdLower.includes('ai') || jdLower.includes('machine learning')

  const suggestedSkills = []
  if (hasReact) suggestedSkills.push('React', 'JavaScript', 'TypeScript', 'HTML/CSS')
  if (hasNode) suggestedSkills.push('Node.js', 'Express', 'RESTful APIs')
  if (hasPython) suggestedSkills.push('Python', 'Django', 'Flask')
  if (hasAI) suggestedSkills.push('Machine Learning', 'TensorFlow', 'Data Analysis')

  // Use user profile skills if available
  const profileSkills = userProfile?.skills ? userProfile.skills.split(',').map(s => s.trim()) : []
  const allSkills = Array.from(new Set([...profileSkills, ...suggestedSkills])).slice(0, 12)

  return {
    personalInfo: {
      name: userProfile?.name || 'Your Name',
      email: userProfile?.email || 'email@example.com',
      phone: userProfile?.phone || '',
      location: userProfile?.location || '',
      linkedin: userProfile?.linkedin_url || '',
      github: userProfile?.github_url || '',
    },
    summary: userProfile?.bio || 'Experienced professional seeking to leverage skills and expertise in a challenging role that aligns with career goals and contributes to organizational success.',
    skills: allSkills,
    experience: userProfile?.current_position ? [{
      title: userProfile.current_position,
      company: userProfile.current_company || '',
      startDate: 'Present',
      endDate: '',
      description: 'Key responsibilities and achievements in this role.',
    }] : [],
    education: userProfile?.university_name ? [{
      degree: userProfile.major || 'Bachelor of Science',
      school: userProfile.university_name,
      graduationYear: userProfile.graduation_year || '',
    }] : [],
  }
}

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, userProfile } = await req.json()

    if (!jobDescription) {
      return NextResponse.json({ error: 'Missing job description' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey })

        const profileContext = userProfile ? `
User Profile:
Name: ${userProfile.name || 'N/A'}
Current Position: ${userProfile.current_position || 'N/A'}
Company: ${userProfile.current_company || 'N/A'}
Skills: ${userProfile.skills || 'N/A'}
Education: ${userProfile.university_name || 'N/A'} - ${userProfile.major || 'N/A'}
Bio: ${userProfile.bio || 'N/A'}
` : ''

        const prompt = `You are a professional resume writer. Generate an ATS-optimized resume tailored to the following job description.
${profileContext}

Job Description:
${jobDescription}

Return a JSON object with this structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string"
  },
  "summary": "Professional summary (3-4 sentences)",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "description": "Bullet points of achievements and responsibilities"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "graduationYear": "YYYY"
    }
  ]
}

If user profile is provided, use that information. Otherwise, create a template based on the job requirements.
Focus on keywords from the job description. Make it ATS-friendly.`

        const response = await client.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a professional resume writer. Output only valid JSON.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        })

        const content = response.choices[0]?.message?.content || '{}'
        const resumeData = JSON.parse(content)

        return NextResponse.json({
          success: true,
          resume: resumeData
        })
      } catch (aiError: any) {
        console.error('AI generation error:', aiError)
        // Fallback to basic generation
        const basicResume = generateBasicResume(jobDescription, userProfile)
        return NextResponse.json({
          success: true,
          resume: basicResume,
          warning: 'Used fallback generation due to AI service error'
        })
      }
    }

    // No OpenAI key: use basic generation
    const basicResume = generateBasicResume(jobDescription, userProfile)
    return NextResponse.json({
      success: true,
      resume: basicResume
    })
  } catch (err: any) {
    console.error('generate error', err)
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 })
  }
}
