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

/**
 * Tool execution result type
 */
export interface ToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
}
