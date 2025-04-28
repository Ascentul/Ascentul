import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { openaiInstance } from '../openai';
import { z } from 'zod';

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
    
    // Prepare conversation history for OpenAI in the expected format
    const messages = [
      {
        role: 'system',
        content: `You are an expert interviewer for a ${jobTitle} position at ${company}. 
        Your task is to conduct a realistic job interview, asking relevant and challenging questions.
        ${jobDescription ? `The job description is: ${jobDescription}` : ''}
        
        Ask one question at a time. Make your questions specifically relevant to the job title 
        and company. Ask a mix of behavioral, technical, and situational questions appropriate 
        for this role. Keep your questions concise and focused.
        
        If this is the first question, introduce yourself briefly as the interviewer and then 
        ask an appropriate opening question.`
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
          Format your response in a structured way with clear sections.`
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
        max_tokens: 1000 // Allow for detailed feedback
      });
      
      const feedback = completion.choices[0].message.content;
      
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
          Your evaluation will be used internally to gauge the quality of responses.`
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
    
    // Create a temporary file for the audio (in-memory)
    const audioBlob = new Blob([buffer], { type: 'audio/webm' });
    
    // Use OpenAI's Whisper API to transcribe the audio
    const transcription = await openaiInstance.audio.transcriptions.create({
      file: audioBlob as any,
      model: 'whisper-1'
    });
    
    return res.status(200).json({ text: transcription.text });
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return res.status(500).json({ error: 'Failed to transcribe audio' });
  }
});

export const registerInterviewVoiceRoutes = (app: Router) => {
  app.use('/api/interview', router);
};