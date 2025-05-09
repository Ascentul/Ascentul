import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { validateModelAndGetId, DEFAULT_MODEL } from "../utils/models-config";

// Check for OpenAI API key and use mock mode if missing
const apiKey = process.env.OPENAI_API_KEY;
let useMockOpenAI = false;
let openai: any;

if (!apiKey) {
  console.warn('OPENAI_API_KEY is not set in utils/openai.ts. Using mock OpenAI mode.');
  useMockOpenAI = true;
  
  // Create a mock OpenAI instance
  openai = {
    chat: {
      completions: {
        create: async (params: any) => {
          console.log('Mock OpenAI API call in utils with params:', params);
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    message: "This is mock AI content from utils/openai. Please provide an OpenAI API key for real responses.",
                    recommendations: ["Add an OpenAI API key to enable AI features"]
                  })
                }
              }
            ],
            model: "mock-gpt-4o",
            usage: { total_tokens: 0, prompt_tokens: 0, completion_tokens: 0 }
          };
        }
      }
    }
  };
} else {
  // Initialize with the real API key
  openai = new OpenAI({ apiKey });
}

// Schedule for daily recommendations - midnight (00:00:00)
export const RECOMMENDATIONS_REFRESH_TIME = {
  hour: 0,
  minute: 0,
  second: 0
};

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
    selectedModel?: string;
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
    // Validate the selected model or use default
    const validatedModel = userContext?.selectedModel
      ? validateModelAndGetId(userContext.selectedModel)
      : DEFAULT_MODEL;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: validatedModel, // Use the validated model
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

// Generate AI-driven recommendations based on user data
export async function generateDailyAIRecommendations(
  userContext: {
    userId: number;
    workHistory?: any[];
    goals?: any[];
    interviewProcesses?: any[];
    userName?: string;
    selectedModel?: string;
  }
): Promise<string[]> {
  if (!userContext.userId) {
    throw new Error("User ID is required to generate recommendations");
  }

  // Prepare AI system prompt for generating recommendations
  let systemPrompt = `
You are a career development AI assistant tasked with generating personalized daily recommendations for a user.
Your recommendations should be specific, actionable, and directly relevant to the user's current career situation.

Create 5-7 personalized career-focused recommendations for the user's daily tasks. These should be focused on:
1. Career growth and skill development
2. Job search optimization
3. Interview preparation
4. Networking and personal branding
5. Specific actions related to their current goals or interviews

Format each recommendation as a simple action statement that starts with a verb (e.g., "Update your LinkedIn profile with your recent project")
Make recommendations concrete, specific, and immediately actionable.
Each recommendation should be 10-15 words maximum.
DO NOT include any explanations, introductions, or additional text.
Output MUST be an array of strings in valid JSON format.
`;

  // Add user context to the system prompt if available
  if (userContext.userName) {
    systemPrompt += `\nUser Name: ${userContext.userName}`;
  }

  // Add work history information
  if (userContext.workHistory && userContext.workHistory.length > 0) {
    systemPrompt += "\n\nWork History:";
    userContext.workHistory.forEach((job, index) => {
      systemPrompt += `\n${index + 1}. ${job.position} at ${job.company}`;
      if (job.description) {
        systemPrompt += ` - ${job.description}`;
      }
    });
  } else {
    systemPrompt += "\n\nWork History: None provided";
  }

  // Add goals information
  if (userContext.goals && userContext.goals.length > 0) {
    systemPrompt += "\n\nActive Career Goals:";
    userContext.goals.forEach((goal, index) => {
      const status = goal.completed ? "Completed" : `In Progress (${goal.progress}%)`;
      systemPrompt += `\n${index + 1}. ${goal.title} - ${status}`;
      if (goal.description) {
        systemPrompt += ` - ${goal.description}`;
      }
    });
  } else {
    systemPrompt += "\n\nActive Career Goals: None";
  }

  // Add interview processes information
  if (userContext.interviewProcesses && userContext.interviewProcesses.length > 0) {
    systemPrompt += "\n\nOngoing Interview Processes:";
    userContext.interviewProcesses.forEach((process, index) => {
      systemPrompt += `\n${index + 1}. ${process.position} at ${process.companyName} - Status: ${process.status}`;
    });
  } else {
    systemPrompt += "\n\nOngoing Interview Processes: None";
  }

  try {
    // Validate the selected model or use default
    const validatedModel = userContext?.selectedModel
      ? validateModelAndGetId(userContext.selectedModel)
      : DEFAULT_MODEL;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: validatedModel, // Use the validated model
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate today's personalized career recommendations based on my profile" }
      ],
      temperature: 0.7,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      console.error("Empty response from OpenAI");
      return getDefaultRecommendations();
    }

    try {
      const parsedResponse = JSON.parse(content);
      if (Array.isArray(parsedResponse.recommendations)) {
        return parsedResponse.recommendations;
      } else if (Array.isArray(parsedResponse)) {
        return parsedResponse;
      } else {
        console.error("Unexpected response format from OpenAI:", parsedResponse);
        return getDefaultRecommendations();
      }
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError, "Original response:", content);
      return getDefaultRecommendations();
    }
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return getDefaultRecommendations();
  }
}

// Fallback recommendations if AI generation fails
function getDefaultRecommendations(): string[] {
  return [
    "Update your resume with recent accomplishments",
    "Research industry trends in your field",
    "Connect with a professional in your target role",
    "Practice answering behavioral interview questions",
    "Set a specific, measurable career goal for this month",
    "Update your LinkedIn profile with recent projects",
    "Add your latest skills to your professional profiles"
  ];
}

// Generate a specific AI response based on a prompt
export async function generateAIResponse(
  prompt: string,
  selectedModel?: string
): Promise<string> {
  try {
    // Validate the selected model or use default
    const validatedModel = selectedModel
      ? validateModelAndGetId(selectedModel)
      : DEFAULT_MODEL;
    
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: validatedModel,
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content || '';
  } catch (error) {
    console.error("Error generating AI response:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}

// Function to clean optimized cover letter content by removing headers, greetings, and sign-offs
export async function cleanOptimizedCoverLetter(optimizedLetter: string): Promise<string> {
  if (!optimizedLetter || optimizedLetter.trim() === '') {
    return '';
  }
  
  try {
    const prompt = `
You are an assistant that removes redundant elements from an AI-generated optimized cover letter.

Your goal is to remove:
- The applicant's name
- Contact info (email, LinkedIn, date)
- Greeting (e.g., "Dear Hiring Manager")
- Sign-off (e.g., "Sincerely," and name)

✅ Keep ONLY the main body of the letter (the paragraphs describing the applicant's experience and relevance to the job).

Optimized Letter:
"""
${optimizedLetter}
"""

Return just the main body content without any header or closing lines.
`;

    return await generateAIResponse(prompt);
  } catch (error) {
    console.error("Error cleaning optimized cover letter:", error);
    // If AI cleaning fails, return the original letter
    return optimizedLetter;
  }
}