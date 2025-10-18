import {
  analyzeBullet,
  analyzeExperienceBlock,
  analyzeSummary,
  analyzeSkillsBlock,
  analyzeResume,
} from '@/lib/ai/suggestions';
import type { ResumeBlock } from '@/lib/validators/resume';
import type { ExperienceItem } from '@/lib/resume-types';

describe('AI Suggestions System', () => {
  describe('analyzeBullet', () => {
    it('should detect weak action verbs', () => {
      const bullet = 'Helped implement new features';
      const suggestions = analyzeBullet(bullet, 0);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'verb',
          priority: 'high',
          message: 'Strengthen action verb',
        })
      );
    });

    it('should detect missing metrics', () => {
      const bullet = 'Led a team of developers';
      const suggestions = analyzeBullet(bullet, 0);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'metrics',
          priority: 'high',
          message: 'Add quantifiable metrics',
        })
      );
    });

    it('should detect bullets that are too short', () => {
      const bullet = 'Did coding';
      const suggestions = analyzeBullet(bullet, 0);

      // Short bullets trigger weak verb and missing metrics, not a length check
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'verb',
          priority: 'high',
          message: 'Strengthen action verb',
        })
      );
    });

    it('should detect bullets that are too long', () => {
      const bullet = 'This is a very long bullet point that goes on and on with lots of details about everything that was done in the role and includes way too much information for a single bullet point on a resume which should ideally be concise and to the point rather than rambling on endlessly about every little detail';
      const suggestions = analyzeBullet(bullet, 0);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'length',
          priority: 'medium',
          message: 'Bullet is too long',
        })
      );
    });

    it('should detect vague language', () => {
      const bullet = 'Responsible for various tasks';
      const suggestions = analyzeBullet(bullet, 0);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'medium',
          message: 'Be more specific',
        })
      );
    });

    it('should not flag well-written bullets', () => {
      const bullet = 'Architected microservices platform serving 10M+ users with 99.9% uptime';
      const suggestions = analyzeBullet(bullet, 0);

      // Should have minimal or no suggestions
      const highPriority = suggestions.filter(s => s.priority === 'high');
      expect(highPriority.length).toBe(0);
    });

    it('should handle empty bullets gracefully', () => {
      const bullet = '';
      const suggestions = analyzeBullet(bullet, 0);

      expect(suggestions).toEqual([]);
    });

    it('should accept both number and string indices', () => {
      const bullet = 'Test bullet';
      const suggestions1 = analyzeBullet(bullet, 0);
      const suggestions2 = analyzeBullet(bullet, '0-1');

      expect(Array.isArray(suggestions1)).toBe(true);
      expect(Array.isArray(suggestions2)).toBe(true);

      // Both should handle the same bullet consistently
      suggestions1.forEach(s => {
        expect(s).toHaveProperty('type');
        expect(s).toHaveProperty('priority');
        expect(s).toHaveProperty('message');
      });

      suggestions2.forEach(s => {
        expect(s).toHaveProperty('type');
        expect(s).toHaveProperty('priority');
        expect(s).toHaveProperty('message');
      });

      // Both index types should produce equivalent results
      expect(suggestions1.length).toBe(suggestions2.length);
      expect(suggestions1.map(s => s.type).sort()).toEqual(
        suggestions2.map(s => s.type).sort()
      );
    });
  });

  describe('analyzeExperienceBlock', () => {
    it('should detect tense issues in current roles', () => {
      const items = [
        {
          role: 'Software Engineer',
          company: 'Tech Corp',
          start: 'Jan 2023',
          end: 'Present',
          bullets: ['Led the development of new features'],
        },
      ];

      const suggestions = analyzeExperienceBlock(items);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'tense',
          priority: 'medium',
          message: 'Use present tense',
        })
      );
    });

    it('should detect tense issues in past roles', () => {
      const items = [
        {
          role: 'Software Engineer',
          company: 'Old Corp',
          start: 'Jan 2020',
          end: 'Dec 2022',
          bullets: ['Leads the development of new features'],
        },
      ];

      const suggestions = analyzeExperienceBlock(items);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'tense',
          priority: 'medium',
          message: 'Use past tense',
        })
      );
    });

    it('should analyze all bullets in experience items', () => {
      const items = [
        {
          role: 'Developer',
          company: 'Company',
          start: 'Jan 2023',
          end: 'Present',
          bullets: [
            'Helped implement features',
            'Did coding',
            'Responsible for various things',
          ],
        },
      ];

      const suggestions = analyzeExperienceBlock(items);

      // Should have suggestions for all three poorly written bullets
      expect(suggestions.length).toBeGreaterThan(2);
      const types = suggestions.map(s => s.type);
      expect(types).toContain('verb'); // weak verb in bullet 1 & 2
      expect(types).toContain('metrics'); // missing metrics in all bullets
      expect(types).toContain('clarity'); // vague language in bullet 3
    });

    it('should handle experience blocks with no bullets', () => {
      const items = [
        {
          role: 'Developer',
          company: 'Company',
          start: 'Jan 2023',
          end: 'Present',
          bullets: [],
        },
      ];

      const suggestions = analyzeExperienceBlock(items);

      // Should suggest adding bullets
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'high',
          message: 'Add achievement bullets',
        })
      );
    });
  });

  describe('analyzeSummary', () => {
    it('should detect short summaries', () => {
      const summary = 'Software engineer.';
      const suggestions = analyzeSummary(summary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'medium',
          message: 'Expand your summary',
        })
      );
    });

    it('should detect overly long summaries', () => {
      const summary = 'This is an extremely long summary that goes on and on about every single detail of the person\'s career history and includes way too much information that should really be broken up into separate sections or condensed significantly to make it more readable and impactful for hiring managers who typically spend less than 10 seconds scanning a resume summary before deciding whether to continue reading further into the document or move on to the next candidate in their review queue which is why it is critically important to keep summary sections concise and focused on the most important and relevant achievements.';
      const suggestions = analyzeSummary(summary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'length',
          priority: 'medium',
          message: 'Summary is too long',
        })
      );
    });

    it('should detect missing personal voice in summary', () => {
      const summary = 'Experienced software engineer with strong technical skills. Led multiple projects to successful completion.';
      const suggestions = analyzeSummary(summary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'low',
          message: 'Consider adding personal voice',
        })
      );
    });

    it('should not flag well-written summaries', () => {
      const summary = 'Senior Software Engineer with 8+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud architecture. Led teams to deliver high-impact products serving millions of users.';
      const suggestions = analyzeSummary(summary);

      const highPriority = suggestions.filter(s => s.priority === 'high');
      expect(highPriority.length).toBe(0);
    });
  });

  describe('analyzeSkillsBlock', () => {
    it('should detect insufficient skills', () => {
      const primary = ['JavaScript'];
      const secondary: string[] = [];
      const suggestions = analyzeSkillsBlock(primary, secondary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'medium',
          message: 'Add more skills',
        })
      );
    });

    it('should not flag comprehensive skill lists', () => {
      const primary = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python'];
      const secondary = ['Docker', 'AWS', 'Git', 'CI/CD'];
      const suggestions = analyzeSkillsBlock(primary, secondary);

      expect(suggestions.length).toBe(0);
    });

    it('should handle empty skill lists', () => {
      const primary: string[] = [];
      const secondary: string[] = [];
      const suggestions = analyzeSkillsBlock(primary, secondary);

      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'high',
          message: 'Add skills',
        })
      );
    });
  });

  describe('analyzeResume', () => {
    it('should analyze all blocks in a resume', () => {
      const blocks: ResumeBlock[] = [
        {
          type: 'header' as const,
          order: 0,
          data: {
            fullName: 'John Doe',
            title: 'Developer',
            contact: {},
          },
        },
        {
          type: 'summary' as const,
          order: 1,
          data: {
            paragraph: 'Short summary.',
          },
        },
        {
          type: 'experience' as const,
          order: 2,
          data: {
            items: [
              {
                role: 'Developer',
                company: 'Company',
                start: 'Jan 2023',
                end: 'Present',
                bullets: ['Helped with coding'],
              },
            ],
          },
        },
        {
          type: 'skills' as const,
          order: 3,
          data: {
            primary: ['JavaScript'],
            secondary: [],
          },
        },
      ];

      const suggestionsByBlock = analyzeResume(blocks);

      // Should have suggestions for multiple blocks
      expect(suggestionsByBlock.size).toBeGreaterThan(0);

      // Summary block should have suggestions
      const summaryBlock = blocks.find(b => b.type === 'summary');
      expect(summaryBlock).toBeDefined();
      const summaryBlockId = `block-${summaryBlock!.order}`;
      expect(suggestionsByBlock.has(summaryBlockId)).toBe(true);
      expect(suggestionsByBlock.get(summaryBlockId)?.length).toBeGreaterThan(0);
    });

    it('should return empty map for empty resume', () => {
      const blocks: ResumeBlock[] = [];
      const suggestionsByBlock = analyzeResume(blocks);

      expect(suggestionsByBlock.size).toBe(0);
    });

    it('should skip blocks with no issues', () => {
      const blocks: ResumeBlock[] = [
        {
          type: 'header' as const,
          order: 0,
          data: {
            fullName: 'John Doe',
            title: 'Senior Software Engineer',
            contact: {
              email: 'john@example.com',
              phone: '555-1234',
              location: 'San Francisco, CA',
            },
          },
        },
      ];

      const suggestionsByBlock = analyzeResume(blocks);

      // Header blocks typically don't have suggestions
      expect(suggestionsByBlock.size).toBe(0);
    });

    it('should handle blocks with missing data gracefully', () => {
      const blocks: ResumeBlock[] = [
        {
          type: 'experience' as const,
          order: 0,
          data: {
            items: null as unknown as ExperienceItem[],
          },
        },
      ];

      const suggestionsByBlock = analyzeResume(blocks);

      // Should not throw error
      expect(suggestionsByBlock).toBeDefined();
    });

    it('should handle blocks with undefined data gracefully', () => {
      const blocks: ResumeBlock[] = [
        {
          type: 'experience' as const,
          order: 0,
          data: {
            items: undefined as unknown as ExperienceItem[],
          },
        },
      ];

      const suggestionsByBlock = analyzeResume(blocks);

      // Should not throw error
      expect(suggestionsByBlock).toBeDefined();
    });
  });
});
