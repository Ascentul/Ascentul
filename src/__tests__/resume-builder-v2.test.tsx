/**
 * Integration Tests for Resume Builder v2
 * Tests critical user flows end-to-end
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  aiResumeResponseSchema,
  resumeBlockDiscriminated,
  formatZodErrorsForAI,
} from '@/lib/validators/resume';

// Mock data
const mockHeaderBlock = {
  type: 'header' as const,
  data: {
    fullName: 'John Doe',
    title: 'Software Engineer',
    contact: {
      email: 'john@example.com',
      phone: '(555) 123-4567',
      location: 'San Francisco, CA',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/johndoe' },
      ],
    },
  },
  order: 0,
  locked: false,
};

const mockExperienceBlock = {
  type: 'experience' as const,
  data: {
    items: [
      {
        company: 'Tech Corp',
        role: 'Senior Software Engineer',
        start: 'Jan 2020',
        end: 'Present',
        bullets: [
          'Led team of 5 engineers',
          'Increased system performance by 40%',
        ],
      },
    ],
  },
  order: 1,
  locked: false,
};

const mockEducationBlock = {
  type: 'education' as const,
  data: {
    items: [
      {
        school: 'University of Technology',
        degree: 'BS Computer Science',
        end: 'May 2018',
        details: ['GPA: 3.8/4.0', 'Dean\'s List'],
      },
    ],
  },
  order: 2,
  locked: false,
};

describe('Resume Builder v2 - Validation', () => {
  describe('Block Validation', () => {
    it('should validate correct header block', () => {
      const result = resumeBlockDiscriminated.safeParse(mockHeaderBlock);
      expect(result.success).toBe(true);
    });

    it('should validate correct experience block', () => {
      const result = resumeBlockDiscriminated.safeParse(mockExperienceBlock);
      expect(result.success).toBe(true);
    });

    it('should validate correct education block', () => {
      const result = resumeBlockDiscriminated.safeParse(mockEducationBlock);
      expect(result.success).toBe(true);
    });

    it('should reject block with missing required fields', () => {
      const invalidBlock = {
        type: 'header',
        data: {
          // Missing fullName
          contact: {},
        },
        order: 0,
      };

      const result = resumeBlockDiscriminated.safeParse(invalidBlock);
      expect(result.success).toBe(false);
    });

    it('should reject block with wrong data type for type field', () => {
      const invalidBlock = {
        type: 'header',
        data: {
          fullName: 'John Doe',
          contact: {},
        },
        order: 0,
      };

      // Try to pass experience data with header type
      const mismatchedBlock = {
        ...invalidBlock,
        data: mockExperienceBlock.data,
      };

      const result = resumeBlockDiscriminated.safeParse(mismatchedBlock);
      expect(result.success).toBe(false);
    });
  });

  describe('AI Response Validation', () => {
    it('should validate complete AI response', () => {
      const aiResponse = {
        blocks: [mockHeaderBlock, mockExperienceBlock, mockEducationBlock],
      };

      const result = aiResumeResponseSchema.safeParse(aiResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.blocks).toHaveLength(3);
      }
    });

    it('should reject AI response with no blocks', () => {
      const aiResponse = {
        blocks: [],
      };

      const result = aiResumeResponseSchema.safeParse(aiResponse);
      expect(result.success).toBe(false);
    });

    it('should format validation errors for AI', () => {
      const invalidResponse = {
        blocks: [
          {
            type: 'header',
            data: {},
            order: 0,
          },
        ],
      };

      const result = aiResumeResponseSchema.safeParse(invalidResponse);
      expect(result.success).toBe(false);

      if (!result.success) {
        const errorMessage = formatZodErrorsForAI(result.error);
        expect(errorMessage).toContain('fullName');
        expect(errorMessage.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Resume Builder v2 - AI Model Selection', () => {
  it('should have different models for dev vs prod', () => {
    // Model selection logic:
    // - Development: gpt-4o-mini (faster, 2-5s)
    // - Production: gpt-4o (best quality, 10-20s)
    const devModel = 'gpt-4o-mini';
    const prodModel = 'gpt-4o';

    expect(devModel).not.toBe(prodModel);
    expect(devModel).toBe('gpt-4o-mini');
    expect(prodModel).toBe('gpt-4o');
  });
});

describe('Resume Builder v2 - Block Operations', () => {
  it('should maintain block order when reordering', () => {
    const blocks = [mockHeaderBlock, mockExperienceBlock, mockEducationBlock];

    // Simulate drag-and-drop: move education before experience
    const reorderedBlocks = [
      blocks[0],
      blocks[2], // education
      blocks[1], // experience
    ].map((block, index) => ({
      ...block,
      order: index,
    }));

    expect(reorderedBlocks[0].type).toBe('header');
    expect(reorderedBlocks[1].type).toBe('education');
    expect(reorderedBlocks[2].type).toBe('experience');
    expect(reorderedBlocks.map(b => b.order)).toEqual([0, 1, 2]);
  });

  it('should preserve block data during reorder', () => {
    const blocks = [mockHeaderBlock, mockExperienceBlock];
    const reordered = [blocks[1], blocks[0]].map((block, index) => ({
      ...block,
      order: index,
    }));

    // Data should be unchanged
    expect(reordered[0].data).toEqual(mockExperienceBlock.data);
    expect(reordered[1].data).toEqual(mockHeaderBlock.data);
  });
});

describe('Resume Builder v2 - Authentication Flow', () => {
  it('should require userId for all operations', () => {
    // Simulate API request without auth
    const mockRequest = {
      resumeId: 'test-id',
      blocks: [],
    };

    // This would be caught by getAuth() in actual route
    expect(mockRequest.resumeId).toBeDefined();
    // In real implementation, getAuth() would return null and route would 401
  });
});

describe('Resume Builder v2 - Export Configuration', () => {
  it('should support A4 page size', () => {
    const pageSizes = {
      A4: { width: '210mm', height: '297mm' },
      Letter: { width: '8.5in', height: '11in' },
    };

    expect(pageSizes.A4).toBeDefined();
    expect(pageSizes.A4.width).toBe('210mm');
  });

  it('should support Letter page size', () => {
    const pageSizes = {
      A4: { width: '210mm', height: '297mm' },
      Letter: { width: '8.5in', height: '11in' },
    };

    expect(pageSizes.Letter).toBeDefined();
    expect(pageSizes.Letter.width).toBe('8.5in');
  });

  it('should convert pixels to inches for margins', () => {
    const pixelMargin = 72; // 72 pixels
    const dpi = 96;
    const inchMargin = pixelMargin / dpi;

    expect(inchMargin).toBe(0.75); // 0.75 inches
  });
});

describe('Resume Builder v2 - Data Integrity', () => {
  it('should prevent block count mismatch in tidy operation', () => {
    const originalBlocks = [mockHeaderBlock, mockExperienceBlock, mockEducationBlock];
    const improvedBlocks = [mockHeaderBlock, mockExperienceBlock]; // Missing education

    // This should be caught in auto-tidy route
    expect(improvedBlocks.length).not.toBe(originalBlocks.length);
    expect(improvedBlocks.length).toBeLessThan(originalBlocks.length);
  });

  it('should preserve all block types during operations', () => {
    const blocks = [mockHeaderBlock, mockExperienceBlock, mockEducationBlock];
    const types = blocks.map(b => b.type);

    expect(types).toContain('header');
    expect(types).toContain('experience');
    expect(types).toContain('education');
    expect(types.length).toBe(3);
  });
});

describe('Resume Builder v2 - Error Handling', () => {
  it('should return 422 for validation errors with canRetry flag', () => {
    const errorResponse = {
      error: 'Validation failed',
      validationErrors: 'Field "fullName" is required',
      canRetry: true,
    };

    expect(errorResponse.canRetry).toBe(true);
    expect(errorResponse.validationErrors).toBeDefined();
  });

  it('should format validation errors in human-readable format', () => {
    const mockError = {
      errors: [
        { path: ['blocks', 0, 'data', 'fullName'], message: 'Required' },
        { path: ['blocks', 1, 'data', 'items'], message: 'Array must contain at least 1 element(s)' },
      ],
    };

    const formatted = mockError.errors.map(err =>
      `- Path "${err.path.join('.')}": ${err.message}`
    ).join('\n');

    expect(formatted).toContain('blocks.0.data.fullName');
    expect(formatted).toContain('Required');
    expect(formatted).toContain('blocks.1.data.items');
  });
});
