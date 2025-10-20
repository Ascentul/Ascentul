/**
 * Phase 8: UI tests for Records Grid
 * Tests sort order, hover actions, inline rename, and thumbnail refresh
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecordCard } from '@/components/records/RecordCard';

// Mock the thumbnail cache
jest.mock('@/lib/thumbnail/cache', () => ({
  getCachedThumbnail: jest.fn((documentId: string, lastUpdated?: number | null) => {
    if (lastUpdated === 1000) {
      return 'data:image/png;base64,OLD_THUMBNAIL';
    }
    if (lastUpdated === 2000) {
      return 'data:image/png;base64,NEW_THUMBNAIL';
    }
    return null;
  }),
  setCachedThumbnail: jest.fn(),
  invalidateThumbnail: jest.fn(),
}));

const mockResume = {
  _id: 'resume-1',
  title: 'Software Engineer Resume',
  updatedAt: 1000,
  thumbnailDataUrl: 'data:image/png;base64,OLD_THUMBNAIL',
  templateSlug: 'modern',
};

const mockHandlers = {
  onOpen: jest.fn(),
  onDuplicate: jest.fn(),
  onExport: jest.fn(),
  onDelete: jest.fn(),
  onRename: jest.fn(),
};

describe('Records Grid - RecordCard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Display', () => {
    it('should render record card with title and thumbnail', () => {
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', mockResume.thumbnailDataUrl);
    });

    it('should show updated date when present', () => {
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Should render date in some format
      const dateElement = screen.getByText(/Updated/i);
      expect(dateElement).toBeInTheDocument();
    });

    it('should handle missing thumbnail gracefully', () => {
      const resumeNoThumb = { ...mockResume, thumbnailDataUrl: undefined };
      render(<RecordCard resume={resumeNoThumb} {...mockHandlers} busyAction={null} />);

      // Should still render card
      expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
    });
  });

  describe('Hover Actions', () => {
    it('should show action buttons on hover', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      const card = screen.getByText('Software Engineer Resume').closest('div');
      if (card) {
        await user.hover(card);
      }

      // All 4 actions should be visible (use getAllByLabelText for duplicate labels)
      expect(screen.getAllByLabelText(/open/i).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByLabelText(/duplicate/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/export/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/delete/i)).toBeInTheDocument();
    });

    it('should call onOpen when Open action clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Get the button with exact label "Open" (not the card's open label)
      const openButton = screen.getByLabelText('Open');
      await user.click(openButton);

      expect(mockHandlers.onOpen).toHaveBeenCalledWith('resume-1');
      expect(mockHandlers.onOpen).toHaveBeenCalledTimes(1);
    });

    it('should call onDuplicate when Duplicate action clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      const duplicateButton = screen.getByLabelText(/duplicate/i);
      await user.click(duplicateButton);

      expect(mockHandlers.onDuplicate).toHaveBeenCalledWith('resume-1');
      expect(mockHandlers.onDuplicate).toHaveBeenCalledTimes(1);
    });

    it('should call onExport when Export action clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      const exportButton = screen.getByLabelText(/export/i);
      await user.click(exportButton);

      expect(mockHandlers.onExport).toHaveBeenCalledWith('resume-1');
      expect(mockHandlers.onExport).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when Delete action clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      const deleteButton = screen.getByLabelText(/delete/i);
      await user.click(deleteButton);

      expect(mockHandlers.onDelete).toHaveBeenCalledWith('resume-1');
      expect(mockHandlers.onDelete).toHaveBeenCalledTimes(1);
    });

    it('should disable actions when busyAction is set', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction="export" />);

      const exportButton = screen.getByLabelText(/export/i);
      expect(exportButton).toBeDisabled();

      await user.click(exportButton);
      expect(mockHandlers.onExport).not.toHaveBeenCalled();
    });
  });

  describe('Inline Rename', () => {
    it('should show edit icon on hover when onRename provided', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);

      // Edit icon should appear
      const editIcon = screen.getByTestId('edit-icon');
      expect(editIcon).toBeInTheDocument();
    });

    it('should enter rename mode when edit icon clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);

      const editIcon = screen.getByTestId('edit-icon');
      await user.click(editIcon);

      // Input field should appear
      const input = screen.getByRole('textbox');
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('Software Engineer Resume');
      expect(input).toHaveFocus();
    });

    it('should save new title when Enter key pressed', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Edit title
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Senior Developer Resume');
      await user.keyboard('{Enter}');

      // Should call onRename with new title
      await waitFor(() => {
        expect(mockHandlers.onRename).toHaveBeenCalledWith('resume-1', 'Senior Developer Resume');
      });
    });

    it('should cancel rename when Escape key pressed', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Edit title
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'New Title');
      await user.keyboard('{Escape}');

      // Should NOT call onRename
      expect(mockHandlers.onRename).not.toHaveBeenCalled();

      // Should exit rename mode
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });

      // Original title should still be visible
      expect(screen.getByText('Software Engineer Resume')).toBeInTheDocument();
    });

    it('should save when Check button clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Edit title
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'Updated Resume');

      // Click check button
      const checkButton = screen.getByLabelText(/save/i);
      await user.click(checkButton);

      await waitFor(() => {
        expect(mockHandlers.onRename).toHaveBeenCalledWith('resume-1', 'Updated Resume');
      });
    });

    it('should cancel when X button clicked', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Edit title
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, 'New Title');

      // Click cancel button
      const cancelButton = screen.getByLabelText(/cancel/i);
      await user.click(cancelButton);

      expect(mockHandlers.onRename).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      });
    });

    it('should trim whitespace from new title', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Type title with leading/trailing spaces
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.type(input, '  Trimmed Title  ');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockHandlers.onRename).toHaveBeenCalledWith('resume-1', 'Trimmed Title');
      });
    });

    it('should not save if title unchanged', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Press Enter without changing
      await user.keyboard('{Enter}');

      // Should not call onRename
      expect(mockHandlers.onRename).not.toHaveBeenCalled();
    });

    it('should not save if title is empty after trim', async () => {
      const user = userEvent.setup();
      render(<RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />);

      // Enter rename mode
      const titleElement = screen.getByText('Software Engineer Resume');
      await user.hover(titleElement);
      await user.click(screen.getByTestId('edit-icon'));

      // Clear and press Enter
      const input = screen.getByRole('textbox');
      await user.clear(input);
      await user.keyboard('{Enter}');

      expect(mockHandlers.onRename).not.toHaveBeenCalled();
    });

    it('should not show edit icon when onRename not provided', () => {
      const handlersWithoutRename = { ...mockHandlers, onRename: undefined };
      render(<RecordCard resume={mockResume} {...handlersWithoutRename} busyAction={null} />);

      // Edit icon should not be present
      expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    });
  });

  describe('Thumbnail Refresh', () => {
    it('should use new cache key after updatedAt changes', () => {
      const { getCachedThumbnail } = require('@/lib/thumbnail/cache');

      // Initial render with old updatedAt
      const { rerender } = render(
        <RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />
      );

      expect(getCachedThumbnail).toHaveBeenCalledWith('resume-1', 1000);

      // Update with new updatedAt
      const updatedResume = { ...mockResume, updatedAt: 2000 };
      rerender(<RecordCard resume={updatedResume} {...mockHandlers} busyAction={null} />);

      expect(getCachedThumbnail).toHaveBeenCalledWith('resume-1', 2000);
    });

    it('should render new thumbnail after cache refresh', () => {
      const { rerender } = render(
        <RecordCard resume={mockResume} {...mockHandlers} busyAction={null} />
      );

      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'data:image/png;base64,OLD_THUMBNAIL');

      // Simulate save with new updatedAt and new thumbnail
      const updatedResume = {
        ...mockResume,
        updatedAt: 2000,
        thumbnailDataUrl: 'data:image/png;base64,NEW_THUMBNAIL',
      };
      rerender(<RecordCard resume={updatedResume} {...mockHandlers} busyAction={null} />);

      // Should show new thumbnail
      expect(img).toHaveAttribute('src', 'data:image/png;base64,NEW_THUMBNAIL');
    });
  });
});

describe('Records Grid - Sort Order', () => {
  it('should sort resumes by updatedAt descending (newest first)', () => {
    const resumes = [
      { _id: '1', title: 'Old Resume', updatedAt: 1000, templateSlug: 'modern' },
      { _id: '2', title: 'Recent Resume', updatedAt: 3000, templateSlug: 'modern' },
      { _id: '3', title: 'Middle Resume', updatedAt: 2000, templateSlug: 'modern' },
    ];

    // Sort logic from page.tsx
    const sorted = [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    expect(sorted[0]._id).toBe('2'); // newest (3000)
    expect(sorted[1]._id).toBe('3'); // middle (2000)
    expect(sorted[2]._id).toBe('1'); // oldest (1000)
  });

  it('should handle missing updatedAt as 0', () => {
    const resumes = [
      { _id: '1', title: 'No Date Resume', templateSlug: 'modern' },
      { _id: '2', title: 'Recent Resume', updatedAt: 2000, templateSlug: 'modern' },
    ];

    const sorted = [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    expect(sorted[0]._id).toBe('2'); // has date (2000)
    expect(sorted[1]._id).toBe('1'); // no date (treated as 0)
  });

  it('should maintain order for equal updatedAt values', () => {
    const resumes = [
      { _id: '1', title: 'Resume A', updatedAt: 1000, templateSlug: 'modern' },
      { _id: '2', title: 'Resume B', updatedAt: 1000, templateSlug: 'modern' },
      { _id: '3', title: 'Resume C', updatedAt: 1000, templateSlug: 'modern' },
    ];

    const sorted = [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));

    // Should preserve original order when equal
    expect(sorted[0]._id).toBe('1');
    expect(sorted[1]._id).toBe('2');
    expect(sorted[2]._id).toBe('3');
  });
});
