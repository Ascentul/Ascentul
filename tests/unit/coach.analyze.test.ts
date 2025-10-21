import { describe, it, expect } from '@jest/globals';
import { analyzeDocument, ANALYSIS_THRESHOLDS } from '@/features/resume/coach/analyzeDocument';
import type { EditorSnapshot } from '@/features/resume/editor/types/editorTypes';

describe('Coach Analyzer - Phase 6', () => {
  const mockSnapshot: EditorSnapshot = {
    blocksById: {
      'summary-1': {
        id: 'summary-1',
        type: 'summary',
        parentId: 'page1',
        props: {
          paragraph: 'Experienced software engineer with a passion for building scalable systems. Responsible for managing teams and delivering projects.',
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
                'Led team of 5 engineers to deliver multiple projects',
                'Responsible for code reviews and mentoring',
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

  describe('analyzeDocument', () => {
    it('should return stable metrics for summary section', () => {
      const analysis = analyzeDocument(mockSnapshot);

      const summarySection = analysis.sections.find(s => s.blockType === 'summary');
      expect(summarySection).toBeDefined();
      expect(summarySection!.tokenCount).toBeGreaterThan(0);
      expect(summarySection!.sentenceCount).toBe(2);
      expect(summarySection!.readingTimeSeconds).toBeGreaterThan(0);
    });

    it('should return stable metrics for experience section', () => {
      const analysis = analyzeDocument(mockSnapshot);

      const expSection = analysis.sections.find(s => s.blockType === 'experience');
      expect(expSection).toBeDefined();
      expect(expSection!.tokenCount).toBeGreaterThan(0);
      expect(expSection!.sentenceCount).toBeGreaterThan(0);
    });

    it('should detect passive voice in summary', () => {
      const analysis = analyzeDocument(mockSnapshot);

      const summarySection = analysis.sections.find(s => s.blockType === 'summary');
      expect(summarySection).toBeDefined();
      expect(summarySection!.passiveVoiceCount).toBeGreaterThan(0);
      expect(summarySection!.passiveVoiceRatio).toBeGreaterThan(0);
    });

    it('should detect missing metrics in experience bullets', () => {
      const analysis = analyzeDocument(mockSnapshot);

      const expSection = analysis.sections.find(s => s.blockType === 'experience');
      expect(expSection).toBeDefined();
      // First bullet has no metrics
      expect(expSection!.missingMetricsCount).toBeGreaterThan(0);
      expect(expSection!.missingMetricsRatio).toBeGreaterThan(0);
    });

    it('should flag passive voice when ratio exceeds threshold', () => {
      const analysis = analyzeDocument(mockSnapshot);

      const summarySection = analysis.sections.find(s => s.blockType === 'summary');
      expect(summarySection).toBeDefined();

      const hasPassiveFlag = summarySection!.flags.some(f => f.type === 'passive-voice');
      if (summarySection!.passiveVoiceRatio > ANALYSIS_THRESHOLDS.passiveVoiceLimit) {
        expect(hasPassiveFlag).toBe(true);
      } else {
        expect(hasPassiveFlag).toBe(false);
      }
    });

    it('should flag missing metrics when ratio exceeds 50%', () => {
      const analysis = analyzeDocument(mockSnapshot);

      const expSection = analysis.sections.find(s => s.blockType === 'experience');
      expect(expSection).toBeDefined();

      const hasMetricsFlag = expSection!.flags.some(f => f.type === 'missing-metrics');
      if (expSection!.missingMetricsRatio > 0.5) {
        expect(hasMetricsFlag).toBe(true);
      } else {
        expect(hasMetricsFlag).toBe(false);
      }
    });

    it('should calculate total tokens across all sections', () => {
      const analysis = analyzeDocument(mockSnapshot);

      expect(analysis.totalTokens).toBeGreaterThan(0);
      expect(analysis.totalReadingTimeSeconds).toBeGreaterThan(0);

      // Total should be sum of section tokens
      const sumTokens = analysis.sections.reduce((sum, s) => sum + s.tokenCount, 0);
      expect(analysis.totalTokens).toBe(sumTokens);
    });

    it('should complete analysis in reasonable time', () => {
      const start = performance.now();
      analyzeDocument(mockSnapshot);
      const duration = performance.now() - start;

      // Use lenient threshold for CI stability (100ms)
      // In practice, this runs in ~2-5ms on modern hardware
      expect(duration).toBeLessThan(100);
    });
  });

  describe('Stable fixtures', () => {
    it('should return consistent results for same input', () => {
      const analysis1 = analyzeDocument(mockSnapshot);
      const analysis2 = analyzeDocument(mockSnapshot);

      expect(analysis1.totalTokens).toBe(analysis2.totalTokens);
      expect(analysis1.sections.length).toBe(analysis2.sections.length);
      expect(analysis1.sections[0].tokenCount).toBe(analysis2.sections[0].tokenCount);
    });

    it('should analyze summary with known characteristics', () => {
      const analysis = analyzeDocument(mockSnapshot);
      const summary = analysis.sections.find(s => s.blockType === 'summary');

      expect(summary).toBeDefined();
      expect(summary!.sentenceCount).toBe(2); // Exactly 2 sentences
      expect(summary!.passiveVoiceCount).toBeGreaterThanOrEqual(0); // May contain passive patterns
    });

    it('should analyze experience bullets with known characteristics', () => {
      const analysis = analyzeDocument(mockSnapshot);
      const exp = analysis.sections.find(s => s.blockType === 'experience');

      expect(exp).toBeDefined();
      expect(exp!.tokenCount).toBeGreaterThan(0);
      expect(exp!.sentenceCount).toBeGreaterThan(0);
    });
  });
});
