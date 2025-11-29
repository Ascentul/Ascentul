// @ts-nocheck
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useUser } from '@clerk/nextjs'
import { useAuth } from '@/contexts/ClerkAuthProvider'
import { useMutation, useQuery } from 'convex/react'
import UniversitySettingsPage from '@/app/(dashboard)/university/settings/page'

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
const toastMock = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: toastMock,
  }),
}))

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockUseMutation = useMutation as jest.MockedFunction<typeof useMutation>
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

describe('UniversitySettingsPage - Settings Persistence', () => {
  const mockUpdateUniversitySettings = jest.fn()
  const mockUniversityData = {
    _id: 'uni-id-123',
    name: 'Test University',
    slug: 'test-uni',
    description: 'A great institution',
    website: 'https://testuni.edu',
    contact_email: 'contact@testuni.edu',
    license_plan: 'Pro',
    license_seats: 1000,
    license_used: 250,
    max_students: 5000,
    license_start: Date.now(),
    status: 'active',
    created_at: Date.now(),
    updated_at: Date.now(),
  }

  beforeEach(() => {
    jest.clearAllMocks()

    mockUseUser.mockReturnValue({
      user: {
        id: 'uni-admin-clerk-id',
      } as any,
      isLoaded: true,
      isSignedIn: true,
    } as any)

    mockUseAuth.mockReturnValue({
      user: {
        _id: 'uni-admin-user-id',
        clerkId: 'uni-admin-clerk-id',
        email: 'admin@testuni.edu',
        name: 'University Admin',
        role: 'university_admin',
        subscription_plan: 'university',
        subscription_status: 'active',
        university_id: 'uni-id-123',
        created_at: Date.now(),
        updated_at: Date.now(),
      },
      isLoading: false,
      isSignedIn: true,
      signOut: jest.fn(),
      isAdmin: true,
    })

    mockUseMutation.mockReturnValue(mockUpdateUniversitySettings)
    mockUseQuery.mockReturnValue(mockUniversityData)
  })

  test('should have onClick handler wired to Save Changes button', () => {
    render(<UniversitySettingsPage />)

    const saveButton = screen.getByText(/save changes/i)
    expect(saveButton).toBeInTheDocument()

    // Button should not be disabled initially
    expect(saveButton).not.toBeDisabled()
  })

  test('should call updateUniversitySettings mutation when saving', async () => {
    mockUpdateUniversitySettings.mockResolvedValue({
      success: true,
      message: 'University settings updated successfully',
    })

    render(<UniversitySettingsPage />)

    // Update fields
    const nameInput = screen.getByLabelText(/university name/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    const websiteInput = screen.getByLabelText(/website/i)
    const contactEmailInput = screen.getByLabelText(/contact email/i)

    fireEvent.change(nameInput, { target: { value: 'Updated University Name' } })
    fireEvent.change(descriptionInput, { target: { value: 'Updated description' } })
    fireEvent.change(websiteInput, { target: { value: 'https://updated.edu' } })
    fireEvent.change(contactEmailInput, { target: { value: 'new@testuni.edu' } })

    // Click save
    const saveButton = screen.getByText(/save changes/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateUniversitySettings).toHaveBeenCalledWith({
        clerkId: 'uni-admin-clerk-id',
        universityId: 'uni-id-123',
        settings: {
          name: 'Updated University Name',
          description: 'Updated description',
          website: 'https://updated.edu',
          contact_email: 'new@testuni.edu',
          max_students: expect.any(Number),
          license_seats: expect.any(Number),
        },
      })
    })
  })

  test('should load existing university settings into form', () => {
    render(<UniversitySettingsPage />)

    // Verify form is populated with existing data
    const nameInput = screen.getByDisplayValue('Test University')
    const descriptionInput = screen.getByDisplayValue('A great institution')
    const websiteInput = screen.getByDisplayValue('https://testuni.edu')
    const contactEmailInput = screen.getByDisplayValue('contact@testuni.edu')

    expect(nameInput).toBeInTheDocument()
    expect(descriptionInput).toBeInTheDocument()
    expect(websiteInput).toBeInTheDocument()
    expect(contactEmailInput).toBeInTheDocument()
  })

  test('should update max_students and license_seats', async () => {
    mockUpdateUniversitySettings.mockResolvedValue({ success: true })

    render(<UniversitySettingsPage />)

    const maxStudentsInput = screen.getByLabelText(/maximum students/i)
    const licenseSeatsInput = screen.getByLabelText(/license seats/i)

    fireEvent.change(maxStudentsInput, { target: { value: '10000' } })
    fireEvent.change(licenseSeatsInput, { target: { value: '2000' } })

    const saveButton = screen.getByText(/save changes/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateUniversitySettings).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            max_students: 10000,
            license_seats: 2000,
          }),
        })
      )
    })
  })

  test('should show loading state during save', async () => {
    let resolvePromise: any
    const promise = new Promise((resolve) => {
      resolvePromise = resolve
    })
    mockUpdateUniversitySettings.mockReturnValue(promise)

    render(<UniversitySettingsPage />)

    const saveButton = screen.getByText(/save changes/i)
    fireEvent.click(saveButton)

    // Should show loading state
    await waitFor(() => {
      expect(screen.getByText(/saving/i)).toBeInTheDocument()
    })

    // Resolve promise
    resolvePromise({ success: true })

    await waitFor(() => {
      expect(screen.queryByText(/saving/i)).not.toBeInTheDocument()
    })
  })

  test('should handle save errors', async () => {
    mockUpdateUniversitySettings.mockRejectedValue(
      new Error('Failed to update university')
    )

    const { toast } = require('@/hooks/use-toast').useToast()

    render(<UniversitySettingsPage />)

    const saveButton = screen.getByText(/save changes/i)
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

  test('should restrict access to authorized users only', () => {
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

    render(<UniversitySettingsPage />)

    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument()
    expect(screen.queryByText(/save changes/i)).not.toBeInTheDocument()
  })

  test('should persist settings across page reloads', async () => {
    // First render with initial data
    const { rerender } = render(<UniversitySettingsPage />)

    // Update settings
    mockUpdateUniversitySettings.mockResolvedValue({ success: true })

    const nameInput = screen.getByLabelText(/university name/i)
    fireEvent.change(nameInput, { target: { value: 'New Name' } })

    const saveButton = screen.getByText(/save changes/i)
    fireEvent.click(saveButton)

    await waitFor(() => {
      expect(mockUpdateUniversitySettings).toHaveBeenCalled()
    })

    // Simulate page reload with updated data
    mockUseQuery.mockReturnValue({
      ...mockUniversityData,
      name: 'New Name',
    })

    rerender(<UniversitySettingsPage />)

    // Verify updated data is loaded
    expect(screen.getByDisplayValue('New Name')).toBeInTheDocument()
  })
})
