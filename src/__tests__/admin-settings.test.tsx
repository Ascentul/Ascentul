import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useMutation, useQuery } from 'convex/react'
import AdminSettingsPage from '@/app/(dashboard)/admin/settings/page'

jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
}))
jest.mock('@/contexts/ClerkAuthProvider', () => ({
  useAuth: jest.fn(),
}))
jest.mock('convex/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}))
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('AdminSettingsPage - Settings Persistence', () => {
  const mockUpdatePlatformSettings = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseUser.mockReturnValue({
      user: {
        id: 'admin-clerk-id',
      } as any,
      isLoaded: true,
      isSignedIn: true,
    } as any)

    mockUseAuth.mockReturnValue({
      user: {
        _id: 'admin-user-id',
        clerkId: 'admin-clerk-id',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'super_admin',
        subscription_plan: 'premium',
        subscription_status: 'active',
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      isLoading: false,
      isSignedIn: true,
      signOut: jest.fn(),
      isAdmin: true,
    })

    mockUseMutation.mockReturnValue(mockUpdatePlatformSettings)
    mockUseQuery.mockReturnValue({
      openai_model: 'gpt-4o-mini',
      openai_temperature: 0.7,
      openai_max_tokens: 4000,
      maintenance_mode: false,
      allow_signups: true,
      default_user_role: 'user',
    })
  })

  test('should call updatePlatformSettings mutation when saving AI settings', async () => {
    mockUpdatePlatformSettings.mockResolvedValue({
      success: true,
      settings: {
        openai_model: 'gpt-4o',
        openai_temperature: 0.8,
        openai_max_tokens: 5000,
      },
    })

    render(<AdminSettingsPage />)

    // Navigate to AI tab
    const aiTab = screen.getByRole('tab', { name: /ai/i })
    fireEvent.click(aiTab)

    // Change AI settings
    const modelSelect = screen.getByLabelText(/model/i)
    fireEvent.change(modelSelect, { target: { value: 'gpt-4o' } })

    const temperatureInput = screen.getByLabelText(/temperature/i)
    fireEvent.change(temperatureInput, { target: { value: '0.8' } })

    // Save settings
    const saveButton = screen.getByText(/save.*ai/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdatePlatformSettings).toHaveBeenCalledWith({
        clerkId: 'admin-clerk-id',
        settings: expect.objectContaining({
          openai_model: 'gpt-4o',
          openai_temperature: 0.8,
        }),
      })
    })
  })

  test('should call updatePlatformSettings mutation when saving general/system settings', async () => {
    mockUpdatePlatformSettings.mockResolvedValue({
      success: true,
      settings: {
        maintenance_mode: true,
        allow_signups: false,
      },
    })

    render(<AdminSettingsPage />)

    // Navigate to General tab
    const generalTab = screen.getByRole('tab', { name: /general/i })
    fireEvent.click(generalTab)

    // Toggle maintenance mode
    const maintenanceToggle = screen.getByLabelText(/maintenance mode/i)
    fireEvent.click(maintenanceToggle)

    // Toggle signups
    const signupsToggle = screen.getByLabelText(/allow signups|registration enabled/i)
    fireEvent.click(signupsToggle)

    // Save settings
    const saveButton = screen.getByText(/save.*general|save.*system/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdatePlatformSettings).toHaveBeenCalledWith({
        clerkId: 'admin-clerk-id',
        settings: expect.objectContaining({
          maintenance_mode: true,
          allow_signups: false,
        }),
      })
    })
  })

  test('should NOT use setTimeout fake implementation', async () => {
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    mockUpdatePlatformSettings.mockResolvedValue({ success: true, settings: {} })

    render(<AdminSettingsPage />)

    const aiTab = screen.getByRole('tab', { name: /ai/i })
    fireEvent.click(aiTab)

    const saveButton = screen.getByText(/save.*ai/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdatePlatformSettings).toHaveBeenCalled()
    })

    // Verify setTimeout was not used for fake delay
    expect(setTimeoutSpy).not.toHaveBeenCalledWith(expect.any(Function), 1000)

    setTimeoutSpy.mockRestore()
  })

  test('should load existing settings from database', () => {
    mockUseQuery.mockReturnValue({
      openai_model: 'gpt-4-turbo',
      openai_temperature: 0.9,
      openai_max_tokens: 8000,
      maintenance_mode: true,
      allow_signups: false,
      default_user_role: 'user',
    })

    render(<AdminSettingsPage />)

    // Verify loaded values are displayed
    const aiTab = screen.getByRole('tab', { name: /ai/i })
    fireEvent.click(aiTab)

    const modelSelect = screen.getByDisplayValue(/gpt-4-turbo/i)
    expect(modelSelect).toBeInTheDocument()
  })

  test('should only allow admin and super_admin access', () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'regular-user-id',
        clerkId: 'regular-clerk-id',
        email: 'user@example.com',
        name: 'Regular User',
        role: 'user',
        subscription_plan: 'free',
        subscription_status: 'active',
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      isLoading: false,
      isSignedIn: true,
      signOut: jest.fn(),
      isAdmin: false,
    })

    render(<AdminSettingsPage />)

    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument()
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })

  test('should handle save errors gracefully', async () => {
    mockUpdatePlatformSettings.mockRejectedValue(new Error('Database error'))

    const { toast } = require('@/hooks/use-toast').useToast()

    render(<AdminSettingsPage />)

    const aiTab = screen.getByRole('tab', { name: /ai/i })
    fireEvent.click(aiTab)

    const saveButton = screen.getByText(/save.*ai/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Error',
          variant: 'destructive',
        })
      )
    })
  })
})
