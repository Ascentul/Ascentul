import { storage } from "./storage";
import { openai } from "./utils/openai-client";
import { z } from "zod";
// Create OpenAI client
// const openai = new OpenAI({
//  apiKey: process.env.OPENAI_API_KEY,
// });
const hasMockFlag = !process.env.OPENAI_API_KEY;
if (hasMockFlag) {

}
// Schema for the generate plan request
export const generatePlanRequestSchema = z.object({
    goalId: z.number(),
    week: z.number(),
    currentSkillLevel: z.enum(["beginner", "intermediate", "advanced"])
});
// Function to generate a skill stacker plan using AI
export async function generateSkillStackerPlan(userId, data) {
    let goalTitle = "Your Goal";
    let goalDescription = "No additional context provided";
    try {
        // Get goal information
        const goal = await storage.getGoal(data.goalId);
        if (!goal) {
            throw new Error("Goal not found");
        }
        goalTitle = goal.title;
        goalDescription = goal.description || "No additional context provided";
        if (hasMockFlag) {
            // Return mock data when no API key is set
            return getMockSkillStackerPlan(goalTitle, data.week, data.currentSkillLevel);
        }
        // Use OpenAI to generate a skill stacker plan
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using smaller, faster gpt-4o-mini for better performance and lower cost
            messages: [
                {
                    role: "system",
                    content: `You are an expert career development coach and mentor that creates personalized skill-building plans.
          Your task is to create a week-by-week skill development plan to help the user reach their specific career goal.
          
          The response should be in a structured JSON format with a weekly plan containing:
          1. A compelling and motivational title for the week (specific to the goal and week number)
          2. A detailed description that explains what will be covered this week and why it's important for their goal
          3. A list of tasks with these attributes:
             - title: Brief, action-oriented title (e.g., "Analyze...", "Build...", "Research...")
             - description: Comprehensive explanation with clear success criteria
             - type: Must be one of ["learning", "practice", "project"] based on what the task involves
             - estimatedHours: Realistic time estimate (1-10 hours) considering the user's skill level
             - resources: Array of specific, high-quality resources (URLs, book names, course names) that are directly relevant
          
          Ensure the plan:
          - Matches the user's current skill level (${data.currentSkillLevel})
          - Builds progressively (Week ${data.week} should be appropriate in a sequence)
          - Has immediate practical value for their stated goal
          - Includes a mix of learning, practice, and project tasks
          - Is challenging yet achievable within one week`
                },
                {
                    role: "user",
                    content: `Create a detailed skill development plan for Week ${data.week} to help me achieve my goal: "${goalTitle}".
          
          My current skill level is: ${data.currentSkillLevel}
          
          Additional context about the goal: ${goalDescription}
          
          For Week ${data.week}, I need a plan that:
          1. Clearly advances me toward ${goalTitle}
          2. Builds on previous weeks' progress (if this isn't week 1)
          3. Provides concrete, measurable tasks
          4. Includes modern, relevant resources specific to each task
          5. Balances theory and practical application
          
          Please include 4-5 specific tasks with appropriate resources for each task.`
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

        try {
            const parsedResponse = JSON.parse(responseContent);
            // Transform the response to match our expected format
            const tasks = parsedResponse.tasks.map((task) => ({
                title: task.title,
                description: task.description,
                type: task.type,
                estimatedHours: Number(task.estimatedHours),
                resources: Array.isArray(task.resources)
                    ? task.resources
                    : [task.resources]
            }));
            return {
                title: parsedResponse.title || `Week ${data.week}: ${goalTitle}`,
                description: parsedResponse.description ||
                    `Week ${data.week} skill development plan for ${goalTitle}`,
                tasks
            };
        }
        catch (parseError) {
            console.error("Error parsing OpenAI response:", parseError);
            throw new Error("Failed to parse OpenAI response");
        }
    }
    catch (error) {
        console.error("Error generating skill stacker plan:", error);
        // If API fails, return mock data as fallback
        return getMockSkillStackerPlan(goalTitle, data.week, data.currentSkillLevel);
    }
}
// Function to get mock data when OpenAI API key is not set
function getMockSkillStackerPlan(goalTitle, week, skillLevel) {
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
