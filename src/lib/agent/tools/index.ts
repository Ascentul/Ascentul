/**
 * AI Agent tool registry and OpenAI function schemas
 */

import type OpenAI from 'openai'

/**
 * OpenAI function schemas for all available tools
 */
export const TOOL_SCHEMAS: OpenAI.Chat.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_user_snapshot',
      description:
        'Get comprehensive user profile including career data, applications, goals, resumes, and projects. Use this first to understand the user context.',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_profile_gaps',
      description:
        'Analyze user profile and identify missing or incomplete fields with severity ratings and suggestions',
      parameters: {
        type: 'object',
        properties: {},
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'upsert_profile_field',
      description:
        'Update or insert a user profile field (skills, position, company, location, bio, etc.) with optional confidence score',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description:
              'Profile field name: skills, current_position, current_company, location, bio, industry, experience_level, or linkedin_url',
            enum: [
              'skills',
              'current_position',
              'current_company',
              'location',
              'bio',
              'industry',
              'experience_level',
              'linkedin_url',
            ],
          },
          value: {
            description:
              'The value to set for the field. Can be string (for text fields like bio, position), number (for numeric fields), array of strings (for skills), or object (for complex data)',
          },
          confidence: {
            type: 'number',
            description: 'Confidence score between 0 and 1 (default: 0.9)',
            minimum: 0,
            maximum: 1,
          },
        },
        required: ['field', 'value'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_jobs',
      description:
        'Search for job opportunities based on query and user profile. Returns ranked results with match scores.',
      parameters: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Job search query or keywords (e.g., "software engineer", "data analyst")',
          },
          location: {
            type: 'string',
            description: 'Job location or "remote" (optional, defaults to user location)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return (default: 10)',
            minimum: 1,
            maximum: 50,
          },
        },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_job',
      description:
        'Save a job posting to the user\'s application tracker with "saved" status',
      parameters: {
        type: 'object',
        properties: {
          company: {
            type: 'string',
            description: 'Company name',
          },
          jobTitle: {
            type: 'string',
            description: 'Job title or position name',
          },
          url: {
            type: 'string',
            description: 'URL to the job posting (optional)',
          },
          notes: {
            type: 'string',
            description: 'Optional notes about the job or why it\'s a good fit',
          },
        },
        required: ['company', 'jobTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_goal',
      description:
        'Create a new career goal for the user. Use this when the user wants to set a goal, track a milestone, or plan a career objective.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Goal title (e.g., "Earn Salesforce certification", "Learn Python")',
          },
          description: {
            type: 'string',
            description: 'Optional detailed description of the goal and why it matters',
          },
          category: {
            type: 'string',
            description: 'Goal category (e.g., "certification", "skill", "career_move", "networking")',
          },
          target_date: {
            type: 'number',
            description: 'Target completion date as Unix timestamp in milliseconds. Convert dates carefully: "December 12, 2025" = Date.UTC(2025, 11, 12, 12, 0, 0) milliseconds. Use UTC noon to avoid timezone issues. (optional)',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_goal',
      description:
        'Update an existing goal\'s status, progress, title, or other fields. Use this when the user wants to mark a goal as in progress, completed, or update its details. You must first use get_user_snapshot to find the goal ID.',
      parameters: {
        type: 'object',
        properties: {
          goalId: {
            type: 'string',
            description: 'The ID of the goal to update (from get_user_snapshot)',
          },
          title: {
            type: 'string',
            description: 'Updated goal title (optional)',
          },
          description: {
            type: 'string',
            description: 'Updated description (optional)',
          },
          status: {
            type: 'string',
            description: 'Goal status: not_started, in_progress, active, completed, paused, cancelled',
            enum: ['not_started', 'in_progress', 'active', 'completed', 'paused', 'cancelled'],
          },
          progress: {
            type: 'number',
            description: 'Progress percentage (0-100)',
            minimum: 0,
            maximum: 100,
          },
          category: {
            type: 'string',
            description: 'Updated category (optional)',
          },
          target_date: {
            type: 'number',
            description: 'Updated target date as Unix timestamp in milliseconds. Convert dates carefully: "December 12, 2025" = Date.UTC(2025, 11, 12, 12, 0, 0) milliseconds. Use UTC noon to avoid timezone issues. (optional)',
          },
        },
        required: ['goalId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_goal',
      description:
        'Delete an existing goal permanently. Use this when the user wants to remove a goal. You must first use get_user_snapshot to find the goal ID.',
      parameters: {
        type: 'object',
        properties: {
          goalId: {
            type: 'string',
            description: 'The ID of the goal to delete (from get_user_snapshot)',
          },
        },
        required: ['goalId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_application',
      description:
        'Create a new job application tracking record. Use this when the user wants to track a job they are applying to or have applied to.',
      parameters: {
        type: 'object',
        properties: {
          company: {
            type: 'string',
            description: 'Company name (e.g., "Google", "Microsoft")',
          },
          jobTitle: {
            type: 'string',
            description: 'Job title or position (e.g., "Software Engineer", "Product Manager")',
          },
          status: {
            type: 'string',
            description: 'Application status: saved (bookmarked for later), applied (submitted application), interview (interview scheduled), offer (received offer), rejected (application rejected)',
            enum: ['saved', 'applied', 'interview', 'offer', 'rejected'],
          },
          source: {
            type: 'string',
            description: 'Where the job was found (e.g., "LinkedIn", "Indeed", "Company Website")',
          },
          url: {
            type: 'string',
            description: 'URL to the job posting (optional)',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the application (optional)',
          },
          applied_at: {
            type: 'number',
            description: 'Date when application was submitted as Unix timestamp in milliseconds. Use Date.UTC() for conversion. (optional)',
          },
        },
        required: ['company', 'jobTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_application',
      description:
        'Update an existing job application. Use this when the user wants to change the status, add notes, or update details of an application. You must first use get_user_snapshot to find the application ID.',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'The ID of the application to update (from get_user_snapshot)',
          },
          company: {
            type: 'string',
            description: 'Updated company name (optional)',
          },
          jobTitle: {
            type: 'string',
            description: 'Updated job title (optional)',
          },
          status: {
            type: 'string',
            description: 'Updated application status',
            enum: ['saved', 'applied', 'interview', 'offer', 'rejected'],
          },
          source: {
            type: 'string',
            description: 'Updated source (optional)',
          },
          url: {
            type: 'string',
            description: 'Updated URL (optional)',
          },
          notes: {
            type: 'string',
            description: 'Updated or additional notes (optional)',
          },
          applied_at: {
            type: 'number',
            description: 'Updated application submission date as Unix timestamp in milliseconds (optional)',
          },
        },
        required: ['applicationId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_application',
      description:
        'Delete an existing job application permanently. Use this when the user wants to remove an application from tracking. You must first use get_user_snapshot to find the application ID.',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'The ID of the application to delete (from get_user_snapshot)',
          },
        },
        required: ['applicationId'],
      },
    },
  },
]

/**
 * Tool name type for type safety
 */
export type ToolName =
  | 'get_user_snapshot'
  | 'get_profile_gaps'
  | 'upsert_profile_field'
  | 'search_jobs'
  | 'save_job'
  | 'create_goal'
  | 'update_goal'
  | 'delete_goal'
  | 'create_application'
  | 'update_application'
  | 'delete_application'

/**
 * Tool execution result type
 */
export interface ToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
}
