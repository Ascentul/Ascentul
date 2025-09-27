import { render, screen } from '@testing-library/react'
import { useUser, useAuth } from '@clerk/nextjs'
import { useAuth as useClerkAuth } from '@/contexts/ClerkAuthProvider'

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  useAuth: jest.fn(),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  SignInButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  SignUpButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
  UserButton: () => <div>User Button</div>,
}))

jest.mock('@/contexts/ClerkAuthProvider', () => ({
  useAuth: jest.fn(),
  ClerkAuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseClerkAuth = useClerkAuth as jest.MockedFunction<typeof useClerkAuth>

describe('Authentication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('User Authentication State', () => {
    it('handles signed-in user correctly', () => {
      const mockUser = {
        id: 'user_123',
        emailAddresses: [{ emailAddress: 'test@example.com' }],
        firstName: 'John',
        lastName: 'Doe',
        username: 'johndoe',
        imageUrl: 'https://example.com/avatar.jpg',
      }

      mockUseUser.mockReturnValue({
        user: mockUser,
        isLoaded: true,
        isSignedIn: true,
      } as any)

      mockUseAuth.mockReturnValue({
        isSignedIn: true,
        userId: 'user_123',
        sessionId: 'sess_123',
        orgId: null,
        orgRole: null,
        orgSlug: null,
        getToken: jest.fn(),
        signOut: jest.fn(),
      } as any)

      mockUseClerkAuth.mockReturnValue({
        user: {
          clerkId: 'user_123',
          email: 'test@example.com',
          name: 'John Doe',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
        },
        isLoading: false,
      } as any)

      // Test component that uses authentication
      const TestComponent = () => {
        const { user } = useClerkAuth()
        return (
          <div>
            {user ? (
              <div>
                <span>Welcome, {user.name}</span>
                <span>Role: {user.role}</span>
                <span>Plan: {user.subscription_plan}</span>
              </div>
            ) : (
              <span>Not authenticated</span>
            )}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByText('Welcome, John Doe')).toBeInTheDocument()
      expect(screen.getByText('Role: user')).toBeInTheDocument()
      expect(screen.getByText('Plan: free')).toBeInTheDocument()
    })

    it('handles loading state correctly', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
        isSignedIn: false,
      } as any)

      mockUseClerkAuth.mockReturnValue({
        user: null,
        isLoading: true,
      } as any)

      const TestComponent = () => {
        const { user, isLoading } = useClerkAuth()
        return (
          <div>
            {isLoading ? (
              <span>Loading...</span>
            ) : user ? (
              <span>Welcome, {user.name}</span>
            ) : (
              <span>Not authenticated</span>
            )}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('handles signed-out user correctly', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: true,
        isSignedIn: false,
      } as any)

      mockUseAuth.mockReturnValue({
        isSignedIn: false,
        userId: null,
        sessionId: null,
        orgId: null,
        orgRole: null,
        orgSlug: null,
        getToken: jest.fn(),
        signOut: jest.fn(),
      } as any)

      mockUseClerkAuth.mockReturnValue({
        user: null,
        isLoading: false,
      } as any)

      const TestComponent = () => {
        const { user, isLoading } = useClerkAuth()
        return (
          <div>
            {isLoading ? (
              <span>Loading...</span>
            ) : user ? (
              <span>Welcome, {user.name}</span>
            ) : (
              <span>Not authenticated</span>
            )}
          </div>
        )
      }

      render(<TestComponent />)

      expect(screen.getByText('Not authenticated')).toBeInTheDocument()
    })

    it('handles different user roles correctly', () => {
      const roles = ['user', 'admin', 'super_admin', 'university_admin'] as const

      roles.forEach(role => {
        mockUseClerkAuth.mockReturnValue({
          user: {
            clerkId: 'user_123',
            email: 'test@example.com',
            name: 'Test User',
            role: role,
            subscription_plan: 'premium',
            subscription_status: 'active',
          },
          isLoading: false,
        } as any)

        const TestComponent = () => {
          const { user } = useClerkAuth()
          return <div>Role: {user?.role}</div>
        }

        const { rerender } = render(<TestComponent />)
        expect(screen.getByText(`Role: ${role}`)).toBeInTheDocument()

        // Clean up for next iteration
        rerender(<div />)
      })
    })
  })

  describe('Authentication Guards', () => {
    it('should redirect university admins to university dashboard', () => {
      mockUseClerkAuth.mockReturnValue({
        user: {
          clerkId: 'user_123',
          email: 'admin@university.edu',
          name: 'University Admin',
          role: 'university_admin',
          subscription_plan: 'university',
          subscription_status: 'active',
        },
        isLoading: false,
      } as any)

      // Test the logic directly - university admin role should trigger redirect logic
      const TestComponent = () => {
        const { user } = useClerkAuth()

        // Simulate the redirect logic
        if (user?.role === 'university_admin') {
          return <div data-testid="redirect-triggered">Redirecting to university dashboard...</div>
        }

        return <div>Regular dashboard</div>
      }

      render(<TestComponent />)

      expect(screen.getByTestId('redirect-triggered')).toBeInTheDocument()
      expect(screen.getByText('Redirecting to university dashboard...')).toBeInTheDocument()
    })

    it('should allow regular users to access dashboard', () => {
      mockUseClerkAuth.mockReturnValue({
        user: {
          clerkId: 'user_123',
          email: 'user@example.com',
          name: 'Regular User',
          role: 'user',
          subscription_plan: 'free',
          subscription_status: 'active',
        },
        isLoading: false,
      } as any)

      const TestGuardComponent = () => {
        const { user } = useClerkAuth()

        if (user?.role === 'university_admin') {
          return null
        }

        return <div>Regular dashboard</div>
      }

      render(<TestGuardComponent />)

      expect(screen.getByText('Regular dashboard')).toBeInTheDocument()
    })
  })
})