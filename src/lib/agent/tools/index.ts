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
        'Update or insert a user profile field (skills, bio, education, work history, etc.) with optional confidence score',
      parameters: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            description:
              'Profile field to update. Strings: bio, skills, current_position, current_company, location, industry, experience_level, linkedin_url, phone_number, city, major, university_name, graduation_year, career_goals. Complex arrays: education_history, work_history.',
            enum: [
              'skills',
              'current_position',
              'current_company',
              'location',
              'bio',
              'industry',
              'experience_level',
              'linkedin_url',
              'phone_number',
              'city',
              'major',
              'university_name',
              'graduation_year',
              'career_goals',
              'education_history',
              'work_history',
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
        'Create a new career goal for the user. Use this when the user wants to set a goal, track a milestone, or plan a career objective. Supports optional checklist for breaking goals into sub-tasks.',
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
          checklist: {
            type: 'array',
            description: 'Optional checklist of sub-tasks for the goal',
            items: {
              type: 'object',
              properties: {
                id: {
                  type: 'string',
                  description: 'Unique identifier for the checklist item (use nanoid or uuid)',
                },
                text: {
                  type: 'string',
                  description: 'The sub-task text',
                },
                completed: {
                  type: 'boolean',
                  description: 'Whether this sub-task is completed (default: false)',
                },
              },
              required: ['id', 'text', 'completed'],
            },
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
        'Create a new job application tracking record. Use this when the user wants to track a job they are applying to or have applied to. Can optionally link a resume.',
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
          resume_id: {
            type: 'string',
            description: 'ID of the resume used for this application (from get_user_snapshot) (optional)',
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
        'Update an existing job application. Use this when the user wants to change the status, add notes, attach a resume or cover letter, or update details of an application. You must first use get_user_snapshot to find the application ID and available resume/cover letter IDs.',
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
          resume_id: {
            type: 'string',
            description: 'ID of the resume to attach to this application (from get_user_snapshot resumes list) (optional)',
          },
          cover_letter_id: {
            type: 'string',
            description: 'ID of the cover letter to attach to this application (from get_user_snapshot cover_letters list) (optional)',
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
  {
    type: 'function',
    function: {
      name: 'generate_career_path',
      description:
        'Generate a personalized career path roadmap based on target role. IMPORTANT: Always use get_user_snapshot FIRST to retrieve the user\'s profile data (current position, skills, experience level, industry) - do NOT ask the user for this information. The career path will be automatically tailored using their existing profile.',
      parameters: {
        type: 'object',
        properties: {
          targetRole: {
            type: 'string',
            description: 'Desired job title or career goal (e.g., "Senior Software Engineer", "Product Manager")',
          },
          currentRole: {
            type: 'string',
            description: 'DEPRECATED: Do not use. The user\'s current role will be pulled from get_user_snapshot automatically.',
          },
        },
        required: ['targetRole'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'generate_cover_letter',
      description:
        'Generate a tailored cover letter for a specific job application using AI. Pulls user experience from profile automatically.',
      parameters: {
        type: 'object',
        properties: {
          jobDescription: {
            type: 'string',
            description: 'Full job description text to tailor the cover letter to',
          },
          company: {
            type: 'string',
            description: 'Company name',
          },
          jobTitle: {
            type: 'string',
            description: 'Job title/position',
          },
        },
        required: ['jobDescription', 'company', 'jobTitle'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_cover_letter',
      description:
        'Delete a saved cover letter by ID. Use this when the user wants to remove a draft or generated cover letter.',
      parameters: {
        type: 'object',
        properties: {
          coverLetterId: {
            type: 'string',
            description: 'ID of the cover letter to delete (from get_user_snapshot or cover letter list)',
          },
        },
        required: ['coverLetterId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_resume',
      description:
        'Create a new resume draft for the user. Provide a title and optional content/metadata.',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Resume title (e.g., "Product Manager Resume")',
          },
          content: {
            description: 'Resume content structure. Provide either a JSON object with sections or a raw summary string.',
          },
          visibility: {
            type: 'string',
            enum: ['private', 'public'],
            description: 'Resume visibility (defaults to private).',
          },
          source: {
            type: 'string',
            enum: ['manual', 'ai_generated', 'ai_optimized', 'pdf_upload'],
            description: 'Source of the resume data (optional).',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_resume',
      description:
        'Update an existing resume by ID or name. You can change the title, content, or visibility.',
      parameters: {
        type: 'object',
        properties: {
          resumeId: {
            type: 'string',
            description: 'ID or name of the resume to update (from get_user_snapshot or resume list).',
          },
          title: {
            type: 'string',
            description: 'Updated resume title (optional).',
          },
          content: {
            description: 'Updated resume content (object or raw string).',
          },
          visibility: {
            type: 'string',
            enum: ['private', 'public'],
            description: 'Updated visibility (optional).',
          },
        },
        required: ['resumeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_resume',
      description:
        'Delete a saved resume by ID or name.',
      parameters: {
        type: 'object',
        properties: {
          resumeId: {
            type: 'string',
            description: 'ID or name of the resume to delete (from get_user_snapshot or resume list).',
          },
        },
        required: ['resumeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'analyze_cover_letter',
      description:
        'Analyze an existing cover letter for quality, tone, and relevance. Provides actionable feedback and suggestions for improvement.',
      parameters: {
        type: 'object',
        properties: {
          coverLetterId: {
            type: 'string',
            description: 'ID of the cover letter to analyze (from get_user_snapshot)',
          },
          jobDescription: {
            type: 'string',
            description: 'Optional job description to analyze fit against',
          },
        },
        required: ['coverLetterId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contact',
      description:
        'Add a new professional contact to the networking CRM. Use this when the user wants to track recruiters, hiring managers, mentors, or other professional connections. Supports full contact details including phone and relationship tracking.',
      parameters: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Contact full name',
          },
          email: {
            type: 'string',
            description: 'Contact email address (optional)',
          },
          company: {
            type: 'string',
            description: 'Company where contact works (optional)',
          },
          role: {
            type: 'string',
            description: 'Contact job title or role (optional)',
          },
          linkedinUrl: {
            type: 'string',
            description: 'LinkedIn profile URL (optional)',
          },
          phone: {
            type: 'string',
            description: 'Contact phone number (optional)',
          },
          relationship: {
            type: 'string',
            description: 'Relationship to contact, e.g., "Recruiter", "Hiring Manager", "Mentor", "Former Colleague" (optional)',
          },
          notes: {
            type: 'string',
            description: 'Notes about the contact, how you met, etc. (optional)',
          },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_contact',
      description:
        'Update an existing contact\'s information in the CRM (name, email, company, position, phone, relationship, etc.). Use this ONLY for updating static contact details. For logging new interactions or updating interaction timestamps, ALWAYS use log_contact_interaction instead. You must first use get_user_snapshot to find the contact ID.',
      parameters: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'ID of the contact to update (from get_user_snapshot)',
          },
          name: {
            type: 'string',
            description: 'Updated name (optional)',
          },
          email: {
            type: 'string',
            description: 'Updated email (optional)',
          },
          company: {
            type: 'string',
            description: 'Updated company (optional)',
          },
          role: {
            type: 'string',
            description: 'Updated role (optional)',
          },
          linkedinUrl: {
            type: 'string',
            description: 'Updated LinkedIn URL (optional)',
          },
          phone: {
            type: 'string',
            description: 'Updated phone number (optional)',
          },
          relationship: {
            type: 'string',
            description: 'Updated relationship type (optional)',
          },
          notes: {
            type: 'string',
            description: 'Updated general notes about the contact (optional). For interaction-specific notes, use log_contact_interaction instead.',
          },
        },
        required: ['contactId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_contact',
      description:
        'Delete a contact from the CRM permanently. You must first use get_user_snapshot to find the contact ID.',
      parameters: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'ID of the contact to delete (from get_user_snapshot)',
          },
        },
        required: ['contactId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_contact_interaction',
      description:
        'Log an interaction with a contact. This creates an interaction record that appears in the Interactions tab of the contact detail view. Use this when the user says "log interaction", "I met with", "I spoke with", or similar. You must first use get_user_snapshot to find the contact ID by name.',
      parameters: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'ID of the contact to log interaction for (from get_user_snapshot networking_contacts array)',
          },
          notes: {
            type: 'string',
            description: 'Notes about the interaction (optional)',
          },
        },
        required: ['contactId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_contact_followup',
      description:
        'Create a follow-up task or reminder for a contact. Use this when the user wants to schedule a follow-up action with a contact (e.g., "remind me to follow up with John next week", "schedule a coffee chat with Sarah"). You must first use get_user_snapshot to find the contact ID by name.',
      parameters: {
        type: 'object',
        properties: {
          contactId: {
            type: 'string',
            description: 'ID of the contact to create follow-up for (from get_user_snapshot networking_contacts array)',
          },
          type: {
            type: 'string',
            description: 'Type of follow-up (e.g., "follow_up", "coffee_chat", "email", "call", "meeting")',
          },
          description: {
            type: 'string',
            description: 'Description of the follow-up task',
          },
          due_date: {
            type: 'number',
            description: 'Due date as Unix timestamp in milliseconds. Use Date.UTC() to convert dates.',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the follow-up (optional)',
          },
        },
        required: ['contactId', 'type', 'description', 'due_date'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_contact_followup',
      description:
        'Update an existing follow-up task for a contact. Use this to mark a follow-up as completed, reschedule it, or change its details. You must first use get_user_snapshot to find the follow-up ID from the contact\'s followups array.',
      parameters: {
        type: 'object',
        properties: {
          followupId: {
            type: 'string',
            description: 'ID of the follow-up to update (from get_user_snapshot networking_contacts[].followups[].id)',
          },
          type: {
            type: 'string',
            description: 'Type of follow-up (optional)',
          },
          description: {
            type: 'string',
            description: 'Description of the follow-up task (optional)',
          },
          due_date: {
            type: 'number',
            description: 'Due date as Unix timestamp in milliseconds (optional)',
          },
          completed: {
            type: 'boolean',
            description: 'Whether the follow-up is completed (optional)',
          },
          notes: {
            type: 'string',
            description: 'Additional notes (optional)',
          },
        },
        required: ['followupId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_contact_followup',
      description:
        'Delete a follow-up task for a contact. You must first use get_user_snapshot to find the follow-up ID from the contact\'s followups array.',
      parameters: {
        type: 'object',
        properties: {
          followupId: {
            type: 'string',
            description: 'ID of the follow-up to delete (from get_user_snapshot networking_contacts[].followups[].id)',
          },
        },
        required: ['followupId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_interview_stage',
      description:
        'CRITICAL: Add an interview stage/event to a job application. Use this EXCLUSIVELY when the user explicitly says "interview", "phone screen", "technical interview", "on-site interview", "panel interview", or "final round". NEVER use this for: follow-up emails, reminders, checking status, sending thank you notes, or any other non-interview tasks. If the user says "follow up", "follow-up", "reminder", "check on", or "reach out" - DO NOT use this tool. Use create_followup instead. You must first use get_user_snapshot to find the application ID.',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'The ID of the application to add the interview stage to (from get_user_snapshot)',
          },
          title: {
            type: 'string',
            description: 'Interview stage title (e.g., "Phone Screen", "Technical Interview", "On-Site Interview", "Final Round")',
          },
          scheduled_at: {
            type: 'number',
            description: 'Scheduled date and time as Unix timestamp in milliseconds. Use Date.UTC() to convert dates. (optional)',
          },
          location: {
            type: 'string',
            description: 'Interview location or platform (e.g., "Phone", "Zoom", "Google Meet", "Company Office") (optional)',
          },
          notes: {
            type: 'string',
            description: 'Additional notes about the interview (optional)',
          },
        },
        required: ['applicationId', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_interview_stage',
      description:
        'Update an existing interview stage for a job application. Use this when the user wants to change the status, reschedule, or modify details of an existing interview. You must first use get_user_snapshot to find the stage ID from the application\'s interview_stages array.',
      parameters: {
        type: 'object',
        properties: {
          stageId: {
            type: 'string',
            description: 'The ID of the interview stage to update (from get_user_snapshot in application.interview_stages)',
          },
          title: {
            type: 'string',
            description: 'Updated interview stage title (optional)',
          },
          scheduled_at: {
            type: 'number',
            description: 'Updated scheduled date and time as Unix timestamp in milliseconds. Use Date.UTC() to convert dates. (optional)',
          },
          location: {
            type: 'string',
            description: 'Updated interview location or platform (optional)',
          },
          notes: {
            type: 'string',
            description: 'Updated notes about the interview (optional)',
          },
          outcome: {
            type: 'string',
            enum: ['pending', 'scheduled', 'passed', 'failed'],
            description: 'Interview outcome status: "pending" (not yet scheduled), "scheduled" (confirmed), "passed" (successful), "failed" (unsuccessful) (optional)',
          },
        },
        required: ['stageId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_followup',
      description:
        'Create a follow-up task or reminder for a job application. Use this for general reminders, tasks, and follow-ups that are NOT interviews (e.g., "follow up email", "check application status", "send thank you note", "reach out to recruiter", "update resume for this role"). This is for action items and reminders, NOT for scheduled interviews. For interviews, use create_interview_stage instead. You must first use get_user_snapshot to find the application ID.',
      parameters: {
        type: 'object',
        properties: {
          applicationId: {
            type: 'string',
            description: 'The ID of the application to create a follow-up for (from get_user_snapshot)',
          },
          description: {
            type: 'string',
            description: 'Brief description of the follow-up task (e.g., "Send follow-up email", "Check application status", "Send thank you note")',
          },
          due_date: {
            type: 'number',
            description: 'Due date for the follow-up as Unix timestamp in milliseconds. Use Date.UTC() to convert dates. (optional)',
          },
          notes: {
            type: 'string',
            description: 'Additional notes or details about the follow-up task (optional)',
          },
          type: {
            type: 'string',
            description: 'Type of follow-up (e.g., "follow_up", "reminder", "thank_you") - defaults to "follow_up" (optional)',
          },
        },
        required: ['applicationId', 'description'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_followup',
      description:
        'Update or complete an existing follow-up task for a job application. Use this when the user wants to mark a follow-up as complete, change its description, update due date, or modify notes. You must first use get_user_snapshot to find the follow-up ID.',
      parameters: {
        type: 'object',
        properties: {
          followupId: {
            type: 'string',
            description: 'The ID of the follow-up task to update (from get_user_snapshot)',
          },
          description: {
            type: 'string',
            description: 'Updated description of the follow-up task (optional)',
          },
          due_date: {
            type: 'number',
            description: 'Updated due date as Unix timestamp in milliseconds (optional)',
          },
          notes: {
            type: 'string',
            description: 'Updated notes (optional)',
          },
          type: {
            type: 'string',
            description: 'Updated type (e.g., "follow_up", "reminder", "thank_you") (optional)',
          },
          completed: {
            type: 'boolean',
            description: 'Mark follow-up as completed (true) or incomplete (false) (optional)',
          },
        },
        required: ['followupId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_project',
      description:
        'Create a new project or portfolio item for the user. Use this when the user wants to add a project they worked on (personal, professional, or open source).',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Project title (e.g., "E-commerce Website", "Mobile App for Food Delivery")',
          },
          description: {
            type: 'string',
            description: 'Detailed description of the project and what was built (optional)',
          },
          role: {
            type: 'string',
            description: 'Your role in the project (e.g., "Lead Developer", "Frontend Engineer") (optional)',
          },
          company: {
            type: 'string',
            description: 'Company or organization where project was done (optional)',
          },
          type: {
            type: 'string',
            description: 'Project type (e.g., "personal", "professional", "open-source", "academic")',
            enum: ['personal', 'professional', 'open-source', 'academic', 'freelance'],
          },
          technologies: {
            type: 'array',
            description: 'Technologies, languages, or frameworks used (e.g., ["React", "Node.js", "MongoDB"])',
            items: {
              type: 'string',
            },
          },
          url: {
            type: 'string',
            description: 'Live project URL or demo link (optional)',
          },
          github_url: {
            type: 'string',
            description: 'GitHub repository URL (optional)',
          },
          start_date: {
            type: 'number',
            description: 'Project start date as Unix timestamp in milliseconds (optional)',
          },
          end_date: {
            type: 'number',
            description: 'Project end date as Unix timestamp in milliseconds. Omit if ongoing. (optional)',
          },
        },
        required: ['title', 'description', 'type', 'technologies'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_project',
      description:
        'Update an existing project\'s details. Use this when the user wants to modify a project. You must first use get_user_snapshot to find the project ID.',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The ID of the project to update (from get_user_snapshot)',
          },
          title: {
            type: 'string',
            description: 'Updated project title (optional)',
          },
          description: {
            type: 'string',
            description: 'Updated project description (optional)',
          },
          role: {
            type: 'string',
            description: 'Updated role (optional)',
          },
          company: {
            type: 'string',
            description: 'Updated company (optional)',
          },
          type: {
            type: 'string',
            description: 'Updated project type (optional)',
            enum: ['personal', 'professional', 'open-source', 'academic', 'freelance'],
          },
          technologies: {
            type: 'array',
            description: 'Updated technologies list (optional)',
            items: {
              type: 'string',
            },
          },
          url: {
            type: 'string',
            description: 'Updated project URL (optional)',
          },
          github_url: {
            type: 'string',
            description: 'Updated GitHub URL (optional)',
          },
          start_date: {
            type: 'number',
            description: 'Updated start date as Unix timestamp (optional)',
          },
          end_date: {
            type: 'number',
            description: 'Updated end date as Unix timestamp (optional)',
          },
        },
        required: ['projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_project',
      description:
        'Delete a project from the user\'s portfolio. Use this when the user wants to remove a project. You must first use get_user_snapshot to find the project ID.',
      parameters: {
        type: 'object',
        properties: {
          projectId: {
            type: 'string',
            description: 'The ID of the project to delete (from get_user_snapshot)',
          },
        },
        required: ['projectId'],
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
  | 'create_interview_stage'
  | 'update_interview_stage'
  | 'create_followup'
  | 'update_followup'
  | 'generate_career_path'
  | 'generate_cover_letter'
  | 'delete_cover_letter'
  | 'create_resume'
  | 'update_resume'
  | 'delete_resume'
  | 'analyze_cover_letter'
  | 'create_contact'
  | 'update_contact'
  | 'delete_contact'
  | 'log_contact_interaction'
  | 'create_contact_followup'
  | 'update_contact_followup'
  | 'delete_contact_followup'
  | 'create_project'
  | 'update_project'
  | 'delete_project'

/**
 * Tool execution result type
 */
export interface ToolExecutionResult {
  success: boolean
  data?: unknown
  error?: string
}
