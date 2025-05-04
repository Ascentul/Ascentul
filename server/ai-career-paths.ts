import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface CareerSkill {
  name: string;
  level: 'basic' | 'intermediate' | 'advanced';
}

export interface CareerNode {
  id: string;
  title: string;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'executive';
  salaryRange: string;
  yearsExperience: string;
  skills: CareerSkill[];
  description: string;
  growthPotential: 'low' | 'medium' | 'high';
  icon: string; // Icon name that will be mapped on the frontend
}

export interface CareerPath {
  id: string;
  name: string;
  nodes: CareerNode[];
  description: string;
}

export async function generateCareerPaths(profileData: any): Promise<CareerPath[]> {
  try {
    // Extract relevant details from profile data
    const workHistory = profileData.workHistory || [];
    const education = profileData.education || [];
    const skills = profileData.skills || [];
    const certifications = profileData.certifications || [];
    const careerSummary = profileData.careerSummary || '';
    
    // Format the data for the prompt
    const workHistoryText = workHistory.map((job: any) => 
      `${job.title} at ${job.company} (${job.startDate} to ${job.endDate || 'Present'}): ${job.description || ''}`
    ).join('\n');
    
    const educationText = education.map((edu: any) => 
      `${edu.degree} in ${edu.fieldOfStudy} from ${edu.school} (${edu.graduationYear || 'In progress'})`
    ).join('\n');
    
    const skillsText = skills.map((skill: any) => 
      `${skill.name} (${skill.level || 'intermediate'})`
    ).join(', ');
    
    const certificationsText = certifications.map((cert: any) => 
      `${cert.name} from ${cert.issuingOrganization || 'Unknown'}`
    ).join(', ');

    const systemPrompt = `You are a career advisor AI specializing in creating personalized career path roadmaps based on an individual's professional background, education, and skills.`;
    
    const userPrompt = `Create three distinct, personalized career paths for a professional with the following profile:

CAREER SUMMARY:
${careerSummary}

WORK HISTORY:
${workHistoryText || 'No work history provided'}

EDUCATION:
${educationText || 'No education history provided'}

SKILLS:
${skillsText || 'No skills provided'}

CERTIFICATIONS:
${certificationsText || 'No certifications provided'}

For each career path:
1. Identify one specific track/specialization that leverages their existing skills and background
2. Create a logical progression of 4-5 roles from their current level upward
3. For each role, specify required skills, typical experience needed, salary range, and growth potential

Return your response as a JSON object with the following structure:
{
  "paths": [
    {
      "id": "generate-a-unique-string-id",
      "name": "Path Name (e.g., 'Data Science Leadership Track')",
      "description": "Brief overview of this career path and why it's suitable for them",
      "nodes": [
        {
          "id": "generate-a-unique-string-id",
          "title": "Job Title",
          "level": "entry|mid|senior|lead|executive",
          "salaryRange": "Salary range in USD",
          "yearsExperience": "Typical years of experience required",
          "skills": [
            {"name": "Skill Name", "level": "basic|intermediate|advanced"}
          ],
          "description": "Role description and responsibilities",
          "growthPotential": "low|medium|high",
          "icon": "Choose one: Briefcase, Code, Database, ChartBar, Brain, Users, Presentation"
        }
      ]
    }
  ]
}

Focus on creating realistic, well-structured career paths that reflect actual industry roles and expectations.`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const jsonString = response.choices[0].message.content;
    
    if (!jsonString) {
      throw new Error("Failed to generate career paths");
    }
    
    // Parse the response from OpenAI
    const parsedResults = JSON.parse(jsonString);
    
    if (Array.isArray(parsedResults.paths)) {
      return parsedResults.paths;
    } else {
      throw new Error("Unexpected response format from OpenAI");
    }
    
  } catch (error) {
    console.error("Error generating career paths:", error);
    return [];
  }
}