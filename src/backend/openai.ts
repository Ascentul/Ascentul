import OpenAI from "openai"
import { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { validateModelAndGetId, DEFAULT_MODEL } from "./utils/models-config"
import { Express, Request, Response } from "express"
import { openai } from "./utils/openai-client"
import { storage } from "./storage"
import multer from "multer"
import { v4 as uuidv4 } from "uuid"
import { existsSync, promises as fs } from "fs"
import * as path from "path"
import { extractTextFromPDF } from "./pdf-extractor"

// Check for OpenAI API key and fail fast if missing
if (!process.env.OPENAI_API_KEY && process.env.NODE_ENV === "production") {
  throw new Error(
    "❌ OPENAI_API_KEY not found — please add it in Replit Secrets."
  )
} else if (!process.env.OPENAI_API_KEY) {

    ) {
      return "There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key."
    }

    return "Unable to generate cover letter suggestions at this time. Please try again later."
  }
}

// Generate full cover letter
export async function generateCoverLetter(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  careerData: {
    careerSummary: string | null
    workHistory: string
    education: string
    skills: string[]
    certifications: string
  },
  userProfile?: any // Optional user profile object with name, email, etc.
): Promise<string> {
  try {
    // Log the user profile to debug what we're receiving

    ) {
      return "There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key."
    }

    return "Unable to generate cover letter at this time. Please try again later."
  }
}

// Generate interview questions
export async function generateInterviewQuestions(
  jobTitle: string,
  skills: string[]
): Promise<{
  behavioral: { question: string; suggestedAnswer: string }[]
  technical: { question: string; suggestedAnswer: string }[]
}> {
  try {
    const prompt = `Generate interview questions for a ${jobTitle} position where the candidate has the following skills: ${skills.join(
      ", "
    )}.

Provide your response in JSON format with these fields:
1. behavioral: An array of objects containing behavioral questions and suggested answers
2. technical: An array of objects containing technical questions and suggested answers

Each question object should have:
- question: The interview question
- suggestedAnswer: A brief outline of how to structure a good response

Generate 3 behavioral questions and 3 technical questions.`

    const response = await openaiInstance.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content || "{}"
    const parsedResponse = JSON.parse(content)

    return {
      behavioral: parsedResponse.behavioral || [],
      technical: parsedResponse.technical || []
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error)

    // Check for API key issues
    if (
      error.message &&
      (error.message.includes("API key") || error.status === 401)
    ) {
      return {
        behavioral: [
          {
            question: "There's an issue with the OpenAI API key configuration.",
            suggestedAnswer:
              "Please contact the administrator to set up a valid API key."
          }
        ],
        technical: []
      }
    }

    return {
      behavioral: [
        {
          question: "Unable to generate questions at this time.",
          suggestedAnswer: ""
        }
      ],
      technical: []
    }
  }
}

// Get career goals suggestions
export interface RoleInsightResponse {
  suggestedRoles: {
    title: string
    description: string
    keySkills: string[]
    salaryRange: string
    growthPotential: "low" | "medium" | "high"
    timeToAchieve: string
  }[]
  transferableSkills: {
    skill: string
    relevance: string
    currentProficiency: "basic" | "intermediate" | "advanced"
  }[]
  recommendedCertifications: {
    name: string
    provider: string
    timeToComplete: string
    difficulty: "beginner" | "intermediate" | "advanced"
    relevance: string
  }[]
  developmentPlan: {
    step: string
    timeframe: string
    description: string
  }[]
  insights: string
}

export async function generateRoleInsights(
  currentRole: string,
  yearsExperience: number,
  industry: string,
  workHistory: any[]
): Promise<RoleInsightResponse> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openaiInstance.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a career development AI that provides detailed insights and recommendations for career progression. " +
            "Analyze the user's work history and current role to suggest realistic next steps in their career path. " +
            "Be specific, practical, and realistic with recommendations. " +
            "Focus on job roles that build on their existing experience while providing growth opportunities. " +
            "You will return a structured JSON response with suggested roles, transferable skills analysis, certification recommendations, and a development plan."
        },
        {
          role: "user",
          content: JSON.stringify({
            currentRole,
            yearsExperience,
            industry,
            workHistory
          })
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    })

    // Parse the JSON response
    const content = response.choices[0].message.content || "{}"
    let result
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      result = {} // Use empty object as fallback
    }

    // Ensure the result matches our expected structure
    return {
      suggestedRoles: result.suggestedRoles || [],
      transferableSkills: result.transferableSkills || [],
      recommendedCertifications: result.recommendedCertifications || [],
      developmentPlan: result.developmentPlan || [],
      insights: result.insights || ""
    }
  } catch (error: any) {
    console.error("Error generating role insights:", error)
    const errorMessage =
      error && error.message ? error.message : "Unknown error"
    throw new Error("Failed to generate role insights: " + errorMessage)
  }
}

// Optimize career data based on job description
export async function optimizeCareerData(
  careerData: any,
  jobDescription: string
): Promise<any> {
  try {
    // Convert career data to a structured format for the AI
    const workHistoryText =
      careerData.workHistory && careerData.workHistory.length > 0
        ? careerData.workHistory
            .map((item: any) => {
              const endDate = item.currentJob
                ? "Present"
                : item.endDate
                ? new Date(item.endDate).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric"
                  })
                : "N/A"
              return `Company: ${item.company}
Position: ${item.position}
Duration: ${new Date(item.startDate).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric"
              })} - ${endDate}
Description: ${item.description || "No description provided"}
Achievements: ${
                item.achievements ? item.achievements.join("; ") : "None listed"
              }
ID: ${item.id}`
            })
            .join("\n\n")
        : "No work history provided"

    const skillsText =
      careerData.skills && careerData.skills.length > 0
        ? careerData.skills.map((skill: any) => skill.name).join(", ")
        : "No skills provided"

    const prompt = `You are an expert career coach specializing in resume optimization. Based on the user's existing career data and the job description, provide optimized career data that truthfully enhances their profile WITHOUT inventing new experiences or qualifications.

User's Current Work History:
${workHistoryText}

User's Current Skills:
${skillsText}

User's Current Career Summary:
${careerData.careerSummary || "No career summary provided"}

Job Description:
${jobDescription}

Create optimized career data that highlights relevant experiences and skills for this specific job opportunity. Your response should be in JSON format with the following structure:

{
  "careerSummary": "An improved career summary that emphasizes relevant experience for this job",
  "workHistory": [
    {
      "id": 1, // Keep the original ID from the input data
      "description": "Enhanced job description highlighting relevant achievements and responsibilities",
      "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"]
    },
    // Include all work history items from the original data, with improved descriptions and achievements
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8", "Skill 9", "Skill 10"],
  "explanations": {
    "summary": "Brief explanation of how the summary was improved",
    "workHistory": "Brief explanation of how work history was enhanced",
    "skills": "Brief explanation of skill recommendations"
  }
}

IMPORTANT RULES:
1. Do NOT invent new work experiences, positions, or companies
2. Do NOT invent qualifications the person doesn't have
3. DO enhance existing content to better showcase relevant skills and experiences
4. DO maintain the original IDs for all work history items
5. DO include both current and enhanced skills relevant to the job
6. ONLY include truthful information based on the user's existing career data`

    const response = await openaiInstance.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 3000
    })

    const content = response.choices[0].message.content || "{}"
    const parsedResponse = JSON.parse(content)

    return parsedResponse
  } catch (error: any) {
    console.error("OpenAI API error:", error)

    // Check for API key issues
    if (
      error.message &&
      (error.message.includes("API key") || error.status === 401)
    ) {
      throw new Error(
        "There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key."
      )
    }

    throw new Error(
      "An error occurred while optimizing career data. Please try again later."
    )
  }
}

export async function suggestCareerGoals(
  currentPosition: string,
  desiredPosition: string,
  timeframe: string,
  skills: string[]
): Promise<{
  shortTerm: { title: string; description: string }[]
  mediumTerm: { title: string; description: string }[]
  longTerm: { title: string; description: string }[]
}> {
  try {
    const prompt = `As a career coach, suggest career goals for someone currently in a ${currentPosition} position who wants to become a ${desiredPosition} within ${timeframe}. They have these skills: ${skills.join(
      ", "
    )}.

Provide your response in JSON format with these fields:
1. shortTerm: An array of goal objects to complete in the next 3 months
2. mediumTerm: An array of goal objects to complete in the next 3-12 months
3. longTerm: An array of goal objects to complete in 1+ years

Each goal object should have:
- title: A concise goal title (max 50 characters)
- description: A brief description explaining the goal and its importance (max 150 characters)

Generate 3 goals for each timeframe.`

    const response = await openaiInstance.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0].message.content || "{}"
    let parsedResponse
    try {
      parsedResponse = JSON.parse(content)
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError)
      parsedResponse = {
        shortTerm: [],
        mediumTerm: [],
        longTerm: []
      }
    }

    return {
      shortTerm: parsedResponse.shortTerm || [],
      mediumTerm: parsedResponse.mediumTerm || [],
      longTerm: parsedResponse.longTerm || []
    }
  } catch (error: any) {
    console.error("OpenAI API error:", error)

    // Check for API key issues
    if (
      error.message &&
      (error.message.includes("API key") || error.status === 401)
    ) {
      return {
        shortTerm: [
          {
            title: "API Configuration Issue",
            description:
              "There's an issue with the OpenAI API key. Please contact the administrator to set up a valid API key."
          }
        ],
        mediumTerm: [],
        longTerm: []
      }
    }

    return {
      shortTerm: [
        { title: "Unable to generate goals at this time.", description: "" }
      ],
      mediumTerm: [],
      longTerm: []
    }
  }
}
