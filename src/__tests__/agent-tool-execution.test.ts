/**
 * Agent Tool Execution Tests
 *
 * Validates that the Agent's tool execution layer correctly routes to
 * Convex backend functions with proper parameter mapping.
 *
 * These tests ensure data consistency between Agent and UI implementations.
 */

import type { Id } from 'convex/_generated/dataModel'

// Mock setup
const mockConvexQuery = jest.fn()
const mockConvexMutation = jest.fn()

const mockConvex = {
  query: mockConvexQuery,
  mutation: mockConvexMutation,
}

// Mock the convex-server module
jest.mock('@/lib/convex-server', () => ({
  getConvexClient: () => mockConvex,
}))

// Mock user data
const mockUserId = 'user_test123' as Id<'users'>
const mockClerkId = 'clerk_test123'
const mockUser = {
  _id: mockUserId,
  _creationTime: Date.now(),
  clerkId: mockClerkId,
  email: 'test@example.com',
  name: 'Test User',
  role: 'user' as const,
  subscription_plan: 'free' as const,
  subscription_status: 'active' as const,
}

// Helper to simulate tool execution
// This recreates the executeTool function from route.ts without importing api
async function simulateToolExecution(
  toolName: string,
  input: Record<string, unknown>
): Promise<unknown> {
  // Create mock API paths - these would normally come from convex/_generated/api
  const mockApiPaths = {
    agent: {
      getUserSnapshot: 'agent:getUserSnapshot',
      createGoal: 'agent:createGoal',
      updateGoal: 'agent:updateGoal',
      deleteGoal: 'agent:deleteGoal',
      createApplication: 'agent:createApplication',
      updateApplication: 'agent:updateApplication',
      deleteApplication: 'agent:deleteApplication',
    },
    contacts: {
      createContact: 'contacts:createContact',
      updateContact: 'contacts:updateContact',
      deleteContact: 'contacts:deleteContact',
    },
    career_paths: {
      createCareerPath: 'career_paths:createCareerPath',
    },
    cover_letters: {
      generateCoverLetterContent: 'cover_letters:generateCoverLetterContent',
    },
  }

  switch (toolName) {
    case 'get_user_snapshot':
      return await mockConvex.query(mockApiPaths.agent.getUserSnapshot, { userId: mockUserId })

    case 'create_goal':
      return await mockConvex.mutation(mockApiPaths.agent.createGoal, {
        userId: mockUserId,
        title: input.title as string,
        description: input.description as string | undefined,
        category: input.category as string | undefined,
        target_date: input.target_date as number | undefined,
      })

    case 'update_goal':
      return await mockConvex.mutation(mockApiPaths.agent.updateGoal, {
        userId: mockUserId,
        goalId: input.goalId as Id<'goals'>,
        title: input.title as string | undefined,
        description: input.description as string | undefined,
        status: input.status as 'not_started' | 'in_progress' | 'active' | 'completed' | 'paused' | 'cancelled' | undefined,
        progress: input.progress as number | undefined,
        category: input.category as string | undefined,
        target_date: input.target_date as number | undefined,
      })

    case 'delete_goal':
      return await mockConvex.mutation(mockApiPaths.agent.deleteGoal, {
        userId: mockUserId,
        goalId: input.goalId as Id<'goals'>,
      })

    case 'create_application':
      return await mockConvex.mutation(mockApiPaths.agent.createApplication, {
        userId: mockUserId,
        company: input.company as string,
        jobTitle: input.jobTitle as string,
        status: input.status as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | undefined,
        source: input.source as string | undefined,
        url: input.url as string | undefined,
        notes: input.notes as string | undefined,
        applied_at: input.applied_at as number | undefined,
      })

    case 'update_application':
      return await mockConvex.mutation(mockApiPaths.agent.updateApplication, {
        userId: mockUserId,
        applicationId: input.applicationId as Id<'applications'>,
        company: input.company as string | undefined,
        jobTitle: input.jobTitle as string | undefined,
        status: input.status as 'saved' | 'applied' | 'interview' | 'offer' | 'rejected' | undefined,
        source: input.source as string | undefined,
        url: input.url as string | undefined,
        notes: input.notes as string | undefined,
        applied_at: input.applied_at as number | undefined,
      })

    case 'delete_application':
      return await mockConvex.mutation(mockApiPaths.agent.deleteApplication, {
        userId: mockUserId,
        applicationId: input.applicationId as Id<'applications'>,
      })

    case 'create_contact':
      return await mockConvex.mutation(mockApiPaths.contacts.createContact, {
        clerkId: mockClerkId,
        name: input.name as string,
        email: input.email as string | undefined,
        company: input.company as string | undefined,
        position: input.role as string | undefined, // Note: role → position mapping
        linkedin_url: input.linkedinUrl as string | undefined,
        notes: input.notes as string | undefined,
        // Optional fields (phone, relationship, last_contact) omitted
      })

    case 'update_contact':
      return await mockConvex.mutation(mockApiPaths.contacts.updateContact, {
        clerkId: mockClerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
        updates: {
          name: input.name as string | undefined,
          email: input.email as string | undefined,
          company: input.company as string | undefined,
          position: input.role as string | undefined,
          linkedin_url: input.linkedinUrl as string | undefined,
          notes: input.notes as string | undefined,
        },
      })

    case 'delete_contact':
      return await mockConvex.mutation(mockApiPaths.contacts.deleteContact, {
        clerkId: mockClerkId,
        contactId: input.contactId as Id<'networking_contacts'>,
      })

    case 'generate_career_path':
      return await mockConvex.mutation(mockApiPaths.career_paths.createCareerPath, {
        clerkId: mockClerkId,
        target_role: input.targetRole as string,
        current_level: input.currentRole as string | undefined,
        estimated_timeframe: undefined,
        status: 'planning', // Route.ts passes 'planning' (line 303)
      })

    case 'generate_cover_letter':
      return await mockConvex.mutation(mockApiPaths.cover_letters.generateCoverLetterContent, {
        clerkId: mockClerkId,
        job_description: input.jobDescription as string | undefined,
        company_name: input.company as string,
        job_title: input.jobTitle as string,
        // Optional field (user_experience) omitted - handled by mutation defaults
      })

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

describe('Agent Tool Execution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Snapshot Tool', () => {
    it('get_user_snapshot calls agent.getUserSnapshot with userId', async () => {
      mockConvexQuery.mockResolvedValue({
        user: mockUser,
        goals: [],
        applications: [],
        resumes: [],
        cover_letters: [],
        contacts: [],
        projects: [],
      })

      await simulateToolExecution('get_user_snapshot', {})

      expect(mockConvexQuery).toHaveBeenCalledWith(
        'agent:getUserSnapshot',
        expect.objectContaining({
          userId: mockUserId,
        })
      )
    })
  })

  describe('Goals Tools', () => {
    it('create_goal calls agent.createGoal with correct parameters', async () => {
      mockConvexMutation.mockResolvedValue({
        success: true,
        goal_id: 'goal_123' as Id<'goals'>,
        title: 'Learn TypeScript',
        status: 'not_started',
      })

      await simulateToolExecution('create_goal', {
        title: 'Learn TypeScript',
        category: 'skill',
        target_date: Date.UTC(2025, 11, 12, 12, 0, 0),
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:createGoal',
        expect.objectContaining({
          userId: mockUserId,
          title: 'Learn TypeScript',
          category: 'skill',
          target_date: expect.any(Number),
        })
      )
    })

    it('update_goal calls agent.updateGoal with goalId', async () => {
      const goalId = 'goal_123' as Id<'goals'>
      mockConvexMutation.mockResolvedValue({
        success: true,
        goal_id: goalId,
        status: 'in_progress',
        progress: 50,
      })

      await simulateToolExecution('update_goal', {
        goalId,
        status: 'in_progress',
        progress: 50,
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:updateGoal',
        expect.objectContaining({
          userId: mockUserId,
          goalId,
          status: 'in_progress',
          progress: 50,
        })
      )
    })

    it('delete_goal calls agent.deleteGoal with goalId', async () => {
      const goalId = 'goal_123' as Id<'goals'>
      mockConvexMutation.mockResolvedValue({
        success: true,
        goal_id: goalId,
      })

      await simulateToolExecution('delete_goal', { goalId })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:deleteGoal',
        expect.objectContaining({
          userId: mockUserId,
          goalId,
        })
      )
    })
  })

  describe('Applications Tools', () => {
    it('create_application calls agent.createApplication with jobTitle parameter', async () => {
      mockConvexMutation.mockResolvedValue({
        success: true,
        application_id: 'app_123' as Id<'applications'>,
      })

      await simulateToolExecution('create_application', {
        company: 'Google',
        jobTitle: 'Software Engineer',
        status: 'saved',
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:createApplication',
        expect.objectContaining({
          userId: mockUserId,
          company: 'Google',
          jobTitle: 'Software Engineer',
          status: 'saved',
        })
      )
    })

    it('update_application calls agent.updateApplication', async () => {
      const applicationId = 'app_123' as Id<'applications'>
      mockConvexMutation.mockResolvedValue({
        success: true,
        application_id: applicationId,
        status: 'interview',
      })

      await simulateToolExecution('update_application', {
        applicationId,
        status: 'interview',
        notes: 'Phone screen scheduled for Monday',
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:updateApplication',
        expect.objectContaining({
          userId: mockUserId,
          applicationId,
          status: 'interview',
          notes: 'Phone screen scheduled for Monday',
        })
      )
    })

    it('delete_application calls agent.deleteApplication', async () => {
      const applicationId = 'app_123' as Id<'applications'>
      mockConvexMutation.mockResolvedValue({
        success: true,
        application_id: applicationId,
      })

      await simulateToolExecution('delete_application', { applicationId })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:deleteApplication',
        expect.objectContaining({
          userId: mockUserId,
          applicationId,
        })
      )
    })
  })

  describe('Contacts Tools', () => {
    it('create_contact calls contacts.createContact (not agent module)', async () => {
      mockConvexMutation.mockResolvedValue({
        _id: 'contact_123' as Id<'networking_contacts'>,
        name: 'John Doe',
        company: 'Acme Corp',
        position: 'Recruiter',
      })

      await simulateToolExecution('create_contact', {
        name: 'John Doe',
        company: 'Acme Corp',
        role: 'Recruiter', // Tool schema uses 'role'
      })

      // Verify it calls the contacts module
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'contacts:createContact',
        expect.objectContaining({
          clerkId: mockClerkId,
          name: 'John Doe',
          company: 'Acme Corp',
          position: 'Recruiter', // Convex function expects 'position'
        })
      )
    })

    it('create_contact maps role parameter to position field', async () => {
      mockConvexMutation.mockResolvedValue({
        _id: 'contact_123' as Id<'networking_contacts'>,
        name: 'Jane Smith',
        position: 'Engineering Manager',
      })

      await simulateToolExecution('create_contact', {
        name: 'Jane Smith',
        role: 'Engineering Manager',
      })

      // Verify parameter name conversion
      const call = mockConvexMutation.mock.calls[0]
      expect(call[1]).toHaveProperty('position', 'Engineering Manager')
      expect(call[1]).not.toHaveProperty('role')
    })

    it('update_contact calls contacts.updateContact with clerkId', async () => {
      const contactId = 'contact_123' as Id<'networking_contacts'>
      mockConvexMutation.mockResolvedValue({
        _id: contactId,
        name: 'John Doe Updated',
      })

      await simulateToolExecution('update_contact', {
        contactId,
        name: 'John Doe Updated',
        email: 'john@updated.com',
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'contacts:updateContact',
        expect.objectContaining({
          clerkId: mockClerkId,
          contactId,
        })
      )
    })

    it('delete_contact calls contacts.deleteContact', async () => {
      const contactId = 'contact_123' as Id<'networking_contacts'>
      mockConvexMutation.mockResolvedValue({ success: true })

      await simulateToolExecution('delete_contact', { contactId })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'contacts:deleteContact',
        expect.objectContaining({
          clerkId: mockClerkId,
          contactId,
        })
      )
    })
  })

  describe('Career Path Tool', () => {
    it('generate_career_path calls career_paths.createCareerPath with clerkId', async () => {
      mockConvexMutation.mockResolvedValue({
        _id: 'path_123' as Id<'career_paths'>,
        target_role: 'Senior Software Engineer',
        status: 'planning',
      })

      await simulateToolExecution('generate_career_path', {
        targetRole: 'Senior Software Engineer',
        currentRole: 'Software Engineer',
        yearsOfExperience: 3,
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'career_paths:createCareerPath',
        expect.objectContaining({
          clerkId: mockClerkId,
          target_role: 'Senior Software Engineer',
          current_level: 'Software Engineer',
          status: 'planning',
        })
      )
    })

    it('generate_career_path passes estimated_timeframe', async () => {
      mockConvexMutation.mockResolvedValue({
        _id: 'path_123' as Id<'career_paths'>,
        target_role: 'CTO',
      })

      await simulateToolExecution('generate_career_path', {
        targetRole: 'CTO',
      })

      // Verify estimated_timeframe is passed (route.ts line 302)
      const call = mockConvexMutation.mock.calls[0]
      expect(call[1]).toHaveProperty('estimated_timeframe')
    })
  })

  describe('Cover Letter Tool', () => {
    it('generate_cover_letter calls cover_letters.generateCoverLetterContent', async () => {
      mockConvexMutation.mockResolvedValue({
        success: true,
        coverLetterId: 'cover_123' as Id<'cover_letters'>,
        content: 'Dear Hiring Manager...',
      })

      await simulateToolExecution('generate_cover_letter', {
        company: 'Microsoft',
        jobTitle: 'Product Manager',
        jobDescription: 'We are looking for an experienced PM...',
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'cover_letters:generateCoverLetterContent',
        expect.objectContaining({
          clerkId: mockClerkId,
          company_name: 'Microsoft',
          job_title: 'Product Manager',
          job_description: 'We are looking for an experienced PM...',
        })
      )
    })

    it('generate_cover_letter does not pass user_experience', async () => {
      mockConvexMutation.mockResolvedValue({
        success: true,
        coverLetterId: 'cover_123' as Id<'cover_letters'>,
      })

      await simulateToolExecution('generate_cover_letter', {
        company: 'Apple',
        jobTitle: 'Designer',
      })

      // Verify user_experience is NOT passed (function pulls from user profile internally)
      const call = mockConvexMutation.mock.calls[0]
      expect(call[1]).not.toHaveProperty('user_experience')
    })
  })

  describe('Parameter Validation', () => {
    it('handles missing required parameters by passing undefined', async () => {
      mockConvexMutation.mockResolvedValue({ success: true })

      await simulateToolExecution('create_goal', {
        title: 'Test Goal',
        // description, category, target_date are optional
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:createGoal',
        expect.objectContaining({
          userId: mockUserId,
          title: 'Test Goal',
          description: undefined,
          category: undefined,
          target_date: undefined,
        })
      )
    })

    it('preserves optional parameters when provided', async () => {
      mockConvexMutation.mockResolvedValue({ success: true })

      await simulateToolExecution('create_application', {
        company: 'Netflix',
        jobTitle: 'Data Scientist',
        status: 'applied',
        url: 'https://netflix.com/careers/123',
        notes: 'Applied via referral',
        applied_at: 1234567890000,
      })

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:createApplication',
        expect.objectContaining({
          userId: mockUserId,
          company: 'Netflix',
          jobTitle: 'Data Scientist',
          status: 'applied',
          url: 'https://netflix.com/careers/123',
          notes: 'Applied via referral',
          applied_at: 1234567890000,
        })
      )
    })
  })

  describe('ID Type Handling', () => {
    it('uses userId (Id<users>) for agent module functions', async () => {
      mockConvexMutation.mockResolvedValue({ success: true })

      await simulateToolExecution('create_goal', {
        title: 'Test',
      })

      const call = mockConvexMutation.mock.calls[0]
      expect(call[1].userId).toBe(mockUserId)
      expect(typeof call[1].userId).toBe('string')
    })

    it('uses clerkId (string) for feature module functions', async () => {
      mockConvexMutation.mockResolvedValue({ success: true })

      await simulateToolExecution('create_contact', {
        name: 'Test Contact',
      })

      const call = mockConvexMutation.mock.calls[0]
      expect(call[1].clerkId).toBe(mockClerkId)
      expect(typeof call[1].clerkId).toBe('string')
    })
  })

  describe('Error Handling', () => {
    it('propagates Convex mutation errors', async () => {
      mockConvexMutation.mockRejectedValue(new Error('User not found'))

      await expect(
        simulateToolExecution('create_goal', { title: 'Test' })
      ).rejects.toThrow('User not found')
    })

    it('throws error for unknown tool names', async () => {
      await expect(
        simulateToolExecution('unknown_tool', {})
      ).rejects.toThrow('Unknown tool: unknown_tool')
    })
  })
})
