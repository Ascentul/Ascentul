import '@testing-library/jest-dom'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return ''
  },
}))

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: true,
    userId: 'test-user-id',
  }),
  ClerkProvider: ({ children }) => children,
  SignInButton: ({ children }) => children,
  SignUpButton: ({ children }) => children,
  UserButton: () => <div>User Button</div>,
}))

// Mock toast hook with overridable jest.fn
const toastFn = jest.fn()
const useToastMock = jest.fn(() => ({ toast: toastFn }))
jest.mock('@/hooks/use-toast', () => ({
  useToast: useToastMock,
}))

// Mock Convex
const mockUseQuery = jest.fn((name) => {
  if (name === 'universities:getUniversitySettings') {
    return {
      _id: 'uni-1',
      name: 'Test University',
      description: 'A great place to learn',
      website: 'https://example.edu',
      contact_email: 'admin@example.edu',
      max_students: 123,
      license_seats: 50,
      license_used: 10,
    }
  }
  if (name === 'analytics:getUserDashboardAnalytics') {
    return {
      totalStudents: 0,
      sessionsThisWeek: 0,
      progress: [],
    }
  }
  if (name === 'ai_coach:getConversations') {
    return [{ id: 'conversation-1', title: 'Test Conversation' }]
  }
  if (name === 'ai_coach:getMessages') {
    return []
  }
  if (name === 'users:getUserByClerkId') {
    return { _id: 'user-1', role: 'student', name: 'Test User' }
  }
  return undefined
})
const mockUseMutation = jest.fn((name) => {
  if (name === 'avatar:generateAvatarUploadUrl') {
    return jest.fn(() => Promise.resolve('https://upload.example.com'))
  }
  if (name === 'avatar:updateUserAvatar') {
    return jest.fn(() => Promise.resolve({ success: true }))
  }
  if (name === 'universities:updateUniversitySettings') {
    return jest.fn(() => Promise.resolve({ success: true }))
  }
  return jest.fn(() => Promise.resolve({ success: true }))
})
const mockUseAction = jest.fn(() => jest.fn(() => Promise.resolve({ success: true })))

jest.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
  useAction: mockUseAction,
  ConvexProvider: ({ children }) => children,
}))

// Mock Convex Next.js helpers
jest.mock('convex/nextjs', () => ({
  fetchQuery: jest.fn(() => Promise.resolve(undefined)),
  fetchMutation: jest.fn(() => Promise.resolve(undefined)),
  fetchAction: jest.fn(() => Promise.resolve(undefined)),
}))

// Mock Convex server helper used in API routes
jest.mock('@/lib/convex-server', () => {
  const query = jest.fn((fn) => {
    if (fn === 'ai_coach:getConversations') {
      return Promise.resolve([
        { id: 'conversation-1', title: 'Test Conversation' },
        { id: 'test-conversation', title: 'Test Conversation' },
        { id: '123', title: 'Sample Conversation' },
      ])
    }
    if (fn === 'ai_coach:getMessages') {
      return Promise.resolve([{ id: 'message-1', text: 'Hi there', role: 'user' }])
    }
    if (
      fn === 'users:getUserByClerkId' ||
      fn === 'goals:getUserGoals' ||
      fn === 'applications:getUserApplications' ||
      fn === 'resumes:getUserResumes' ||
      fn === 'cover_letters:getUserCoverLetters' ||
      fn === 'projects:getUserProjects'
    ) {
      return Promise.resolve([])
    }
    return Promise.resolve({})
  })
  const mutation = jest.fn(() => Promise.resolve({ success: true }))
  const action = jest.fn(() => Promise.resolve({ success: true }))
  return {
    convexServer: { query, mutation, action },
  }
})

// Mock Impersonation context to avoid provider errors in tests
jest.mock('@/contexts/ImpersonationContext', () => ({
  useImpersonation: () => ({
    isImpersonating: false,
    impersonatedUser: null,
    getEffectiveRole: () => 'student',
    startImpersonation: jest.fn(),
    stopImpersonation: jest.fn(),
  }),
  ImpersonationProvider: ({ children }) => children,
}))

global.HTMLElement.prototype.scrollIntoView = jest.fn()

// Mock Clerk server auth for API route tests
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn().mockResolvedValue({
    userId: 'test-user-id',
    getToken: jest.fn().mockResolvedValue('test-token'),
  }),
}))


// Mock API requests with a basic resolved response
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({ storageId: 'storage-1' }),
    blob: async () => new Blob(),
  })
)

// Mock next/server for API route testing
jest.mock('next/server', () => ({
  NextRequest: class NextRequest {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
      this.body = init.body
    }
    async json() {
      return JSON.parse(this.body || '{}')
    }
  },
  NextResponse: {
    json: (data, init = {}) => ({
      json: async () => data,
      status: init.status || 200,
    }),
  },
}))

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock Next.js Request and Response for API tests
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, init = {}) {
      this.url = url
      this.method = init.method || 'GET'
      this.headers = new Map(Object.entries(init.headers || {}))
      this.body = init.body
    }
    async json() {
      return JSON.parse(this.body || '{}')
    }
  }
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, init = {}) {
      this.body = body
      this.status = init.status || 200
      this.headers = new Map(Object.entries(init.headers || {}))
    }
    async json() {
      return JSON.parse(this.body)
    }
  }
}
