import { Express, Request, Response } from "express"
import { storage } from "./storage"
import fs from "fs"
import path from "path"
import { openai } from "./utils/openai-client"
import { fileURLToPath } from "url"
import { z } from "zod"

// Create OpenAI client
// const openai = new OpenAI({
//  apiKey: process.env.OPENAI_API_KEY,
// });

const hasMockFlag = !process.env.OPENAI_API_KEY
if (hasMockFlag) {

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
        resources: [
          "Official Documentation",
          "Online Tutorials",
          "YouTube Channels"
        ]
      },
      {
        title: "Complete Practice Exercises",
        description:
          "Apply your knowledge by solving a set of increasingly difficult problems and exercises.",
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
        description:
          "Create notes and a summary of what you've learned to reinforce your knowledge.",
        type: "learning",
        estimatedHours: 2,
        resources: ["Note-taking Apps", "Mind Mapping Tools"]
      }
    ]
  }
}
