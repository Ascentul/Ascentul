// @ts-nocheck
// Mock dependencies before any imports
jest.mock('convex/browser', () => ({
  ConvexHttpClient: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    mutation: jest.fn(),
  })),
}))

jest.mock('convex/_generated/api', () => {
  const createMockFn = (name: string) => ({ _name: name })
  return {
    api: {
      ai_coach: {
        getConversations: createMockFn('ai_coach:getConversations'),
        getMessages: createMockFn('ai_coach:getMessages'),
        createConversation: createMockFn('ai_coach:createConversation'),
        addMessages: createMockFn('ai_coach:addMessages'),
      },
      users: {
        getUserByClerkId: createMockFn('users:getUserByClerkId'),
      },
      goals: {
        getUserGoals: createMockFn('goals:getUserGoals'),
      },
      applications: {
        getUserApplications: createMockFn('applications:getUserApplications'),
      },
      resumes: {
        getUserResumes: createMockFn('resumes:getUserResumes'),
      },
      cover_letters: {
        getUserCoverLetters: createMockFn('cover_letters:getUserCoverLetters'),
      },
      projects: {
        getUserProjects: createMockFn('projects:getUserProjects'),
      },
    },
  }
}, { virtual: true })

import { NextRequest } from 'next/server'
import { GET as getConversations, POST as createConversation } from '@/app/api/ai-coach/conversations/route'
import { GET as getMessages, POST as sendMessage } from '@/app/api/ai-coach/conversations/[id]/messages/route'

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))


jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }))
})

const mockAuth = require('@clerk/nextjs/server').auth
const mockConvexHttpClient = require('convex/browser').ConvexHttpClient

describe('AI Coach API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud'
    process.env.OPENAI_API_KEY = 'test-openai-key'
  })

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL
    delete process.env.OPENAI_API_KEY
  })

  describe('/api/ai-coach/conversations', () => {
    describe('GET', () => {
      it('returns conversations for authenticated user', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const mockConversations = [
          { id: '1', title: 'Test Conversation', createdAt: '2024-01-01T00:00:00Z', userId: 'test-user-id' }
        ]

        const mockClient = {
          query: jest.fn().mockResolvedValue(mockConversations),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations')
        const response = await getConversations(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockConversations)
        expect(mockClient.query).toHaveBeenCalledWith(
          expect.any(Object),
          { clerkId: 'test-user-id' }
        )
      })

      it('returns 401 for unauthenticated user', async () => {
        mockAuth.mockResolvedValue({ userId: null })

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations')
        const response = await getConversations(request)
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })

      it('handles Convex errors gracefully', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const mockClient = {
          query: jest.fn().mockRejectedValue(new Error('Convex error')),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations')
        const response = await getConversations(request)
        const data = await response.json()

        expect(response.status).toBe(500)
        expect(data.error).toBe('Failed to fetch conversations')
      })
    })

    describe('POST', () => {
      it('creates new conversation for authenticated user', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const newConversation = {
          id: 'new-conv-id',
          title: 'New Conversation',
          createdAt: '2024-01-01T00:00:00Z',
          userId: 'test-user-id'
        }

        const mockClient = {
          mutation: jest.fn().mockResolvedValue(newConversation),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations', {
          method: 'POST',
          body: JSON.stringify({ title: 'New Conversation' }),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await createConversation(request)
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data).toEqual(newConversation)
        expect(mockClient.mutation).toHaveBeenCalledWith(
          expect.any(Object),
          {
            clerkId: 'test-user-id',
            title: 'New Conversation',
          }
        )
      })

      it('returns 400 for missing title', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await createConversation(request)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Title is required')
      })
    })
  })

  describe('/api/ai-coach/conversations/[id]/messages', () => {
    describe('GET', () => {
      it('returns messages for conversation', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const mockMessages = [
          {
            id: '1',
            conversationId: 'conv-1',
            isUser: true,
            message: 'Hello',
            timestamp: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            conversationId: 'conv-1',
            isUser: false,
            message: 'Hi there!',
            timestamp: '2024-01-01T00:01:00Z'
          }
        ]

        const mockClient = {
          query: jest.fn().mockResolvedValue(mockMessages),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations/conv-1/messages')
        const response = await getMessages(request, { params: { id: 'conv-1' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data).toEqual(mockMessages)
      })

      it('returns 401 for unauthenticated user', async () => {
        mockAuth.mockResolvedValue({ userId: null })

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations/conv-1/messages')
        const response = await getMessages(request, { params: { id: 'conv-1' } })
        const data = await response.json()

        expect(response.status).toBe(401)
        expect(data.error).toBe('Unauthorized')
      })
    })

    describe('POST', () => {
      it('sends message and gets AI response', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const mockExistingMessages = []
        const mockNewMessages = [
          {
            id: '1',
            conversationId: 'conv-1',
            isUser: true,
            message: 'How can I improve my resume?',
            timestamp: '2024-01-01T00:00:00Z'
          },
          {
            id: '2',
            conversationId: 'conv-1',
            isUser: false,
            message: 'Here are some tips for improving your resume...',
            timestamp: '2024-01-01T00:01:00Z'
          }
        ]

        const mockClient = {
          query: jest.fn().mockImplementation((fn) => {
            const fnName = fn?._name || ''
            // Return empty arrays for user context queries
            if (fnName.includes('users:') || fnName.includes('goals:') || fnName.includes('applications:') ||
                fnName.includes('resumes:') || fnName.includes('cover_letters:') || fnName.includes('projects:')) {
              return Promise.resolve([])
            }
            // Return existing messages for getMessages
            return Promise.resolve(mockExistingMessages)
          }),
          mutation: jest.fn().mockResolvedValue(mockNewMessages),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        // Mock OpenAI response
        const mockOpenAI = require('openai')
        const mockOpenAIInstance = mockOpenAI()
        mockOpenAIInstance.chat.completions.create.mockResolvedValue({
          choices: [{
            message: {
              content: 'Here are some tips for improving your resume...'
            }
          }]
        })

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations/conv-1/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'How can I improve my resume?' }),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await sendMessage(request, { params: { id: 'conv-1' } })
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data).toEqual(mockNewMessages)
        expect(mockOpenAIInstance.chat.completions.create).toHaveBeenCalledWith({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'How can I improve my resume?' })
          ]),
          temperature: 0.7,
          max_tokens: 1500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1
        })
      })

      it('returns 400 for missing content', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations/conv-1/messages', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await sendMessage(request, { params: { id: 'conv-1' } })
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Message content is required')
      })

      it('handles OpenAI API errors gracefully', async () => {
        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const mockClient = {
          query: jest.fn().mockImplementation((fn) => {
            // Return empty arrays for all queries
            return Promise.resolve([])
          }),
          mutation: jest.fn().mockResolvedValue([
            {
              id: '1',
              conversationId: 'conv-1',
              isUser: true,
              message: 'Test message',
              timestamp: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              conversationId: 'conv-1',
              isUser: false,
              message: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
              timestamp: '2024-01-01T00:01:00Z'
            }
          ]),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        // Mock OpenAI error
        const mockOpenAI = require('openai')
        const mockOpenAIInstance = mockOpenAI()
        mockOpenAIInstance.chat.completions.create.mockRejectedValue(new Error('OpenAI API error'))

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations/conv-1/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Test message' }),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await sendMessage(request, { params: { id: 'conv-1' } })
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data[1].message).toContain('technical difficulties')
      })

      it('works without OpenAI when API key is missing', async () => {
        delete process.env.OPENAI_API_KEY

        mockAuth.mockResolvedValue({ userId: 'test-user-id' })

        const mockClient = {
          query: jest.fn().mockImplementation((fn) => {
            // Return empty arrays for all queries
            return Promise.resolve([])
          }),
          mutation: jest.fn().mockResolvedValue([
            {
              id: '1',
              conversationId: 'conv-1',
              isUser: true,
              message: 'Test message',
              timestamp: '2024-01-01T00:00:00Z'
            },
            {
              id: '2',
              conversationId: 'conv-1',
              isUser: false,
              message: "Thank you for your question: \"Test message\". I'm currently unable to access my AI capabilities.",
              timestamp: '2024-01-01T00:01:00Z'
            }
          ]),
        }
        mockConvexHttpClient.mockReturnValue(mockClient)

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations/conv-1/messages', {
          method: 'POST',
          body: JSON.stringify({ content: 'Test message' }),
          headers: { 'Content-Type': 'application/json' },
        })

        const response = await sendMessage(request, { params: { id: 'conv-1' } })
        const data = await response.json()

        expect(response.status).toBe(201)
        expect(data[1].message).toContain('unable to access my AI capabilities')
      })
    })
  })

  describe('Environment Configuration', () => {
    it('handles missing Convex URL', async () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL
      mockAuth.mockResolvedValue({ userId: 'test-user-id' })

      const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations')
      const response = await getConversations(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Convex URL not configured')
    })
  })
})
