#!/bin/bash

# Read and convert all userId instances in career-path.ts
echo "Fixing career-path.ts..."
cat > src/backend/career-path.ts.temp << 'EOL'
// filepath: /Users/andrew/dev/Ascentul/src/backend/career-path.ts
import { Express, Request, Response } from "express"
import { storage } from "./storage"
import { openai } from "./utils/openai-client"

// Session type declaration is now centralized in index.ts

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    "Warning: OPENAI_API_KEY is not set. Career path features will use mock data in development mode."
  )
}

// Function to generate career path from job title
async function generateCareerPathFromJobTitle(jobTitle: string) {
  try {
    // Create prompt focusing only on the job title
    const prompt = `
    Generate a detailed career path for someone who wants to become a "${jobTitle}".

    Generate a detailed career path with the following:
    1. A primary career path with 3-5 sequential roles (starting from entry-level to the "${jobTitle}" position and potential future progression), each with:
       - Job title
       - Level (entry, mid, senior, lead, executive)
       - Realistic salary range
       - Years of experience typically needed
       - Required skills (with skill level: basic, intermediate, advanced)
       - Growth potential (low, medium, high)
       - Brief description
       - Appropriate icon identifier (choose from: braces, cpu, database, briefcase, user, award, lineChart, layers, graduation, lightbulb, book)
    
    2. A list of transferable skills that would be valuable for this career path
    
    3. 3-5 recommended certifications or educational steps with provider, time to complete, difficulty level, and relevance
    
    4. A step-by-step development plan with timeframes to reach the "${jobTitle}" position

    5. Brief insights on the recommended path

    Format the response as a JSON object with the following structure:
    {
      "paths": [
        {
          "id": "main-path",
          "name": "${jobTitle} Career Path",
          "nodes": [
            {
              "id": "role-1",
              "title": "Role Title",
              "level": "entry|mid|senior|lead|executive",
              "salaryRange": "Range in USD",
              "experience": "Years required",
              "skills": [
                {
                  "name": "Skill Name",
                  "level": "basic|intermediate|advanced"
                }
              ],
              "growthPotential": "low|medium|high",
              "description": "Brief description of the role",
              "icon": "icon-identifier"
            }
          ],
          "skills": {
            "technical": ["Technical skill 1", "Technical skill 2"],
            "soft": ["Soft skill 1", "Soft skill 2"]
          },
          "certifications": [
            {
              "name": "Certification Name",
              "provider": "Provider name",
              "timeToComplete": "Estimated time",
              "difficulty": "beginner|intermediate|advanced",
              "relevance": "high|medium|low"
            }
          ],
          "developmentPlan": {
            "steps": [
              {
                "id": "step-1",
                "title": "Step title",
                "description": "Description of what to do",
                "timeframe": "Time required"
              }
            ]
          },
          "insights": "Brief insights about this career path"
        }
      ]
    }
    
    Be sure the output is strictly valid JSON that can be parsed, with all property values properly quoted.
    `

    const response = await openai.chat.completions.create({
      model: "gpt-4-1106-preview",
      messages: [
        {
          role: "system",
          content: "You are a career counselor who generates detailed career path information."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.3,
      response_format: { type: "json_object" }
    })

    const result = response.choices?.[0]?.message?.content
    if (!result) {
      throw new Error("Failed to generate career path content")
    }

    try {
      const parsed = JSON.parse(result)
      return parsed
    } catch (parseError) {
      console.error("Failed to parse generated career path JSON:", parseError)
      throw new Error("Generated content is not valid JSON")
    }
  } catch (error: any) {
    console.error("Error generating career path:", error.message)
    if (process.env.NODE_ENV === "development") {
      console.log("Using mock career path data due to error")
      return mockCareerPathResponse(jobTitle)
    }
    throw error
  }
}

// Mock response for development without OpenAI
function mockCareerPathResponse(jobTitle: string) {
  return {
    paths: [
      {
        id: "main-path",
        name: `${jobTitle} Career Path`,
        nodes: [
          {
            id: "role-1",
            title: "Junior Software Developer",
            level: "entry",
            salaryRange: "$60,000 - $80,000",
            experience: "0-2 years",
            skills: [
              { name: "JavaScript", level: "intermediate" },
              { name: "HTML/CSS", level: "intermediate" },
              { name: "Git", level: "basic" }
            ],
            growthPotential: "high",
            description: "Entry-level position focusing on front-end development and bug fixes.",
            icon: "braces"
          },
          {
            id: "role-2",
            title: "Software Developer",
            level: "mid",
            salaryRange: "$80,000 - $110,000",
            experience: "2-5 years",
            skills: [
              { name: "React", level: "intermediate" },
              { name: "Node.js", level: "intermediate" },
              { name: "SQL", level: "intermediate" }
            ],
            growthPotential: "high",
            description: "Mid-level role working on complete features and components.",
            icon: "cpu"
          },
          {
            id: "role-3",
            title: "Senior Software Developer",
            level: "senior",
            salaryRange: "$110,000 - $150,000",
            experience: "5-8 years",
            skills: [
              { name: "System Design", level: "advanced" },
              { name: "Cloud Services", level: "intermediate" },
              { name: "CI/CD", level: "intermediate" }
            ],
            growthPotential: "medium",
            description: "Senior role leading technical decisions and mentoring junior developers.",
            icon: "database"
          }
        ],
        skills: {
          technical: ["JavaScript", "React", "Node.js", "SQL", "Git", "System Design"],
          soft: ["Communication", "Problem Solving", "Teamwork", "Time Management"]
        },
        certifications: [
          {
            name: "AWS Certified Developer",
            provider: "Amazon Web Services",
            timeToComplete: "3-6 months",
            difficulty: "intermediate",
            relevance: "high"
          },
          {
            name: "Professional Scrum Developer",
            provider: "Scrum.org",
            timeToComplete: "1-2 months",
            difficulty: "intermediate",
            relevance: "medium"
          }
        ],
        developmentPlan: {
          steps: [
            {
              id: "step-1",
              title: "Build foundation",
              description: "Learn core web technologies: HTML, CSS, JavaScript",
              timeframe: "6-12 months"
            },
            {
              id: "step-2",
              title: "Gain practical experience",
              description: "Take on entry-level role or internship",
              timeframe: "1-2 years"
            },
            {
              id: "step-3",
              title: "Specialize",
              description: "Focus on front-end or back-end technologies",
              timeframe: "2-3 years"
            }
          ]
        },
        insights: "The software development career path offers strong growth potential with continuous learning requirements. New technologies emerge frequently, so adaptability is key to long-term success."
      }
    ]
  }
}

// Register all career path related routes
export function registerCareerPathRoutes(app: Express) {
  // Generate a career path from job title
  app.post("/api/career-paths/generate", async (req: Request, res: Response) => {
    try {
      const { jobTitle } = req.body
      if (!jobTitle) {
        return res.status(400).json({ error: "Job title is required" })
      }

      const careerPathData = await generateCareerPathFromJobTitle(jobTitle)
      return res.json(careerPathData)
    } catch (error: any) {
      console.error("Career path generation error:", error)
      return res.status(500).json({ error: error.message })
    }
  })

  // Save a career path
  app.post("/api/career-paths", async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" })
      }

      const { name, pathData } = req.body
      if (!name || !pathData) {
        return res.status(400)
          .json({ error: "Name and path data are required" })
      }

      // Convert userId to number for database compatibility
      const userIdNum = req.userId ? parseInt(req.userId) : undefined
      if (!userIdNum) {
        return res.status(401).json({ error: "Not authorized" })
      }
      const savedPath = await storage.saveCareerPath(userIdNum, name, pathData)

      return res.status(201).json(savedPath)
    } catch (error: any) {
      console.error("Career path save error:", error)
      return res.status(500).json({ error: error.message })
    }
  })

  // Get all career paths for the current user
  app.get("/api/career-paths", async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" })
      }
      
      // Convert userId to number for database compatibility
      const userIdNum = req.userId ? parseInt(req.userId) : undefined
      if (!userIdNum) {
        return res.status(401).json({ error: "Not authorized" })
      }
      const paths = await storage.getCareerPaths(userIdNum)
      
      return res.json(paths)
    } catch (error: any) {
      console.error("Error fetching career paths:", error)
      return res.status(500).json({ error: error.message })
    }
  })

  // Get a specific career path by ID
  app.get("/api/career-paths/:id", async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" })
      }
      
      const pathId = parseInt(req.params.id)
      if (isNaN(pathId)) {
        return res.status(400).json({ error: "Invalid path ID" })
      }
      
      // Convert userId to number for database compatibility
      const userIdNum = req.userId ? parseInt(req.userId) : undefined
      if (!userIdNum) {
        return res.status(401).json({ error: "Not authorized" })
      }
      
      const path = await storage.getCareerPathById(pathId)
      
      if (!path) {
        return res.status(404).json({ error: "Career path not found" })
      }
      
      // Check if this path belongs to the current user
      if (path.userId !== userIdNum) {
        return res.status(403).json({ error: "Not authorized to access this career path" })
      }
      
      return res.json(path)
    } catch (error: any) {
      console.error("Error fetching career path:", error)
      return res.status(500).json({ error: error.message })
    }
  })

  // Delete a career path
  app.delete("/api/career-paths/:id", async (req: Request, res: Response) => {
    try {
      if (!req.userId) {
        return res.status(401).json({ error: "Not authenticated" })
      }
      
      const pathId = parseInt(req.params.id)
      if (isNaN(pathId)) {
        return res.status(400).json({ error: "Invalid path ID" })
      }
      
      // Convert userId to number for database compatibility
      const userIdNum = req.userId ? parseInt(req.userId) : undefined
      if (!userIdNum) {
        return res.status(401).json({ error: "Not authorized" })
      }
      
      // First check if the path belongs to this user
      const path = await storage.getCareerPathById(pathId)
      if (!path) {
        return res.status(404).json({ error: "Career path not found" })
      }
      
      if (path.userId !== userIdNum) {
        return res.status(403).json({ error: "Not authorized to delete this career path" })
      }
      
      await storage.deleteCareerPath(pathId)
      return res.status(204).send()
    } catch (error: any) {
      console.error("Error deleting career path:", error)
      return res.status(500).json({ error: error.message })
    }
  })
}
EOL

# Move the temp file to replace the original
mv src/backend/career-path.ts.temp src/backend/career-path.ts

echo "Conversion complete!"
