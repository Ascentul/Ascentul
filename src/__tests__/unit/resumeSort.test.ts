/**
 * Unit tests for resume sorting utility
 *
 * Tests the actual sortResumesByUpdatedAt function used in the Records Grid
 */

import { describe, it, expect } from '@jest/globals';
import { sortResumesByUpdatedAt } from '@/lib/sorting/resumeSort';
import type { SortableResume } from '@/lib/sorting/resumeSort';

describe('sortResumesByUpdatedAt', () => {
  describe('Basic Sorting', () => {
    it('should sort resumes by updatedAt descending (newest first)', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: 1000 },
        { _id: '2', updatedAt: 3000 },
        { _id: '3', updatedAt: 2000 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('2'); // newest (3000)
      expect(sorted[1]._id).toBe('3'); // middle (2000)
      expect(sorted[2]._id).toBe('1'); // oldest (1000)
    });

    it('should not mutate the original array', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: 1000 },
        { _id: '2', updatedAt: 3000 },
      ];

      const original = [...resumes];
      sortResumesByUpdatedAt(resumes);

      expect(resumes).toEqual(original);
    });

    it('should handle empty array', () => {
      const sorted = sortResumesByUpdatedAt([]);

      expect(sorted).toEqual([]);
    });

    it('should handle single element array', () => {
      const resumes: SortableResume[] = [{ _id: '1', updatedAt: 1000 }];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted).toEqual(resumes);
      expect(sorted).not.toBe(resumes); // New array
    });
  });

  describe('Missing updatedAt Handling', () => {
    it('should treat missing updatedAt as 0 (placed at end)', () => {
      const resumes: SortableResume[] = [
        { _id: '1' }, // no updatedAt
        { _id: '2', updatedAt: 2000 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('2'); // has date (2000)
      expect(sorted[1]._id).toBe('1'); // no date (treated as 0)
    });

    it('should handle all missing updatedAt values', () => {
      const resumes: SortableResume[] = [
        { _id: '1' },
        { _id: '2' },
        { _id: '3' },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      // With all equal (0), stable sort preserves original order
      expect(sorted[0]._id).toBe('1');
      expect(sorted[1]._id).toBe('2');
      expect(sorted[2]._id).toBe('3');
    });

    it('should handle mix of missing and present updatedAt', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: 1000 },
        { _id: '2' },
        { _id: '3', updatedAt: 3000 },
        { _id: '4' },
        { _id: '5', updatedAt: 2000 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('3'); // 3000
      expect(sorted[1]._id).toBe('5'); // 2000
      expect(sorted[2]._id).toBe('1'); // 1000
      // Missing values at end (stable sort preserves order)
      expect(sorted[3]._id).toBe('2');
      expect(sorted[4]._id).toBe('4');
    });
  });

  describe('Equal Timestamps (Stable Sort)', () => {
    it('should maintain original order for equal updatedAt values', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: 1000 },
        { _id: '2', updatedAt: 1000 },
        { _id: '3', updatedAt: 1000 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      // JavaScript's Array.sort is stable (ES2019+)
      // Equal values preserve original order
      expect(sorted[0]._id).toBe('1');
      expect(sorted[1]._id).toBe('2');
      expect(sorted[2]._id).toBe('3');
    });

    it('should handle groups of equal timestamps', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: 2000 },
        { _id: '2', updatedAt: 3000 },
        { _id: '3', updatedAt: 2000 },
        { _id: '4', updatedAt: 3000 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      // 3000 group first (stable order: 2, 4)
      expect(sorted[0]._id).toBe('2');
      expect(sorted[1]._id).toBe('4');
      // 2000 group second (stable order: 1, 3)
      expect(sorted[2]._id).toBe('1');
      expect(sorted[3]._id).toBe('3');
    });
  });

  describe('Generic Type Handling', () => {
    it('should preserve additional properties', () => {
      const resumes = [
        { _id: '1', updatedAt: 1000, title: 'Resume 1', templateSlug: 'modern' },
        { _id: '2', updatedAt: 2000, title: 'Resume 2', templateSlug: 'classic' },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]).toEqual({
        _id: '2',
        updatedAt: 2000,
        title: 'Resume 2',
        templateSlug: 'classic',
      });
      expect(sorted[1]).toEqual({
        _id: '1',
        updatedAt: 1000,
        title: 'Resume 1',
        templateSlug: 'modern',
      });
    });

    it('should work with complex resume objects', () => {
      const resumes = [
        {
          _id: '1',
          updatedAt: 1000,
          title: 'Old Resume',
          thumbnailDataUrl: 'data:image/png;base64,OLD',
          templateSlug: 'modern',
          metadata: { version: 1 },
        },
        {
          _id: '2',
          updatedAt: 2000,
          title: 'New Resume',
          thumbnailDataUrl: 'data:image/png;base64,NEW',
          templateSlug: 'classic',
          metadata: { version: 2 },
        },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('2');
      expect(sorted[0].title).toBe('New Resume');
      expect(sorted[0].metadata).toEqual({ version: 2 });
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large timestamps', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: Number.MAX_SAFE_INTEGER },
        { _id: '2', updatedAt: Number.MAX_SAFE_INTEGER - 1 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('1');
      expect(sorted[1]._id).toBe('2');
    });

    it('should handle zero timestamps', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: 0 },
        { _id: '2', updatedAt: 1000 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('2');
      expect(sorted[1]._id).toBe('1');
    });

    it('should handle negative timestamps (if they occur)', () => {
      const resumes: SortableResume[] = [
        { _id: '1', updatedAt: -1000 },
        { _id: '2', updatedAt: 1000 },
        { _id: '3', updatedAt: 0 },
      ];

      const sorted = sortResumesByUpdatedAt(resumes);

      expect(sorted[0]._id).toBe('2'); // 1000
      expect(sorted[1]._id).toBe('3'); // 0
      expect(sorted[2]._id).toBe('1'); // -1000
    });
  });
});
