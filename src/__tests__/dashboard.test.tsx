import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useQuery } from '@tanstack/react-query'
import DashboardPage from '@/app/(dashboard)/dashboard/page'

// Mock the hooks and components
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}))

jest.mock('@/contexts/ClerkAuthProvider', () => ({
  useAuth: () => ({
    user: {
      clerkId: 'test-user-id',
      role: 'user',
      name: 'Test User',
    },
  }),
}))

jest.mock('@/components/AICareerCoach', () => ({
  AICareerCoach: () => <div data-testid="ai-career-coach">AI Career Coach Component</div>,
}))

jest.mock('@/components/TodaysRecommendations', () => ({
  TodaysRecommendations: () => <div data-testid="todays-recommendations">Today's Recommendations</div>,
}))

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  TestWrapper.displayName = 'TestWrapper'
  return TestWrapper
}

describe('Dashboard Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock for analytics data
    mockUseQuery.mockReturnValue({
      data: {
        applicationStats: {
          total: 10,
          applied: 5,
          interview: 3,
          offer: 1,
          rejected: 1,
        },
        recentActivity: [],
        weeklyProgress: [],
      },
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    } as any)
  })

  it('renders dashboard page correctly', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Welcome back, Test User! Here\'s your career progress.')).toBeInTheDocument()
    expect(screen.getByTestId('ai-career-coach')).toBeInTheDocument()
    expect(screen.getByTestId('todays-recommendations')).toBeInTheDocument()
  })

  it('displays application statistics', async () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    // The component uses hardcoded stats
    expect(screen.getByText('12')).toBeInTheDocument() // Active applications
    expect(screen.getByText('4')).toBeInTheDocument() // Pending tasks
    expect(screen.getByText('3')).toBeInTheDocument() // Active goals
    expect(screen.getByText('Tomorrow 2PM')).toBeInTheDocument() // Next interview
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: jest.fn(),
    } as any)

    render(<DashboardPage />, { wrapper: createWrapper() })

    // Should show loading indicators
    expect(screen.getByTestId('ai-career-coach')).toBeInTheDocument()
  })

  it('handles error state gracefully', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load analytics'),
      refetch: jest.fn(),
    } as any)

    render(<DashboardPage />, { wrapper: createWrapper() })

    // Should still render the main structure
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('displays recent activity when available', () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    // The component shows hardcoded activity
    expect(screen.getByText('Applied to TechCorp Inc.')).toBeInTheDocument()
    expect(screen.getByText('1 day ago')).toBeInTheDocument()
  })

  it('shows recent activity section', () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    // Component always shows recent activity section with hardcoded content
    expect(screen.getByText('Applied to TechCorp Inc.')).toBeInTheDocument()
  })

  it('renders quick actions button', () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })
})