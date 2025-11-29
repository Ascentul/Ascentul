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

// Mock Convex
const mockUseQuery = jest.fn(() => undefined)
const mockUseMutation = jest.fn(() => jest.fn(() => Promise.resolve()))
const mockUseAction = jest.fn(() => jest.fn(() => Promise.resolve()))

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

// Mock Convex browser client and API
jest.mock('convex/browser', () => ({
  ConvexHttpClient: jest.fn().mockImplementation(() => ({
    query: jest.fn(),
    mutation: jest.fn(),
  })),
}))

// Mock convex/_generated/api globally
jest.mock('convex/_generated/api', () => ({
  api: {
    avatar: {
      generateAvatarUploadUrl: 'avatar:generateAvatarUploadUrl',
      updateUserAvatar: 'avatar:updateUserAvatar',
    },
    universities: {
      getUniversitySettings: 'universities:getUniversitySettings',
      updateUniversitySettings: 'universities:updateUniversitySettings',
    },
    users: {
      getUser: 'users:getUser',
      getUserByClerkId: 'users:getUserByClerkId',
      setStripeCustomer: 'users:setStripeCustomer',
    },
    projects: {
      getUserProjects: 'projects:getUserProjects',
    },
    ai_coach: {
      getConversations: 'ai_coach:getConversations',
      getMessages: 'ai_coach:getMessages',
      createConversation: 'ai_coach:createConversation',
      sendMessage: 'ai_coach:sendMessage',
    },
  },
}), { virtual: true })

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


// Mock API requests
global.fetch = jest.fn()

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
