import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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
          console.log('Mock OpenAI API call with params:', params);
          return {
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    message: "This is mock AI content. Please provide an OpenAI API key for real responses.",
                    details: "The application is running in mock mode because the OPENAI_API_KEY is not set."
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

// Interface for LinkedIn profile analysis
export interface LinkedInProfileAnalysis {
  overallScore: number;
  sections: {
    headline: {
      score: number;
      feedback: string;
      suggestion: string;
    };
    summary: {
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
    recommendations: {
      score: number;
      feedback: string;
    };
    education: {
      score: number;
      feedback: string;
    };
    profile: {
      score: number;
      feedback: string;
    };
  };
  actionPlan: {
    highPriority: string[];
    mediumPriority: string[];
    lowPriority: string[];
  };
}

// Analyze a LinkedIn profile content to provide improvement recommendations
export async function analyzeLinkedInProfile(
  profileData: { url?: string; profileText?: string; targetJobTitle: string }
): Promise<LinkedInProfileAnalysis> {
  try {
    const { url, profileText, targetJobTitle } = profileData;
    
    // Determine which input to use (URL or pasted content)
    const contentSource = profileText 
      ? `LinkedIn Profile Content:\n${profileText}` 
      : `LinkedIn Profile URL: ${url}`;
    
    const systemPrompt = `You are an expert LinkedIn profile optimizer and career coach with a specialty in helping professionals optimize their LinkedIn profiles for specific target jobs.

Analyze the given LinkedIn profile for someone who is targeting a position as a ${targetJobTitle}. Provide a thorough analysis and actionable recommendations to improve their profile's effectiveness.

${contentSource}

Evaluate each section of the profile and assign a score from 0-100 based on its effectiveness for the target role. Provide specific feedback and suggestions for improvement.

Your response must be in JSON format with the following structure:
{
  "overallScore": number,
  "sections": {
    "headline": {
      "score": number,
      "feedback": string,
      "suggestion": string
    },
    "summary": {
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
    "recommendations": {
      "score": number,
      "feedback": string
    },
    "education": {
      "score": number,
      "feedback": string
    },
    "profile": {
      "score": number,
      "feedback": string
    }
  },
  "actionPlan": {
    "highPriority": string[],
    "mediumPriority": string[],
    "lowPriority": string[]
  }
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    // Apply default values for any missing fields to ensure consistent structure
    return {
      overallScore: result.overallScore || 50,
      sections: {
        headline: {
          score: result.sections?.headline?.score || 50,
          feedback: result.sections?.headline?.feedback || "No feedback available for your headline.",
          suggestion: result.sections?.headline?.suggestion || "Add a compelling headline that includes your target role and key skills."
        },
        summary: {
          score: result.sections?.summary?.score || 50,
          feedback: result.sections?.summary?.feedback || "No feedback available for your summary.",
          suggestion: result.sections?.summary?.suggestion || "Create a summary that highlights your relevant experience and value proposition."
        },
        experience: {
          score: result.sections?.experience?.score || 50,
          feedback: result.sections?.experience?.feedback || "No feedback available for your experience section.",
          suggestions: result.sections?.experience?.suggestions || ["Focus on achievements rather than responsibilities", "Quantify your results where possible"]
        },
        skills: {
          score: result.sections?.skills?.score || 50,
          feedback: result.sections?.skills?.feedback || "No feedback available for your skills section.",
          missingSkills: result.sections?.skills?.missingSkills || [],
          suggestedSkills: result.sections?.skills?.suggestedSkills || []
        },
        recommendations: {
          score: result.sections?.recommendations?.score || 50,
          feedback: result.sections?.recommendations?.feedback || "No feedback available for your recommendations."
        },
        education: {
          score: result.sections?.education?.score || 50,
          feedback: result.sections?.education?.feedback || "No feedback available for your education section."
        },
        profile: {
          score: result.sections?.profile?.score || 50,
          feedback: result.sections?.profile?.feedback || "No feedback available for your profile picture."
        }
      },
      actionPlan: {
        highPriority: result.actionPlan?.highPriority || ["Update your headline to include target job title"],
        mediumPriority: result.actionPlan?.mediumPriority || ["Add relevant skills to your profile"],
        lowPriority: result.actionPlan?.lowPriority || ["Request recommendations from colleagues"]
      }
    };
  } catch (error: any) {
    console.error("Error analyzing LinkedIn profile:", error);
    
    // Return a default structure with error information
    return {
      overallScore: 0,
      sections: {
        headline: {
          score: 0,
          feedback: "We encountered an error analyzing your profile.",
          suggestion: "Please try again later or contact support."
        },
        summary: {
          score: 0,
          feedback: "We encountered an error analyzing your profile.",
          suggestion: "Please try again later or contact support."
        },
        experience: {
          score: 0,
          feedback: "We encountered an error analyzing your profile.",
          suggestions: ["Please try again later"]
        },
        skills: {
          score: 0,
          feedback: "We encountered an error analyzing your profile.",
          missingSkills: [],
          suggestedSkills: []
        },
        recommendations: {
          score: 0,
          feedback: "We encountered an error analyzing your profile."
        },
        education: {
          score: 0,
          feedback: "We encountered an error analyzing your profile."
        },
        profile: {
          score: 0,
          feedback: "We encountered an error analyzing your profile."
        }
      },
      actionPlan: {
        highPriority: ["Try submitting your profile again"],
        mediumPriority: [],
        lowPriority: []
      }
    };
  }
}

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
  companyName?: string
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
      model: "gpt-4o",
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
    // Prepare the conversation history
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      { role: "user", content: query }
    ];

    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
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

// Generate a complete resume tailored to a specific job description
export async function generateFullResume(
  workHistory: string, 
  jobDescription: string, 
  userData?: any
): Promise<any> {
  try {
    const userInfo = userData ? `
User's Personal Information:
Name: ${userData.name || 'N/A'}
Email: ${userData.email || 'N/A'}
Phone: ${userData.phone || 'N/A'}
Location: ${userData.location || 'N/A'}
` : '';

    const prompt = `You are an expert resume writer and career counselor. Create a complete, professional resume tailored to the job description, using only the candidate's actual work history to avoid fabrication. The resume should strategically frame the candidate's experience to best match the job requirements.

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

// Generate cover letter
export async function generateCoverLetter(
  jobTitle: string, 
  companyName: string, 
  jobDescription: string, 
  userExperience: string,
  userSkills: string[]
): Promise<string> {
  try {
    // Note: userExperience may contain additional work history data added by the server
    // but the user doesn't need to know this - the AI will seamlessly incorporate it
    
    const prompt = `Write a professional cover letter for a ${jobTitle} position at ${companyName}. 

Job Description:
${jobDescription}

My Relevant Experience:
${userExperience}

My Skills:
${userSkills.join(", ")}

The cover letter should be professional, concise, and highlight how my experience and skills match the job requirements. Focus on specific achievements and how they relate to this position. If the experience section mentions "Additional Work History", use those details to enrich the letter, but don't explicitly mention them as separate work history items - integrate them naturally.`;

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
