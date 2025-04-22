import { OpenAI } from "openai";
import crypto from "crypto";
import { z } from "zod";
import { storage } from "./storage";

// Create OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const hasMockFlag = !process.env.OPENAI_API_KEY;
if (hasMockFlag) {
  console.log("OPENAI_API_KEY is not set. Using mock OpenAI mode for skill stacker features.");
}

// Interface for AI-generated Skill Stacker tasks
export interface SkillStackerTaskData {
  title: string;
  description: string;
  type: "learning" | "practice" | "project";
  estimatedHours: number;
  resources: string[];
}

// Interface for AI-generated Skill Stacker plan
export interface SkillStackerPlanData {
  title: string;
  description: string;
  tasks: SkillStackerTaskData[];
}

// Schema for the generate plan request
export const generatePlanRequestSchema = z.object({
  goalId: z.number(),
  week: z.number(),
  currentSkillLevel: z.enum(["beginner", "intermediate", "advanced"])
});

export type GeneratePlanRequest = z.infer<typeof generatePlanRequestSchema>;

// Function to generate a skill stacker plan using AI
export async function generateSkillStackerPlan(
  userId: number,
  data: GeneratePlanRequest
): Promise<SkillStackerPlanData> {
  try {
    // Get goal information
    const goal = await storage.getGoal(data.goalId);
    if (!goal) {
      throw new Error("Goal not found");
    }
    
    if (hasMockFlag) {
      // Return mock data when no API key is set
      return getMockSkillStackerPlan(goal.title, data.week, data.currentSkillLevel);
    }
    
    // Use OpenAI to generate a skill stacker plan
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert career development assistant that creates personalized skill-building plans.
          Your task is to create a week-by-week skill development plan to help the user reach their career goal.
          The response should be in a structured JSON format with a weekly plan containing:
          1. An engaging title for the week
          2. A brief description of what will be covered
          3. A list of tasks including:
             - Title (brief and specific)
             - Description (detailed explanation)
             - Type (one of: "learning", "practice", or "project")
             - Estimated hours to complete (realistic number)
             - Resources (list of specific resources to help, like websites, tutorials, etc.)
          
          The plan should be appropriate for the user's current skill level (beginner, intermediate, or advanced)
          and should build progressively week by week.`
        },
        {
          role: "user",
          content: `Create a detailed skill development plan for Week ${data.week} to help me achieve my goal: "${goal.title}".
          
          My current skill level is: ${data.currentSkillLevel}
          
          Additional context about the goal: ${goal.description || "No additional context provided"}
          
          Please include 3-5 specific tasks with appropriate resources for each task.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const responseContent = response.choices[0]?.message?.content;
    if (!responseContent) {
      throw new Error("Failed to generate skill stacker plan");
    }
    
    const parsedResponse = JSON.parse(responseContent);
    
    // Transform the response to match our expected format
    const tasks: SkillStackerTaskData[] = parsedResponse.tasks.map((task: any) => ({
      title: task.title,
      description: task.description,
      type: task.type,
      estimatedHours: Number(task.estimatedHours),
      resources: Array.isArray(task.resources) ? task.resources : [task.resources]
    }));
    
    return {
      title: parsedResponse.title || `Week ${data.week}: ${goal.title}`,
      description: parsedResponse.description || `Week ${data.week} skill development plan for ${goal.title}`,
      tasks
    };
  } catch (error: any) {
    console.error("Error generating skill stacker plan:", error);
    
    // Get the goal title if possible, or use a fallback
    const goalTitle = goal?.title || "Your Goal";
    
    // If API fails, return mock data as fallback
    return getMockSkillStackerPlan(goalTitle, data.week, data.currentSkillLevel);
  }
}

// Function to get mock data when OpenAI API key is not set
function getMockSkillStackerPlan(
  goalTitle: string,
  week: number,
  skillLevel: string
): SkillStackerPlanData {
  // For demonstration, we'll create mock data
  return {
    title: `Week ${week}: ${goalTitle} Foundations`,
    description: `A comprehensive plan to build ${skillLevel} level skills for ${goalTitle}`,
    tasks: [
      {
        title: "Learn Core Concepts",
        description: `Study the fundamental principles of ${goalTitle} through guided tutorials and documentation.`,
        type: "learning",
        estimatedHours: 3,
        resources: ["Official Documentation", "Online Tutorials", "YouTube Channels"]
      },
      {
        title: "Complete Practice Exercises",
        description: "Apply your knowledge by solving a set of increasingly difficult problems and exercises.",
        type: "practice",
        estimatedHours: 4,
        resources: ["LeetCode", "HackerRank", "Practice Workbooks"]
      },
      {
        title: "Build a Small Project",
        description: `Create a small ${goalTitle} project to solidify your understanding and add to your portfolio.`,
        type: "project",
        estimatedHours: 5,
        resources: ["GitHub Examples", "Project Tutorials", "Stack Overflow"]
      },
      {
        title: "Review and Summarize",
        description: "Create notes and a summary of what you've learned to reinforce your knowledge.",
        type: "learning",
        estimatedHours: 2,
        resources: ["Note-taking Apps", "Mind Mapping Tools"]
      }
    ]
  };
}