import { auth } from '@clerk/nextjs/server';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { evaluate } from '@/lib/ai-evaluation';
import { convexServer } from '@/lib/convex-server';
import { createRequestLogger, getCorrelationIdFromRequest, toErrorCode } from '@/lib/logger';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type definitions based on Convex schema
type UserProfile = Doc<'users'>;
type Project = Doc<'projects'>;
type Application = Doc<'applications'>;
type CoverLetter = Doc<'cover_letters'>;

export async function POST(request: NextRequest) {
  const correlationId = getCorrelationIdFromRequest(request);
  const log = createRequestLogger(correlationId, {
    feature: 'cover-letter',
    httpMethod: 'POST',
    httpPath: '/api/cover-letters/generate',
  });

  const startTime = Date.now();
  log.info('Cover letter generation request started', { event: 'request.start' });

  try {
    const { userId, getToken } = await auth();
    if (!userId) {
      log.warn('Unauthorized generation request', {
        event: 'auth.failed',
        errorCode: 'UNAUTHORIZED',
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }
    const token = await getToken({ template: 'convex' });
    if (!token) {
      log.warn('Failed to obtain auth token', { event: 'auth.failed', errorCode: 'TOKEN_ERROR' });
      return NextResponse.json(
        { error: 'Failed to obtain auth token' },
        {
          status: 401,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    log.debug('User authenticated', { event: 'auth.success', clerkId: userId });

    const body = await request.json();
    const { jobDescription, companyName, position } = body as {
      jobDescription?: string;
      companyName?: string;
      position?: string;
    };

    if (!jobDescription || !companyName || !position) {
      log.warn('Missing required fields', { event: 'validation.failed', errorCode: 'BAD_REQUEST' });
      return NextResponse.json(
        {
          error: 'Job description, company name, and position are required',
        },
        {
          status: 400,
          headers: { 'x-correlation-id': correlationId },
        },
      );
    }

    // Fetch the user career profile so generation stays grounded in real data
    let profile: UserProfile | null = null;
    let projects: Project[] = [];
    let applications: Application[] = [];

    try {
      profile = await convexServer.query(api.users.getUserByClerkId, { clerkId: userId }, token);
    } catch (error) {
      log.warn('Failed to load career profile for letter generation', {
        event: 'context.fetch.error',
        errorCode: toErrorCode(error),
      });
    }

    // Fetch user's projects to demonstrate accomplishments
    try {
      projects =
        (await convexServer.query(api.projects.getUserProjects, { clerkId: userId }, token)) || [];
    } catch (error) {
      log.warn('Failed to load projects for letter generation', {
        event: 'context.fetch.error',
        errorCode: toErrorCode(error),
      });
    }

    // Fetch recent applications to understand career trajectory
    try {
      applications =
        (await convexServer.query(
          api.applications.getUserApplications,
          { clerkId: userId },
          token,
        )) || [];
      // Get the 5 most recent applications
      applications = applications.slice(0, 5);
    } catch (error) {
      log.warn('Failed to load applications for letter generation', {
        event: 'context.fetch.error',
        errorCode: toErrorCode(error),
      });
    }

    // Build profile summary for cover letter personalization
    // NOTE: Only include data needed for cover letter generation
    // Bio and career_goals excluded to minimize PII sent to AI service
    const profileSummary: string[] = [];
    if (profile) {
      if (profile.current_position)
        profileSummary.push(`Current position: ${profile.current_position}`);
      if (profile.current_company)
        profileSummary.push(`Current company: ${profile.current_company}`);
      if (profile.industry) profileSummary.push(`Industry: ${profile.industry}`);
      if (profile.experience_level)
        profileSummary.push(`Experience level: ${profile.experience_level}`);
      if (profile.location) profileSummary.push(`Location: ${profile.location}`);
      if (profile.skills)
        profileSummary.push(
          `Skills: ${Array.isArray(profile.skills) ? profile.skills.join(', ') : profile.skills}`,
        );
      // NOTE: bio and career_goals intentionally excluded - they contain free-form personal
      // information that is not necessary for cover letter generation and may contain sensitive data
      if (profile.education) profileSummary.push(`Education: ${profile.education}`);
      if (profile.university_name) profileSummary.push(`University: ${profile.university_name}`);
      if (profile.major) profileSummary.push(`Major: ${profile.major}`);
      if (profile.graduation_year)
        profileSummary.push(`Graduation year: ${profile.graduation_year}`);

      // Add work history details
      if (
        profile.work_history &&
        Array.isArray(profile.work_history) &&
        profile.work_history.length > 0
      ) {
        profileSummary.push('\n--- Work History ---');
        profile.work_history.forEach(
          (job: NonNullable<UserProfile['work_history']>[number], idx: number) => {
            const workLines: string[] = [];
            workLines.push(`${idx + 1}. ${job.role || 'Role'} at ${job.company || 'Company'}`);
            workLines.push(
              `   Duration: ${job.start_date || 'N/A'} - ${job.is_current ? 'Present' : job.end_date || 'N/A'}`,
            );
            if (job.location) workLines.push(`   Location: ${job.location}`);
            if (job.summary) workLines.push(`   Summary: ${job.summary}`);
            profileSummary.push(workLines.join('\n'));
          },
        );
      }

      // Add education history details
      if (
        profile.education_history &&
        Array.isArray(profile.education_history) &&
        profile.education_history.length > 0
      ) {
        profileSummary.push('\n--- Education History ---');
        profile.education_history.forEach(
          (edu: NonNullable<UserProfile['education_history']>[number], idx: number) => {
            const eduLines: string[] = [];
            eduLines.push(
              `${idx + 1}. ${edu.degree || 'Degree'} in ${edu.field_of_study || 'Field'}`,
            );
            eduLines.push(`   Institution: ${edu.school || 'N/A'}`);
            eduLines.push(
              `   Duration: ${edu.start_year || 'N/A'} - ${edu.is_current ? 'Present' : edu.end_year || 'N/A'}`,
            );
            if (edu.description) eduLines.push(`   Description: ${edu.description}`);
            profileSummary.push(eduLines.join('\n'));
          },
        );
      }
    }

    // Add projects summary
    if (projects.length > 0) {
      profileSummary.push('\n--- Projects & Experience ---');
      projects.slice(0, 5).forEach((project: Project, idx: number) => {
        const projLines: string[] = [];
        projLines.push(`Project ${idx + 1}: ${project.title}`);
        if (project.role) projLines.push(`  Role: ${project.role}`);
        if (project.company) projLines.push(`  Company: ${project.company}`);
        if (project.description) projLines.push(`  Description: ${project.description}`);
        if (project.technologies?.length)
          projLines.push(`  Technologies: ${project.technologies.join(', ')}`);
        profileSummary.push(projLines.join('\n'));
      });
    }

    // Add recent applications context
    if (applications.length > 0) {
      profileSummary.push('\n--- Recent Job Applications (for context) ---');
      applications.forEach((app: Application, idx: number) => {
        profileSummary.push(
          `${idx + 1}. ${app.job_title} at ${app.company} (Status: ${app.status})`,
        );
      });
    }

    const userProfileSummary = profileSummary.length
      ? profileSummary.join('\n')
      : 'No additional career profile data provided.';

    // Generate cover letter using OpenAI with graceful fallback
    const prompt = `You are creating a comprehensive, tailored cover letter for a job application.

Company: ${companyName}
Role: ${position}
Job Description:
${jobDescription}

Candidate's Career Profile (ground truth - use this data to personalize the letter):
${userProfileSummary}

Instructions:
- Produce a COMPREHENSIVE cover letter that includes: strong opening paragraph, at least 3-4 detailed body paragraphs, and a compelling closing paragraph.
- DO NOT include a greeting line (like "Dear Hiring Manager") - that will be added separately.
- DO NOT include a signature line - the user will add that.
- The cover letter should be thorough and detailed, aiming for 400-600 words in total.
- Analyze the job description carefully and identify at least 10-12 key requirements or desired qualifications from the posting.
- For each key requirement, explain how the candidate's background (from their profile, projects, or experience) demonstrates that qualification.
- Use specific examples from the candidate's projects, experience, and skills to demonstrate fit.
- Weave in the candidate's verified career profile details wherever relevant. Do not invent facts. If specific information is missing, focus on the strengths that ARE documented.
- Highlight technical skills, project experience, and relevant accomplishments with concrete details.
- Address why the candidate is specifically interested in this company and role (if career goals suggest alignment).
- Keep the tone professional, confident, enthusiastic, and specific to the role and company.
- Make the letter compelling and substantive - avoid generic statements.
- Return only the body text of the cover letter, ready for the user to send.

Structure your response as a professional cover letter body with:
1. Opening paragraph (introduce yourself and express interest)
2. Body paragraph 1 (discuss most relevant experience and how it aligns with the role)
3. Body paragraph 2 (highlight specific projects, skills, and accomplishments)
4. Body paragraph 3 (explain what makes you a great cultural and technical fit)
5. Closing paragraph (express enthusiasm and call to action)

Remember: Be specific, be thorough, and make every sentence count. Use concrete examples from the candidate's profile. Start directly with the opening paragraph - NO greeting line.`;

    log.info('Starting OpenAI cover letter generation', { event: 'ai.request' });

    let generatedContent: string | null = null;
    let usedFallback = false;
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional career coach and expert cover letter writer with 15+ years of experience. You generate compelling, personalized, and comprehensive cover letters that highlight relevant skills, experience, and cultural fit. Your letters are detailed, substantive, and help candidates stand out from the competition.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });
      generatedContent = completion.choices[0]?.message?.content || null;

      log.info('OpenAI cover letter generation completed', { event: 'ai.response' });

      // Evaluate AI-generated cover letter (non-blocking for now)
      if (generatedContent) {
        try {
          const evalResult = await evaluate({
            tool_id: 'cover-letter-generation',
            input: { jobDescription, companyName, position, userProfileSummary },
            output: { content: generatedContent },
            user_id: userId,
          });

          if (!evalResult.passed) {
            log.warn('Cover letter generation failed AI evaluation', {
              event: 'ai.evaluation.failed',
              extra: {
                score: evalResult.overall_score,
                riskFlagsCount: evalResult.risk_flags?.length ?? 0,
              },
            });
          }
        } catch (evalError) {
          // Don't block on evaluation failures
          log.warn('Error evaluating cover letter generation', {
            event: 'ai.evaluation.error',
            errorCode: toErrorCode(evalError),
          });
        }
      }
    } catch (e) {
      log.warn('OpenAI generation failed, using fallback', {
        event: 'ai.fallback',
        errorCode: toErrorCode(e),
      });
      generatedContent = null;
    }

    if (!generatedContent) {
      usedFallback = true;
      const profileName = profile?.name || 'Your Name';

      // Build a more comprehensive fallback
      const paragraphs: string[] = [];

      // Opening
      paragraphs.push('Dear Hiring Manager,');
      paragraphs.push('');

      const currentRole = profile?.current_position
        ? `As a ${profile.current_position}${profile.current_company ? ` at ${profile.current_company}` : ''}, I am`
        : 'I am';
      paragraphs.push(
        `${currentRole} excited to apply for the ${position} role at ${companyName}. Your job description aligns perfectly with my professional background, skills, and career aspirations.`,
      );
      paragraphs.push('');

      // Experience paragraph
      if (profile?.current_position || profile?.experience_level) {
        const expLevel = profile?.experience_level || 'experienced professional';
        const industry = profile?.industry ? ` in the ${profile.industry} sector` : '';
        // NOTE: bio excluded from fallback template (may contain sensitive personal info)
        paragraphs.push(
          `With my background as a ${expLevel}${industry}, I bring valuable expertise that directly addresses the requirements outlined in your posting.`,
        );
        paragraphs.push('');
      }

      // Skills paragraph
      if (profile?.skills) {
        paragraphs.push(
          `My technical and professional skills include ${profile.skills}. I am confident that this diverse skill set will enable me to make immediate contributions to ${companyName} and help drive the success of your team.`,
        );
        paragraphs.push('');
      }

      // Projects paragraph
      if (projects.length > 0) {
        const topProject = projects[0];
        paragraphs.push(
          `In my recent work, I ${topProject.description || `led the ${topProject.title} project`}${topProject.company ? ` at ${topProject.company}` : ''}. This experience has prepared me to take on similar challenges and deliver meaningful results in the ${position} role.`,
        );
        paragraphs.push('');
      }

      // NOTE: career_goals paragraph removed - may contain sensitive personal aspirations
      // The closing paragraph below provides sufficient context without exposing PII

      // Closing
      paragraphs.push(
        `I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to ${companyName}'s continued success. Thank you for considering my application, and I look forward to the possibility of speaking with you soon.`,
      );
      paragraphs.push('');
      paragraphs.push('Sincerely,');
      paragraphs.push(profileName);

      generatedContent = paragraphs.join('\n');
    }

    // Save the generated cover letter to Convex, degrade gracefully if persistence fails
    let coverLetter: CoverLetter | null = null;
    let saveWarning: string | undefined;
    try {
      coverLetter = await convexServer.mutation(
        api.cover_letters.createCoverLetter,
        {
          clerkId: userId,
          name: `Cover Letter - ${companyName} ${position}`,
          job_title: position,
          company_name: companyName,
          template: 'standard',
          content: generatedContent,
          closing: 'Sincerely,',
          source: 'ai_generated',
        },
        token,
      );
    } catch (error) {
      log.warn('Failed to save cover letter', {
        event: 'data.save.error',
        errorCode: toErrorCode(error),
      });
      saveWarning = 'Cover letter generated but could not be saved.';
    }

    const durationMs = Date.now() - startTime;
    const httpStatus = coverLetter ? 201 : 200;
    log.info('Cover letter generation request completed', {
      event: coverLetter ? 'data.created' : 'request.success',
      clerkId: userId,
      httpStatus,
      durationMs,
      extra: { usedFallback, saved: !!coverLetter },
    });

    return NextResponse.json(
      {
        coverLetter,
        generatedContent,
        usedFallback,
        warning: saveWarning,
      },
      {
        status: httpStatus,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    log.error('Cover letter generation request failed', toErrorCode(error), {
      event: 'request.error',
      httpStatus: 500,
      durationMs,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      {
        status: 500,
        headers: { 'x-correlation-id': correlationId },
      },
    );
  }
}
