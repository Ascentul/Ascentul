import { Express, Request, Response } from "express";
import { storage } from "./storage";
import OpenAI from "openai";
import session from "express-session";

// Session type declaration is now centralized in index.ts

if (!process.env.OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY is not set. Career path features will not work properly.");
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
              "yearsExperience": "Required experience",
              "skills": [
                {
                  "name": "Skill Name",
                  "level": "basic|intermediate|advanced"
                }
              ],
              "growthPotential": "low|medium|high",
              "description": "Brief description",
              "icon": "icon-identifier"
            }
          ]
        }
      ],
      "transferableSkills": [
        {
          "skill": "Skill name",
          "relevance": "Brief explanation of relevance",
          "currentProficiency": "basic|intermediate|advanced"
        }
      ],
      "recommendedCertifications": [
        {
          "name": "Certification name",
          "provider": "Provider name",
          "timeToComplete": "Time estimate",
          "difficulty": "beginner|intermediate|advanced",
          "relevance": "Why it's relevant"
        }
      ],
      "developmentPlan": [
        {
          "step": "Step description",
          "timeframe": "Time estimate",
          "description": "More details"
        }
      ],
      "insights": "General insights and advice"
    }`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career development expert with detailed knowledge of career paths, skills, and job market trends across many industries. Your recommendations should be realistic, specific, and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI service");
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating career path from job title:", error);
    throw new Error(`Failed to generate career path: ${error.message}`);
  }
}

// Function to generate career path using OpenAI
async function generateCareerPath(data: any) {
  try {
    // Prepare work history data for the prompt
    const workHistory = data.workHistory ? data.workHistory.map((job: any) => {
      return `Company: ${job.company}, Position: ${job.position}, ${job.currentJob ? 'Current job' : `${job.startDate} to ${job.endDate || 'present'}`}${job.description ? `, Description: ${job.description}` : ''}`;
    }).join('\n') : 'No work history provided';

    // Create prompt with all available data
    const prompt = `
    Based on the following information, generate a personalized career path with multiple potential progression routes.

    Current information:
    - Current job title: ${data.currentJobTitle}
    - Years of experience: ${data.yearsOfExperience || 'Not specified'}
    - Work history: 
    ${workHistory}
    ${data.desiredRole ? `- Desired future role: ${data.desiredRole}` : ''}
    ${data.desiredField ? `- Desired industry/field: ${data.desiredField}` : ''}
    ${data.desiredTimeframe ? `- Timeframe: ${data.desiredTimeframe} years` : ''}
    ${data.additionalInfo ? `- Additional information: ${data.additionalInfo}` : ''}

    Generate a detailed career path with the following:
    1. A primary career path with 3-5 sequential roles (including current role), each with:
       - Job title
       - Level (entry, mid, senior, lead, executive)
       - Realistic salary range
       - Years of experience typically needed
       - Required skills (with skill level: basic, intermediate, advanced)
       - Growth potential (low, medium, high)
       - Brief description
       - Appropriate icon identifier (choose from: braces, cpu, database, briefcase, user, award, lineChart, layers, graduation, lightbulb, book)
    
    2. A list of transferable skills the person currently has, their relevance to the career path, and their current proficiency
    
    3. 3-5 recommended certifications or educational steps with provider, time to complete, difficulty level, and relevance
    
    4. A step-by-step development plan with timeframes

    5. Brief insights on the recommended path

    Format the response as a JSON object with the following structure:
    {
      "paths": [
        {
          "id": "main-path",
          "name": "Primary Career Path",
          "nodes": [
            {
              "id": "role-1",
              "title": "Role Title",
              "level": "entry|mid|senior|lead|executive",
              "salaryRange": "Range in USD",
              "yearsExperience": "Required experience",
              "skills": [
                {
                  "name": "Skill Name",
                  "level": "basic|intermediate|advanced"
                }
              ],
              "growthPotential": "low|medium|high",
              "description": "Brief description",
              "icon": "icon-identifier"
            }
          ]
        }
      ],
      "transferableSkills": [
        {
          "skill": "Skill name",
          "relevance": "Brief explanation of relevance",
          "currentProficiency": "basic|intermediate|advanced"
        }
      ],
      "recommendedCertifications": [
        {
          "name": "Certification name",
          "provider": "Provider name",
          "timeToComplete": "Time estimate",
          "difficulty": "beginner|intermediate|advanced",
          "relevance": "Why it's relevant"
        }
      ],
      "developmentPlan": [
        {
          "step": "Step description",
          "timeframe": "Time estimate",
          "description": "More details"
        }
      ],
      "insights": "General insights and advice"
    }`;

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a career development expert with detailed knowledge of career paths, skills, and job market trends across many industries. Your recommendations should be realistic, specific, and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
    });

    // Parse the response
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI service");
    }

    return JSON.parse(content);
  } catch (error: any) {
    console.error("Error generating career path:", error);
    throw new Error(`Failed to generate career path: ${error.message}`);
  }
}

// Register API endpoints
export function registerCareerPathRoutes(app: Express) {
  // Generate a career path from job title
  app.post("/api/career-path/generate-from-job", async (req: Request, res: Response) => {
    try {
      const { jobTitle } = req.body;
      
      if (!jobTitle) {
        return res.status(400).json({ error: "Job title is required" });
      }

      const result = await generateCareerPathFromJobTitle(jobTitle);
      return res.json(result);
    } catch (error: any) {
      console.error("Career path generation error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Generate a career path
  app.post("/api/career-path/generate", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated using session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const result = await generateCareerPath(req.body);
      return res.json(result);
    } catch (error: any) {
      console.error("Career path generation error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Save a generated career path
  app.post("/api/career-path/save", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated using session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const { name, pathData } = req.body;
      
      if (!name || !pathData) {
        return res.status(400).json({ error: "Name and path data are required" });
      }

      const userId = req.session.userId;
      const savedPath = await storage.saveCareerPath(userId, name, pathData);
      
      return res.status(201).json(savedPath);
    } catch (error: any) {
      console.error("Career path save error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Get saved career paths for a user
  app.get("/api/career-path/saved", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated using session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const userId = req.session.userId;
      const savedPaths = await storage.getUserCareerPaths(userId);
      
      return res.json(savedPaths);
    } catch (error: any) {
      console.error("Fetch saved career paths error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Get a specific saved career path
  app.get("/api/career-path/saved/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated using session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const pathId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(pathId)) {
        return res.status(400).json({ error: "Invalid path ID" });
      }

      const path = await storage.getCareerPath(pathId);
      
      if (!path) {
        return res.status(404).json({ error: "Career path not found" });
      }

      if (path.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      return res.json(path);
    } catch (error: any) {
      console.error("Fetch career path error:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // Delete a saved career path
  app.delete("/api/career-path/saved/:id", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated using session
      if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const pathId = parseInt(req.params.id);
      const userId = req.session.userId;
      
      if (isNaN(pathId)) {
        return res.status(400).json({ error: "Invalid path ID" });
      }

      const path = await storage.getCareerPath(pathId);
      
      if (!path) {
        return res.status(404).json({ error: "Career path not found" });
      }

      if (path.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      await storage.deleteCareerPath(pathId);
      return res.sendStatus(204);
    } catch (error: any) {
      console.error("Delete career path error:", error);
      return res.status(500).json({ error: error.message });
    }
  });
}