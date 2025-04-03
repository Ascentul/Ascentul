import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Base system prompt for the career coach
const CAREER_COACH_SYSTEM_PROMPT = `
You are an experienced, professional Career Coach with over 15 years of experience helping professionals navigate their career journeys. Your expertise includes career development, interview preparation, resume/CV optimization, skill development, and professional growth strategies.

As a Career Coach, you focus on:
- Providing actionable, specific career advice tailored to the individual's work history and goals
- Maintaining a professional, supportive tone while being direct when necessary
- Asking insightful questions to help the user gain clarity about their career trajectory
- Offering strategic guidance on professional development and upskilling
- Suggesting concrete next steps and resources the user can leverage

When a user shares details about their career goals, work history, or interviews, acknowledge this information and use it to personalize your responses.
`;

// Generate a coaching response using the OpenAI API
export async function generateCoachingResponse(
  messages: ChatCompletionMessageParam[],
  userContext: {
    workHistory?: any[];
    goals?: any[];
    interviewProcesses?: any[];
    userName?: string;
  }
) {
  // Prepare a full context for the AI by combining the base prompt with user-specific information
  let systemPrompt = CAREER_COACH_SYSTEM_PROMPT;

  // Add user context to the system prompt if available
  if (userContext) {
    systemPrompt += "\n\nUser Information:\n";

    if (userContext.userName) {
      systemPrompt += `Name: ${userContext.userName}\n`;
    }

    // Add work history information
    if (userContext.workHistory && userContext.workHistory.length > 0) {
      systemPrompt += "\nWork History:\n";
      userContext.workHistory.forEach((job, index) => {
        const duration = job.currentJob
          ? `${new Date(job.startDate).toLocaleDateString()} - Present`
          : `${new Date(job.startDate).toLocaleDateString()} - ${
              job.endDate
                ? new Date(job.endDate).toLocaleDateString()
                : "Not specified"
            }`;

        systemPrompt += `${index + 1}. ${job.position} at ${
          job.company
        } (${duration})\n`;
        if (job.description) {
          systemPrompt += `   Description: ${job.description}\n`;
        }
        if (job.achievements && job.achievements.length > 0) {
          systemPrompt += `   Achievements: ${job.achievements.join(", ")}\n`;
        }
      });
    }

    // Add goals information
    if (userContext.goals && userContext.goals.length > 0) {
      systemPrompt += "\nCareer Goals:\n";
      userContext.goals.forEach((goal, index) => {
        const status = goal.completed ? "Completed" : `In Progress (${goal.progress}%)`;
        systemPrompt += `${index + 1}. ${goal.title} - ${status}\n`;
        if (goal.description) {
          systemPrompt += `   Description: ${goal.description}\n`;
        }
      });
    }

    // Add interview processes information
    if (userContext.interviewProcesses && userContext.interviewProcesses.length > 0) {
      systemPrompt += "\nInterview Processes:\n";
      userContext.interviewProcesses.forEach((process, index) => {
        systemPrompt += `${index + 1}. ${process.position} at ${process.companyName} - Status: ${process.status}\n`;
      });
    }
  }

  // Create a messages array starting with the system prompt
  const fullMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...messages,
  ];

  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: fullMessages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return {
      content: response.choices[0].message.content,
      model: response.model,
      usage: response.usage,
    };
  } catch (error) {
    console.error("Error generating OpenAI response:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}