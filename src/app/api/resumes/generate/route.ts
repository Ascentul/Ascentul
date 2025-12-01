import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { evaluate } from '@/lib/ai-evaluation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin_url?: string;
  github_url?: string;
  bio?: string;
  job_title?: string;
  company?: string;
  skills?: string | string[];
  current_position?: string;
  current_company?: string;
  education?: string;
  university_name?: string;
  major?: string;
  graduation_year?: string;
  experience_level?: string;
  industry?: string;
  work_history?: any[];
  education_history?: any[];
  achievements_history?: any[];
  projects?: any[];
}

function generateBasicResume(jobDescription: string, userProfile?: UserProfile) {
  // Extract key requirements from job description
  const jdLower = jobDescription.toLowerCase();
  const hasReact = jdLower.includes('react');
  const hasNode = jdLower.includes('node') || jdLower.includes('backend');
  const hasPython = jdLower.includes('python');
  const hasAI = jdLower.includes('ai') || jdLower.includes('machine learning');

  const suggestedSkills = [];
  if (hasReact) suggestedSkills.push('React', 'JavaScript', 'TypeScript', 'HTML/CSS');
  if (hasNode) suggestedSkills.push('Node.js', 'Express', 'RESTful APIs');
  if (hasPython) suggestedSkills.push('Python', 'Django', 'Flask');
  if (hasAI) suggestedSkills.push('Machine Learning', 'TensorFlow', 'Data Analysis');

  // Use user profile skills if available
  const profileSkills = userProfile?.skills
    ? Array.isArray(userProfile.skills)
      ? userProfile.skills
      : userProfile.skills.split(',').map((s) => s.trim())
    : [];
  const allSkills = Array.from(new Set([...profileSkills, ...suggestedSkills])).slice(0, 12);

  // Build experience section from work history
  let experience: any[] = [];
  if (
    userProfile?.work_history &&
    Array.isArray(userProfile.work_history) &&
    userProfile.work_history.length > 0
  ) {
    experience = userProfile.work_history.map((job: any) => ({
      title: job.role || '',
      company: job.company || '',
      startDate: job.start_date || '',
      endDate: job.is_current ? 'Present' : job.end_date || '',
      location: job.location || '',
      description: job.summary || 'Key responsibilities and achievements in this role.',
    }));
  } else if (userProfile?.current_position) {
    // Fallback to current position if no work history
    experience = [
      {
        title: userProfile.current_position,
        company: userProfile.current_company || '',
        startDate: 'Present',
        endDate: '',
        description: 'Key responsibilities and achievements in this role.',
      },
    ];
  }

  // Build education section from education history
  let education: any[] = [];
  if (
    userProfile?.education_history &&
    Array.isArray(userProfile.education_history) &&
    userProfile.education_history.length > 0
  ) {
    education = userProfile.education_history.map((edu: any) => ({
      degree: `${edu.degree || 'Bachelor'} in ${edu.field_of_study || 'Field'}`,
      school: edu.institution || edu.school || '',
      graduationYear: edu.end_date || edu.graduation_date || edu.end_year || '',
      gpa: edu.gpa || undefined,
    }));
  } else if (userProfile?.university_name) {
    // Fallback to basic education if no education history
    education = [
      {
        degree: userProfile.major || 'Bachelor of Science',
        school: userProfile.university_name,
        graduationYear: userProfile.graduation_year || '',
      },
    ];
  }

  // Build projects section from projects
  let projects: any[] = [];
  if (
    userProfile?.projects &&
    Array.isArray(userProfile.projects) &&
    userProfile.projects.length > 0
  ) {
    projects = userProfile.projects.map((proj: any) => ({
      title: proj.title || 'Project',
      role: proj.role || undefined,
      company: proj.company || undefined,
      startDate: proj.start_date
        ? new Date(proj.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : undefined,
      endDate: proj.end_date
        ? new Date(proj.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : undefined,
      description: proj.description || '',
      technologies: proj.technologies || [],
      url: proj.url || undefined,
      github_url: proj.github_url || undefined,
    }));
  }

  // Build achievements section from achievements history
  let achievements: any[] = [];
  if (
    userProfile?.achievements_history &&
    Array.isArray(userProfile.achievements_history) &&
    userProfile.achievements_history.length > 0
  ) {
    achievements = userProfile.achievements_history.map((ach: any) => ({
      title: ach.title || 'Achievement',
      organization: ach.organization || undefined,
      date: ach.date || undefined,
      description: ach.description || '',
    }));
  }

  const personalInfo: any = {
    name: userProfile?.name || 'Your Name',
    email: userProfile?.email || 'email@example.com',
    phone: userProfile?.phone || '',
    location: userProfile?.location || '',
  };

  // Only include social links if they have actual values
  if (userProfile?.linkedin_url) personalInfo.linkedin = userProfile.linkedin_url;
  if (userProfile?.github_url) personalInfo.github = userProfile.github_url;

  return {
    personalInfo,
    summary:
      userProfile?.bio ||
      'Experienced professional seeking to leverage skills and expertise in a challenging role that aligns with career goals and contributes to organizational success.',
    skills: allSkills,
    experience,
    education,
    projects: projects.length > 0 ? projects : undefined,
    achievements: achievements.length > 0 ? achievements : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, userProfile } = await req.json();

    if (!jobDescription) {
      return NextResponse.json({ error: 'Missing job description' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (apiKey) {
      try {
        const client = new OpenAI({ apiKey });

        let profileContext = userProfile
          ? `
User Profile:
Name: ${userProfile.name || 'N/A'}
Email: ${userProfile.email || 'N/A'}
Phone: ${userProfile.phone || 'N/A'}
Location: ${userProfile.location || 'N/A'}
Current Position: ${userProfile.current_position || 'N/A'}
Company: ${userProfile.current_company || 'N/A'}
Skills: ${Array.isArray(userProfile.skills) ? userProfile.skills.join(', ') : userProfile.skills || 'N/A'}
Education: ${userProfile.university_name || 'N/A'} - ${userProfile.major || 'N/A'}
Bio: ${userProfile.bio || 'N/A'}
LinkedIn: ${userProfile.linkedin_url || 'N/A'}
GitHub: ${userProfile.github_url || 'N/A'}
`
          : '';

        // Add work history to context if available
        if (
          userProfile?.work_history &&
          Array.isArray(userProfile.work_history) &&
          userProfile.work_history.length > 0
        ) {
          profileContext += '\nWork History:\n';
          userProfile.work_history.forEach((job: any, idx: number) => {
            profileContext += `${idx + 1}. ${job.role || 'N/A'} at ${job.company || 'N/A'}\n`;
            profileContext += `   Duration: ${job.start_date || 'N/A'} - ${job.is_current ? 'Present' : job.end_date || 'N/A'}\n`;
            if (job.location) profileContext += `   Location: ${job.location}\n`;
            if (job.summary) profileContext += `   Summary: ${job.summary}\n`;
            profileContext += '\n';
          });
        }

        // Add education history if available
        if (
          userProfile?.education_history &&
          Array.isArray(userProfile.education_history) &&
          userProfile.education_history.length > 0
        ) {
          profileContext += '\nEducation History:\n';
          userProfile.education_history.forEach((edu: any, idx: number) => {
            profileContext += `${idx + 1}. ${edu.degree || 'N/A'} in ${edu.field_of_study || 'N/A'}\n`;
            profileContext += `   Institution: ${edu.institution || edu.school || 'N/A'}\n`;
            profileContext += `   Duration: ${edu.start_year || edu.start_date || 'N/A'} - ${edu.is_current ? 'Present' : edu.end_year || edu.end_date || edu.graduation_date || 'N/A'}\n`;
            if (edu.gpa) profileContext += `   GPA: ${edu.gpa}\n`;
            if (edu.activities || edu.description)
              profileContext += `   Activities: ${edu.activities || edu.description}\n`;
            profileContext += '\n';
          });
        }

        // Add projects if available
        if (
          userProfile?.projects &&
          Array.isArray(userProfile.projects) &&
          userProfile.projects.length > 0
        ) {
          profileContext += '\nProjects:\n';
          userProfile.projects.forEach((proj: any, idx: number) => {
            profileContext += `${idx + 1}. ${proj.title || 'N/A'}\n`;
            if (proj.role) profileContext += `   Role: ${proj.role}\n`;
            if (proj.company) profileContext += `   Company: ${proj.company}\n`;
            if (proj.start_date || proj.end_date) {
              const startDate = proj.start_date
                ? new Date(proj.start_date).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'N/A';
              const endDate = proj.end_date
                ? new Date(proj.end_date).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })
                : 'Present';
              profileContext += `   Duration: ${startDate} - ${endDate}\n`;
            }
            if (proj.description) profileContext += `   Description: ${proj.description}\n`;
            if (proj.technologies && proj.technologies.length > 0)
              profileContext += `   Technologies: ${proj.technologies.join(', ')}\n`;
            if (proj.url) profileContext += `   URL: ${proj.url}\n`;
            if (proj.github_url) profileContext += `   GitHub: ${proj.github_url}\n`;
            profileContext += '\n';
          });
        }

        // Add achievements if available
        if (
          userProfile?.achievements_history &&
          Array.isArray(userProfile.achievements_history) &&
          userProfile.achievements_history.length > 0
        ) {
          profileContext += '\nAchievements & Awards:\n';
          userProfile.achievements_history.forEach((ach: any, idx: number) => {
            profileContext += `${idx + 1}. ${ach.title || 'N/A'}\n`;
            if (ach.organization) profileContext += `   Organization: ${ach.organization}\n`;
            if (ach.date) profileContext += `   Date: ${ach.date}\n`;
            if (ach.description) profileContext += `   Description: ${ach.description}\n`;
            profileContext += '\n';
          });
        }

        const prompt = `You are a professional resume writer. Generate an ATS-optimized resume tailored to the following job description.
${profileContext}

Job Description:
${jobDescription}

Return a JSON object with this structure:
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string (optional)",
    "location": "string (optional)",
    "linkedin": "string (only if user has a LinkedIn URL)",
    "github": "string (only if user has a GitHub URL)"
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
  ],
  "projects": [
    {
      "title": "Project Title",
      "role": "Your Role (optional)",
      "company": "Company (optional)",
      "startDate": "MM/YYYY (optional)",
      "endDate": "MM/YYYY or Present (optional)",
      "description": "Project description and key accomplishments",
      "technologies": ["tech1", "tech2", ...],
      "url": "Project URL (optional)",
      "github_url": "GitHub URL (optional)"
    }
  ],
  "achievements": [
    {
      "title": "Achievement Title",
      "organization": "Organization Name (optional)",
      "date": "Date (optional)",
      "description": "Achievement description"
    }
  ]
}

IMPORTANT:
- Only include social media links (linkedin, github) in personalInfo if the user profile explicitly provides them. Do not generate or invent social media URLs. Omit these fields if not provided in the user profile.
- Only include "projects" section if the user has projects in their profile. Omit if not provided.
- Only include "achievements" section if the user has achievements in their profile. Omit if not provided.

If user profile is provided, use that information. Otherwise, create a template based on the job requirements.
Focus on keywords from the job description. Make it ATS-friendly.`;

        const response = await client.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Output only valid JSON.',
            },
            { role: 'user', content: prompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content || '{}';
        const resumeData = JSON.parse(content);

        // Clean up empty social links from AI response
        if (resumeData.personalInfo) {
          if (!resumeData.personalInfo.linkedin) delete resumeData.personalInfo.linkedin;
          if (!resumeData.personalInfo.github) delete resumeData.personalInfo.github;
        }

        // Evaluate AI-generated resume (non-blocking for now)
        try {
          const evalResult = await evaluate({
            tool_id: 'resume-generation',
            input: { jobDescription, userProfile },
            output: resumeData,
          });

          if (!evalResult.passed) {
            console.warn('[AI Evaluation] Resume generation failed evaluation:', {
              score: evalResult.overall_score,
              risk_flags: evalResult.risk_flags,
              explanation: evalResult.explanation,
            });
          }
        } catch (evalError) {
          // Don't block on evaluation failures
          console.error('[AI Evaluation] Error evaluating resume:', evalError);
        }

        return NextResponse.json({
          success: true,
          resume: resumeData,
        });
      } catch (aiError: any) {
        console.error('AI generation error:', aiError);
        // Fallback to basic generation
        const basicResume = generateBasicResume(jobDescription, userProfile);
        return NextResponse.json({
          success: true,
          resume: basicResume,
          warning: 'Used fallback generation due to AI service error',
        });
      }
    }

    // No OpenAI key: use basic generation
    const basicResume = generateBasicResume(jobDescription, userProfile);
    return NextResponse.json({
      success: true,
      resume: basicResume,
    });
  } catch (err: any) {
    console.error('generate error', err);
    return NextResponse.json({ error: 'Failed to generate resume' }, { status: 500 });
  }
}
