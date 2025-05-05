import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { validateModelAndGetId, DEFAULT_MODEL } from "./utils/models-config";

// Check for OpenAI API key - this is required for the Voice Practice feature
let apiKey = process.env.OPENAI_API_KEY;
let openai: OpenAI;

// Try to read API key using alternative methods if the environment variable isn't working
if (!apiKey) {
  try {
    // Try alternative approach to access environment variables
    const fs = require('fs');
    const envFile = fs.readFileSync('.env', 'utf8');
    const openaiKeyMatch = envFile.match(/OPENAI_API_KEY=(.+)/);
    if (openaiKeyMatch && openaiKeyMatch[1]) {
      apiKey = openaiKeyMatch[1].trim();
      console.log('Successfully loaded OPENAI_API_KEY from .env file');
    }
  } catch (error) {
    console.log('No .env file found or unable to parse OPENAI_API_KEY');
  }
}

console.log('OPENAI_API_KEY status:', apiKey ? 'present' : 'missing');

if (!apiKey) {
  // Throw an error since we need the real OpenAI API for Voice Practice features
  throw new Error('OPENAI_API_KEY is required for the Voice Practice feature. Please provide a valid API key.');
}

// Initialize with the real API key
openai = new OpenAI({ apiKey });

// Helper function to get or create an interview assistant
export async function getOrCreateInterviewAssistant() {
  try {
    // Check for existing assistants with the tag 'interview-coach'
    const assistantsList = await openai.beta.assistants.list({
      order: 'desc',
      limit: 10,
    });
    
    const existingAssistant = assistantsList.data.find(
      assistant => assistant.name === 'Interview Coach'
    );
    
    if (existingAssistant) {
      console.log('Found existing interview coach assistant');
      return { assistantId: existingAssistant.id };
    }
    
    // Create a new assistant if none exists
    console.log('Creating new interview coach assistant');
    const assistant = await openai.beta.assistants.create({
      name: 'Interview Coach',
      instructions: `You are a warm, professional career coach. The user is applying for the role of [Job Title] at [Company Name]. Study the job description below and generate realistic, role-specific interview questions. Do not repeat the job description verbatim. Ask smart, targeted questions a real hiring manager would. After each answer, provide feedback on clarity, content, and confidence. Adjust your tone to remain supportive and human.

Your approach:
1. Before asking questions, briefly review what this role typically requires, including skills, experience, and challenges to demonstrate your expertise.
2. Begin with a warm welcome and explain your role as an interviewer who has researched this position carefully.
3. Start with broad questions about experience and background that relate specifically to the job description.
4. Progressively ask more detailed situational, behavioral, or technical questions that a real interviewer would ask for this specific role.
5. After each answer, offer clear, practical feedback as a $200/hr interview coach would — focusing on how the candidate can improve clarity, confidence, and alignment with the job requirements.
6. Maintain a calm, supportive, human tone throughout while being thorough and realistic.
7. Reference specific elements from the job description throughout to simulate a well-prepared interviewer.

The final experience should feel like:
1. You welcome the user by job title and company
2. You ask smart questions based on the job context
3. You respond with feedback and follow-up questions
4. You speak with a natural human voice using 'nova' voice style

Make sure each response is thoughtful but concise so it's comfortable for the user to listen to.`,
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    });
    
    return { assistantId: assistant.id };
  } catch (error) {
    console.error('Error creating/retrieving interview assistant:', error);
    throw error;
  }
}

// Helper function to manage interview threads
export async function manageInterviewThread(params: {
  threadId?: string;
  assistantId: string;
  jobTitle: string;
  company: string;
  jobDescription?: string;
  userMessage?: string;
}) {
  try {
    const { threadId, assistantId, jobTitle, company, jobDescription, userMessage } = params;
    
    let thread;
    
    // Create or retrieve thread
    if (threadId) {
      // Use existing thread
      thread = { id: threadId };
    } else {
      // Prepare detailed context for the interview using the enhanced system prompt format
      let contextMessage = `I'm preparing for an interview for the position of ${jobTitle} at ${company}.`;
      
      if (jobDescription && jobDescription.length > 10) {
        contextMessage += `\n\nHere is the complete job description:\n${jobDescription}`;
      }
      
      contextMessage += `\n\nI'd like you to conduct a realistic practice interview with me following these guidelines:
      
1. Before asking questions, briefly review what this role typically requires, including skills, experience, and challenges.
2. Begin the interview with a brief welcome and ask detailed, customized questions based on this understanding.
3. Start with broader questions, then progress to more situational, behavioral, or technical questions.
4. After each answer, offer clear, practical feedback as a $200/hr interview coach would — focusing on how I can improve clarity, confidence, and alignment with the job.
5. Maintain a calm, supportive, human tone throughout while simulating what a real hiring manager or recruiter would ask.`;
      
      // Create a new thread with enhanced initial context
      thread = await openai.beta.threads.create({
        messages: [
          {
            role: "user",
            content: contextMessage
          }
        ]
      });
    }
    
    // Add user message to thread if provided
    if (userMessage) {
      await openai.beta.threads.messages.create(
        thread.id,
        {
          role: "user",
          content: userMessage
        }
      );
    }
    
    // Run the assistant on the thread with enhanced instructions
    const run = await openai.beta.threads.runs.create(
      thread.id,
      {
        assistant_id: assistantId,
        instructions: `You are a warm, professional career coach. The user is applying for the role of ${jobTitle} at ${company}. Study the job description below and generate realistic, role-specific interview questions. Do not repeat the job description verbatim. Ask smart, targeted questions a real hiring manager would. After each answer, provide feedback on clarity, content, and confidence. Adjust your tone to remain supportive and human.

Your approach:
1. Before asking questions, briefly review what this role typically requires, including skills, experience, and challenges to demonstrate your expertise.
2. Begin with a warm welcome and explain your role as an interviewer who has researched this position carefully.
3. Start with broad questions about experience and background that relate specifically to the job description.
4. Progressively ask more detailed situational, behavioral, or technical questions that a real interviewer would ask for this specific role.
5. After each answer, offer clear, practical feedback as a $200/hr interview coach would — focusing on how the candidate can improve clarity, confidence, and alignment with the job requirements.
6. Maintain a calm, supportive, human tone throughout while being thorough and realistic.
7. Reference specific elements from the job description throughout to simulate a well-prepared interviewer.

The final experience should feel like:
1. You welcome the user by job title and company
2. You ask smart questions based on the job context
3. You respond with feedback and follow-up questions
4. You speak with a natural human voice using 'nova' voice style

Make sure each response is thoughtful but concise so it's comfortable for the user to listen to.`,
      }
    );
    
    // Wait for the run to complete
    let runStatus = await openai.beta.threads.runs.retrieve(
      thread.id,
      run.id
    );
    
    // Poll for completion (with a reasonable timeout)
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (runStatus.status !== "completed" && runStatus.status !== "failed" && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      attempts++;
    }
    
    if (runStatus.status === "failed") {
      console.error("Assistant run failed:", runStatus.last_error);
      throw new Error(`Assistant run failed: ${runStatus.last_error?.message || "Unknown error"}`);
    }
    
    if (attempts >= maxAttempts && runStatus.status !== "completed") {
      console.error("Assistant run timed out");
      throw new Error("Assistant run timed out");
    }
    
    // Get the latest assistant message
    const messages = await openai.beta.threads.messages.list(
      thread.id
    );
    
    // Find the last assistant message
    const assistantMessages = messages.data.filter(msg => msg.role === "assistant");
    const latestMessage = assistantMessages[0]; // Most recent first
    
    if (!latestMessage) {
      throw new Error("No assistant message found");
    }
    
    // Extract the text content
    const textContent = latestMessage.content.find(
      content => content.type === "text"
    );
    
    if (!textContent || textContent.type !== "text") {
      throw new Error("No text content found in assistant message");
    }
    
    return {
      threadId: thread.id,
      response: textContent.text.value
    };
  } catch (error) {
    console.error('Error managing interview thread:', error);
    throw error;
  }
}

// Export the OpenAI instance
export const openaiInstance = openai;

// Interface for LinkedIn profile analysis
export interface LinkedInProfileAnalysis {
  overallScore: number;
  sections: {
    headline: {
      score: number;
      feedback: string;
      suggestion: string;
    };
    about: {
      score: number;
      feedback: string;
      suggestion: string;
    };
    experience: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    skills: {
      score: number;
      feedback: string;
      missingSkills: string[];
      suggestedSkills: string[];
    };
    featured: {
      score: number;
      feedback: string;
      suggestions: string[];
    };
    banner: {
      score: number;
      feedback: string;
      suggestion: string;
    };
  };
  recruiterPerspective: string;
  actionPlan: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
}

// Analyze a LinkedIn profile content to provide improvement recommendations
export async function analyzeLinkedInProfile(
  profileData: { url?: string; profileText?: string; targetJobTitle: string; selectedModel?: string }
): Promise<LinkedInProfileAnalysis> {
  try {
    const { url, profileText, targetJobTitle, selectedModel } = profileData;
    
    // Determine which input to use (URL or pasted content)
    const contentSource = profileText 
      ? `LinkedIn Profile Content:\n${profileText}` 
      : `LinkedIn Profile URL: ${url}`;
    
    // Validate the selected model or use default
    const validatedModel = selectedModel 
      ? validateModelAndGetId(selectedModel) 
      : DEFAULT_MODEL;
    
    const systemPrompt = `You are a top-tier LinkedIn optimization coach with years of experience helping people land high-quality roles.  
Your job is to evaluate a LinkedIn profile for a user who is targeting the role of ${targetJobTitle}.  

The user has provided their full LinkedIn profile content (headline, about section, experience, skills, featured, banner):

${contentSource}

You will evaluate their profile strictly — as if you are a consultant being paid $500 for a session.  
Do not give vague or overly polite advice. Be direct, specific, and helpful.  

For each section (Headline, About, Experience, Skills, Featured, and Banner):  
- Score it out of 10  
- Explain the score  
- Suggest improvements with example rewrites when useful  

For the banner, evaluate: relevance, quality, branding, and visual impact. Recommend ideas if missing.  

End with:  
- Overall Score out of 100  
- A final summary starting with:  
"If I were a recruiter for ${targetJobTitle}, I would think…"  

Your response must be in JSON format with the following structure:
{
  "overallScore": number,
  "sections": {
    "headline": {
      "score": number,
      "feedback": string,
      "suggestion": string
    },
    "about": {
      "score": number,
      "feedback": string,
      "suggestion": string
    },
    "experience": {
      "score": number,
      "feedback": string,
      "suggestions": string[]
    },
    "skills": {
      "score": number,
      "feedback": string,
      "missingSkills": string[],
      "suggestedSkills": string[]
    },
    "featured": {
      "score": number,
      "feedback": string,
      "suggestions": string[]
    },
    "banner": {
      "score": number,
      "feedback": string,
      "suggestion": string
    }
  },
  "recruiterPerspective": string,
  "actionPlan": {
    "highPriority": string[],
    "mediumPriority": string[],
    "lowPriority": string[]
  }
}`;

    const response = await openai.chat.completions.create({
      model: validatedModel, // Use the validated model
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content !== null ? content : "{}");
    
    // Apply default values for any missing fields to ensure consistent structure
    return {
      overallScore: result.overallScore || 50,
      sections: {
        headline: {
          score: result.sections?.headline?.score || 5,
          feedback: result.sections?.headline?.feedback || "No feedback provided",
          suggestion: result.sections?.headline?.suggestion || "No suggestion provided"
        },
        about: {
          score: result.sections?.about?.score || 5,
          feedback: result.sections?.about?.feedback || "No feedback provided",
          suggestion: result.sections?.about?.suggestion || "No suggestion provided"
        },
        experience: {
          score: result.sections?.experience?.score || 5,
          feedback: result.sections?.experience?.feedback || "No feedback provided",
          suggestions: result.sections?.experience?.suggestions || ["No suggestions provided"]
        },
        skills: {
          score: result.sections?.skills?.score || 5,
          feedback: result.sections?.skills?.feedback || "No feedback provided",
          missingSkills: result.sections?.skills?.missingSkills || ["No missing skills identified"],
          suggestedSkills: result.sections?.skills?.suggestedSkills || ["No skill suggestions provided"]
        },
        featured: {
          score: result.sections?.featured?.score || 5,
          feedback: result.sections?.featured?.feedback || "No feedback provided",
          suggestions: result.sections?.featured?.suggestions || ["No suggestions provided"]
        },
        banner: {
          score: result.sections?.banner?.score || 5,
          feedback: result.sections?.banner?.feedback || "No feedback provided",
          suggestion: result.sections?.banner?.suggestion || "No suggestion provided"
        }
      },
      recruiterPerspective: result.recruiterPerspective || "No recruiter perspective provided",
      actionPlan: {
        highPriority: result.actionPlan?.highPriority || ["No high priority items identified"],
        mediumPriority: result.actionPlan?.mediumPriority || ["No medium priority items identified"],
        lowPriority: result.actionPlan?.lowPriority || ["No low priority items identified"]
      }
    };
  } catch (error) {
    console.error('Error analyzing LinkedIn profile:', error);
    throw error;
  }
}

// Generic interface for OpenAI chat completions
export async function createCompletion(
  messages: ChatCompletionMessageParam[], 
  userContext?: {
    userId?: number;
    selectedModel?: string;
  }
): Promise<{ content: string; model: string; usage?: any }> {
  if (!messages || messages.length === 0) {
    throw new Error("No messages provided for completion");
  }
  
  // Create a full copy of messages to avoid mutating the original
  const fullMessages = [...messages];
  
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

    const content = response.choices[0].message.content;
    
    return {
      content: content !== null ? content : "",
      model: response.model,
      usage: response.usage,
    };
  } catch (error) {
    console.error("Error generating OpenAI response:", error);
    throw new Error("Failed to generate AI response. Please try again later.");
  }
}

// Function to create a streaming Text-to-Speech response using the "nova" voice
export async function createStreamingTTS(text: string, speed: number = 1.0) {
  try {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text provided for speech generation');
    }
    
    // Use the high-definition model for better quality with the "nova" voice
    const response = await openai.audio.speech.create({
      model: "tts-1-hd", // Use the high-definition model for premium quality
      voice: "nova", // The premium voice requested for the interview coach
      input: text,
      speed: speed, // Slightly faster than default for more natural conversation
      response_format: "mp3", // Use MP3 for better quality
    });
    
    // Return the response directly, allowing the API to handle the streaming
    return response;
  } catch (error) {
    console.error('Error generating streaming TTS:', error);
    throw error;
  }
}

// Analyze interview answers and provide feedback
export async function analyzeInterviewAnswer(
  params: {
    jobTitle: string;
    company: string;
    jobDescription?: string;
    userResponse: string;
    conversation: { role: 'assistant' | 'user'; content: string; timestamp: Date | string }[];
  }
): Promise<{ feedback: string; isLastQuestion: boolean }> {
  try {
    const { jobTitle, company, jobDescription, userResponse, conversation } = params;
    
    // Determine if this should be the last question based on conversation length
    const isLastQuestion = conversation.length >= 9; // 4 questions + 5th question's answer
    
    if (isLastQuestion) {
      // Generate comprehensive feedback for the entire interview
      const feedbackMessages: any[] = [
        {
          role: "system",
          content: `You are an expert career coach providing feedback on a job interview for a ${jobTitle} position at ${company}.
          Analyze the entire interview conversation and provide constructive, actionable feedback.
          Include specific strengths, areas for improvement, and 3-5 concrete suggestions.
          Format your response in a structured way with clear sections.
          
          Base your feedback on these details about the job:
          ${jobDescription || `This is for the role of ${jobTitle} at ${company}.`}`
        }
      ];
      
      // Add conversation history
      conversation.forEach(message => {
        feedbackMessages.push({
          role: message.role,
          content: message.content
        });
      });
      
      // Add the final user response
      feedbackMessages.push({
        role: "user",
        content: userResponse
      });
      
      feedbackMessages.push({
        role: "user",
        content: "Please provide comprehensive feedback on my interview performance."
      });
      
      // Call OpenAI to generate comprehensive, natural-sounding feedback
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: feedbackMessages,
        temperature: 0.7, // Balanced creativity for natural language
        max_tokens: 1000, // Allow for detailed feedback
        presence_penalty: 0.4, // Reduce repetitiveness
        frequency_penalty: 0.3 // Encourage more diverse vocabulary and natural phrasing
      });
      
      const feedbackContent = completion.choices[0].message.content;
      const feedback = feedbackContent !== null ? feedbackContent : "Unfortunately, I couldn't generate feedback at this time. Please try again.";
      
      // Return feedback and indicate this was the last question
      return { 
        feedback, 
        isLastQuestion: true 
      };
    } else {
      // For regular ongoing interview, generate the next AI response directly
      // First, prepare system message for the interview conversation
      const interviewSystemPrompt = `You are a warm, confident, and highly skilled professional interview coach who charges $200 per hour.
      You're coaching someone through an interview for the ${jobTitle} position at ${company}. 
      ${jobDescription ? `The job description is: ${jobDescription}` : ''}
      
      Provide brief, constructive feedback on the candidate's previous answer, then ask your next interview question.
      Your responses should be conversational and natural, as if you're speaking to them in person.
      Focus on asking relevant, challenging questions that would be asked in a real interview for this role.`;
      
      const interviewMessages: any[] = [
        { role: "system", content: interviewSystemPrompt }
      ];
      
      // Add the full conversation history 
      conversation.forEach(message => {
        interviewMessages.push({
          role: message.role,
          content: message.content
        });
      });
      
      // Add the user's latest response (which might not be in the conversation array yet)
      interviewMessages.push({
        role: "user",
        content: userResponse
      });
      
      // Add a specific prompt to continue the interview with feedback and next question
      interviewMessages.push({
        role: "user",
        content: "Please provide brief feedback on my answer, then ask your next interview question."
      });
      
      // Generate the next AI response with enhanced human-like conversation parameters
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: interviewMessages,
        temperature: 0.75, // Slightly higher creativity for more varied, natural responses
        max_tokens: 500, // Enough for detailed, conversational responses
        presence_penalty: 0.6, // Strongly encourage the AI to ask new questions
        frequency_penalty: 0.5 // Penalize repetition for natural conversation
      });
      
      const responseContent = completion.choices[0].message.content;
      const aiResponse = responseContent !== null ? responseContent : "Let me ask you another question about your experience relevant to this role.";
      
      // Return the AI's next response directly
      return { 
        feedback: aiResponse,
        isLastQuestion: false
      };
    }
  } catch (error) {
    console.error('Error analyzing interview response:', error);
    throw error;
  }
}

// Generate interview questions for practice sessions
export async function generateInterviewQuestions(category?: string): Promise<string[]> {
  try {
    // Create a prompt for generating interview questions
    const prompt = category 
      ? `Generate 5 challenging interview questions for the "${category}" category. These should be thought-provoking questions that would be asked in real job interviews.`
      : `Generate 5 challenging general interview questions. These should be thought-provoking questions that would be asked in real job interviews.`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        { 
          role: "system", 
          content: "You are an expert interview coach helping to create challenging, realistic interview questions." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      temperature: 0.7
    });
    
    // Parse the response into an array of questions
    const content = response.choices[0].message.content;
    if (!content) return ["Tell me about yourself and your relevant experience for this role."];
    
    // Split by numbers (1., 2., etc.) or line breaks, then filter out empty strings
    const questions = content
      .split(/\n|(?:\d+\.)\s+/g)
      .map(q => q.trim())
      .filter(q => q && q.length > 10 && (q.endsWith('?') || q.includes('?')));
    
    return questions.slice(0, 5); // Return at most 5 questions
  } catch (error) {
    console.error('Error generating interview questions:', error);
    // Return fallback questions that are always appropriate
    return [
      "Tell me about yourself and your relevant experience for this role.",
      "What are your greatest strengths and how would they help you in this position?",
      "Describe a challenging situation you've faced at work and how you handled it.",
      "Why are you interested in this position and our company?",
      "Where do you see yourself professionally in five years?"
    ];
  }
}

// Get career advice based on user's profile and goals
export async function getCareerAdvice(
  userProfile: any,
  careerGoals: any[],
  specificQuestion?: string
): Promise<string> {
  const context = `
User Profile:
${JSON.stringify(userProfile, null, 2)}

Career Goals:
${JSON.stringify(careerGoals, null, 2)}
`;

  const question = specificQuestion || "What career advice would you give this person based on their profile and goals?";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an experienced career coach and advisor. Provide personalized, actionable career advice."
        },
        {
          role: "user",
          content: `${context}\n\n${question}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    return content !== null ? content : "Unable to generate career advice at this time.";
  } catch (error) {
    console.error("Error getting career advice:", error);
    throw new Error("Failed to generate career advice. Please try again later.");
  }
}

// Generate suggestions for improving a resume
export async function generateResumeSuggestions(resumeText: string, jobTitle?: string): Promise<any> {
  try {
    const prompt = jobTitle
      ? `Analyze this resume for a ${jobTitle} position and provide actionable suggestions to improve it.`
      : `Analyze this resume and provide actionable suggestions to improve it.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert resume reviewer who specializes in providing detailed, actionable feedback to help job seekers improve their resumes."
        },
        {
          role: "user",
          content: `${prompt}\n\nResume:\n${resumeText}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const suggestions = JSON.parse(response.choices[0].message.content || "{}");
    return suggestions;
  } catch (error) {
    console.error("Error generating resume suggestions:", error);
    throw new Error("Failed to generate resume suggestions. Please try again later.");
  }
}

// Generate a full resume based on the user's profile
export async function generateFullResume(
  workHistory: any[], 
  education: any[], 
  skills: string[], 
  jobTitle: string
): Promise<string> {
  try {
    const context = {
      workHistory,
      education,
      skills,
      targetJobTitle: jobTitle
    };

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert resume writer who creates professional, ATS-friendly resumes tailored to specific job positions."
        },
        {
          role: "user",
          content: `Create a professional resume for a ${jobTitle} position based on the following information:\n\n${JSON.stringify(context, null, 2)}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.choices[0].message.content;
    return content !== null ? content : "Unable to generate resume content.";
  } catch (error) {
    console.error("Error generating full resume:", error);
    throw new Error("Failed to generate resume. Please try again later.");
  }
}

// Generate a cover letter based on user profile and job details
export async function generateCoverLetter(
  userProfile: any,
  jobDetails: { title: string; company: string; description?: string },
  style?: string
): Promise<string> {
  try {
    const stylePrompt = style 
      ? `Use a ${style} writing style.` 
      : "Use a professional, confident writing style.";

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert cover letter writer. ${stylePrompt} Focus on matching the candidate's experience to the job requirements.`
        },
        {
          role: "user",
          content: `Create a compelling cover letter for a ${jobDetails.title} position at ${jobDetails.company} based on the following profile information:\n\n${JSON.stringify(userProfile, null, 2)}\n\nJob Description: ${jobDetails.description || "Not provided"}`
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    return content !== null ? content : "Unable to generate cover letter content.";
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter. Please try again later.");
  }
}

// Generate suggestions for improving a cover letter
export async function generateCoverLetterSuggestions(
  coverLetterText: string, 
  jobDetails: { title: string; company: string; description?: string }
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert cover letter reviewer who provides detailed, actionable feedback to help job seekers improve their cover letters."
        },
        {
          role: "user",
          content: `Analyze this cover letter for a ${jobDetails.title} position at ${jobDetails.company} and provide actionable suggestions to improve it.\n\nCover Letter:\n${coverLetterText}\n\nJob Description: ${jobDetails.description || "Not provided"}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const suggestions = JSON.parse(response.choices[0].message.content || "{}");
    return suggestions;
  } catch (error) {
    console.error("Error generating cover letter suggestions:", error);
    throw new Error("Failed to generate cover letter suggestions. Please try again later.");
  }
}

// Suggest career goals based on user profile
export async function suggestCareerGoals(userProfile: any): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a career development expert who helps professionals identify meaningful career goals and growth opportunities."
        },
        {
          role: "user",
          content: `Based on this professional profile, suggest 3-5 career goals that would be meaningful and achievable:\n\n${JSON.stringify(userProfile, null, 2)}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const suggestions = JSON.parse(response.choices[0].message.content || "{}");
    return suggestions;
  } catch (error) {
    console.error("Error generating career goal suggestions:", error);
    throw new Error("Failed to generate career goal suggestions. Please try again later.");
  }
}

// Generate insights about a specific role or industry
export interface RoleInsightResponse {
  keySkills: string[];
  careerPath: {
    entryLevel: string;
    midLevel: string;
    seniorLevel: string;
  };
  industryTrends: string[];
  salaryRange: {
    low: string;
    median: string;
    high: string;
  };
  certifications: string[];
}

export async function generateRoleInsights(roleTitle: string): Promise<RoleInsightResponse> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a career insights specialist who provides detailed information about specific roles and industries."
        },
        {
          role: "user",
          content: `Provide comprehensive insights about the ${roleTitle} role, including key skills, career path, industry trends, salary range, and relevant certifications.`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const insights = JSON.parse(response.choices[0].message.content || "{}");
    
    // Ensure the response follows the expected structure
    return {
      keySkills: insights.keySkills || [],
      careerPath: insights.careerPath || { 
        entryLevel: "Not specified", 
        midLevel: "Not specified", 
        seniorLevel: "Not specified" 
      },
      industryTrends: insights.industryTrends || [],
      salaryRange: insights.salaryRange || { 
        low: "Not specified", 
        median: "Not specified", 
        high: "Not specified" 
      },
      certifications: insights.certifications || []
    };
  } catch (error) {
    console.error("Error generating role insights:", error);
    throw new Error("Failed to generate role insights. Please try again later.");
  }
}