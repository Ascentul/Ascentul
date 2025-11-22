import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Enhanced fallback parser that uses regex to extract comprehensive resume information
 * Used when OpenAI is not available
 */
function fallbackParser(resumeText: string) {
  const lines = resumeText.split('\n').filter(line => line.trim())

  // Extract email
  const emailMatch = resumeText.match(/[\w\.-]+@[\w\.-]+\.\w+/)
  const email = emailMatch ? emailMatch[0] : ''

  // Extract phone
  const phoneMatch = resumeText.match(/(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0] : ''

  // Extract LinkedIn
  const linkedinMatch = resumeText.match(/(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)[\w-]+/i)
  const linkedin = linkedinMatch ? `https://${linkedinMatch[0]}` : ''

  // Extract GitHub
  const githubMatch = resumeText.match(/(?:github\.com\/)[\w-]+/i)
  const github = githubMatch ? `https://${githubMatch[0]}` : ''

  // Extract location - look for common patterns like "City, State" or "City, Country"
  const locationMatch = resumeText.match(/(?:^|\n)([A-Z][a-z]+(?:\s[A-Z][a-z]+)?,\s*[A-Z]{2,}(?:\s+\d{5})?)/m)
  const location = locationMatch ? locationMatch[1].trim() : ''

  // Try to extract name (usually first line or near top, often in caps or bold)
  let name = 'Imported Resume'
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim()
    // Name is typically the first substantial line, often in caps or title case
    if (line.length > 3 && line.length < 50 && !line.includes('@') && !line.match(/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/)) {
      name = line.replace(/[^\w\s'-]/g, '').trim()
      if (name.length > 3) break
    }
  }

  // Helper function to find section content
  const extractSection = (headers: string[]): string => {
    const headerPattern = new RegExp(`^\\s*(${headers.join('|')})\\s*[:]*\\s*$`, 'im')
    const match = resumeText.match(headerPattern)
    if (!match) return ''

    const startIndex = match.index! + match[0].length
    const remainingText = resumeText.substring(startIndex)

    // Find next major section (all caps header)
    const nextSectionMatch = remainingText.match(/\n\s*[A-Z][A-Z\s]{3,}[:]*\s*\n/)
    const endIndex = nextSectionMatch ? nextSectionMatch.index! : remainingText.length

    return remainingText.substring(0, endIndex).trim()
  }

  // Extract Professional Summary
  const summaryHeaders = ['SUMMARY', 'PROFESSIONAL SUMMARY', 'PROFILE', 'OBJECTIVE', 'CAREER OBJECTIVE', 'ABOUT ME']
  const summary = extractSection(summaryHeaders)

  // Extract Skills
  const skillsHeaders = ['SKILLS', 'TECHNICAL SKILLS', 'CORE COMPETENCIES', 'EXPERTISE', 'TECHNOLOGIES']
  const skillsText = extractSection(skillsHeaders)
  let skills: string[] = []
  if (skillsText) {
    skills = skillsText.split(/[,\n•·\-\|]/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length < 50 && !s.match(/^[A-Z\s]{4,}$/)) // Exclude headers
      .slice(0, 20)
  }

  // Extract Work Experience
  const experienceHeaders = ['EXPERIENCE', 'WORK EXPERIENCE', 'PROFESSIONAL EXPERIENCE', 'EMPLOYMENT HISTORY', 'WORK HISTORY']
  const experienceText = extractSection(experienceHeaders)
  const experience: any[] = []

  if (experienceText) {
    // Split by job entries - typically starts with a job title (often bold/caps) followed by company
    const jobPattern = /([^\n]+?)\s*\n\s*([^\n]+?)(?:\n|\s+)([A-Z][a-z]+\s+\d{4}\s*[-–—]\s*(?:[A-Z][a-z]+\s+\d{4}|Present|Current))/gi
    let match

    while ((match = jobPattern.exec(experienceText)) !== null) {
      const [, titleLine, companyLine, dateRange] = match

      // Extract dates
      const dateMatch = dateRange.match(/([A-Z][a-z]+\s+\d{4})\s*[-–—]\s*([A-Z][a-z]+\s+\d{4}|Present|Current)/i)
      const startDate = dateMatch ? dateMatch[1] : ''
      const endDate = dateMatch ? dateMatch[2] : ''
      const current = endDate.match(/present|current/i) !== null

      // Get description (everything until next job or section)
      const descStart = match.index + match[0].length
      const remainingExp = experienceText.substring(descStart)
      const nextJobMatch = remainingExp.match(/\n\s*[A-Z][^\n]{10,50}\n\s*[A-Z]/m)
      const descEnd = nextJobMatch ? nextJobMatch.index! : Math.min(500, remainingExp.length)
      const description = remainingExp.substring(0, descEnd).trim()

      experience.push({
        title: titleLine.trim(),
        company: companyLine.trim().replace(/^\s*[-–—•]\s*/, ''),
        location: '',
        startDate,
        endDate: current ? 'Present' : endDate,
        current,
        description: description || ''
      })
    }

    // Fallback: if no structured jobs found, try simpler pattern
    if (experience.length === 0) {
      const simpleJobLines = experienceText.split('\n').filter(l => l.trim())
      for (let i = 0; i < simpleJobLines.length; i++) {
        const line = simpleJobLines[i].trim()
        // Look for lines that might be job titles (reasonable length, not all caps unless short)
        if (line.length > 5 && line.length < 80) {
          const nextLine = simpleJobLines[i + 1]?.trim() || ''
          const datePattern = /\d{4}\s*[-–—]\s*(?:\d{4}|Present)/

          if (datePattern.test(line) || datePattern.test(nextLine)) {
            experience.push({
              title: line.replace(datePattern, '').trim(),
              company: '',
              location: '',
              startDate: '',
              endDate: '',
              current: false,
              description: ''
            })
          }
        }
      }
    }
  }

  // Extract Education
  const educationHeaders = ['EDUCATION', 'ACADEMIC BACKGROUND', 'QUALIFICATIONS', 'ACADEMIC QUALIFICATIONS']
  const educationText = extractSection(educationHeaders)
  const education: any[] = []

  if (educationText) {
    // Look for degree patterns
    const degreePattern = /(Bachelor|Master|PhD|B\.?S\.?|M\.?S\.?|B\.?A\.?|M\.?A\.?|Associate|Doctorate)[^\n]*\n([^\n]+)\n?([^\n]*\d{4}[^\n]*)?/gi
    let match

    while ((match = degreePattern.exec(educationText)) !== null) {
      const [, degreeType, schoolLine, dateLine] = match

      // Extract graduation year
      const yearMatch = (dateLine || schoolLine).match(/\d{4}/)
      const graduationYear = yearMatch ? yearMatch[0] : ''

      // Extract GPA
      const gpaMatch = educationText.match(/GPA[:\s]*(\d+\.?\d*)/i)
      const gpa = gpaMatch ? gpaMatch[1] : ''

      education.push({
        degree: degreeType.trim(),
        field: match[0].replace(degreeType, '').split('\n')[0].trim(),
        school: schoolLine.trim(),
        location: '',
        startYear: '',
        endYear: graduationYear,
        graduationYear,
        gpa,
        honors: ''
      })
    }

    // Fallback: simpler education parsing
    if (education.length === 0) {
      const eduLines = educationText.split('\n').filter(l => l.trim())
      const degreeKeywords = /bachelor|master|phd|degree|b\.?s\.?|m\.?s\.?|b\.?a\.?|m\.?a\.?/i

      for (let i = 0; i < eduLines.length; i++) {
        const line = eduLines[i].trim()
        if (degreeKeywords.test(line)) {
          const yearMatch = line.match(/\d{4}/)
          education.push({
            degree: line,
            field: '',
            school: eduLines[i + 1]?.trim() || '',
            location: '',
            startYear: '',
            endYear: yearMatch ? yearMatch[0] : '',
            graduationYear: yearMatch ? yearMatch[0] : '',
            gpa: '',
            honors: ''
          })
          break
        }
      }
    }
  }

  // Extract Projects
  const projectHeaders = ['PROJECTS', 'PERSONAL PROJECTS', 'KEY PROJECTS', 'PORTFOLIO']
  const projectsText = extractSection(projectHeaders)
  const projects: any[] = []

  if (projectsText) {
    const projectLines = projectsText.split(/\n(?=[A-Z])/g).filter(l => l.trim())

    for (const projectBlock of projectLines.slice(0, 5)) {
      const lines = projectBlock.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length > 0) {
        const name = lines[0]
        const description = lines.slice(1).join('\n')

        // Look for technologies
        const techMatch = description.match(/(?:Technologies?|Tech Stack|Built with)[:\s]*([^\n]+)/i)
        const technologies = techMatch ? techMatch[1].trim() : ''

        projects.push({
          name,
          role: '',
          technologies,
          description: description.replace(/(?:Technologies?|Tech Stack|Built with)[:\s]*[^\n]+/i, '').trim(),
          url: ''
        })
      }
    }
  }

  // Extract Achievements/Awards
  const achievementHeaders = ['ACHIEVEMENTS', 'AWARDS', 'HONORS', 'CERTIFICATIONS', 'ACCOMPLISHMENTS']
  const achievementsText = extractSection(achievementHeaders)
  const achievements: any[] = []

  if (achievementsText) {
    const achievementLines = achievementsText.split(/\n/).filter(l => l.trim() && l.length > 5)

    for (const line of achievementLines.slice(0, 10)) {
      // Extract year if present
      const yearMatch = line.match(/\b(19|20)\d{2}\b/)
      const date = yearMatch ? yearMatch[0] : ''

      achievements.push({
        title: line.replace(/^[•\-\*]\s*/, '').trim(),
        description: '',
        date
      })
    }
  }

  return {
    personalInfo: {
      name: name || 'Imported Resume',
      email,
      phone,
      location,
      linkedin,
      github,
    },
    summary,
    skills,
    experience,
    education,
    projects,
    achievements,
  }
}

export async function POST(req: NextRequest) {
  try {
    const { resumeText } = await req.json()

    if (!resumeText || typeof resumeText !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid resume text' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY

    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey })

        const prompt = `You are a professional resume parser. Parse the following resume text and extract structured information.

Resume Text:
${resumeText}

Return a JSON object with this exact structure:
{
  "personalInfo": {
    "name": "Full name from resume",
    "email": "Email address",
    "phone": "Phone number",
    "location": "City, State or location",
    "linkedin": "LinkedIn URL if found",
    "github": "GitHub URL if found"
  },
  "summary": "Professional summary or objective if found, otherwise empty string",
  "skills": ["skill1", "skill2", ...],
  "experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "location": "City, State",
      "startDate": "MM/YYYY",
      "endDate": "MM/YYYY or Present",
      "current": false,
      "summary": "Brief paragraph summarizing the role and overall responsibilities (2-3 sentences, NO bullet point)",
      "keyContributions": [
        "Specific achievement or contribution (no bullet symbol, just the text)",
        "Another key contribution (no bullet symbol, just the text)",
        "Additional accomplishment (no bullet symbol, just the text)"
      ]
    }
  ],
  "education": [
    {
      "degree": "Degree name",
      "field": "Field of study",
      "school": "Institution name",
      "location": "City, State",
      "startYear": "YYYY",
      "endYear": "YYYY",
      "graduationYear": "YYYY",
      "gpa": "GPA if mentioned",
      "honors": "Honors/awards if mentioned"
    }
  ],
  "projects": [
    {
      "name": "Project name",
      "role": "Your role",
      "technologies": "Technologies used",
      "description": "Project description",
      "url": "Project URL if available"
    }
  ],
  "achievements": [
    {
      "title": "Achievement title",
      "description": "Achievement description",
      "date": "Date if available"
    }
  ]
}

IMPORTANT FORMATTING RULES:
1. For work experience, separate the role summary from specific achievements:
   - "summary": A paragraph describing overall responsibilities (NO bullets, just plain text)
   - "keyContributions": An array of specific achievements (each item is PLAIN TEXT without bullet symbols like •, -, or *)
2. DO NOT include bullet point symbols (•, -, *, etc.) in the keyContributions array - just the text content
3. Extract all information accurately. If a field is not found, use an empty string or empty array.
4. Clean up any bullet symbols from the original resume text before adding to keyContributions.`

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a professional resume parser. Output only valid JSON with the exact structure requested.' },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // Lower temperature for more accurate parsing
        })

        const content = response.choices[0]?.message?.content || '{}'
        const parsedData = JSON.parse(content)

        return NextResponse.json({
          success: true,
          data: parsedData
        })
      } catch (aiError: any) {
        console.error('AI parsing error:', aiError)
        // Fallback to basic parsing
        const fallbackData = fallbackParser(resumeText)
        return NextResponse.json({
          success: true,
          data: fallbackData,
          warning: 'Used fallback parsing due to AI service error'
        })
      }
    }

    // No OpenAI key: use fallback parser
    const fallbackData = fallbackParser(resumeText)
    return NextResponse.json({
      success: true,
      data: fallbackData,
      warning: 'OpenAI API key not configured, using basic parsing'
    })
  } catch (err: any) {
    console.error('parse error', err)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
