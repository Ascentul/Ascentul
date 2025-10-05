// Mock Convex useQuery - must be hoisted
const mockUseQuery = jest.fn()
jest.mock('convex/react', () => ({
  useQuery: mockUseQuery,
}))

// Mock Convex API - must be hoisted
jest.mock('convex/_generated/api', () => ({
  api: {
    analytics: {
      getUserDashboardAnalytics: 'mock-analytics-function',
    },
  },
}))

import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import DashboardPage from '@/app/(dashboard)/dashboard/page'

jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    isLoaded: true,
  }),
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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

jest.mock('@/components/AICareerCoach', () => ({
  AICareerCoach: () => <div data-testid="ai-career-coach">AI Career Coach Component</div>,
}))

jest.mock('@/components/TodaysRecommendations', () => ({
  TodaysRecommendations: () => <div data-testid="todays-recommendations">Today's Recommendations</div>,
}))

jest.mock('@/components/OnboardingGuard', () => ({
  OnboardingGuard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock all the other components used in dashboard
jest.mock('@/components/SimpleOnboardingChecklist', () => ({
  SimpleOnboardingChecklist: () => <div data-testid="onboarding-checklist">Onboarding Checklist</div>,
}))

jest.mock('@/components/CareerGoalsSummary', () => ({
  CareerGoalsSummary: () => <div data-testid="career-goals">Career Goals Summary</div>,
}))

jest.mock('@/components/ActiveInterviewsSummary', () => ({
  ActiveInterviewsSummary: () => <div data-testid="active-interviews">Active Interviews Summary</div>,
}))

jest.mock('@/components/FollowupActionsSummary', () => ({
  FollowupActionsSummary: () => <div data-testid="followup-actions">Followup Actions Summary</div>,
}))

jest.mock('@/components/StatCard', () => {
  const MockStatCard = ({ label, value }: any) => (
    <div data-testid="stat-card">
      <div>{label}</div>
      <div>{value}</div>
    </div>
  )
  MockStatCard.displayName = 'StatCard'
  return MockStatCard
})

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
  },
}))

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

    // Mock the Convex useQuery for dashboard analytics
    mockUseQuery.mockReturnValue({
      applicationStats: {
        total: 10,
        applied: 5,
        interview: 3,
        offer: 1,
        rejected: 1,
      },
      nextInterview: "Tomorrow 2PM",
      pendingTasks: 4,
      activeGoals: 3,
      upcomingInterviews: 2,
      interviewRate: 30,
      recentActivity: [
        {
          id: "1",
          type: "application",
          description: "Applied to TechCorp Inc.",
          timestamp: Date.now() - 86400000, // 1 day ago
        }
      ],
    })
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

    // The component now uses real data from analytics
    expect(screen.getByText('10')).toBeInTheDocument() // Active applications from mock
    expect(screen.getByText('4')).toBeInTheDocument() // Pending tasks from mock
    expect(screen.getByText('3')).toBeInTheDocument() // Active goals from mock
    expect(screen.getByText('Tomorrow 2PM')).toBeInTheDocument() // Next interview from mock
  })

  it('shows loading state', () => {
    mockUseQuery.mockReturnValue(undefined) // No data from Convex query

    render(<DashboardPage />, { wrapper: createWrapper() })

    // Should show default values when no data
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByTestId('ai-career-coach')).toBeInTheDocument()
  })

  it('handles error state gracefully', () => {
    mockUseQuery.mockReturnValue(null) // Error state from Convex

    render(<DashboardPage />, { wrapper: createWrapper() })

    // Should still render the main structure with fallback values
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('No Interviews')).toBeInTheDocument() // Fallback value
  })

  it('displays recent activity when available', () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    // The component shows real activity from database mock
    expect(screen.getByText('Applied to TechCorp Inc.')).toBeInTheDocument()
    expect(screen.getByText('1 day ago')).toBeInTheDocument()
  })

  it('shows recent activity section', () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    // Component shows recent activity section with real data
    expect(screen.getByText('Recent Activity')).toBeInTheDocument()
    expect(screen.getByText('Applied to TechCorp Inc.')).toBeInTheDocument()
  })

  it('renders quick actions button', () => {
    render(<DashboardPage />, { wrapper: createWrapper() })

    expect(screen.getByText('Quick Actions')).toBeInTheDocument()
  })
})
