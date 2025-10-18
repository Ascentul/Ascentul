import { validateResumeDocument, assertValidResumeDocument } from '@/lib/validate-resume-document';
import type { Page } from '@/types/resume';
import type { Block } from '@/lib/resume-types';

describe('validateResumeDocument', () => {
  it('validates a correct document with no errors', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1', 'block-2'],
      },
    };

    const blocks: Record<string, Block> = {
      'block-1': {
        _id: 'block-1' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'header',
        data: { fullName: 'John Doe' },
        order: 0,
        locked: false,
      },
      'block-2': {
        _id: 'block-2' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'summary',
        data: { paragraph: 'Summary' },
        order: 1,
        locked: false,
      },
    };

    const result = validateResumeDocument(pages, blocks);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });

  it('detects missing blocks referenced by pages', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1', 'block-missing'],
      },
    };

    const blocks: Record<string, Block> = {
      'block-1': {
        _id: 'block-1' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'header',
        data: { fullName: 'John Doe' },
        order: 0,
        locked: false,
      },
    };

    const result = validateResumeDocument(pages, blocks);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('missing_block');
    expect(result.errors[0].pageId).toBe('page-1');
    expect(result.errors[0].blockId).toBe('block-missing');
    expect(result.errors[0].message).toContain('non-existent block');
  });

  it('detects orphaned blocks not referenced by any page', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1'],
      },
    };

    const blocks: Record<string, Block> = {
      'block-1': {
        _id: 'block-1' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'header',
        data: { fullName: 'John Doe' },
        order: 0,
        locked: false,
      },
      'block-orphan': {
        _id: 'block-orphan' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'summary',
        data: { paragraph: 'Orphaned' },
        order: 1,
        locked: false,
      },
    };

    const result = validateResumeDocument(pages, blocks);

    expect(result.valid).toBe(true); // Orphans are warnings, not errors
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].type).toBe('orphaned_block');
    expect(result.warnings[0].blockId).toBe('block-orphan');
    expect(result.warnings[0].message).toContain('not referenced by any page');
  });

  it('detects duplicate block references across pages', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1'],
      },
      'page-2': {
        id: 'page-2',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1'],
      },
    };

    const blocks: Record<string, Block> = {
      'block-1': {
        _id: 'block-1' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'header',
        data: { fullName: 'John Doe' },
        order: 0,
        locked: false,
      },
    };

    const result = validateResumeDocument(pages, blocks);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].type).toBe('duplicate_reference');
    expect(result.errors[0].blockId).toBe('block-1');
    expect(result.errors[0].message).toContain('referenced by 2 pages');
  });

  it('detects multiple errors and warnings simultaneously', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1', 'block-missing'],
      },
      'page-2': {
        id: 'page-2',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1'],
      },
    };

    const blocks: Record<string, Block> = {
      'block-1': {
        _id: 'block-1' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'header',
        data: { fullName: 'John Doe' },
        order: 0,
        locked: false,
      },
      'block-orphan': {
        _id: 'block-orphan' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'summary',
        data: { paragraph: 'Orphaned' },
        order: 1,
        locked: false,
      },
    };

    const result = validateResumeDocument(pages, blocks);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(2); // missing block + duplicate reference
    expect(result.warnings).toHaveLength(1); // orphaned block

    const errorTypes = result.errors.map((e) => e.type);
    expect(errorTypes).toContain('missing_block');
    expect(errorTypes).toContain('duplicate_reference');

    expect(result.warnings[0].type).toBe('orphaned_block');
  });
});

describe('assertValidResumeDocument', () => {
  it('does not throw for valid document', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-1'],
      },
    };

    const blocks: Record<string, Block> = {
      'block-1': {
        _id: 'block-1' as Block['_id'],
        resumeId: 'resume-1' as Block['resumeId'],
        type: 'header',
        data: { fullName: 'John Doe' },
        order: 0,
        locked: false,
      },
    };

    expect(() => assertValidResumeDocument(pages, blocks)).not.toThrow();
  });

  it('throws for invalid document with detailed error message', () => {
    const pages: Record<string, Page> = {
      'page-1': {
        id: 'page-1',
        size: 'Letter',
        margins: { top: 0.75, right: 0.75, bottom: 0.75, left: 0.75 },
        blocks: ['block-missing'],
      },
    };

    const blocks: Record<string, Block> = {};

    // Capture error once for multiple assertions
    let error: Error | undefined;
    try {
      assertValidResumeDocument(pages, blocks);
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    expect(error?.message).toMatch(/Resume document validation failed/);
    expect(error?.message).toMatch(/non-existent block/);
  });
});
