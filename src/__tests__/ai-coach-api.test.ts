// @ts-nocheck
/**
 * Tests for AI Coach API routes
 *
 * These tests verify the API routes work correctly with:
 * - Clerk authentication
 * - Convex database operations
 * - OpenAI integration
 */

// Mock setup variables - declared before mocks
let mockGetToken: jest.Mock;
const mockAuthUserId: string | null = 'test-user-id';

// Mock @clerk/nextjs/server - must be before imports
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(() =>
    Promise.resolve({
      userId: mockAuthUserId,
      getToken: () => mockGetToken(),
    }),
  ),
}));

// Mock convex-auth helper - this is what the API routes actually use
jest.mock('@/lib/convex-auth', () => ({
  requireConvexToken: jest.fn(),
}));

// Mock convex/nextjs
const mockFetchQuery = jest.fn();
const mockFetchMutation = jest.fn();

jest.mock('convex/nextjs', () => ({
  fetchQuery: (...args: unknown[]) => mockFetchQuery(...args),
  fetchMutation: (...args: unknown[]) => mockFetchMutation(...args),
}));

// Mock convex-server - the wrapper used by API routes
jest.mock('@/lib/convex-server', () => ({
  convexServer: {
    query: (...args: unknown[]) => mockFetchQuery(...args),
    mutation: (...args: unknown[]) => mockFetchMutation(...args),
    action: jest.fn(),
  },
}));

// Mock convex/_generated/api
jest.mock(
  'convex/_generated/api',
  () => {
    const createMockFn = (name: string) => ({ _name: name });
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
    };
  },
  { virtual: true },
);

// Mock OpenAI
const mockOpenAICreate = jest.fn();
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: mockOpenAICreate,
      },
    },
  }));
});

import { NextRequest } from 'next/server';

import {
  GET as getMessages,
  POST as sendMessage,
} from '@/app/api/ai-coach/conversations/[id]/messages/route';
import {
  GET as getConversations,
  POST as createConversation,
} from '@/app/api/ai-coach/conversations/route';
import { requireConvexToken } from '@/lib/convex-auth';

const mockRequireConvexToken = requireConvexToken as jest.MockedFunction<typeof requireConvexToken>;

// Helper to setup auth mock
const setupAuthMock = (userId: string | null, token: string | null = 'mock-convex-token') => {
  if (userId === null) {
    mockRequireConvexToken.mockRejectedValue(new Error('Unauthorized'));
  } else {
    mockRequireConvexToken.mockResolvedValue({
      userId,
      token: token!,
    });
  }
};

describe('AI Coach API Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetToken = jest.fn().mockResolvedValue('mock-convex-token');
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test-convex-url.convex.cloud';
    process.env.OPENAI_API_KEY = 'test-openai-key';
  });

  afterEach(() => {
    delete process.env.NEXT_PUBLIC_CONVEX_URL;
    delete process.env.OPENAI_API_KEY;
  });

  describe('/api/ai-coach/conversations', () => {
    describe('GET', () => {
      it('returns conversations for authenticated user', async () => {
        setupAuthMock('test-user-id');

        const mockConversations = [
          {
            id: '1',
            title: 'Test Conversation',
            createdAt: '2024-01-01T00:00:00Z',
            userId: 'test-user-id',
          },
        ];
        mockFetchQuery.mockResolvedValue(mockConversations);

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations');
        const response = await getConversations(request);
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockConversations);
        expect(mockFetchQuery).toHaveBeenCalledWith(
          expect.any(Object),
          { clerkId: 'test-user-id' },
          'mock-convex-token',
        );
      });

      it('returns 401 for unauthenticated user', async () => {
        setupAuthMock(null);

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations');
        const response = await getConversations(request);
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });

      it('handles Convex errors gracefully', async () => {
        setupAuthMock('test-user-id');
        mockFetchQuery.mockRejectedValue(new Error('Convex error'));

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations');
        const response = await getConversations(request);
        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data.error).toBe('Convex error');
      });
    });

    describe('POST', () => {
      it('creates new conversation for authenticated user', async () => {
        setupAuthMock('test-user-id');

        const newConversation = {
          id: 'new-conv-id',
          title: 'New Conversation',
          createdAt: '2024-01-01T00:00:00Z',
          userId: 'test-user-id',
        };
        mockFetchMutation.mockResolvedValue(newConversation);

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations', {
          method: 'POST',
          body: JSON.stringify({ title: 'New Conversation' }),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await createConversation(request);
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual(newConversation);
        expect(mockFetchMutation).toHaveBeenCalledWith(
          expect.any(Object),
          { clerkId: 'test-user-id', title: 'New Conversation' },
          'mock-convex-token',
        );
      });

      it('returns 400 for missing title', async () => {
        setupAuthMock('test-user-id');

        const request = new NextRequest('http://localhost:3000/api/ai-coach/conversations', {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'Content-Type': 'application/json' },
        });

        const response = await createConversation(request);
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Title is required');
      });
    });
  });

  describe('/api/ai-coach/conversations/[id]/messages', () => {
    describe('GET', () => {
      it('returns messages for conversation', async () => {
        setupAuthMock('test-user-id');

        const mockMessages = [
          {
            id: '1',
            conversationId: 'conv-1',
            isUser: true,
            message: 'Hello',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            conversationId: 'conv-1',
            isUser: false,
            message: 'Hi there!',
            timestamp: '2024-01-01T00:01:00Z',
          },
        ];
        mockFetchQuery.mockResolvedValue(mockMessages);

        const request = new NextRequest(
          'http://localhost:3000/api/ai-coach/conversations/conv-1/messages',
        );
        const response = await getMessages(request, { params: Promise.resolve({ id: 'conv-1' }) });
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data).toEqual(mockMessages);
      });

      it('returns 401 for unauthenticated user', async () => {
        setupAuthMock(null);

        const request = new NextRequest(
          'http://localhost:3000/api/ai-coach/conversations/conv-1/messages',
        );
        const response = await getMessages(request, { params: Promise.resolve({ id: 'conv-1' }) });
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toBe('Unauthorized');
      });
    });

    describe('POST', () => {
      it('sends message and gets AI response', async () => {
        setupAuthMock('test-user-id');

        const mockExistingMessages: Array<{ isUser: boolean; message: string }> = [];
        const mockNewMessages = [
          {
            id: '1',
            conversationId: 'conv-1',
            isUser: true,
            message: 'How can I improve my resume?',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            conversationId: 'conv-1',
            isUser: false,
            message: 'Here are some tips for improving your resume...',
            timestamp: '2024-01-01T00:01:00Z',
          },
        ];

        // Set up mock responses for the various queries
        mockFetchQuery.mockImplementation((fn) => {
          const fnName = fn?._name || '';
          if (fnName === 'ai_coach:getMessages') {
            return Promise.resolve(mockExistingMessages);
          }
          // Return null/empty for user context queries
          if (fnName === 'users:getUserByClerkId') {
            return Promise.resolve(null);
          }
          return Promise.resolve([]);
        });
        mockFetchMutation.mockResolvedValue(mockNewMessages);

        // Mock OpenAI response
        mockOpenAICreate.mockResolvedValue({
          choices: [
            {
              message: {
                content: 'Here are some tips for improving your resume...',
              },
            },
          ],
        });

        const request = new NextRequest(
          'http://localhost:3000/api/ai-coach/conversations/conv-1/messages',
          {
            method: 'POST',
            body: JSON.stringify({ content: 'How can I improve my resume?' }),
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const response = await sendMessage(request, { params: Promise.resolve({ id: 'conv-1' }) });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data).toEqual(mockNewMessages);
        expect(mockOpenAICreate).toHaveBeenCalledWith({
          model: 'gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({ role: 'system' }),
            expect.objectContaining({ role: 'user', content: 'How can I improve my resume?' }),
          ]),
          temperature: 0.7,
          max_tokens: 1500,
          presence_penalty: 0.1,
          frequency_penalty: 0.1,
        });
      });

      it('returns 400 for missing content', async () => {
        setupAuthMock('test-user-id');

        const request = new NextRequest(
          'http://localhost:3000/api/ai-coach/conversations/conv-1/messages',
          {
            method: 'POST',
            body: JSON.stringify({}),
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const response = await sendMessage(request, { params: Promise.resolve({ id: 'conv-1' }) });
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toBe('Message content is required');
      });

      it('handles OpenAI API errors gracefully', async () => {
        setupAuthMock('test-user-id');

        mockFetchQuery.mockImplementation((fn) => {
          const fnName = fn?._name || '';
          if (fnName === 'users:getUserByClerkId') {
            return Promise.resolve(null);
          }
          return Promise.resolve([]);
        });
        mockFetchMutation.mockResolvedValue([
          {
            id: '1',
            conversationId: 'conv-1',
            isUser: true,
            message: 'Test message',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            conversationId: 'conv-1',
            isUser: false,
            message:
              "I apologize, but I'm experiencing technical difficulties. Please try again in a moment.",
            timestamp: '2024-01-01T00:01:00Z',
          },
        ]);

        // Mock OpenAI error
        mockOpenAICreate.mockRejectedValue(new Error('OpenAI API error'));

        const request = new NextRequest(
          'http://localhost:3000/api/ai-coach/conversations/conv-1/messages',
          {
            method: 'POST',
            body: JSON.stringify({ content: 'Test message' }),
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const response = await sendMessage(request, { params: Promise.resolve({ id: 'conv-1' }) });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data[1].message).toContain('technical difficulties');
      });

      it('works without OpenAI when API key is missing', async () => {
        delete process.env.OPENAI_API_KEY;

        setupAuthMock('test-user-id');

        mockFetchQuery.mockImplementation((fn) => {
          const fnName = fn?._name || '';
          if (fnName === 'users:getUserByClerkId') {
            return Promise.resolve(null);
          }
          return Promise.resolve([]);
        });
        mockFetchMutation.mockResolvedValue([
          {
            id: '1',
            conversationId: 'conv-1',
            isUser: true,
            message: 'Test message',
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            id: '2',
            conversationId: 'conv-1',
            isUser: false,
            message:
              'Thank you for your question: "Test message". I\'m currently unable to access my AI capabilities.',
            timestamp: '2024-01-01T00:01:00Z',
          },
        ]);

        const request = new NextRequest(
          'http://localhost:3000/api/ai-coach/conversations/conv-1/messages',
          {
            method: 'POST',
            body: JSON.stringify({ content: 'Test message' }),
            headers: { 'Content-Type': 'application/json' },
          },
        );

        const response = await sendMessage(request, { params: Promise.resolve({ id: 'conv-1' }) });
        const data = await response.json();

        expect(response.status).toBe(201);
        expect(data[1].message).toContain('unable to access my AI capabilities');
      });
    });
  });
});
