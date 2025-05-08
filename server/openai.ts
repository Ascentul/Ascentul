import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { validateModelAndGetId, DEFAULT_MODEL } from "./utils/models-config";

// Check for OpenAI API key and fail fast if missing
if (!process.env.OPENAI_API_KEY) {
  throw new Error("❌ OPENAI_API_KEY not found — please add it in Replit Secrets.");
}

console.log("✅ OpenAI client initialized with real API key.");

// Initialize with the real API key
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// Export the OpenAI instance
export const openaiInstance = openai;

// LinkedIn Optimizer interface removed

// LinkedIn Optimizer function removed

// Interface for interview answer analysis
export interface InterviewAnswerAnalysis {
  feedback: string;
  strengthsScore: number; // 1-5
  improvementScore: number; // 1-5
  clarity: number; // 1-5
  relevance: number; // 1-5
  overall: number; // 1-5
  strengths: string[];
  areasForImprovement: string[];
  suggestedResponse?: string;
}

// Analyze an interview answer
export async function analyzeInterviewAnswer(
  question: string,
  answer: string,
  jobTitle?: string,
  companyName?: string,
  selectedModel?: string
): Promise<InterviewAnswerAnalysis> {
  if (!answer || answer.trim() === "") {
    return {
      feedback: "You didn't provide an answer. Remember, even in practice, it's important to attempt a response to develop your skills.",
      strengthsScore: 1,
      improvementScore: 5,
      clarity: 1,
      relevance: 1,
      overall: 1,
      strengths: ["Attempted the interview practice exercise"],
      areasForImprovement: [
        "Provide at least a basic answer to practice articulating your thoughts",
        "Try to address the core elements of the question",
        "Structure your thoughts, even if they're not perfect"
      ]
    };
  }

  const systemPrompt = `You are an expert interview coach helping candidates prepare for job interviews.
Analyze the candidate's answer to the interview question and provide detailed, constructive feedback.

Your analysis should include:
1. Specific strengths in the answer (what worked well)
2. Areas for improvement (what could be better)
3. Comment on clarity, structure, and relevance to the question
4. Personalized advice based on the specific job/company context

Format your response as JSON with the following structure:
{
  "feedback": "Your overall detailed feedback as a paragraph",
  "strengthsScore": number between 1-5,
  "improvementScore": number between 1-5,
  "clarity": number between 1-5,
  "relevance": number between 1-5, 
  "overall": number between 1-5,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "areasForImprovement": ["area 1", "area 2", "area 3"],
  "suggestedResponse": "A brief outline of an improved answer structure"
}

Make your feedback specific to this exact answer, not generic advice. Base your analysis on interview best practices and what would impress a hiring manager.`;

  try {
    // Validate the selected model or use default
    const validatedModel = selectedModel
      ? validateModelAndGetId(selectedModel)
      : DEFAULT_MODEL;

    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `Question: ${question}
Answer: ${answer}
${jobTitle ? `Job Title: ${jobTitle}` : ''}
${companyName ? `Company: ${companyName}` : ''}`
      }
    ];
    
    const response = await openai.chat.completions.create({
      model: validatedModel, // Use the validated model
      messages: messages,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Ensure all required fields are present with defaults if missing
    return {
      feedback: result.feedback || "No feedback available.",
      strengthsScore: result.strengthsScore || 3,
      improvementScore: result.improvementScore || 3,
      clarity: result.clarity || 3,
      relevance: result.relevance || 3,
      overall: result.overall || 3,
      strengths: result.strengths || [],
      areasForImprovement: result.areasForImprovement || [],
      suggestedResponse: result.suggestedResponse
    };
  } catch (error: any) {
    console.error("Error analyzing interview answer:", error);
    return {
      feedback: "We couldn't analyze your answer at this time. Please try again later.",
      strengthsScore: 3,
      improvementScore: 3,
      clarity: 3,
      relevance: 3,
      overall: 3,
      strengths: ["Attempted the question"],
      areasForImprovement: ["Try again later for detailed feedback"]
    };
  }
}

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
`;

// AI Coach for career advice with enhanced context
export async function getCareerAdvice(
  query: string, 
  userContext: {
    goals?: any[];
    workHistory?: any[];
    skills?: string[];
    interviewProcesses?: any[];
    userName?: string;
    resumeDetails?: string;
    interviewPrep?: string;
    achievements?: any[]; // Added achievements to the type signature
    selectedModel?: string; // Added model selection capability
  },
  conversationHistory: ChatCompletionMessageParam[] = []
): Promise<string> {
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
    } else if (userContext.workHistory && Array.isArray(userContext.workHistory) && userContext.workHistory.length === 0) {
      systemPrompt += "\nWork History: No work history available\n";
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
    } else if (userContext.goals && Array.isArray(userContext.goals) && userContext.goals.length === 0) {
      systemPrompt += "\nCareer Goals: No goals set yet\n";
    }

    // Add skills information
    if (userContext.skills && userContext.skills.length > 0) {
      systemPrompt += `\nSkills: ${userContext.skills.join(", ")}\n`;
    }

    // Add interview processes information
    if (userContext.interviewProcesses && userContext.interviewProcesses.length > 0) {
      systemPrompt += "\nInterview Processes:\n";
      userContext.interviewProcesses.forEach((process, index) => {
        systemPrompt += `${index + 1}. ${process.position} at ${process.companyName} - Status: ${process.status}\n`;
      });
    } else if (userContext.interviewProcesses && Array.isArray(userContext.interviewProcesses) && userContext.interviewProcesses.length === 0) {
      systemPrompt += "\nInterview Processes: No active interview processes\n";
    }

    // Add achievements information
    if (userContext.achievements && userContext.achievements.length > 0) {
      systemPrompt += "\nPersonal Achievements:\n";
      userContext.achievements.forEach((achievement, index) => {
        const date = achievement.achievementDate 
          ? new Date(achievement.achievementDate).toLocaleDateString() 
          : 'No date specified';
          
        systemPrompt += `${index + 1}. ${achievement.title} (${date})\n`;
        systemPrompt += `   Description: ${achievement.description}\n`;
        
        if (achievement.issuingOrganization) {
          systemPrompt += `   Issuing Organization: ${achievement.issuingOrganization}\n`;
        }
        
        if (achievement.skills) {
          systemPrompt += `   Related Skills: ${achievement.skills}\n`;
        }
      });
    } else if (userContext.achievements && Array.isArray(userContext.achievements) && userContext.achievements.length === 0) {
      systemPrompt += "\nPersonal Achievements: No achievements recorded yet\n";
    }
    
    // Add additional context if provided
    if (userContext.resumeDetails) {
      systemPrompt += `\nResume Details: ${userContext.resumeDetails}\n`;
    }
    
    if (userContext.interviewPrep) {
      systemPrompt += `\nInterview Preparation: ${userContext.interviewPrep}\n`;
    }
  }

  try {
    // Validate the selected model or use default
    const validatedModel = userContext?.selectedModel
      ? validateModelAndGetId(userContext.selectedModel)
      : DEFAULT_MODEL;
    
    // Prepare the conversation history
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: query }
    ];

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: validatedModel, // Use the validated model
      messages: messages,
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0].message.content || "I'm not sure how to advise on that topic. Could you try rephrasing your question?";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      return "There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.";
    }
    
    return "I'm currently unable to provide advice. Please try again later.";
  }
}

// Generate resume suggestions
export async function generateResumeSuggestions(workHistory: string, jobDescription: string): Promise<{
  suggestions: string[];
  keywords: string[];
}> {
  try {
    const prompt = `Based on the user's work history and the job description, provide specific and actionable suggestions to improve their resume by highlighting relevant experience and skills.

User's Work History:
${workHistory}

Job Description:
${jobDescription}

Provide your response in JSON format with these fields:
1. suggestions: An array of 5-7 specific improvements for the resume, focusing on exactly what aspects of their work history should be emphasized to match the job description. Be very specific about which skills, achievements, and experiences from their work history align with the job requirements.
2. keywords: An array of 5-10 relevant keywords/skills from the job description that should be highlighted in the resume`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    return {
      suggestions: parsedResponse.suggestions || [],
      keywords: parsedResponse.keywords || []
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      return {
        suggestions: ["There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key."],
        keywords: []
      };
    }
    
    return {
      suggestions: ["Unable to generate suggestions at this time."],
      keywords: []
    };
  }
}

// Analyze a resume document against a job description
export async function analyzeResumeForJob(resumeText: string, jobDescription: string): Promise<{
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  missingKeywords: string[];
  improvementSuggestions: string[];
  technicalSkillAssessment: string[];
  softSkillAssessment: string[];
  formattingFeedback: string[];
  keywordMatchScore: number;
  relevanceScore: number;
}> {
  try {
    const prompt = `You are an expert resume reviewer and career coach with deep experience in hiring. Conduct a comprehensive analysis of this resume against the provided job description.

Resume Text:
${resumeText}

Job Description:
${jobDescription}

Provide a detailed expert analysis of how well this resume matches the job description, focusing on both content and presentation.
Format your response as a JSON object with these fields:

1. overallScore: A number from 0-100 representing the overall match of the resume to the job description
2. strengths: An array of 3-5 specific strengths of the resume for this job
3. weaknesses: An array of 3-5 specific weaknesses of the resume for this job
4. missingKeywords: An array of important keywords/skills from the job description that are missing from the resume
5. improvementSuggestions: An array of 5-7 actionable suggestions to improve the resume for this specific job
6. technicalSkillAssessment: An array of 2-3 observations about how well the technical skills match the job requirements
7. softSkillAssessment: An array of 2-3 observations about how well the soft skills/attributes match the job requirements
8. formattingFeedback: An array of 2-3 suggestions about resume formatting, structure, and presentation
9. keywordMatchScore: A number from 0-100 representing how well the resume's keywords match the job description
10. relevanceScore: A number from 0-100 representing how relevant the experience is to the job

Be specific, actionable, and constructive. Focus on substance over style, and emphasize ways the candidate can better position their actual experience and skills to match this specific job.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    // Ensure all required fields are present
    return {
      overallScore: parsedResponse.overallScore || 0,
      strengths: parsedResponse.strengths || [],
      weaknesses: parsedResponse.weaknesses || [],
      missingKeywords: parsedResponse.missingKeywords || [],
      improvementSuggestions: parsedResponse.improvementSuggestions || [],
      technicalSkillAssessment: parsedResponse.technicalSkillAssessment || [],
      softSkillAssessment: parsedResponse.softSkillAssessment || [],
      formattingFeedback: parsedResponse.formattingFeedback || [],
      keywordMatchScore: parsedResponse.keywordMatchScore || 0,
      relevanceScore: parsedResponse.relevanceScore || 0
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      throw new Error("There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.");
    }
    
    throw new Error("An error occurred while analyzing the resume. Please try again later.");
  }
}

// Analyze a cover letter against a job description
export async function analyzeCoverLetter(
  coverLetter: string,
  jobDescription: string
): Promise<{
  overallScore: number;
  alignment: number;
  persuasiveness: number;
  clarity: number;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: string[];
  optimizedCoverLetter: string;
}> {
  try {
    const prompt = `As a professional cover letter coach, analyze the following cover letter in relation to the job description provided. Offer actionable feedback and an optimized version.

Job Description:
${jobDescription}

Cover Letter:
${coverLetter}

Provide your analysis in JSON format with the following fields:
1. overallScore: A number from 0-100 representing how effective the cover letter is overall
2. alignment: A number from 0-100 representing how well the letter aligns with the job requirements
3. persuasiveness: A number from 0-100 representing how persuasively the letter makes the case for hiring the candidate
4. clarity: A number from 0-100 representing how clear and well-structured the letter is
5. strengths: An array of 3-5 specific strengths of this cover letter
6. weaknesses: An array of 2-4 weaknesses or missed opportunities in this cover letter
7. improvementSuggestions: An array of 4-6 actionable suggestions to improve the cover letter
8. optimizedCoverLetter: A complete rewritten version of the cover letter that addresses all the weaknesses while maintaining the applicant's truthful experience and using their tone of voice

Be specific, actionable, and honest in your assessment. Focus on content, relevance, and persuasiveness rather than just format.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    // Ensure all required fields are present
    return {
      overallScore: parsedResponse.overallScore || 0,
      alignment: parsedResponse.alignment || 0,
      persuasiveness: parsedResponse.persuasiveness || 0,
      clarity: parsedResponse.clarity || 0,
      strengths: parsedResponse.strengths || [],
      weaknesses: parsedResponse.weaknesses || [],
      improvementSuggestions: parsedResponse.improvementSuggestions || [],
      optimizedCoverLetter: parsedResponse.optimizedCoverLetter || coverLetter
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      throw new Error("There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.");
    }
    
    throw new Error("An error occurred while analyzing the cover letter. Please try again later.");
  }
}

// Generate a complete resume tailored to a specific job description
export async function generateFullResume(
  workHistory: string, 
  jobDescription: string, 
  userData?: any,
  originalWorkHistoryItems?: any[]
): Promise<any> {
  try {
    const userInfo = userData ? `
User's Personal Information:
Name: ${userData.name || 'N/A'}
Email: ${userData.email || 'N/A'}
Phone: ${userData.phone || 'N/A'}
Location: ${userData.location || 'N/A'}
` : '';

    // Build a more detailed prompt if we have original work history items to optimize
    const promptForOptimization = originalWorkHistoryItems && originalWorkHistoryItems.length > 0 ? `
Additionally, I need you to optimize the user's career data to better match this job description while maintaining absolute truthfulness.
Provide an additional field in your response:
6. optimizedCareerData: An object containing:
   - careerSummary: An improved professional summary that can be saved to the user's profile
   - workHistory: An array of optimized work history entries with these fields:
     * id: (must match the ID from the original items below)
     * description: Enhanced job description highlighting relevant achievements and responsibilities
     * achievements: Array of quantifiable achievements aligned with the job description
   - skills: An array of skills extracted from the work history and job description that would strengthen the user's profile

Here are the original work history items with their IDs that need optimizing:
${JSON.stringify(originalWorkHistoryItems, null, 2)}

IMPORTANT RULES FOR OPTIMIZATION:
- Do NOT invent new work experiences, positions, or companies
- Do NOT invent qualifications the person doesn't have
- DO enhance existing content to better showcase relevant skills and experiences
- DO maintain the original IDs for all work history items
- DO include both current and enhanced skills relevant to the job
- ONLY include truthful information based on the user's existing career data
` : '';

    const prompt = `You are an expert resume writer and career coach. Create a complete, professional resume tailored to the job description, using only the candidate's actual work history to avoid fabrication. The resume should strategically frame the candidate's experience to best match the job requirements.

${userInfo}

User's Work History:
${workHistory}

Job Description:
${jobDescription}

Provide your response in JSON format with these fields:
1. personalInfo: An object with fullName, email, phone, and location
2. summary: A compelling professional summary paragraph tailored to the job
3. skills: An array of 8-12 skills extracted from the work history that are relevant to the job
4. experience: An array of work experience objects, each containing:
   - company
   - position
   - startDate
   - endDate
   - currentJob (boolean)
   - description (an improved bullet-point style description that highlights relevant achievements)
   - achievements (an array of 2-3 specific, quantifiable achievements from each position)
5. education: An array of education objects (if found in the work history)
${promptForOptimization}

Important: Use ONLY information provided in the work history. Do not invent or fabricate any details. Format dates consistently. The description and achievements for each position should be tailored to emphasize aspects that align with the job description.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2500,
    });

    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    return parsedResponse;
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      throw new Error("There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.");
    }
    
    throw new Error("An error occurred while generating the resume. Please try again later.");
  }
}

// Generate cover letter suggestions for the "Get Suggestions" functionality
export async function generateCoverLetterSuggestions(
  jobTitle: string, 
  companyName: string, 
  jobDescription: string, 
  userExperience: string,
  userSkills: string
): Promise<string> {
  try {
    // This function generates writing suggestions rather than a full cover letter
    const prompt = `You are an expert AI career assistant helping job seekers create high-scoring cover letters.

I need targeted suggestions for a cover letter that would score 80+ on alignment, persuasiveness, clarity, and overall impact for the following position:

Job Title: ${jobTitle}
Company: ${companyName}
Job Description:
${jobDescription}

${userExperience ? `My Relevant Experience:\n${userExperience}` : ''}

${userSkills ? `My Skills:\n${userSkills}` : ''}

Instead of writing a complete cover letter, please provide high-quality suggestions that focus on specific components:

1. OPENING PARAGRAPH:
   - Provide a strong, attention-grabbing opening that mentions the exact position
   - Include a compelling value proposition statement
   - Balance enthusiasm with professionalism
   - Start directly with a "Dear Hiring Manager," greeting (do NOT include address blocks)

2. KEY ACCOMPLISHMENTS TO HIGHLIGHT (4-5):
   - Extract specific keywords/requirements from the job description
   - For each accomplishment, suggest a quantifiable achievement format (metrics, percentages, results)
   - Frame each as a problem-solution-outcome structure when possible

3. PERSUASIVE LANGUAGE:
   - Provide 5-7 impactful phrases that demonstrate alignment with the job requirements
   - Include industry-specific terminology from the job description
   - Suggest language that shows understanding of the company's challenges/needs

4. EFFECTIVE CLOSING:
   - Create a confident call-to-action
   - Suggest a closing that reinforces value and enthusiasm without generic phrasing
   - Include a professional sign-off

5. FORMAT REQUIREMENTS:
   - Use a modern format with this structure:
     {User first and last name}
     {job title} 
     
     {User email} | {user linkedin link} | {user mobile phone}
     {date}
     {company applying for}
     
     Dear Hiring Manager,
   
   - This header information replaces traditional address blocks
   - DO NOT include old-style address sections (no "Your Address" or "City, State, Zip")
   - DO NOT include recipient address sections

Ensure all suggestions focus on clarity (short, direct sentences), alignment with the job, persuasiveness through concrete examples, and strong overall impact. Avoid generic statements like "I'm a hard worker" or "I'm passionate about success."
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "Unable to generate cover letter suggestions at this time.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      return "There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.";
    }
    
    return "Unable to generate cover letter suggestions at this time. Please try again later.";
  }
}

// Generate full cover letter
export async function generateCoverLetter(
  jobTitle: string, 
  companyName: string, 
  jobDescription: string, 
  careerData: {
    careerSummary: string | null;
    workHistory: string;
    education: string;
    skills: string[];
    certifications: string;
  }
): Promise<string> {
  try {
    const prompt = `
You are an expert AI career assistant helping job seekers write tailored, professional cover letters.

Generate a one-page cover letter for the following role:
Job Title: ${jobTitle || 'The position described in the job description'}
Company: ${companyName || 'The hiring company'}
Job Description:
---
${jobDescription}
---

User Career Background:
Career Summary: ${careerData.careerSummary || 'Not provided'}
Work History: ${careerData.workHistory}
Education: ${careerData.education || 'Not provided'}
Skills: ${careerData.skills?.join(', ') || 'Not provided'}
Certifications: ${careerData.certifications || 'Not provided'}

🎯 Your goal is to generate a cover letter that would score 80 or higher on these categories:

1. **Alignment** – Clearly match the role and mention job-specific keywords from the job description. Extract 3-5 key skills/technologies from the job posting and incorporate them naturally. Position the candidate as an ideal fit.

2. **Persuasiveness** – Convey confidence and motivation through:
   - Quantifiable achievements with metrics (%, $, time saved)
   - Problem-solution narratives showing value
   - Concrete examples of applying skills in similar contexts
   - A clear value proposition for the employer

3. **Clarity** – Create a crystal-clear document with:
   - Short, readable sentences (15-20 words max)
   - Strong action verbs at the start of bullet points
   - Logical paragraph structure with clean transitions
   - No complex jargon or unnecessarily verbose language

4. **Overall Impact** – Structure for maximum effectiveness:
   - Strong opening that states the position and shows enthusiasm
   - Middle paragraphs with specific accomplishments matching job requirements
   - Professional closing that drives action
   - Appropriate formal tone without being stiff or robotic

IMPORTANT FORMAT NOTES:
- Use a simple, modern format with the following structure:
  {User first and last name}
  {job title} 
  
  {User email} | {user linkedin link} | {user mobile phone}
  {date}
  {company applying for}
  
  Dear Hiring Manager,

- The above information should replace traditional address blocks
- DO NOT include old address sections (no "[Your Address]" or "[City, State, Zip Code]")
- DO NOT include recipient address sections like "Hiring Manager" or "[Company Address]"

DO NOT:
- Use generic phrases like "I'm a hard worker" or "I'm passionate about success"
- Include lengthy or irrelevant personal information
- Create a wall of text or dense paragraphs
- Use clichés, redundant phrases, or overly formal language
- Merely restate resume information without adding context or value

Instead, show clear alignment and value through action-based language, tangible results, and relevant outcomes that directly connect to the job requirements.

Keep the tone professional, conversational, and human. Limit to 1 page maximum.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
    });

    return response.choices[0].message.content || "Unable to generate cover letter at this time.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      return "There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.";
    }
    
    return "Unable to generate cover letter at this time. Please try again later.";
  }
}

// Generate interview questions
export async function generateInterviewQuestions(jobTitle: string, skills: string[]): Promise<{
  behavioral: { question: string; suggestedAnswer: string }[];
  technical: { question: string; suggestedAnswer: string }[];
}> {
  try {
    const prompt = `Generate interview questions for a ${jobTitle} position where the candidate has the following skills: ${skills.join(", ")}.

Provide your response in JSON format with these fields:
1. behavioral: An array of objects containing behavioral questions and suggested answers
2. technical: An array of objects containing technical questions and suggested answers

Each question object should have:
- question: The interview question
- suggestedAnswer: A brief outline of how to structure a good response

Generate 3 behavioral questions and 3 technical questions.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    return {
      behavioral: parsedResponse.behavioral || [],
      technical: parsedResponse.technical || []
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      return {
        behavioral: [{ 
          question: "There's an issue with the OpenAI API key configuration.", 
          suggestedAnswer: "Please contact the administrator to set up a valid API key." 
        }],
        technical: []
      };
    }
    
    return {
      behavioral: [{ question: "Unable to generate questions at this time.", suggestedAnswer: "" }],
      technical: []
    };
  }
}

// Get career goals suggestions
export interface RoleInsightResponse {
  suggestedRoles: {
    title: string;
    description: string;
    keySkills: string[];
    salaryRange: string;
    growthPotential: 'low' | 'medium' | 'high';
    timeToAchieve: string;
  }[];
  transferableSkills: {
    skill: string;
    relevance: string;
    currentProficiency: 'basic' | 'intermediate' | 'advanced';
  }[];
  recommendedCertifications: {
    name: string;
    provider: string;
    timeToComplete: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    relevance: string;
  }[];
  developmentPlan: {
    step: string;
    timeframe: string;
    description: string;
  }[];
  insights: string;
}

export async function generateRoleInsights(
  currentRole: string,
  yearsExperience: number,
  industry: string,
  workHistory: any[]
): Promise<RoleInsightResponse> {
  try {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: 
            "You are a career development AI that provides detailed insights and recommendations for career progression. " +
            "Analyze the user's work history and current role to suggest realistic next steps in their career path. " +
            "Be specific, practical, and realistic with recommendations. " +
            "Focus on job roles that build on their existing experience while providing growth opportunities. " +
            "You will return a structured JSON response with suggested roles, transferable skills analysis, certification recommendations, and a development plan."
        },
        {
          role: "user",
          content: JSON.stringify({
            currentRole,
            yearsExperience,
            industry,
            workHistory
          })
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1500
    });

    // Parse the JSON response
    const content = response.choices[0].message.content || "{}";
    let result;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      result = {}; // Use empty object as fallback
    }
    
    // Ensure the result matches our expected structure
    return {
      suggestedRoles: result.suggestedRoles || [],
      transferableSkills: result.transferableSkills || [],
      recommendedCertifications: result.recommendedCertifications || [],
      developmentPlan: result.developmentPlan || [],
      insights: result.insights || ""
    };
  } catch (error: any) {
    console.error("Error generating role insights:", error);
    const errorMessage = error && error.message ? error.message : "Unknown error";
    throw new Error("Failed to generate role insights: " + errorMessage);
  }
}

// Optimize career data based on job description
export async function optimizeCareerData(
  careerData: any,
  jobDescription: string
): Promise<any> {
  try {
    // Convert career data to a structured format for the AI
    const workHistoryText = careerData.workHistory && careerData.workHistory.length > 0
      ? careerData.workHistory.map((item: any) => {
        const endDate = item.currentJob ? 'Present' : (item.endDate ? new Date(item.endDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'N/A');
        return `Company: ${item.company}
Position: ${item.position}
Duration: ${new Date(item.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} - ${endDate}
Description: ${item.description || 'No description provided'}
Achievements: ${item.achievements ? item.achievements.join('; ') : 'None listed'}
ID: ${item.id}`;
      }).join('\n\n')
      : 'No work history provided';

    const skillsText = careerData.skills && careerData.skills.length > 0
      ? careerData.skills.map((skill: any) => skill.name).join(', ')
      : 'No skills provided';
    
    const prompt = `You are an expert career coach specializing in resume optimization. Based on the user's existing career data and the job description, provide optimized career data that truthfully enhances their profile WITHOUT inventing new experiences or qualifications.

User's Current Work History:
${workHistoryText}

User's Current Skills:
${skillsText}

User's Current Career Summary:
${careerData.careerSummary || 'No career summary provided'}

Job Description:
${jobDescription}

Create optimized career data that highlights relevant experiences and skills for this specific job opportunity. Your response should be in JSON format with the following structure:

{
  "careerSummary": "An improved career summary that emphasizes relevant experience for this job",
  "workHistory": [
    {
      "id": 1, // Keep the original ID from the input data
      "description": "Enhanced job description highlighting relevant achievements and responsibilities",
      "achievements": ["Achievement 1", "Achievement 2", "Achievement 3"]
    },
    // Include all work history items from the original data, with improved descriptions and achievements
  ],
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5", "Skill 6", "Skill 7", "Skill 8", "Skill 9", "Skill 10"],
  "explanations": {
    "summary": "Brief explanation of how the summary was improved",
    "workHistory": "Brief explanation of how work history was enhanced",
    "skills": "Brief explanation of skill recommendations"
  }
}

IMPORTANT RULES:
1. Do NOT invent new work experiences, positions, or companies
2. Do NOT invent qualifications the person doesn't have
3. DO enhance existing content to better showcase relevant skills and experiences
4. DO maintain the original IDs for all work history items
5. DO include both current and enhanced skills relevant to the job
6. ONLY include truthful information based on the user's existing career data`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const content = response.choices[0].message.content || "{}";
    const parsedResponse = JSON.parse(content);
    
    return parsedResponse;
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      throw new Error("There's an issue with the AI service configuration. Please contact the administrator to set up a valid API key.");
    }
    
    throw new Error("An error occurred while optimizing career data. Please try again later.");
  }
}

export async function suggestCareerGoals(
  currentPosition: string,
  desiredPosition: string,
  timeframe: string,
  skills: string[]
): Promise<{
  shortTerm: { title: string; description: string }[];
  mediumTerm: { title: string; description: string }[];
  longTerm: { title: string; description: string }[];
}> {
  try {
    const prompt = `As a career coach, suggest career goals for someone currently in a ${currentPosition} position who wants to become a ${desiredPosition} within ${timeframe}. They have these skills: ${skills.join(", ")}.

Provide your response in JSON format with these fields:
1. shortTerm: An array of goal objects to complete in the next 3 months
2. mediumTerm: An array of goal objects to complete in the next 3-12 months
3. longTerm: An array of goal objects to complete in 1+ years

Each goal object should have:
- title: A concise goal title (max 50 characters)
- description: A brief description explaining the goal and its importance (max 150 characters)

Generate 3 goals for each timeframe.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || "{}";
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(content);
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      parsedResponse = {
        shortTerm: [],
        mediumTerm: [],
        longTerm: []
      };
    }
    
    return {
      shortTerm: parsedResponse.shortTerm || [],
      mediumTerm: parsedResponse.mediumTerm || [],
      longTerm: parsedResponse.longTerm || []
    };
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check for API key issues
    if (error.message && (error.message.includes("API key") || error.status === 401)) {
      return {
        shortTerm: [{ title: "API Configuration Issue", description: "There's an issue with the OpenAI API key. Please contact the administrator to set up a valid API key." }],
        mediumTerm: [],
        longTerm: []
      };
    }
    
    return {
      shortTerm: [{ title: "Unable to generate goals at this time.", description: "" }],
      mediumTerm: [],
      longTerm: []
    };
  }
}
