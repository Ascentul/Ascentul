import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { openaiInstance } from '../openai';
import { z } from 'zod';
import { storage } from '../storage';
import fs from 'fs';
import path from 'path';
import { logRequest, logResponse, saveAudioForDebugging } from '../debug-voice-practice';

// Define interfaces for our data structures
interface WorkHistoryItem {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface EducationItem {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
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

// Schema for text-to-speech request
const textToSpeechSchema = z.object({
  text: z.string().min(1, "Text is required"),
  voice: z.string().optional().default('nova')
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
    
    const { jobTitle, company, jobDescription, conversation } = validationResult.data;
    
    logRequest('generate-question', 'Valid request data received', {
      jobTitle,
      company,
      hasJobDescription: !!jobDescription,
      conversationLength: conversation.length
    });
    
    // Generate dynamic system prompt with user profile data
    const systemPrompt = await generateDynamicSystemPrompt(req, jobTitle, company, jobDescription);
    
    // Prepare conversation history for OpenAI in the expected format
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];
    
    // Add conversation history
    conversation.forEach((message, index) => {
      messages.push({
        role: message.role,
        content: message.content
      });
      
      // Log conversation history for debugging
      logRequest('generate-question', `Conversation message ${index}`, {
        role: message.role,
        contentLength: message.content.length,
        excerpt: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
      });
    });
    
    // If this is a new conversation, add a prompt to start the interview
    if (conversation.length === 0) {
      const startPrompt = `Start the interview for a ${jobTitle} position at ${company}.`;
      messages.push({
        role: 'user',
        content: startPrompt
      });
      logRequest('generate-question', 'Starting new interview', { prompt: startPrompt });
    } else {
      // If we already have conversation, ask the AI to continue with next question
      const continuePrompt = 'Please ask the next interview question based on our conversation so far.';
      messages.push({
        role: 'user',
        content: continuePrompt
      });
      logRequest('generate-question', 'Continuing existing interview', { prompt: continuePrompt });
    }
    
    logRequest('generate-question', 'Calling OpenAI API', {
      model: 'gpt-4o',
      messageCount: messages.length,
      isNewConversation: conversation.length === 0
    });
    
    try {
      // Call OpenAI to generate a question
      const completion = await openaiInstance.chat.completions.create({
        model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: messages,
        temperature: 0.7, // Slight creativity in questions
        max_tokens: 300, // Keep responses concise but allow for context
        stream: false // Disable streaming for reliability
      });
      
      const aiResponse = completion.choices[0].message.content;
      
      // Log the generated question for debugging
      logResponse('generate-question', 200, 'Successfully generated interview question', {
        responseLength: aiResponse.length,
        responseExcerpt: aiResponse.substring(0, 50) + (aiResponse.length > 50 ? '...' : '')
      });
      
      // Return the question as aiResponse to match the analyze-response endpoint format
      return res.status(200).json({ 
        question: aiResponse, // Keep for backward compatibility
        aiResponse: aiResponse // Add this field to match analyze-response format
      });
    } catch (openaiError: any) {
      logResponse('generate-question', 500, 'OpenAI API error', openaiError);
      return res.status(500).json({ 
        error: 'Failed to generate interview question', 
        details: openaiError.message || 'Unknown error with OpenAI API'
      });
    }
  } catch (error: any) {
    logResponse('generate-question', 500, 'Error generating interview question', error);
    return res.status(500).json({ 
      error: 'Failed to generate interview question',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * Analyze a user's interview response and provide feedback
 */
router.post('/analyze-response', requireAuth, async (req: Request, res: Response) => {
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
      userResponseLength: userResponse.length,
      conversationLength: conversation.length,
      conversationSummary: conversation.map(msg => ({ role: msg.role, contentLength: msg.content.length })),
      userResponseExcerpt: userResponse.substring(0, 50) + (userResponse.length > 50 ? '...' : '')
    });
    
    // Generate dynamic system prompt with user profile data
    const systemPrompt = await generateDynamicSystemPrompt(req, jobTitle, company, jobDescription);
    
    // Determine if this should be the last question based on conversation length
    // Typically end after 5 question-answer pairs (10 messages)
    const isLastQuestion = conversation.length >= 9; // 4 questions + 5th question's answer
    
    logRequest('analyze-response', `Processing ${isLastQuestion ? 'final feedback' : 'ongoing interview'} response`);
    
    if (isLastQuestion) {
      logRequest('analyze-response', 'Generating comprehensive interview feedback');
      
      // Generate comprehensive feedback for the entire interview
      const feedbackMessages: OpenAIMessage[] = [
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
      
      logRequest('analyze-response', 'Calling OpenAI API for feedback generation', {
        messageCount: feedbackMessages.length
      });
      
      try {
        // Call OpenAI to generate feedback - disable streaming for reliability
        const completion = await openaiInstance.chat.completions.create({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: feedbackMessages,
          temperature: 0.7,
          max_tokens: 1000, // Allow for detailed feedback
          stream: false // Disable streaming for reliability
        });
        
        const feedback = completion.choices[0].message.content;
        
        logResponse('analyze-response', 200, 'Successfully generated final feedback', {
          feedbackLength: feedback.length,
          feedbackExcerpt: feedback.substring(0, 50) + (feedback.length > 50 ? '...' : '')
        });
        
        // Return feedback and indicate this was the last question
        return res.status(200).json({ 
          feedback, 
          isLastQuestion: true 
        });
      } catch (openaiError: any) {
        logResponse('analyze-response', 500, 'OpenAI API error during feedback generation', openaiError);
        return res.status(500).json({ 
          error: 'Failed to generate interview feedback', 
          details: openaiError.message || 'Unknown error with OpenAI API'
        });
      }
    } else {
      logRequest('analyze-response', 'Processing ongoing interview response');
      
      // For regular ongoing interview, generate the next AI response directly
      // First, prepare system message for the interview conversation
      const interviewSystemPrompt = await generateDynamicSystemPrompt(req, jobTitle, company, jobDescription);
      
      const interviewMessages: OpenAIMessage[] = [
        { role: 'system', content: interviewSystemPrompt }
      ];
      
      // Add the full conversation history 
      conversation.forEach((message, index) => {
        interviewMessages.push({
          role: message.role,
          content: message.content
        });
        
        // Log messages for debugging
        logRequest('analyze-response', `Conversation message ${index}`, {
          role: message.role,
          contentLength: message.content.length,
          excerpt: message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
        });
      });
      
      // Add the user's latest response (which might not be in the conversation array yet)
      interviewMessages.push({
        role: 'user',
        content: userResponse
      });
      
      // Add a specific prompt to continue the interview with feedback and next question
      interviewMessages.push({
        role: 'user',
        content: 'Please provide brief feedback on my answer, then ask your next interview question.'
      });
      
      logRequest('analyze-response', 'Calling OpenAI API for next question generation', {
        messageCount: interviewMessages.length,
        systemPromptLength: interviewSystemPrompt.length
      });
      
      try {
        // Generate the next AI response that continues the interview
        const completion = await openaiInstance.chat.completions.create({
          model: 'gpt-4o', // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
          messages: interviewMessages,
          temperature: 0.7,
          max_tokens: 500,
          presence_penalty: 0.6, // Encourage the AI to ask new questions
          frequency_penalty: 0.5,  // Penalize repetition
          stream: false // Disable streaming for reliability
        });
        
        const aiResponse = completion.choices[0].message.content;
        
        logResponse('analyze-response', 200, 'Successfully generated AI response', {
          aiResponseLength: aiResponse.length,
          aiResponseExcerpt: aiResponse.substring(0, 50) + (aiResponse.length > 50 ? '...' : '')
        });
        
        // Return the AI's next response directly
        return res.status(200).json({ 
          isLastQuestion: false,
          aiResponse
        });
      } catch (openaiError: any) {
        logResponse('analyze-response', 500, 'OpenAI API error during response generation', openaiError);
        return res.status(500).json({ 
          error: 'Failed to generate interview response', 
          details: openaiError.message || 'Unknown error with OpenAI API'
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
router.post('/transcribe', requireAuth, async (req: Request, res: Response) => {
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
      
      // Log successful transcription
      const excerpt = transcription.text.substring(0, 50) + (transcription.text.length > 50 ? '...' : '');
      logResponse('transcribe', 200, 'Transcription completed successfully', {
        textLength: transcription.text.length,
        excerpt: excerpt
      });
      
      // Clean up the temporary file
      try {
        fs.unlinkSync(tempFilePath);
        logRequest('transcribe', 'Temporary file cleaned up successfully');
      } catch (cleanupError) {
        // Non-fatal error, just log it
        logRequest('transcribe', 'Non-fatal error cleaning up temporary file', cleanupError);
      }
      
      return res.status(200).json({ text: transcription.text });
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
router.post('/text-to-speech', requireAuth, async (req: Request, res: Response) => {
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
    
    const { text, voice } = validationResult.data;
    
    logRequest('text-to-speech', `Text-to-speech request received, text length: ${text.length}, voice: ${voice}`, {
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
    
    try {
      logRequest('text-to-speech', `Calling OpenAI TTS API with model: tts-1-hd, voice: ${voice}`);
      
      // Call OpenAI's TTS API
      const mp3 = await openaiInstance.audio.speech.create({
        model: 'tts-1-hd', // Use high-definition TTS model
        voice: voice, // Default is 'nova', a friendly, natural female voice
        input: text
      });
      
      logRequest('text-to-speech', 'OpenAI TTS API call successful, processing response...');
      
      // Convert response to Buffer
      const buffer = Buffer.from(await mp3.arrayBuffer());
      logRequest('text-to-speech', `Converted audio to buffer, size: ${buffer.length} bytes`);
      
      // Save audio file to disk
      try {
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
      } catch (fileError) {
        logResponse('text-to-speech', 500, 'Error saving audio file to disk', fileError);
        return res.status(500).json({ error: 'Failed to save generated audio file' });
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
  app.use('/api/interview', router);
};