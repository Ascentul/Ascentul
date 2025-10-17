import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BlockSuggestions } from '@/app/(studio)/resume/components/BlockSuggestions';
import type { ContentSuggestion } from '@/lib/ai/suggestions';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

/**
 * Helper function for consistent and safe button selection across tests
 * @param index - The index of the dismiss button to select (default: 0)
 * @returns The dismiss button element at the specified index
 * @throws Error if the dismiss button at the specified index does not exist
 */
const getDismissButton = (index: number = 0): HTMLElement => {
  const dismissButtons = screen.getAllByTestId('dismiss-button');
  if (index >= dismissButtons.length) {
    throw new Error(`Dismiss button at index ${index} not found. Only ${dismissButtons.length} button(s) available.`);
  }
  return dismissButtons[index];
};

describe('BlockSuggestions Component', () => {
  const mockSuggestions: ContentSuggestion[] = [
    {
      id: 'test-1',
      type: 'verb',
      priority: 'high',
      message: 'Strengthen action verb',
      detail: 'Replace "helped" with a stronger verb',
    },
    {
      id: 'test-2',
      type: 'metrics',
      priority: 'high',
      message: 'Add quantifiable metrics',
      detail: 'Include numbers or percentages',
    },
    {
      id: 'test-3',
      type: 'length',
      priority: 'medium',
      message: 'Bullet point too short',
      detail: 'Add more detail about your impact',
    },
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('Rendering', () => {
    it('should render all suggestions in full mode', () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={false}
        />
      );

      expect(screen.getByText('Strengthen action verb')).toBeInTheDocument();
      expect(screen.getByText('Add quantifiable metrics')).toBeInTheDocument();
      expect(screen.getByText('Bullet point too short')).toBeInTheDocument();
    });

    it('should render suggestion count in compact mode', () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={true}
        />
      );

      // Should show count badge with specific test ID
      expect(screen.getByTestId('suggestion-count')).toHaveTextContent('3');
    });

    it('should not render if no suggestions provided', () => {
      const { container } = render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[]}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show priority badges', () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={false}
        />
      );

      const highPriorityElements = screen.getAllByText('high');
      const mediumPriorityElements = screen.getAllByText('medium');

      expect(highPriorityElements.length).toBe(2);
      expect(mediumPriorityElements.length).toBe(1);
    });
  });

  describe('Dismissing Suggestions', () => {
    it('should allow dismissing individual suggestions', async () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={false}
        />
      );

      // Find and click the first dismiss button
      const dismissButton = getDismissButton(0);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        // The first suggestion should be removed from the DOM
        expect(screen.queryByText('Strengthen action verb')).not.toBeInTheDocument();
      });

      // Other suggestions should still be visible
      expect(screen.getByText('Add quantifiable metrics')).toBeInTheDocument();
      expect(screen.getByText('Bullet point too short')).toBeInTheDocument();
    });

    it('should persist dismissed suggestions to localStorage', async () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={false}
        />
      );

      const dismissButton = getDismissButton(0);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        const stored = localStorage.getItem('resume-dismissed-suggestions');
        expect(stored).toBeTruthy();

        if (stored) {
          const parsed = JSON.parse(stored);
          expect(parsed['test-block']).toContain('test-1');
        }
      });
    });

    it('should call onDismiss callback when provided', async () => {
      const mockOnDismiss = jest.fn();

      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          onDismiss={mockOnDismiss}
          compact={false}
        />
      );

      const dismissButton = getDismissButton(0);
      fireEvent.click(dismissButton);

      await waitFor(() => {
        expect(mockOnDismiss).toHaveBeenCalledWith('test-1');
      });
    });
  });

  describe('localStorage Integration', () => {
    it('should load previously dismissed suggestions from localStorage', () => {
      // Pre-populate localStorage
      localStorage.setItem(
        'resume-dismissed-suggestions',
        JSON.stringify({
          'test-block': ['test-1', 'test-2'],
        })
      );

      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={false}
        />
      );

      // First two suggestions should not appear
      expect(screen.queryByText('Strengthen action verb')).not.toBeInTheDocument();
      expect(screen.queryByText('Add quantifiable metrics')).not.toBeInTheDocument();

      // Third suggestion should still be visible
      expect(screen.getByText('Bullet point too short')).toBeInTheDocument();
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('resume-dismissed-suggestions', 'invalid-json');

      const { container } = render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={mockSuggestions}
          compact={false}
        />
      );

      // Should still render without crashing
      expect(container).toBeTruthy();
      expect(screen.getByText('Strengthen action verb')).toBeInTheDocument();
    });
  });

  describe('Different Priority Levels', () => {
    it('should render high priority suggestions with red styling', () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[mockSuggestions[0]]}
          compact={false}
        />
      );

      const priorityBadge = screen.getByText('high');
      expect(priorityBadge).toHaveClass('text-red-700');
    });

    it('should render medium priority suggestions with yellow styling', () => {
      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[mockSuggestions[2]]}
          compact={false}
        />
      );

      const priorityBadge = screen.getByText('medium');
      expect(priorityBadge).toHaveClass('text-yellow-700');
    });

    it('should render low priority suggestions with blue styling', () => {
      const lowPrioritySuggestion: ContentSuggestion = {
        id: 'test-low',
        type: 'clarity',
        priority: 'low',
        message: 'Low priority tip',
        detail: 'This is optional',
      };

      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[lowPrioritySuggestion]}
          compact={false}
        />
      );

      const priorityBadge = screen.getByText('low');
      expect(priorityBadge).toHaveClass('text-blue-700');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty blockId', () => {
      const { container } = render(
        <BlockSuggestions
          blockId=""
          suggestions={mockSuggestions}
        />
      );

      // Should render without crashing
      expect(container).toBeTruthy();
    });

    it('should handle suggestions without detail', () => {
      const suggestionsWithoutDetail: ContentSuggestion[] = [
        {
          id: 'test-no-detail',
          type: 'verb',
          priority: 'high',
          message: 'Strengthen action verb',
        },
      ];

      render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={suggestionsWithoutDetail}
          compact={false}
        />
      );

      expect(screen.getByText('Strengthen action verb')).toBeInTheDocument();
    });

    it('should update when suggestions prop changes', () => {
      const { rerender } = render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[mockSuggestions[0]]}
          compact={false}
        />
      );

      expect(screen.getByText('Strengthen action verb')).toBeInTheDocument();

      rerender(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[mockSuggestions[1]]}
          compact={false}
        />
      );

      expect(screen.queryByText('Strengthen action verb')).not.toBeInTheDocument();
      expect(screen.getByText('Add quantifiable metrics')).toBeInTheDocument();
    });

    it('should not render when all suggestions are dismissed', async () => {
      const { container } = render(
        <BlockSuggestions
          blockId="test-block"
          suggestions={[mockSuggestions[0]]}
          compact={false}
        />
      );

      // Verify suggestion is initially rendered
      expect(screen.getByText('Strengthen action verb')).toBeInTheDocument();

      // Dismiss the only suggestion
      const dismissButton = getDismissButton(0);
      fireEvent.click(dismissButton);

      // Component should not render when all suggestions are dismissed
      await waitFor(() => {
        expect(container.firstChild).toBeNull();
      });
    });
  });
});
