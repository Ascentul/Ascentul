import { Router, Request, Response } from "express"
import { storage } from "../storage"
import { z } from "zod"
import { openai } from "../utils/openai-client"

// Helper function to check if user is authenticated
function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.userId) {
    return res.status(401).json({ message: "Authentication required" })
  }
  next()
}

export const registerJobsAIRoutes = (router: Router) => {
  // Route for AI-assisted job application suggestions
  router.post(
    "/api/jobs/ai-assist",
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const { jobTitle, companyName, jobDescription } = req.body

        if (!jobTitle || !companyName || !jobDescription) {
          return res.status(400).json({
            message:
              "Missing required fields. Please provide jobTitle, companyName, and jobDescription."
          })
        }

        // Get user's most recent resume to personalize suggestions
        const userId = req.userId
        const resumes = await storage.getResumesByUserId(userId)

        // Sort by last updated
        resumes.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )

        // Get the most recent resume if available
        const resume = resumes.length > 0 ? resumes[0] : null

        // Generate personalized suggestions based on the job and user's resume
        const suggestions = await generateJobApplicationSuggestions(
          jobTitle,
          companyName,
          jobDescription,
          resume?.content || ""
        )

        res.json(suggestions)
      } catch (error) {
        console.error("Error generating AI job application suggestions:", error)
        res.status(500).json({
          message: "Failed to generate job application suggestions",
          error: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
  )
}

// Helper function to generate AI-powered job application suggestions
async function generateJobApplicationSuggestions(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  resumeContent: string
): Promise<any> {
  try {
    // Prepare the prompt
    const prompt = constructJobAssistantPrompt(
      jobTitle,
      companyName,
      jobDescription,
      resumeContent
    )

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using the smaller, faster gpt-4o-mini model instead of gpt-4o
      messages: [
        {
          role: "system",
          content:
            "You are an AI job application assistant that helps users customize their application materials for specific job opportunities. Provide concise, actionable suggestions based on the job description and the user's resume."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    })

    // Parse and return the suggestions
    const suggestionsContent = response.choices[0].message.content
    const suggestions = JSON.parse(suggestionsContent || "{}")

    return suggestions
  } catch (error) {
    console.error("Error calling OpenAI API:", error)
    throw new Error("Failed to generate job application suggestions")
  }
}

// Helper function to construct the prompt for the AI assistant
function constructJobAssistantPrompt(
  jobTitle: string,
  companyName: string,
  jobDescription: string,
  resumeContent: string
): string {
  return `
I need help customizing my job application for the following position:

Job Title: ${jobTitle}
Company: ${companyName}

Job Description:
${jobDescription}

My Resume Content:
${resumeContent || "No resume provided."}

Please provide me with the following in JSON format:
1. 5-7 tailored resume bullet points that highlight my relevant skills for this position
2. 3-5 suggested short responses for common application questions for this role
3. 3 cover letter paragraph snippets tailored to this company and position

Format your response as a JSON object with the following structure:
{
  "suggestions": {
    "resumeBulletPoints": ["Bullet 1", "Bullet 2", ...],
    "shortResponses": [
      { "question": "Question 1", "response": "Response 1" },
      { "question": "Question 2", "response": "Response 2" },
      ...
    ],
    "coverLetterSnippets": [
      { "title": "Introduction", "content": "Paragraph content..." },
      { "title": "Experience Highlight", "content": "Paragraph content..." },
      { "title": "Conclusion", "content": "Paragraph content..." }
    ]
  }
}
`
}
