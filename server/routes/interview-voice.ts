import { Router, Request, Response } from 'express';
import { requireAuth, requireLoginFallback } from '../auth';
import { openaiInstance, getOrCreateInterviewAssistant, manageInterviewThread } from '../openai';
import { z } from 'zod';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { logRequest, logResponse, saveAudioForDebugging } from '../debug-voice-practice';

// Define interfaces for our data structures
interface WorkHistoryItem {
  company: string;
  position: string;
  startDate: string | Date;
  endDate: string | Date;
  description: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  startDate: string | Date;
  endDate: string | Date;
  achievements: string[];
}

// OpenAI message type for chat completions
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const router = Router();

// Schema for interview question generation request
const generateQuestionSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  jobDescription: z.string().optional().default(''),
  conversation: z.array(z.object({
    role: z.enum(['assistant', 'user']),
    content: z.string(),
    timestamp: z.date().or(z.string())
  })).optional().default([]),
  threadId: z.string().optional() // Optional thread ID for continuing conversations
});

// Schema for interview response analysis request
const analyzeResponseSchema = z.object({
  jobTitle: z.string(),
  company: z.string(),
  jobDescription: z.string().optional().default(''),
  userResponse: z.string(),
  conversation: z.array(z.object({
    role: z.enum(['assistant', 'user']),
    content: z.string(),
    timestamp: z.date().or(z.string())
  })).optional().default([])
});

// Schema for speech transcription request
const transcribeSchema = z.object({
  audio: z.string()
});

// Schema for text-to-speech request
const textToSpeechSchema = z.object({
  text: z.string().min(1, "Text is required"),
  voice: z.string().optional().default('nova'), // Default to nova for natural female voice
  speed: z.number().min(0.25).max(4.0).optional().default(1.0) // Control speaking speed
});

/**
 * Generate a dynamic system prompt based on job and user profile data
 */
async function generateDynamicSystemPrompt(req: Request, jobTitle: string, company: string, jobDescription: string): Promise<string> {
  try {
    // Get the current user from the session
    const userId = req.session?.userId;
    if (!userId) {
      return getBasicSystemPrompt(jobTitle, company, jobDescription);
    }
    
    // Fetch user profile data
    const user = await storage.getUser(userId);
    if (!user) {
      return getBasicSystemPrompt(jobTitle, company, jobDescription);
    }
    
    // Try to get work history, education, and skills from storage
    let workHistory: WorkHistoryItem[] = [];
    let education: EducationItem[] = [];
    let skills: string[] = [];
    let achievements: string[] = [];
    
    try {
      // Fetch user data from storage if available
      try {
        const userWorkHistory = await storage.getWorkHistory(userId);
        if (userWorkHistory && userWorkHistory.length > 0) {
          // Format work history items to match the expected structure
          workHistory = userWorkHistory.map(item => ({
            company: item.company || "",
            position: item.position || "",
            startDate: item.startDate || "",
            endDate: item.endDate || "Present",
            description: item.description || ""
          }));
        }
      } catch (err) {
        console.log("Work history not available in storage");
      }
      
      try {
        const userEducation = await storage.getEducationHistory(userId);
        if (userEducation && userEducation.length > 0) {
          // Format education items to match the expected structure
          education = userEducation.map(item => ({
            institution: item.institution || "",
            degree: item.degree || "",
            startDate: item.startDate || "",
            endDate: item.endDate || "Present",
            achievements: Array.isArray(item.achievements) ? item.achievements : []
          }));
        }
      } catch (err) {
        console.log("Education not available in storage");
      }
      
      try {
        const userSkills = await storage.getUserSkills(userId);
        if (userSkills && userSkills.length > 0) {
          // Extract skill names to create a string array
          skills = userSkills.map(skill => skill.name);
        }
      } catch (err) {
        console.log("Skills not available in storage");
      }
      
      try {
        const userAchievements = await storage.getAchievements();
        if (userAchievements && userAchievements.length > 0) {
          // Extract achievement descriptions to create a string array
          achievements = userAchievements.map(achievement => achievement.description);
        }
      } catch (err) {
        console.log("Achievements not available in storage");
      }
    } catch (error) {
      console.log("Error fetching user profile data:", error);
      // Continue with whatever data we have
    }
    
    // Format work history
    const workHistorySummary = workHistory.length > 0 
      ? workHistory.map(job => 
          `${job.position} at ${job.company} (${job.startDate} - ${job.endDate}): ${job.description}`
        ).join("\n- ")
      : "Not available";
      
    // Format education
    const educationSummary = education.length > 0
      ? education.map(edu => 
          `${edu.degree} from ${edu.institution} (${edu.startDate} - ${edu.endDate})`
        ).join("\n- ")
      : "Not available";
      
    // Format skills
    const skillsSummary = skills.length > 0
      ? skills.join(", ")
      : "Not available";
      
    // Format achievements
    const achievementsSummary = achievements.length > 0
      ? achievements.join("\n- ")
      : "Not available";
    
    // Construct the dynamic system prompt with updated coaching instructions
    return `You are a $200/hr professional interview coach. For each session, read the job description in detail and ask role-specific, intelligent, and challenging questions tailored to that position. Never repeat the job post directly. Think like a hiring manager. Ask one question at a time, wait for an answer, and then respond with thoughtful feedback or a follow-up question.

Job Details:
- Position: ${jobTitle}
- Company: ${company}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

Candidate Background:
- Work History: ${workHistorySummary}
- Education: ${educationSummary}
- Skills: ${skillsSummary}
- Achievements: ${achievementsSummary}

Important Instructions:
1. First, identify 3-5 key themes, skills, or responsibilities from the job description.
2. Generate thoughtful questions that probe for experience and competency in these areas.
3. Ask questions that require specific examples, not just theoretical knowledge.
4. NEVER parrot the job description text verbatim - synthesize and reframe.
5. Be conversational but professional, as if you're an actual hiring manager.
6. Connect the candidate's background to the job requirements in your questions.`;
  } catch (error) {
    console.error("Error generating dynamic system prompt:", error);
    return getBasicSystemPrompt(jobTitle, company, jobDescription);
  }
}

/**
 * Generate a basic system prompt as fallback
 */
function getBasicSystemPrompt(jobTitle: string, company: string, jobDescription: string): string {
  return `You are a $200/hr professional interview coach. For each session, read the job description in detail and ask role-specific, intelligent, and challenging questions tailored to that position. Never repeat the job post directly. Think like a hiring manager. Ask one question at a time, wait for an answer, and then respond with thoughtful feedback or a follow-up question.

Job Details:
- Position: ${jobTitle}
- Company: ${company}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

Important Instructions:
1. First, identify 3-5 key themes, skills, or responsibilities from the job description.
2. Generate thoughtful questions that probe for experience and competency in these areas.
3. Ask questions that require specific examples, not just theoretical knowledge.
4. NEVER parrot the job description text verbatim - synthesize and reframe.
5. Be conversational but professional, as if you're an actual hiring manager.`;
}

/**
 * Generate a relevant interview question based on job details and conversation history
 * Uses OpenAI Assistants API for more contextual and thread-aware responses
 */
router.post('/generate-question', requireLoginFallback, async (req: Request, res: Response) => {
  try {
    // Log the start of question generation
    logRequest('generate-question', 'Generate question request received');
    
    const validationResult = generateQuestionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logResponse('generate-question', 400, 'Invalid request data', validationResult.error.format());
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { jobTitle, company, jobDescription, conversation, threadId } = validationResult.data;
    
    logRequest('generate-question', 'Valid request data received', {
      jobTitle,
      company,
      hasJobDescription: !!jobDescription,
      conversationLength: conversation.length,
      hasExistingThread: !!threadId
    });
    
    // Validate that we have a job description - it's required for generating good interview questions
    if (!jobDescription || jobDescription.trim().length < 10) {
      logResponse('generate-question', 400, 'Missing or insufficient job description');
      return res.status(400).json({
        error: 'Missing job description',
        details: 'A detailed job description is required to generate intelligent interview questions. Please provide a proper job description.'
      });
    }
    
    // Use OpenAI Assistants API exclusively for interview questions and feedback
    try {
      // Check if the OpenAI API key is set
      if (!process.env.OPENAI_API_KEY) {
        logResponse('generate-question', 500, 'OpenAI API key missing');
        return res.status(500).json({ 
          error: 'OpenAI API configuration is missing',
          details: 'The OpenAI API key is required for interview functionality.'
        });
      }
      
      // Get or create an interview assistant
      const { assistantId } = await getOrCreateInterviewAssistant();
      
      logRequest('generate-question', 'Using assistant', { assistantId });
      
      // Use the thread management function to handle the interview
      const { threadId: newThreadId, response } = await manageInterviewThread({
        threadId, // Will be undefined for new threads
        assistantId,
        jobTitle,
        company,
        jobDescription,
        // Only pass user message for continued conversations, not for the initial question
        userMessage: conversation.length > 0 ? conversation[conversation.length - 1].content : undefined
      });
      
      // Log successful response
      logResponse('generate-question', 200, 'Question generated successfully via assistant', {
        threadId: newThreadId,
        responseLength: response.length,
        excerpt: response.substring(0, 50) + (response.length > 50 ? '...' : '')
      });
      
      // Return the question and thread ID to the client
      return res.status(200).json({ 
        question: response,
        threadId: newThreadId
      });
    } catch (error: any) {
      // If the Assistants API fails, provide a clear error
      console.error('Error using OpenAI Assistants API:', error);
      logResponse('generate-question', 500, 'Error using OpenAI Assistants API', {
        errorMessage: error?.message || 'Unknown error'
      });
      
      // Return a helpful error message to the client
      return res.status(500).json({ 
        error: 'Failed to generate interview question', 
        details: error.message || 'An error occurred with the AI assistant'
      });
    }
  } catch (error) {
    console.error('Error generating interview question (outer try/catch):', error);
    
    // Log the error for monitoring and debugging
    logResponse('generate-question', 500, 'Error generating question (critical error)', {
      errorMessage: typeof error === 'object' && error !== null ? ((error as any).message || 'Unknown error') : String(error),
      stack: typeof error === 'object' && error !== null && 'stack' in error ? (error as any).stack : 'No stack trace available',
      errorType: typeof error
    });
    
    try {
      // LAST RESORT FALLBACK - This should ALWAYS work
      console.log('[Interview Voice] Using last resort emergency fallback response');
      
      // Use a coaching-style fallback with no variable substitution to avoid any potential errors
      const emergencyFallback = "As your interview coach, I'd like to understand your professional background better. Could you share some of your relevant experience for this position? Focus on skills and accomplishments that best showcase your qualifications.";
      
      // Include multiple response formats for maximum compatibility with client-side code
      return res.status(200).json({
        question: emergencyFallback,
        aiResponse: emergencyFallback,
        text: emergencyFallback,
        content: emergencyFallback,
        isFallback: true,
        isEmergencyFallback: true
      });
    } catch (finalError) {
      // If even our emergency fallback fails, just return a hard-coded JSON string
      console.error('CRITICAL: Even emergency fallback failed:', finalError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send('{"question":"Tell me about your experience.","aiResponse":"Tell me about your experience.","isFallback":true,"isCriticalFallback":true}');
    }
  }
});

/**
 * Analyze a user's interview response and provide feedback
 */
router.post('/analyze-response', requireLoginFallback, async (req: Request, res: Response) => {
  try {
    // Log the start of analysis process
    logRequest('analyze-response', 'Analyze response request received');
    
    const validationResult = analyzeResponseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logResponse('analyze-response', 400, 'Invalid request data', validationResult.error.format());
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { jobTitle, company, jobDescription, userResponse, conversation } = validationResult.data;
    
    logRequest('analyze-response', 'Valid request data received', {
      jobTitle,
      company,
      hasJobDescription: !!jobDescription,
      userResponseLength: userResponse.length,
      conversationLength: conversation.length,
      conversationSummary: conversation.map(msg => ({ role: msg.role, contentLength: msg.content.length })),
      userResponseExcerpt: userResponse.substring(0, 50) + (userResponse.length > 50 ? '...' : '')
    });
    
    // Validate that we have a job description - it's required for generating good interview feedback
    if (!jobDescription || jobDescription.trim().length < 10) {
      logResponse('analyze-response', 400, 'Missing or insufficient job description');
      return res.status(400).json({
        error: 'Missing job description',
        details: 'A detailed job description is required to provide meaningful interview feedback. Please provide a proper job description.'
      });
    }
    
    // Generate dynamic system prompt with user profile data
    const systemPrompt = await generateDynamicSystemPrompt(req, jobTitle, company, jobDescription);
    
    // Determine if this should be the last question based on conversation length
    // Typically end after 5 question-answer pairs (10 messages)
    const isLastQuestion = conversation.length >= 9; // 4 questions + 5th question's answer
    
    logRequest('analyze-response', `Processing ${isLastQuestion ? 'final feedback' : 'ongoing interview'} response`);
    
    if (isLastQuestion) {
      logRequest('analyze-response', 'Generating comprehensive interview feedback');
      
      try {
        // Check if OpenAI API key is available before attempting API call
        if (!process.env.OPENAI_API_KEY) {
          logResponse('analyze-response', 500, 'OpenAI API key missing');
          return res.status(500).json({ 
            error: 'OpenAI API configuration is missing',
            details: 'The OpenAI API key is required for interview functionality.'
          });
        }
        
        // Get or create an interview assistant
        const { assistantId } = await getOrCreateInterviewAssistant();
        
        // Create a thread with interview context and conversation history
        const thread = await openaiInstance.beta.threads.create({
          messages: [
            {
              role: "user",
              content: `I'm completing a practice interview for the position of ${jobTitle} at ${company}.
              
              Please analyze our full conversation and provide comprehensive feedback on my interview performance. 
              Include specific strengths, areas for improvement, and 3-5 concrete suggestions.
              Format your response in a structured way with clear sections.`
            }
          ]
        });
        
        // Add conversation history
        for (const message of conversation) {
          await openaiInstance.beta.threads.messages.create(
            thread.id,
            {
              role: message.role === 'assistant' ? 'assistant' : 'user',
              content: message.content
            }
          );
        }
        
        // Add the final user response if it's not already in the conversation
        await openaiInstance.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: userResponse
          }
        );
        
        // Final request for comprehensive feedback
        await openaiInstance.beta.threads.messages.create(
          thread.id,
          {
            role: "user",
            content: "Please provide comprehensive feedback on my interview performance. Include my strengths, areas for improvement, and specific suggestions for how I can improve."
          }
        );
        
        // Run the assistant on the thread with enhanced instructions for final feedback
        const run = await openaiInstance.beta.threads.runs.create(
          thread.id,
          {
            assistant_id: assistantId,
            instructions: `You are a $200/hr professional interview coach providing comprehensive feedback on a completed interview for a ${jobTitle} position at ${company}.

Analyze the entire interview conversation and provide professional-quality feedback with these components:

1. ANSWER QUALITY ANALYSIS
   - Evaluate how effectively the candidate addressed the specific questions asked
   - Note where answers demonstrated strong alignment with the job requirements
   - Identify where answers could have been more focused or relevant

2. COMMUNICATION ASSESSMENT  
   - Assess clarity, structure, and conciseness of responses
   - Evaluate storytelling ability and use of specific examples
   - Identify areas where communication could be improved

3. KEY STRENGTHS (3-5 points)
   - Highlight specific moments where the candidate excelled
   - Explain why these strengths would be valued by the employer

4. IMPROVEMENT AREAS (3-5 points)
   - Identify concrete areas where the candidate could improve
   - Be direct but constructive - this is high-value feedback

5. ACTIONABLE RECOMMENDATIONS
   - Provide 3-5 specific, tactical suggestions they can implement immediately
   - Include example phrases or approaches they could use in the real interview

FORMAT: Structure your response with clear headings, concise paragraphs, and bullet points for easy readability.
TONE: Professional but warm - deliver candid feedback as a trusted expert would, balancing honesty with encouragement.`
          }
        );
        
        // Wait for completion
        let completedRun = await openaiInstance.beta.threads.runs.retrieve(
          thread.id,
          run.id
        );
        
        // Poll for completion
        while (completedRun.status !== "completed") {
          await new Promise(resolve => setTimeout(resolve, 1000));
          completedRun = await openaiInstance.beta.threads.runs.retrieve(
            thread.id,
            run.id
          );
          
          if (["failed", "cancelled", "expired"].includes(completedRun.status)) {
            throw new Error(`Run ended with status: ${completedRun.status}`);
          }
        }
        
        // Get messages from the thread
        const messages = await openaiInstance.beta.threads.messages.list(thread.id);
        
        // Get the latest assistant message (the feedback)
        const feedbackMessage = messages.data
          .filter(msg => msg.role === "assistant")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (!feedbackMessage || !feedbackMessage.content || feedbackMessage.content.length === 0) {
          throw new Error("No feedback content received from assistant");
        }
        
        // Extract the text content safely handling different content types
        let feedback = '';
        const content = feedbackMessage.content[0];
        
        // Handle the different potential response formats with proper type checking
        if ('text' in content) {
          // Handle text content when directly accessible
          feedback = typeof content.text === 'object' 
            ? content.text.value 
            : String(content.text);
        } else {
          // For newer API formats, we need to check the structure carefully
          // First, convert to 'any' type to bypass strict type checking
          const anyContent = content as any;
          
          // Now safely check for properties
          if (anyContent && anyContent.type && anyContent.text) {
            feedback = typeof anyContent.text === 'object'
              ? anyContent.text.value
              : String(anyContent.text);
          } else {
            // Log the content for debugging and provide a meaningful error
            console.error("Unexpected content format from OpenAI:", JSON.stringify(content, null, 2));
            throw new Error("Unsupported response content type from assistant");
          }
        }
        
        logResponse('analyze-response', 200, 'Successfully generated final feedback via assistant', {
          threadId: thread.id,
          feedbackLength: feedback.length,
          feedbackExcerpt: feedback.substring(0, 50) + (feedback.length > 50 ? '...' : '')
        });
        
        // Return feedback and indicate this was the last question
        return res.status(200).json({ 
          feedback, 
          isLastQuestion: true,
          threadId: thread.id
        });
      } catch (error: any) {
        // If the Assistants API fails, provide a clear error
        console.error('Error using OpenAI Assistants API for feedback:', error);
        logResponse('analyze-response', 500, 'Error using OpenAI Assistants API for feedback', {
          errorMessage: error?.message || 'Unknown error'
        });
        
        // Return a helpful error message to the client
        return res.status(500).json({ 
          error: 'Failed to generate interview feedback', 
          details: error.message || 'An error occurred with the AI assistant',
          isLastQuestion: true
        });
      }
    } else {
      logRequest('analyze-response', 'Processing ongoing interview response');
      
      try {
        // Check if OpenAI API key is available before attempting API call
        if (!process.env.OPENAI_API_KEY) {
          logResponse('analyze-response', 500, 'OpenAI API key missing');
          return res.status(500).json({ 
            error: 'OpenAI API configuration is missing',
            details: 'The OpenAI API key is required for interview functionality.'
          });
        }
        
        // Get or create an interview assistant
        const { assistantId } = await getOrCreateInterviewAssistant();
        
        // Check if we have a thread ID passed from the client
        let threadId: string | undefined = req.body.threadId;
        
        // Use existing thread or create a new one
        if (!threadId) {
          // Create a new thread with initial context
          let contextMessage = `I'm preparing for an interview for the position of ${jobTitle} at ${company}.`;
          
          if (jobDescription && jobDescription.length > 10) {
            contextMessage += `\n\nHere is the complete job description:\n${jobDescription}`;
          }
          
          const thread = await openaiInstance.beta.threads.create({
            messages: [
              {
                role: "user",
                content: contextMessage
              }
            ]
          });
          
          threadId = thread.id;
          
          // Add conversation history if this is not the first message
          if (conversation && conversation.length > 0) {
            for (const message of conversation) {
              await openaiInstance.beta.threads.messages.create(
                threadId,
                {
                  role: message.role === 'assistant' ? 'assistant' : 'user',
                  content: message.content
                }
              );
            }
          }
        }
        
        // Add the user's latest response
        await openaiInstance.beta.threads.messages.create(
          threadId,
          {
            role: "user",
            content: userResponse
          }
        );
        
        // Add a prompt for feedback and next question
        await openaiInstance.beta.threads.messages.create(
          threadId,
          {
            role: "user",
            content: "Please provide brief feedback on my answer, then ask your next interview question."
          }
        );
        
        // Run the assistant on the thread
        const run = await openaiInstance.beta.threads.runs.create(
          threadId,
          {
            assistant_id: assistantId,
            instructions: `You are a $200/hr professional interview coach. For each session, read the job description in detail and ask role-specific, intelligent, and challenging questions tailored to that position. Never repeat the job post directly. Think like a hiring manager. Ask one question at a time, wait for an answer, and then respond with thoughtful feedback or a follow-up question.

Important Instructions for this ${jobTitle} position at ${company}:
1. First, identify 3-5 key themes, skills, or responsibilities from the job description.
2. Generate thoughtful questions that probe for experience and competency in these areas.
3. Ask questions that require specific examples, not just theoretical knowledge.
4. NEVER parrot the job description text verbatim - synthesize and reframe.
5. Be conversational but professional, as if you're an actual hiring manager.
6. After each answer, offer clear, practical feedback focusing on how the candidate can improve clarity, confidence, and alignment with the job requirements.
7. Always provide brief, specific feedback before asking your next question.`
          }
        );
        
        // Wait for completion
        let completedRun = await openaiInstance.beta.threads.runs.retrieve(
          threadId,
          run.id
        );
        
        // Poll for completion
        while (completedRun.status !== "completed") {
          await new Promise(resolve => setTimeout(resolve, 1000));
          completedRun = await openaiInstance.beta.threads.runs.retrieve(
            threadId,
            run.id
          );
          
          if (["failed", "cancelled", "expired"].includes(completedRun.status)) {
            throw new Error(`Run ended with status: ${completedRun.status}`);
          }
        }
        
        // Get messages from the thread
        const messages = await openaiInstance.beta.threads.messages.list(threadId);
        
        // Get the latest assistant message (the feedback + next question)
        const responseMessage = messages.data
          .filter(msg => msg.role === "assistant")
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
        
        if (!responseMessage || !responseMessage.content || responseMessage.content.length === 0) {
          throw new Error("No response content received from assistant");
        }
        
        // Extract the text content safely handling different content types
        let aiResponse = '';
        const content = responseMessage.content[0];
        
        // Handle the different potential response formats with proper type checking
        if ('text' in content) {
          // Handle text content when directly accessible
          aiResponse = typeof content.text === 'object' 
            ? content.text.value 
            : String(content.text);
        } else {
          // For newer API formats, we need to check the structure carefully
          // First, convert to 'any' type to bypass strict type checking
          const anyContent = content as any;
          
          // Now safely check for properties
          if (anyContent && anyContent.type && anyContent.text) {
            aiResponse = typeof anyContent.text === 'object'
              ? anyContent.text.value
              : String(anyContent.text);
          } else {
            // Log the content for debugging and provide a meaningful error
            console.error("Unexpected content format from OpenAI:", JSON.stringify(content, null, 2));
            throw new Error("Unsupported response content type from assistant");
          }
        }
        
        logResponse('analyze-response', 200, 'Successfully generated next question via assistant', {
          threadId,
          responseLength: aiResponse.length,
          responseExcerpt: aiResponse.substring(0, 50) + (aiResponse.length > 50 ? '...' : '')
        });
        
        // Return the AI's next response with the thread ID
        return res.status(200).json({ 
          isLastQuestion: false,
          aiResponse,
          threadId
        });
      } catch (error: any) {
        // If the Assistants API fails, provide a clear error
        console.error('Error using OpenAI Assistants API for ongoing interview:', error);
        logResponse('analyze-response', 500, 'Error using OpenAI Assistants API for ongoing interview', {
          errorMessage: error?.message || 'Unknown error'
        });
        
        // Return a helpful error message to the client
        return res.status(500).json({ 
          error: 'Failed to generate interview question', 
          details: error.message || 'An error occurred with the AI assistant',
          isLastQuestion: false
        });
      }
    }
  } catch (error: any) {
    logResponse('analyze-response', 500, 'Error analyzing interview response', error);
    return res.status(500).json({ 
      error: 'Failed to analyze interview response',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Transcribe speech audio to text
 */
router.post('/transcribe', requireLoginFallback, async (req: Request, res: Response) => {
  try {
    // Log the start of the transcription process
    logRequest('transcribe', 'Transcription request received');
    
    const validationResult = transcribeSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logResponse('transcribe', 400, 'Invalid request data', validationResult.error.format());
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { audio } = validationResult.data;
    
    // Log incoming request for debugging with a truncated preview
    let audioPreview = '';
    if (audio) {
      audioPreview = audio.substring(0, 50) + (audio.length > 50 ? '...' : '');
    }
    logRequest('transcribe', `Transcription request with payload size: ${audio?.length || 0}`, { preview: audioPreview });
    
    // Validate audio data length and basic format
    if (!audio || audio.length < 100) {
      logResponse('transcribe', 400, 'Audio data too small or missing', { length: audio?.length || 0 });
      return res.status(400).json({ 
        error: 'Audio data is too small', 
        details: 'The recording is too short to process. Please hold the microphone button longer when speaking.' 
      });
    }
    
    // Save a copy of the audio for debugging
    const debugFilePath = saveAudioForDebugging(audio, 'transcribe');
    if (debugFilePath) {
      logRequest('transcribe', `Saved debug audio copy to: ${debugFilePath}`);
    }
    
    // Extract the actual base64 data (remove the data URL prefix if present)
    let cleanedAudio = audio;
    let mimetype = 'audio/webm'; // Default to webm if no MIME type is present
    
    if (audio.includes('base64,')) {
      // Extract the MIME type from the data URL
      const matches = audio.match(/^data:([^;]+);base64,(.+)$/);
      if (matches && matches.length >= 3) {
        mimetype = matches[1];
        cleanedAudio = matches[2];
        logRequest('transcribe', `Extracted MIME type: ${mimetype} from data URL`);
      } else {
        // If no proper match but there's a comma, split at the comma
        cleanedAudio = audio.split(',')[1] || audio;
        logRequest('transcribe', 'Could not extract MIME type but split at comma');
      }
    }
    
    // Validate that cleaned audio contains valid base64 data
    if (!/^[A-Za-z0-9+/=]+$/.test(cleanedAudio)) {
      logResponse('transcribe', 400, 'Invalid base64 data in audio');
      return res.status(400).json({ 
        error: 'Invalid audio format', 
        details: 'The audio data is not properly encoded. Please try recording again or use a different browser.' 
      });
    }
    
    // Convert base64 to buffer
    const buffer = Buffer.from(cleanedAudio, 'base64');
    logRequest('transcribe', `Converted to buffer, size: ${buffer.length} bytes`);
    
    if (buffer.length === 0) {
      logResponse('transcribe', 400, 'Empty buffer created from base64 data');
      return res.status(400).json({ 
        error: 'Empty audio content', 
        details: 'The audio data could not be processed. Please try recording again.' 
      });
    }
    
    // Create a temporary file path using a supported OpenAI format
    // OpenAI Whisper API supports: flac, m4a, mp3, mp4, mpeg, mpga, oga, ogg, wav, or webm
    let fileExtension = 'webm'; // Default extension
    
    // Map mime types to file extensions that Whisper API supports
    if (mimetype) {
      if (mimetype.includes('mp3') || mimetype.includes('mpeg')) {
        fileExtension = 'mp3';
      } else if (mimetype.includes('webm')) {
        fileExtension = 'webm';
      } else if (mimetype.includes('wav') || mimetype.includes('x-wav')) {
        fileExtension = 'wav';
      } else if (mimetype.includes('mp4')) {
        fileExtension = 'mp4';
      } else if (mimetype.includes('ogg')) {
        fileExtension = 'ogg';
      } else if (mimetype.includes('mpga')) {
        fileExtension = 'mpga';
      } else if (mimetype.includes('m4a')) {
        fileExtension = 'm4a';
      } else if (mimetype.includes('flac')) {
        fileExtension = 'flac';
      }
    }
    
    logRequest('transcribe', `Using file extension: ${fileExtension} based on MIME type: ${mimetype}`);
    
    // Create a path in the system temp directory which should always be writable
    let uploadDir = path.join(process.cwd(), 'uploads', 'temp');
    
    // Create the directory if it doesn't exist
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        logRequest('transcribe', `Created upload directory: ${uploadDir}`);
      }
    } catch (dirError) {
      // If we can't create the directory, fall back to system temp
      logRequest('transcribe', 'Failed to create upload directory, using system temp');
      // /tmp should be available on both Linux and macOS
      const systemTempDir = '/tmp';
      if (!fs.existsSync(systemTempDir)) {
        try {
          fs.mkdirSync(systemTempDir, { recursive: true });
        } catch (tmpDirError) {
          logRequest('transcribe', 'Failed to create /tmp directory, using current directory');
          uploadDir = '.';
        }
      }
      uploadDir = systemTempDir;
    }
    
    const tempFilePath = path.join(uploadDir, `audio-${Date.now()}.${fileExtension}`);
    
    // Write the buffer to a temporary file
    try {
      fs.writeFileSync(tempFilePath, buffer);
      logRequest('transcribe', `Successfully wrote audio file to: ${tempFilePath}`);
      
      // Verify file exists and has content
      const stats = fs.statSync(tempFilePath);
      logRequest('transcribe', 'Audio file stats', {
        size: stats.size,
        created: stats.birthtime
      });
      
      if (stats.size === 0) {
        logResponse('transcribe', 400, 'Empty audio file', { path: tempFilePath });
        return res.status(400).json({ error: 'Empty audio file received. Please try recording again.' });
      }
    } catch (fileError: any) {
      logResponse('transcribe', 500, 'Error writing audio file', fileError);
      return res.status(500).json({ 
        error: 'Failed to create audio file for transcription',
        details: fileError.message 
      });
    }
    
    try {
      // Check if the OpenAI API key is set
      if (!process.env.OPENAI_API_KEY) {
        logResponse('transcribe', 500, 'OpenAI API key missing');
        return res.status(500).json({ error: 'OpenAI API configuration is missing' });
      }
      
      logRequest('transcribe', 'Creating file read stream for OpenAI Whisper API...');
      
      // NOTE: We're not using FormData directly as it's handled by the OpenAI SDK
      // Just log the file information for debugging
      const fileBuffer = fs.readFileSync(tempFilePath);
      
      logRequest('transcribe', 'File prepared for OpenAI API', {
        fileSize: fileBuffer.length,
        fileExtension,
        mimeType: mimetype
      });
      
      logRequest('transcribe', 'Calling OpenAI Whisper API for audio transcription...', {
        fileSize: fileBuffer.length,
        fileExtension: fileExtension,
        mimeType: mimetype
      });
      
      // Use OpenAI's Whisper API to transcribe the audio
      const transcription = await openaiInstance.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'en',
        response_format: 'text'
      });
      
      // With response_format: 'text', the API returns a direct string
      let transcribedText = '';
      
      // Handle both string and object responses
      if (typeof transcription === 'string') {
        // This is the expected case with response_format: 'text'
        transcribedText = transcription;
        const excerpt = transcribedText.substring(0, 50) + (transcribedText.length > 50 ? '...' : '');
        logResponse('transcribe', 200, 'Transcription completed successfully (string format)', {
          textLength: transcribedText.length,
          excerpt: excerpt
        });
      } else if (transcription && typeof transcription === 'object') {
        // Handle object response format (for compatibility)
        // Check if 'text' property exists and is a string
        if ('text' in transcription && typeof (transcription as any).text === 'string') {
          transcribedText = (transcription as any).text;
          const excerpt = transcribedText.substring(0, 50) + (transcribedText.length > 50 ? '...' : '');
          logResponse('transcribe', 200, 'Transcription completed successfully (object format)', {
            textLength: transcribedText.length,
            excerpt: excerpt
          });
        } else {
          logResponse('transcribe', 500, 'Object transcription missing text property');
          return res.status(500).json({
            error: 'Invalid transcription result',
            details: 'The transcription service returned an invalid object format. Please try again.'
          });
        }
      } else {
        // Handle unexpected response format (neither string nor object with text property)
        logResponse('transcribe', 500, 'Unexpected transcription format from OpenAI API', {
          received: typeof transcription,
          value: transcription
        });
        
        // Since we got something back, try to use it anyway if it has string content
        if (transcription) {
          try {
            const stringValue = String(transcription);
            if (stringValue && stringValue.length > 0) {
              transcribedText = stringValue;
              logResponse('transcribe', 200, 'Recovered transcription from unexpected format', {
                textLength: transcribedText.length
              });
            } else {
              return res.status(500).json({
                error: 'Empty transcription result',
                details: 'The transcription service returned an empty response. Please try again.'
              });
            }
          } catch (stringifyError) {
            return res.status(500).json({
              error: 'Invalid transcription result',
              details: 'The transcription service returned an unexpected format. Please try again.'
            });
          }
        } else {
          return res.status(500).json({
            error: 'Missing transcription result',
            details: 'The transcription service returned no data. Please try again.'
          });
        }
      }
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFilePath);
        logRequest('transcribe', 'Temporary file cleaned up successfully');
      } catch (cleanupError) {
        // Non-fatal error, just log it
        logRequest('transcribe', 'Non-fatal error cleaning up temporary file', cleanupError);
      }
      
      return res.status(200).json({ text: transcribedText });
    } catch (transcriptionError: any) {
      // Log the full error for debugging
      console.error('Whisper API Error:', transcriptionError);
      
      // Clean up the temporary file in case of error
      if (fs.existsSync(tempFilePath)) {
        try {
          fs.unlinkSync(tempFilePath);
          logRequest('transcribe', 'Temporary file cleaned up after error');
        } catch (cleanupError) {
          logResponse('transcribe', 500, 'Error cleaning up temporary file', cleanupError);
        }
      }
      
      // Get detailed error information from the OpenAI response
      const errorMessage = transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError);
      const errorDetails = transcriptionError.response?.data || {};
      
      logResponse('transcribe', 500, 'Error during transcription', { 
        message: errorMessage,
        filePath: tempFilePath,
        openaiDetails: errorDetails,
        stack: transcriptionError instanceof Error ? transcriptionError.stack : undefined
      });
      
      // Check for specific OpenAI API errors
      if (errorMessage.includes('API key')) {
        return res.status(500).json({ 
          error: 'OpenAI API key issue. Please check server configuration.',
          details: errorMessage 
        });
      } else if (errorMessage.includes('No such file')) {
        return res.status(500).json({ 
          error: 'File reading error during transcription',
          details: errorMessage 
        });
      } else if (errorMessage.includes('format') || errorMessage.includes('Content-Type') || 
                errorMessage.includes('multipart/form-data')) {
        return res.status(500).json({ 
          error: 'Audio format error',
          details: `The audio format is not compatible with OpenAI's Whisper API. Error: ${errorMessage}`
        });
      } else if (errorMessage.includes('too short') || errorMessage.includes('audio_too_short')) {
        return res.status(500).json({ 
          error: 'Recording too short',
          details: 'The audio recording must be at least 0.1 seconds long. Please hold the microphone button longer when speaking.'
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to transcribe audio', 
          details: errorMessage || 'Unknown error with OpenAI Whisper API'
        });
      }
    }
  } catch (error: any) {
    console.error('General error in transcribe endpoint:', error);
    logResponse('transcribe', 500, 'Error in transcribe endpoint', error);
    return res.status(500).json({ error: 'Failed to process audio for transcription' });
  }
});

/**
 * Convert text to speech using OpenAI's API
 */
router.post('/text-to-speech', requireLoginFallback, async (req: Request, res: Response) => {
  try {
    // Log the start of the TTS process
    logRequest('text-to-speech', 'Text-to-speech request received');
    
    const validationResult = textToSpeechSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      logResponse('text-to-speech', 400, 'Invalid request data', validationResult.error.format());
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { text, voice, speed } = validationResult.data;
    
    logRequest('text-to-speech', `Text-to-speech request received, text length: ${text.length}, voice: ${voice}, speed: ${speed}`, {
      textExcerpt: text.substring(0, 50) + (text.length > 50 ? '...' : '')
    });
  
    // Check if the OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      logResponse('text-to-speech', 500, 'OpenAI API key missing');
      return res.status(500).json({ error: 'OpenAI API configuration is missing' });
    }
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads', 'audio');
    if (!fs.existsSync(uploadsDir)) {
      logRequest('text-to-speech', `Creating uploads directory: ${uploadsDir}`);
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        logRequest('text-to-speech', 'Successfully created uploads directory');
      } catch (mkdirError) {
        logResponse('text-to-speech', 500, 'Error creating uploads directory', mkdirError);
        return res.status(500).json({ error: 'Failed to create audio storage directory' });
      }
    }
    
    // Generate a unique filename
    const timestamp = Date.now();
    const audioFilename = `speech_${timestamp}.mp3`;
    const audioPath = path.join(uploadsDir, audioFilename);
    const audioUrl = `/uploads/audio/${audioFilename}`;
    
    logRequest('text-to-speech', 'Preparing audio file paths', {
      audioPath,
      audioUrl
    });
    
    let mp3;
    let buffer;
    
    try {
      logRequest('text-to-speech', `Calling OpenAI TTS API with premium HD quality settings`);
      
      // Call OpenAI's TTS API with the highest quality settings
      const speedToUse = speed || 1.12; // Slightly faster for natural conversation pace
      
      logRequest('text-to-speech', `Using premium voice quality: model=tts-1-hd, voice=nova, speed=${speedToUse}`);
      
      mp3 = await openaiInstance.audio.speech.create({
        model: 'tts-1-hd', // Use the highest quality HD model
        voice: 'nova',     // Nova voice for consistency
        input: text,
        speed: speedToUse,
        response_format: 'mp3'
      });
      
      if (!mp3) {
        logResponse('text-to-speech', 500, 'OpenAI TTS API returned null response');
        return res.status(500).json({ 
          error: 'Empty response from text-to-speech API',
          details: 'The TTS service returned an empty response. Please try again.'
        });
      }
      
      logRequest('text-to-speech', 'OpenAI TTS API call successful, processing response...');
      
      // Convert response to Buffer
      buffer = Buffer.from(await mp3.arrayBuffer());
      logRequest('text-to-speech', `Converted audio to buffer, size: ${buffer.length} bytes`);
      
      if (buffer.length === 0) {
        logResponse('text-to-speech', 500, 'Empty buffer created from API response');
        return res.status(500).json({ 
          error: 'Empty audio content',
          details: 'The generated audio was empty. Please try again.'
        });
      }
      
      // Save audio file to disk
      fs.writeFileSync(audioPath, buffer);
      logRequest('text-to-speech', 'Successfully saved audio file to disk');
      
      // Verify file exists and has the right size
      const stats = fs.statSync(audioPath);
      logRequest('text-to-speech', 'Audio file stats', {
        size: stats.size,
        created: stats.birthtime
      });
      
      if (stats.size === 0) {
        logResponse('text-to-speech', 500, 'Generated empty audio file', { path: audioPath });
        return res.status(500).json({ error: 'Generated audio file is empty. Please try again.' });
      }
      
      // Log successful response
      logResponse('text-to-speech', 200, 'Successfully generated speech audio', {
        audioUrl,
        size: buffer.length
      });
      
      // Return success with the URL to the audio file
      return res.status(200).json({ 
        audioUrl,
        text, // Include the original text for fallback
        success: true,
        size: buffer.length
      });
      
    } catch (ttsError: any) {
      logResponse('text-to-speech', 500, 'Error generating speech', ttsError);
      
      // Check if it's an OpenAI API error with a specific message
      if (ttsError.message && ttsError.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'OpenAI API key issue. Please check server configuration.',
          details: ttsError.message 
        });
      } else if (ttsError.message && ttsError.message.includes('Rate limit')) {
        return res.status(429).json({ 
          error: 'OpenAI API rate limit exceeded. Please try again later.',
          details: ttsError.message 
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to generate speech audio',
          details: ttsError.message || 'Unknown error'
        });
      }
    }
  } catch (error) {
    logResponse('text-to-speech', 500, 'Error in text-to-speech endpoint', error);
    return res.status(500).json({ error: 'Failed to process text-to-speech request' });
  }
});

export const registerInterviewVoiceRoutes = (app: Router) => {
  // Export the router directly to avoid route conflicts
  return router;
};