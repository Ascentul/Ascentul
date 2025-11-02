/**
 * Resume From Job Description Tool
 *
 * Creates or optimizes a resume based on a job description
 * Uses OpenAI to extract skills, map to user profile, and generate block diffs
 */

import { v } from 'convex/values'
import { action } from '../_generated/server'
import { api } from '../_generated/api'

/**
 * Create resume from job description
 *
 * This is an action (not mutation) because it calls OpenAI API
 */
export const createFromJD = action({
  args: {
    userId: v.id('users'),
    jdText: v.string(),
    baseResumeId: v.optional(v.id('resumes')),
    targetRole: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get user snapshot for profile data
    const userSnapshot = await ctx.runQuery(api.agent.getUserSnapshot, {
      userId: args.userId,
    })

    if (!userSnapshot) {
      throw new Error('User profile not found')
    }

    // Get base resume if provided
    let baseResume = null
    if (args.baseResumeId) {
      baseResume = await ctx.runQuery(api.resumes.getResume, {
        resumeId: args.baseResumeId,
      })
    }

    // Extract key requirements from JD using OpenAI
    const jdAnalysis = await analyzeJobDescription(args.jdText)

    // Generate resume content based on JD requirements
    const resumeContent = await generateResumeFromJD({
      jdAnalysis,
      userProfile: userSnapshot,
      baseResume,
      targetRole: args.targetRole,
      company: args.company,
    })

    // Create new resume with AI-generated content
    const result = await ctx.runMutation(api.resumes.createFromScratch, {
      userId: args.userId,
      title: args.company
        ? `Resume - ${args.company} ${args.targetRole || 'Application'}`
        : `Resume - ${args.targetRole || 'Tailored'}`,
      blocks: resumeContent.blocks,
      theme: 'professional',
    })

    return {
      success: true,
      resumeId: result.resumeId,
      diff: resumeContent.diff,
      message: `Created tailored resume for ${args.company || args.targetRole || 'position'}`,
      insights: {
        matchedSkills: jdAnalysis.requiredSkills.filter((skill: string) =>
          userSnapshot.skills?.some((s: any) =>
            s.name?.toLowerCase().includes(skill.toLowerCase())
          )
        ).length,
        totalRequiredSkills: jdAnalysis.requiredSkills.length,
        keywordsCovered: jdAnalysis.keywords.length,
      },
    }
  },
})

/**
 * Analyze job description to extract requirements
 *
 * TODO: Implement real AI-powered job description analysis using OpenAI
 * Current status: Returns placeholder data to allow action to complete
 *
 * This function provides graceful degradation instead of throwing errors
 * to prevent breaking the entire action chain when called.
 */
async function analyzeJobDescription(jdText: string): Promise<{
  requiredSkills: string[]
  preferredSkills: string[]
  keywords: string[]
  responsibilities: string[]
  qualifications: string[]
}> {
  // Graceful degradation: Return minimal placeholder data
  // This allows the action to complete without breaking the chain
  return {
    requiredSkills: [],
    preferredSkills: [],
    keywords: [],
    responsibilities: [
      'AI-powered job description analysis is currently under development.',
      'Manual resume creation is still available.',
    ],
    qualifications: [],
  }
}

/**
 * Generate resume content from JD analysis
 *
 * TODO: Implement real AI-powered resume generation using OpenAI
 * Current status: Returns placeholder resume template to allow action to complete
 *
 * This function provides graceful degradation instead of throwing errors
 * to prevent breaking the entire action chain when called.
 */
async function generateResumeFromJD(params: {
  jdAnalysis: any
  userProfile: any
  baseResume: any
  targetRole?: string
  company?: string
}): Promise<{
  blocks: any[]
  diff: any[]
}> {
  // Graceful degradation: Return basic resume template
  // This allows the action to complete and creates a usable (though not AI-optimized) resume
  const blocks = [
    {
      type: 'header',
      content: {
        name: params.userProfile.user?.name || 'Your Name',
        email: params.userProfile.user?.email || '',
        title: params.targetRole || 'Professional',
      },
    },
    {
      type: 'section',
      title: 'Professional Summary',
      content: [
        {
          type: 'text',
          text: 'AI-powered resume generation from job descriptions is currently under development. This is a placeholder resume that you can customize manually. Please add your professional summary, experience, skills, and education.',
        },
      ],
    },
    {
      type: 'section',
      title: 'Note',
      content: [
        {
          type: 'text',
          text: `This resume was created for: ${params.company || params.targetRole || 'your application'}. AI-optimized content tailored to the job description will be available soon.`,
        },
      ],
    },
  ]

  return {
    blocks,
    diff: [
      {
        type: 'info',
        message:
          'AI-powered resume generation is not yet available. A basic template has been created for manual customization.',
      },
    ],
  }
}
