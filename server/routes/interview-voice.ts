import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { openaiInstance } from '../openai';
import { z } from 'zod';
import { storage } from '../storage';

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
  })).optional().default([])
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
    let workHistory = [];
    let education = [];
    let skills = [];
    let achievements = [];
    
    try {
      // Here we'd fetch from actual endpoints if available
      // Since we might not have actual endpoints for these in every implementation,
      // handle gracefully if they don't exist
      
      // These would be the ideal implementations:
      // workHistory = await storage.getUserWorkHistory(userId);
      // education = await storage.getUserEducation(userId);
      // skills = await storage.getUserSkills(userId);
      // achievements = await storage.getUserAchievements(userId);
      
      // For now, provide sample data if user's work history isn't available
      workHistory = [
        {
          company: "Tech Solutions Inc.",
          position: "Senior Developer",
          startDate: "2020-01",
          endDate: "Present",
          description: "Lead development team, implement microservices architecture"
        },
        {
          company: "WebDev Co",
          position: "Frontend Developer",
          startDate: "2017-05",
          endDate: "2019-12",
          description: "Built responsive web applications using React"
        }
      ];
      
      education = [
        {
          institution: "University of Technology",
          degree: "BS Computer Science",
          startDate: "2013-09",
          endDate: "2017-05",
          achievements: ["Dean's List", "Senior Project Award"]
        }
      ];
      
      skills = ["JavaScript", "TypeScript", "React", "Node.js", "Express", "SQL", "NoSQL", "CI/CD"];
      
      achievements = [
        "Reduced application load time by 45% through code optimization",
        "Led team of 5 developers to deliver project under budget and ahead of schedule",
        "Implemented automated testing that improved code quality by 30%"
      ];
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
    
    // Construct the dynamic system prompt
    return `You are a world-class AI Interview Coach.

The user is interviewing for:
- Job Title: ${jobTitle}
- Company: ${company}
- Job Description: ${jobDescription}

The user's background is:
- Work History: ${workHistorySummary}
- Education: ${educationSummary}
- Skills: ${skillsSummary}
- Achievements: ${achievementsSummary}

Your goal:
- Conduct a realistic mock interview.
- Ask specific, role-relevant, and company-contextual questions based on the job description.
- Adapt difficulty and topics based on the user's answers.
- After each answer, provide personalized feedback (Strengths and Areas for Improvement).
- Maintain a supportive but challenging tone.
- Ask one question at a time. Keep your questions concise and focused.
- If this is the first question, introduce yourself briefly as the interviewer and then ask an appropriate opening question.`;
  } catch (error) {
    console.error("Error generating dynamic system prompt:", error);
    return getBasicSystemPrompt(jobTitle, company, jobDescription);
  }
}

/**
 * Generate a basic system prompt as fallback
 */
function getBasicSystemPrompt(jobTitle: string, company: string, jobDescription: string): string {
  return `You are an expert interviewer for a ${jobTitle} position at ${company}. 
  Your task is to conduct a realistic job interview, asking relevant and challenging questions.
  ${jobDescription ? `The job description is: ${jobDescription}` : ''}
  
  Ask one question at a time. Make your questions specifically relevant to the job title 
  and company. Ask a mix of behavioral, technical, and situational questions appropriate 
  for this role. Keep your questions concise and focused.
  
  If this is the first question, introduce yourself briefly as the interviewer and then 
  ask an appropriate opening question.`;
}

/**
 * Generate a relevant interview question based on job details and conversation history
 */
router.post('/generate-question', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = generateQuestionSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { jobTitle, company, jobDescription, conversation } = validationResult.data;
    
    // Generate dynamic system prompt with user profile data
    const systemPrompt = await generateDynamicSystemPrompt(req, jobTitle, company, jobDescription);
    
    // Prepare conversation history for OpenAI in the expected format
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];
    
    // Add conversation history
    conversation.forEach(message => {
      messages.push({
        role: message.role,
        content: message.content
      });
    });
    
    // If this is a new conversation, add a prompt to start the interview
    if (conversation.length === 0) {
      messages.push({
        role: 'user',
        content: `Start the interview for a ${jobTitle} position at ${company}.`
      });
    } else {
      // If we already have conversation, ask the AI to continue with next question
      messages.push({
        role: 'user',
        content: 'Please ask the next interview question based on our conversation so far.'
      });
    }
    
    // Call OpenAI to generate a question
    const completion = await openaiInstance.chat.completions.create({
      model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: messages as any, // Type cast to satisfy TypeScript
      temperature: 0.7, // Slight creativity in questions
      max_tokens: 200 // Keep responses concise
    });
    
    const question = completion.choices[0].message.content;
    
    return res.status(200).json({ question });
  } catch (error) {
    console.error('Error generating interview question:', error);
    return res.status(500).json({ error: 'Failed to generate interview question' });
  }
});

/**
 * Analyze a user's interview response and provide feedback
 */
router.post('/analyze-response', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = analyzeResponseSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { jobTitle, company, jobDescription, userResponse, conversation } = validationResult.data;
    
    // Generate dynamic system prompt with user profile data
    const systemPrompt = await generateDynamicSystemPrompt(req, jobTitle, company, jobDescription);
    
    // Determine if this should be the last question based on conversation length
    // Typically end after 5 question-answer pairs (10 messages)
    const isLastQuestion = conversation.length >= 9; // 4 questions + 5th question's answer
    
    if (isLastQuestion) {
      // Generate comprehensive feedback for the entire interview
      const feedbackMessages = [
        {
          role: 'system',
          content: `You are an expert career coach providing feedback on a job interview for a ${jobTitle} position at ${company}.
          Analyze the entire interview conversation and provide constructive, actionable feedback.
          Include specific strengths, areas for improvement, and 3-5 concrete suggestions.
          Format your response in a structured way with clear sections.
          
          Base your feedback on these details about the job and candidate:
          ${systemPrompt}`
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
        role: 'user',
        content: userResponse
      });
      
      feedbackMessages.push({
        role: 'user',
        content: 'Please provide comprehensive feedback on my interview performance.'
      });
      
      // Call OpenAI to generate feedback
      const completion = await openaiInstance.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: feedbackMessages as any,
        temperature: 0.7,
        max_tokens: 1000, // Allow for detailed feedback
        stream: true // Enable streaming for more responsive UX
      });
      
      // Process the stream and collect the complete feedback
      let feedback = '';
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || '';
        feedback += content;
      }
      
      return res.status(200).json({ 
        feedback, 
        isLastQuestion: true 
      });
    } else {
      // For ongoing interviews, provide brief feedback on the response
      const analysisMessages = [
        {
          role: 'system',
          content: `You are an expert interviewer for a ${jobTitle} position at ${company}.
          Analyze the candidate's response briefly but do not generate any feedback text.
          Your evaluation will be used internally to gauge the quality of responses.
          
          Base your analysis on these details about the job and candidate:
          ${systemPrompt}`
        }
      ];
      
      // Add relevant conversation context
      const relevantHistory = conversation.slice(-2); // Just the most recent Q&A
      relevantHistory.forEach(message => {
        analysisMessages.push({
          role: message.role,
          content: message.content
        });
      });
      
      // Add the current response
      analysisMessages.push({
        role: 'user',
        content: userResponse
      });
      
      // Call OpenAI to analyze the response (but don't show this to the user)
      await openaiInstance.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: analysisMessages as any,
        temperature: 0.7,
        max_tokens: 200
      });
      
      // Simply return success, the frontend will request the next question
      return res.status(200).json({ 
        isLastQuestion: false 
      });
    }
  } catch (error) {
    console.error('Error analyzing interview response:', error);
    return res.status(500).json({ error: 'Failed to analyze interview response' });
  }
});

/**
 * Transcribe speech audio to text
 */
router.post('/transcribe', requireAuth, async (req: Request, res: Response) => {
  try {
    const validationResult = transcribeSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Invalid request data', 
        details: validationResult.error.format() 
      });
    }
    
    const { audio } = validationResult.data;
    
    // Convert base64 to buffer
    const buffer = Buffer.from(audio, 'base64');
    
    // Create a temporary file path
    const tempFilePath = `/tmp/audio-${Date.now()}.webm`;
    
    // Write the buffer to a temporary file
    const fs = require('fs');
    fs.writeFileSync(tempFilePath, buffer);
    
    try {
      // Use OpenAI's Whisper API to transcribe the audio
      const transcription = await openaiInstance.audio.transcriptions.create({
        file: fs.createReadStream(tempFilePath),
        model: 'whisper-1',
        language: 'en', // Specify English language
        response_format: 'text' // Ensure we get plain text back
      });
      
      // Clean up the temporary file
      fs.unlinkSync(tempFilePath);
      
      return res.status(200).json({ text: transcription.text });
    } catch (transcriptionError) {
      // Clean up the temporary file in case of error
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
      
      console.error('Error during transcription:', transcriptionError);
      return res.status(500).json({ error: 'Failed to transcribe audio' });
    }
  } catch (error) {
    console.error('Error in transcribe endpoint:', error);
    return res.status(500).json({ error: 'Failed to process audio for transcription' });
  }
});

export const registerInterviewVoiceRoutes = (app: Router) => {
  app.use('/api/interview', router);
};