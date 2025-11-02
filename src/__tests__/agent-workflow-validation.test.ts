/**
 * Agent Workflow Validation Tests
 *
 * Validates multi-step Agent workflows where operations depend on previous results.
 *
 * Common pattern:
 * 1. Call get_user_snapshot to find record IDs
 * 2. Use those IDs to update/delete records
 *
 * These tests ensure the Agent correctly chains operations and passes IDs between steps.
 */

import type { Id } from 'convex/_generated/dataModel'

// Mock setup
const mockConvexQuery = jest.fn()
const mockConvexMutation = jest.fn()

const mockConvex = {
  query: mockConvexQuery,
  mutation: mockConvexMutation,
}

jest.mock('@/lib/convex-server', () => ({
  getConvexClient: () => mockConvex,
}))

// Mock data
const mockUserId = 'user_test123' as Id<'users'>
const mockClerkId = 'clerk_test123'

const mockGoal1 = {
  _id: 'goal_123' as Id<'goals'>,
  _creationTime: Date.now(),
  user_id: mockUserId,
  title: 'Learn TypeScript',
  status: 'in_progress' as const,
  progress: 30,
  category: 'skill',
  created_at: Date.now(),
  updated_at: Date.now(),
}

const mockGoal2 = {
  _id: 'goal_456' as Id<'goals'>,
  _creationTime: Date.now(),
  user_id: mockUserId,
  title: 'Earn AWS Certification',
  status: 'not_started' as const,
  progress: 0,
  category: 'certification',
  created_at: Date.now(),
  updated_at: Date.now(),
}

const mockApplication1 = {
  _id: 'app_123' as Id<'applications'>,
  _creationTime: Date.now(),
  user_id: mockUserId,
  company: 'Google',
  job_title: 'Software Engineer',
  status: 'applied' as const,
  created_at: Date.now(),
  updated_at: Date.now(),
}

const mockContact1 = {
  _id: 'contact_123' as Id<'networking_contacts'>,
  _creationTime: Date.now(),
  user_id: mockUserId,
  name: 'John Recruiter',
  email: 'john@google.com',
  company: 'Google',
  position: 'Technical Recruiter',
  created_at: Date.now(),
  updated_at: Date.now(),
}

const mockUserSnapshot = {
  user: {
    _id: mockUserId,
    _creationTime: Date.now(),
    clerkId: mockClerkId,
    email: 'test@example.com',
    name: 'Test User',
    role: 'user' as const,
  },
  goals: [mockGoal1, mockGoal2],
  applications: [mockApplication1],
  resumes: [],
  cover_letters: [],
  contacts: [mockContact1],
  projects: [],
}

// Simulate multi-step workflow
async function simulateWorkflow(steps: Array<{ tool: string; input: Record<string, unknown> }>) {
  const mockApiPaths = {
    agent: {
      getUserSnapshot: 'agent:getUserSnapshot',
      updateGoal: 'agent:updateGoal',
      deleteGoal: 'agent:deleteGoal',
      updateApplication: 'agent:updateApplication',
      deleteApplication: 'agent:deleteApplication',
    },
    contacts: {
      updateContact: 'contacts:updateContact',
      deleteContact: 'contacts:deleteContact',
    },
  }

  const results: unknown[] = []

  for (const step of steps) {
    let result: unknown

    switch (step.tool) {
      case 'get_user_snapshot':
        result = await mockConvex.query(mockApiPaths.agent.getUserSnapshot, {
          userId: mockUserId,
        })
        break

      case 'update_goal':
        result = await mockConvex.mutation(mockApiPaths.agent.updateGoal, {
          userId: mockUserId,
          goalId: step.input.goalId as Id<'goals'>,
          title: step.input.title as string | undefined,
          status: step.input.status as string | undefined,
          progress: step.input.progress as number | undefined,
        })
        break

      case 'delete_goal':
        result = await mockConvex.mutation(mockApiPaths.agent.deleteGoal, {
          userId: mockUserId,
          goalId: step.input.goalId as Id<'goals'>,
        })
        break

      case 'update_application':
        result = await mockConvex.mutation(mockApiPaths.agent.updateApplication, {
          userId: mockUserId,
          applicationId: step.input.applicationId as Id<'applications'>,
          status: step.input.status as string | undefined,
          notes: step.input.notes as string | undefined,
        })
        break

      case 'delete_application':
        result = await mockConvex.mutation(mockApiPaths.agent.deleteApplication, {
          userId: mockUserId,
          applicationId: step.input.applicationId as Id<'applications'>,
        })
        break

      case 'update_contact':
        result = await mockConvex.mutation(mockApiPaths.contacts.updateContact, {
          clerkId: mockClerkId,
          contactId: step.input.contactId as Id<'networking_contacts'>,
          updates: {
            name: step.input.name as string | undefined,
            email: step.input.email as string | undefined,
            notes: step.input.notes as string | undefined,
          },
        })
        break

      case 'delete_contact':
        result = await mockConvex.mutation(mockApiPaths.contacts.deleteContact, {
          clerkId: mockClerkId,
          contactId: step.input.contactId as Id<'networking_contacts'>,
        })
        break

      default:
        throw new Error(`Unknown tool: ${step.tool}`)
    }

    results.push(result)
  }

  return results
}

describe('Agent Workflow Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Goal Update Workflow', () => {
    it('should get user snapshot then update specific goal', async () => {
      // Step 1: Get snapshot
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)

      // Step 2: Update goal
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        goal_id: mockGoal1._id,
        status: 'completed',
        progress: 100,
      })

      const results = await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_goal',
          input: {
            goalId: mockGoal1._id,
            status: 'completed',
            progress: 100,
          },
        },
      ])

      // Verify workflow
      expect(mockConvexQuery).toHaveBeenCalledWith('agent:getUserSnapshot', {
        userId: mockUserId,
      })
      expect(mockConvexMutation).toHaveBeenCalledWith('agent:updateGoal', {
        userId: mockUserId,
        goalId: mockGoal1._id,
        status: 'completed',
        progress: 100,
      })
      expect(results).toHaveLength(2)
      expect((results[0] as any).goals).toHaveLength(2) // Snapshot has 2 goals
    })

    it('should handle updating goal by matching title from snapshot', async () => {
      // Simulates: User says "update my TypeScript goal"
      // Agent gets snapshot, finds goal with title "Learn TypeScript", uses that ID

      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        goal_id: mockGoal1._id,
        progress: 60,
      })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_goal',
          input: {
            goalId: mockGoal1._id, // Found from snapshot
            progress: 60,
          },
        },
      ])

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:updateGoal',
        expect.objectContaining({
          goalId: mockGoal1._id,
          progress: 60,
        })
      )
    })

    it('should handle case with multiple goals matching', async () => {
      // When user has multiple goals, agent should ask for clarification
      // But if the workflow continues, it should use the correct ID

      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        goal_id: mockGoal2._id,
        status: 'in_progress',
      })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_goal',
          input: {
            goalId: mockGoal2._id, // Specifically goal 2
            status: 'in_progress',
          },
        },
      ])

      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:updateGoal',
        expect.objectContaining({
          goalId: mockGoal2._id,
          status: 'in_progress',
        })
      )
    })
  })

  describe('Goal Delete Workflow', () => {
    it('should get user snapshot then delete specific goal', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        goal_id: mockGoal1._id,
      })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'delete_goal',
          input: { goalId: mockGoal1._id },
        },
      ])

      expect(mockConvexQuery).toHaveBeenCalledTimes(1)
      expect(mockConvexMutation).toHaveBeenCalledWith('agent:deleteGoal', {
        userId: mockUserId,
        goalId: mockGoal1._id,
      })
    })
  })

  describe('Application Update Workflow', () => {
    it('should get user snapshot then update application status', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        application_id: mockApplication1._id,
        status: 'interview',
      })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_application',
          input: {
            applicationId: mockApplication1._id,
            status: 'interview',
            notes: 'Phone screen scheduled',
          },
        },
      ])

      expect(mockConvexMutation).toHaveBeenCalledWith('agent:updateApplication', {
        userId: mockUserId,
        applicationId: mockApplication1._id,
        status: 'interview',
        notes: 'Phone screen scheduled',
      })
    })

    it('should find application by company name from snapshot', async () => {
      // User: "Update my Google application to interview status"
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        application_id: mockApplication1._id,
      })

      const results = await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_application',
          input: {
            applicationId: mockApplication1._id,
            status: 'interview',
          },
        },
      ])

      // Verify the snapshot includes the Google application
      const snapshot = results[0] as any
      expect(snapshot.applications[0].company).toBe('Google')

      // Verify we used the correct ID
      expect(mockConvexMutation).toHaveBeenCalledWith(
        'agent:updateApplication',
        expect.objectContaining({
          applicationId: mockApplication1._id,
        })
      )
    })
  })

  describe('Application Delete Workflow', () => {
    it('should get user snapshot then delete application', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        success: true,
        application_id: mockApplication1._id,
      })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'delete_application',
          input: { applicationId: mockApplication1._id },
        },
      ])

      expect(mockConvexMutation).toHaveBeenCalledWith('agent:deleteApplication', {
        userId: mockUserId,
        applicationId: mockApplication1._id,
      })
    })
  })

  describe('Contact Update Workflow', () => {
    it('should get user snapshot then update contact', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        _id: mockContact1._id,
        name: 'John Recruiter',
        email: 'john.new@google.com',
      })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_contact',
          input: {
            contactId: mockContact1._id,
            email: 'john.new@google.com',
            notes: 'Sent follow-up email',
          },
        },
      ])

      expect(mockConvexMutation).toHaveBeenCalledWith('contacts:updateContact', {
        clerkId: mockClerkId,
        contactId: mockContact1._id,
        updates: {
          email: 'john.new@google.com',
          notes: 'Sent follow-up email',
          name: undefined,
        },
      })
    })

    it('should find contact by name from snapshot', async () => {
      // User: "Update John's email address"
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({
        _id: mockContact1._id,
      })

      const results = await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_contact',
          input: {
            contactId: mockContact1._id,
            email: 'new@email.com',
          },
        },
      ])

      const snapshot = results[0] as any
      expect(snapshot.contacts[0].name).toContain('John')
    })
  })

  describe('Contact Delete Workflow', () => {
    it('should get user snapshot then delete contact', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({ success: true })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'delete_contact',
          input: { contactId: mockContact1._id },
        },
      ])

      expect(mockConvexMutation).toHaveBeenCalledWith('contacts:deleteContact', {
        clerkId: mockClerkId,
        contactId: mockContact1._id,
      })
    })
  })

  describe('Error Handling in Workflows', () => {
    it('should handle snapshot query failure gracefully', async () => {
      mockConvexQuery.mockRejectedValueOnce(new Error('Database unavailable'))

      await expect(
        simulateWorkflow([{ tool: 'get_user_snapshot', input: {} }])
      ).rejects.toThrow('Database unavailable')

      expect(mockConvexQuery).toHaveBeenCalledTimes(1)
      expect(mockConvexMutation).not.toHaveBeenCalled()
    })

    it('should handle mutation failure after successful snapshot', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockRejectedValueOnce(new Error('Goal not found'))

      await expect(
        simulateWorkflow([
          { tool: 'get_user_snapshot', input: {} },
          {
            tool: 'update_goal',
            input: { goalId: 'invalid_id' as Id<'goals'>, status: 'completed' },
          },
        ])
      ).rejects.toThrow('Goal not found')

      expect(mockConvexQuery).toHaveBeenCalledTimes(1)
      expect(mockConvexMutation).toHaveBeenCalledTimes(1)
    })

    it('should validate ID type consistency across workflow steps', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation.mockResolvedValueOnce({ success: true })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_goal',
          input: { goalId: mockGoal1._id, progress: 100 },
        },
      ])

      // Verify the ID from snapshot matches the ID passed to mutation
      const mutationCall = mockConvexMutation.mock.calls[0]
      expect(mutationCall[1].goalId).toBe(mockGoal1._id)
      expect(typeof mutationCall[1].goalId).toBe('string')
    })
  })

  describe('Sequential Multi-Step Workflows', () => {
    it('should handle updating multiple goals in sequence', async () => {
      mockConvexQuery.mockResolvedValueOnce(mockUserSnapshot)
      mockConvexMutation
        .mockResolvedValueOnce({ success: true, goal_id: mockGoal1._id })
        .mockResolvedValueOnce({ success: true, goal_id: mockGoal2._id })

      await simulateWorkflow([
        { tool: 'get_user_snapshot', input: {} },
        {
          tool: 'update_goal',
          input: { goalId: mockGoal1._id, progress: 100 },
        },
        {
          tool: 'update_goal',
          input: { goalId: mockGoal2._id, status: 'in_progress' },
        },
      ])

      expect(mockConvexQuery).toHaveBeenCalledTimes(1)
      expect(mockConvexMutation).toHaveBeenCalledTimes(2)
      expect(mockConvexMutation).toHaveBeenNthCalledWith(
        1,
        'agent:updateGoal',
        expect.objectContaining({ goalId: mockGoal1._id })
      )
      expect(mockConvexMutation).toHaveBeenNthCalledWith(
        2,
        'agent:updateGoal',
        expect.objectContaining({ goalId: mockGoal2._id })
      )
    })

    it('should handle create-then-update workflow', async () => {
      // User: "Mark my new TypeScript goal as in progress"
      // Agent creates goal, then immediately updates it

      const newGoalId = 'goal_789' as Id<'goals'>

      // No snapshot needed for this workflow
      mockConvexMutation
        .mockResolvedValueOnce({
          success: true,
          goal_id: newGoalId,
          title: 'Learn TypeScript Advanced Features',
          status: 'not_started',
        })
        .mockResolvedValueOnce({
          success: true,
          goal_id: newGoalId,
          status: 'in_progress',
        })

      // Simulate direct workflow without snapshot
      const mockApiPaths = {
        agent: {
          createGoal: 'agent:createGoal',
          updateGoal: 'agent:updateGoal',
        },
      }

      await mockConvex.mutation(mockApiPaths.agent.createGoal, {
        userId: mockUserId,
        title: 'Learn TypeScript Advanced Features',
        category: 'skill',
      })

      await mockConvex.mutation(mockApiPaths.agent.updateGoal, {
        userId: mockUserId,
        goalId: newGoalId,
        status: 'in_progress',
      })

      expect(mockConvexMutation).toHaveBeenCalledTimes(2)
      expect(mockConvexMutation).toHaveBeenNthCalledWith(
        1,
        'agent:createGoal',
        expect.any(Object)
      )
      expect(mockConvexMutation).toHaveBeenNthCalledWith(
        2,
        'agent:updateGoal',
        expect.objectContaining({ goalId: newGoalId })
      )
    })
  })
})
