import { describe, it, expect } from '@jest/globals';
import { getSuggestions, createTextDiff } from '@/features/resume/coach/suggestions';
import type { EditorSnapshot } from '@/features/resume/editor/types/editorTypes';

describe('Coach Suggestions - Phase 6', () => {
  const mockSnapshot: EditorSnapshot = {
    blocksById: {
      'summary-1': {
        id: 'summary-1',
        type: 'summary',
        parentId: 'page1',
        props: {
          paragraph: 'Experienced software engineer with very deep expertise in building really scalable systems. Responsible for managing teams and delivering projects on time.',
        },
      },
      'exp-1': {
        id: 'exp-1',
        type: 'experience',
        parentId: 'page1',
        props: {
          items: [
            {
              role: 'Senior Engineer',
              company: 'Tech Corp',
              start: '2020',
              end: 'Present',
              bullets: [
                'Helped improve system performance',
                'Led team of engineers to deliver projects',
                'Responsible for code reviews and mentoring junior developers',
              ],
            },
          ],
        },
      },
    },
    pagesById: {
      page1: {
        id: 'page1',
        size: 'Letter',
        margins: { top: 72, right: 72, bottom: 72, left: 72 },
        blockIds: ['summary-1', 'exp-1'],
      },
    },
    pageOrder: ['page1'],
    selectedIds: [],
    docMeta: {
      resumeId: 'resume1' as any,
      title: 'Test Resume',
      templateSlug: 'modern',
      updatedAt: Date.now(),
      lastSyncedAt: Date.now(),
      version: 1,
    },
    isDirty: false,
    lastChangedAt: Date.now(),
  };

  describe('getSuggestions', () => {
    it('should return at least 3 suggestions for typical resume', () => {
      const suggestions = getSuggestions(mockSnapshot);

      expect(suggestions.length).toBeGreaterThanOrEqual(3);
    });

    it('should include expected actionTypes', () => {
      const suggestions = getSuggestions(mockSnapshot);

      const actionTypes = suggestions.map(s => s.actionType);
      const expectedTypes: Array<import('@/features/resume/coach/suggestions').SuggestionActionType> = [
        'tighten-summary',
        'fix-passive-voice',
        'strengthen-verb',
        'add-metrics'
      ];

      // At least some expected types should be present
      const hasExpectedTypes = expectedTypes.some(type => actionTypes.includes(type));
      expect(hasExpectedTypes).toBe(true);
    });

    it('should suggest tightening long summary with filler words', () => {
      const suggestions = getSuggestions(mockSnapshot);

      const tightenSuggestion = suggestions.find(s => s.actionType === 'tighten-summary');
      expect(tightenSuggestion).toBeDefined();
      expect(tightenSuggestion!.blockId).toBe('summary-1');
    });

    it('should suggest fixing passive voice', () => {
      const suggestions = getSuggestions(mockSnapshot);

      const passiveSuggestion = suggestions.find(s => s.actionType === 'fix-passive-voice');
      expect(passiveSuggestion).toBeDefined();
    });

    it('should suggest strengthening weak verbs', () => {
      const suggestions = getSuggestions(mockSnapshot);

      const verbSuggestion = suggestions.find(s => s.actionType === 'strengthen-verb');
      expect(verbSuggestion).toBeDefined();
      expect(verbSuggestion!.reason).toContain('helped');
    });

    it('should suggest adding metrics to bullets without numbers', () => {
      const suggestions = getSuggestions(mockSnapshot);

      const metricsSuggestion = suggestions.find(s => s.actionType === 'add-metrics');
      expect(metricsSuggestion).toBeDefined();
    });

    it('should sort suggestions by severity (high first)', () => {
      const suggestions = getSuggestions(mockSnapshot);

      for (let i = 0; i < suggestions.length - 1; i++) {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        const current = severityOrder[suggestions[i].severity];
        const next = severityOrder[suggestions[i + 1].severity];
        expect(current).toBeLessThanOrEqual(next);
      }
    });

    it('should include preview function for each suggestion', () => {
      const suggestions = getSuggestions(mockSnapshot);

      for (const suggestion of suggestions) {
        expect(typeof suggestion.preview).toBe('function');

        // Test preview function
        const block = mockSnapshot.blocksById[suggestion.blockId];
        const parts = suggestion.targetPath.split('.');
        let current: any = block;
        for (const part of parts) {
          current = current?.[part];
        }

        if (current) {
          const diff = suggestion.preview(current);
          expect(diff).toBeDefined();
          expect(diff.before).toBeDefined();
          expect(diff.after).toBeDefined();
          expect(diff.changes).toBeDefined();
        }
      }
    });
  });

  describe('createTextDiff', () => {
    it('should create diff with add/remove/unchanged markers', () => {
      const before = 'Hello world';
      const after = 'Hello there world';

      const diff = createTextDiff(before, after);

      expect(diff.before).toBe(before);
      expect(diff.after).toBe(after);
      expect(Array.isArray(diff.changes)).toBe(true);
      expect(diff.changes.length).toBeGreaterThan(0);
    });

    it('should detect additions', () => {
      const before = 'Hello';
      const after = 'Hello world';

      const diff = createTextDiff(before, after);

      const hasAddition = diff.changes.some(c => c.type === 'add');
      expect(hasAddition).toBe(true);
    });

    it('should detect removals', () => {
      const before = 'Hello world';
      const after = 'Hello';

      const diff = createTextDiff(before, after);

      const hasRemoval = diff.changes.some(c => c.type === 'remove');
      expect(hasRemoval).toBe(true);
    });

    it('should handle identical strings', () => {
      const text = 'Hello world';
      const diff = createTextDiff(text, text);

      const allUnchanged = diff.changes.every(c => c.type === 'unchanged');
      expect(allUnchanged).toBe(true);
    });
  });

  describe('Suggestion targeting', () => {
    it('should target specific blockId', () => {
      const suggestions = getSuggestions(mockSnapshot);

      for (const suggestion of suggestions) {
        expect(suggestion.blockId).toBeDefined();
        expect(mockSnapshot.blocksById[suggestion.blockId]).toBeDefined();
      }
    });

    it('should target specific property path', () => {
      const suggestions = getSuggestions(mockSnapshot);

      for (const suggestion of suggestions) {
        expect(suggestion.targetPath).toBeDefined();
        expect(suggestion.targetPath).toMatch(/^props\./);
      }
    });

    it('should include unique suggestion IDs', () => {
      const suggestions = getSuggestions(mockSnapshot);

      const ids = suggestions.map(s => s.id);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });
  });
});
