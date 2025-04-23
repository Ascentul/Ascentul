import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { requireAuth } from '../auth';
import { storage } from '../storage';

// Initialize OpenAI SDK with API key
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const registerJobsAIRoutes = (router: Router) => {
  // POST /api/jobs/ai-assist - Get AI assistance for job applications
  router.post('/api/jobs/ai-assist', requireAuth, async (req: Request, res: Response) => {
    try {
      const { jobTitle, companyName, jobDescription } = req.body;
      const userId = req.session.userId;
      
      if (!jobTitle) {
        return res.status(400).json({ error: 'Job title is required' });
      }
      
      // Get user resume data if available
      let resumeData = '';
      try {
        const user = await storage.getUser(userId!);
        if (user && user.id) {
          const resumes = await storage.getResumesByUserId(user.id);
          if (resumes && resumes.length > 0) {
            // Use the most recently updated resume
            const latestResume = resumes.sort((a, b) => 
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )[0];
            
            resumeData = latestResume.content || '';
          }
        }
      } catch (error) {
        console.error('Error fetching resume data:', error);
        // Continue without resume data if there's an error
      }
      
      // Construct the prompt for the OpenAI API
      const prompt = constructJobAssistantPrompt(jobTitle, companyName, jobDescription, resumeData);
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a professional career advisor who helps job seekers tailor their applications to specific jobs. Provide concise, actionable, and personalized advice."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });
      
      // Parse the response
      const aiResponse = JSON.parse(response.choices[0].message.content || '{}');
      
      return res.json(aiResponse);
    } catch (error) {
      console.error('Error getting AI assistance:', error);
      return res.status(500).json({ error: 'Failed to generate AI assistance' });
    }
  });
  
  // More AI-powered job application endpoints can be added here
};

// Helper function to construct the prompt for the OpenAI API
function constructJobAssistantPrompt(
  jobTitle: string,
  companyName: string = '',
  jobDescription: string = '',
  resumeData: string = ''
): string {
  return `
I need help tailoring my job application for the following position:

Job Title: ${jobTitle}
${companyName ? `Company: ${companyName}` : ''}

${jobDescription ? `Job Description:
${jobDescription}` : 'No job description provided.'}

${resumeData ? `My Resume:
${resumeData}` : 'No resume provided.'}

Please provide me with:
1. 5 tailored bullet points I should include in my resume for this position
2. 3 short responses to common questions like "Why are you interested in this position?", "What relevant experience do you have?", and "Why do you want to work at our company?"
3. 3 snippets for a cover letter (introduction, highlighting relevant experience, and closing paragraph)

Format your response as a JSON object with the following structure:
{
  "suggestions": {
    "resumeBulletPoints": ["Bullet 1", "Bullet 2", ...],
    "shortResponses": [
      {
        "question": "Question text",
        "response": "Answer text"
      },
      ...
    ],
    "coverLetterSnippets": [
      {
        "title": "Section title",
        "content": "Section content"
      },
      ...
    ]
  }
}

Ensure your suggestions are specific to this job and highlight transferable skills. Make the language professional but conversational. If I provided resume data, use it to personalize your suggestions.
`;
}