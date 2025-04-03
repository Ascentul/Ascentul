import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// AI Coach for career advice
export async function getCareerAdvice(query: string, userContext: {
  goals?: string[];
  workHistory?: string[];
  skills?: string[];
  resumeDetails?: string;
  interviewPrep?: string;
}): Promise<string> {
  const systemPrompt = `You are an expert career coach helping a user with their career journey. 
Your goal is to provide actionable, practical advice that helps them achieve their career goals.
You should be encouraging, supportive, but also realistic and honest.

Here's what you know about the user:
${userContext.goals ? `Goals: ${userContext.goals.join(', ')}` : ''}
${userContext.workHistory ? `Work History: ${userContext.workHistory.join(', ')}` : ''}
${userContext.skills ? `Skills: ${userContext.skills.join(', ')}` : ''}
${userContext.resumeDetails ? `Resume: ${userContext.resumeDetails}` : ''}
${userContext.interviewPrep ? `Interview Preparation: ${userContext.interviewPrep}` : ''}

Respond directly to their question with personalized guidance.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
      ],
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
    const parsedResponse = JSON.parse(content);
    
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
