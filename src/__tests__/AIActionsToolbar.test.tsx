import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIActionsToolbar } from '@/app/(studio)/resume/components/AIActionsToolbar';
import type { ResumeBlock } from '@/lib/validators/resume';

// Mock fetch globally
global.fetch = jest.fn();

const mockResumeId = 'test-resume-id' as any;

const mockBlocks: ResumeBlock[] = [
  {
    type: 'header',
    order: 0,
    data: {
      fullName: 'John Doe',
      title: 'Software Engineer',
      contact: {
        email: 'john@example.com',
      },
    },
  },
  {
    type: 'experience',
    order: 1,
    data: {
      items: [
        {
          title: 'Engineer',
          company: 'Tech Corp',
          startDate: 'Jan 2023',
          endDate: 'Present',
          bullets: ['Developed features'],
        },
      ],
    },
  },
];

describe('AIActionsToolbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the AI Actions button', () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
        />
      );

      expect(screen.getByText('AI Actions')).toBeInTheDocument();
    });

    it('should show dropdown menu when clicked', async () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
        />
      );

      const button = screen.getByText('AI Actions');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Generate Content')).toBeInTheDocument();
        expect(screen.getByText('Tailor to Job')).toBeInTheDocument();
        expect(screen.getByText('Tidy & Improve')).toBeInTheDocument();
      });
    });

    it('should disable button when disabled prop is true', () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
          disabled={true}
        />
      );

      const button = screen.getByRole('button', { name: /AI Actions/i });
      expect(button).toBeDisabled();
    });
  });

  describe('Tidy Action', () => {
    it('should call tidy API when Tidy is clicked', async () => {
      const mockResponse = {
        ok: true,
        blocks: mockBlocks,
        count: 2,
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const onBlocksUpdate = jest.fn();
      const onSuccess = jest.fn();

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={onBlocksUpdate}
          onSuccess={onSuccess}
        />
      );

      // Open dropdown
      fireEvent.click(screen.getByText('AI Actions'));

      // Click Tidy action
      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/resume/tidy',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resumeId: mockResumeId,
              currentBlocks: mockBlocks,
            }),
          })
        );
      });

      await waitFor(() => {
        expect(onBlocksUpdate).toHaveBeenCalledWith(mockBlocks);
        expect(onSuccess).toHaveBeenCalledWith('Tidied 2 blocks successfully!');
      });
    });

    it('should show error when tidy fails', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'API Error' }),
      });

      const onError = jest.fn();

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('API Error');
      });
    });

    it('should show error when no blocks to tidy', async () => {
      const onError = jest.fn();

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={[]}
          onBlocksUpdate={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      expect(onError).toHaveBeenCalledWith('No blocks to tidy. Add some content first.');
    });

    it('should show loading state while tidying', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ blocks: mockBlocks, count: 2 }),
                }),
              100
            )
          )
      );

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      // Check for loading state
      await waitFor(() => {
        expect(screen.getByText(/tidy.../i)).toBeInTheDocument();
      });
    });
  });

  describe('Generate Action', () => {
    it('should open generate dialog when Generate is clicked', async () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const generateButton = screen.getByText('Generate Content');
        fireEvent.click(generateButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Generate Resume Content')).toBeInTheDocument();
      });
    });

    it('should not disable Generate when blocks are empty', async () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={[]}
          onBlocksUpdate={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const generateButton = screen.getByText('Generate Content');
        expect(generateButton.closest('button')).not.toBeDisabled();
      });
    });
  });

  describe('Tailor Action', () => {
    it('should open tailor dialog when Tailor is clicked', async () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tailorButton = screen.getByText('Tailor to Job');
        fireEvent.click(tailorButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Tailor Resume to Job')).toBeInTheDocument();
      });
    });

    it('should disable Tailor when blocks are empty', async () => {
      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={[]}
          onBlocksUpdate={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tailorButton = screen.getByText('Tailor to Job');
        // The menuitem should be disabled
        expect(tailorButton.closest('[role="menuitem"]')).toHaveAttribute('data-disabled', 'true');
      });
    });
  });

  describe('Loading States', () => {
    it('should disable all actions while one is loading', async () => {
      (global.fetch as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ blocks: mockBlocks, count: 2 }),
                }),
              100
            )
          )
      );

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      // Button should be disabled during loading
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /tidy.../i });
        expect(button).toBeDisabled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const onError = jest.fn();

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={jest.fn()}
          onError={onError}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error');
      });
    });

    it('should handle malformed API responses', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ unexpected: 'format' }),
      });

      const onBlocksUpdate = jest.fn();
      const onError = jest.fn();

      render(
        <AIActionsToolbar
          resumeId={mockResumeId}
          currentBlocks={mockBlocks}
          onBlocksUpdate={onBlocksUpdate}
          onError={onError}
        />
      );

      fireEvent.click(screen.getByText('AI Actions'));

      await waitFor(() => {
        const tidyButton = screen.getByText('Tidy & Improve');
        fireEvent.click(tidyButton);
      });

      await waitFor(() => {
        // Should not call onBlocksUpdate with invalid data
        expect(onBlocksUpdate).not.toHaveBeenCalled();
        // Should call onError to notify user of the problem
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('Invalid response'));
      });
    });
  });
});
