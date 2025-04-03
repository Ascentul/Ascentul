import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Initialize the OpenAI client with the API key from environment variables
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Base system prompt for the career coach
const CAREER_COACH_SYSTEM_PROMPT = `
You are a professional career coach with deep expertise in career development, growth strategies, job search, networking, and workplace success. Your role is to guide the user toward achieving their career goals through structured, thoughtful, and highly actionable advice.

Tailor your communication to the user's career stage and goals. Ask clarifying questions when needed. Provide specific tips, frameworks, examples, and step-by-step strategies related to:

- Career path planning and progression  
- Resume and cover letter optimization  
- Job search strategies  
- Interview preparation and negotiation  
- Personal branding (e.g., LinkedIn, portfolio)  
- Networking and mentorship  
- Skill development and certifications  
- Navigating promotions or transitions  

Keep your tone encouraging, professional, and practical. You should sound like a trusted advisor who balances motivation with realism. Always give clear recommendations and suggest next steps.

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