import {
  analyzeBullet,
  analyzeExperienceBlock,
  analyzeSummaryBlock,
  analyzeSkillsBlock,
  analyzeResume,
} from '@/lib/ai/suggestions';

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

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'length',
          priority: 'medium',
          message: 'Bullet point too short',
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
          message: 'Bullet point too long',
        })
      );
    });

    it('should detect vague language', () => {
      const bullet = 'Responsible for various tasks';
      const suggestions = analyzeBullet(bullet, 0);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'clarity',
          priority: 'high',
          message: 'Avoid vague language',
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

      expect(suggestions1).toBeDefined();
      expect(suggestions2).toBeDefined();
    });
  });

  describe('analyzeExperienceBlock', () => {
    it('should detect tense issues in current roles', () => {
      const items = [
        {
          title: 'Software Engineer',
          company: 'Tech Corp',
          startDate: 'Jan 2023',
          endDate: 'Present',
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
          title: 'Software Engineer',
          company: 'Old Corp',
          startDate: 'Jan 2020',
          endDate: 'Dec 2022',
          bullets: ['Leading the development of new features'],
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
          title: 'Developer',
          company: 'Company',
          startDate: 'Jan 2023',
          endDate: 'Present',
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
    });

    it('should handle experience blocks with no bullets', () => {
      const items = [
        {
          title: 'Developer',
          company: 'Company',
          startDate: 'Jan 2023',
          endDate: 'Present',
          bullets: [],
        },
      ];

      const suggestions = analyzeExperienceBlock(items);

      expect(suggestions).toEqual([]);
    });
  });

  describe('analyzeSummaryBlock', () => {
    it('should detect short summaries', () => {
      const summary = 'Software engineer.';
      const suggestions = analyzeSummaryBlock(summary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'length',
          priority: 'high',
          message: 'Summary too short',
        })
      );
    });

    it('should detect overly long summaries', () => {
      const summary = 'This is an extremely long summary that goes on and on about every single detail of the person\'s career history and includes way too much information that should really be broken up into separate sections or condensed significantly to make it more readable and impactful for hiring managers who typically spend less than 10 seconds scanning a resume summary before deciding whether to continue reading further into the document or move on to the next candidate in their review queue which is why it is critically important to keep summary sections concise and focused on the most important and relevant achievements.';
      const suggestions = analyzeSummaryBlock(summary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'length',
          priority: 'medium',
          message: 'Summary too long',
        })
      );
    });

    it('should detect missing keywords in summary', () => {
      const summary = 'I like to code.';
      const suggestions = analyzeSummaryBlock(summary);

      expect(suggestions).toContainEqual(
        expect.objectContaining({
          type: 'keyword',
          priority: 'medium',
          message: 'Add relevant keywords',
        })
      );
    });

    it('should not flag well-written summaries', () => {
      const summary = 'Senior Software Engineer with 8+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud architecture. Led teams to deliver high-impact products serving millions of users.';
      const suggestions = analyzeSummaryBlock(summary);

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
          type: 'keyword',
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
    });
  });

  describe('analyzeResume', () => {
    it('should analyze all blocks in a resume', () => {
      const blocks = [
        {
          type: 'header',
          order: 0,
          data: {
            fullName: 'John Doe',
            title: 'Developer',
            contact: {},
          },
        },
        {
          type: 'summary',
          order: 1,
          data: {
            paragraph: 'Short summary.',
          },
        },
        {
          type: 'experience',
          order: 2,
          data: {
            items: [
              {
                title: 'Developer',
                company: 'Company',
                startDate: 'Jan 2023',
                endDate: 'Present',
                bullets: ['Helped with coding'],
              },
            ],
          },
        },
        {
          type: 'skills',
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
      const summaryBlockId = 'block-1';
      expect(suggestionsByBlock.has(summaryBlockId)).toBe(true);
    });

    it('should return empty map for empty resume', () => {
      const blocks: any[] = [];
      const suggestionsByBlock = analyzeResume(blocks);

      expect(suggestionsByBlock.size).toBe(0);
    });

    it('should skip blocks with no issues', () => {
      const blocks = [
        {
          type: 'header',
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
      const blocks = [
        {
          type: 'experience',
          order: 0,
          data: {
            items: null,
          },
        },
      ];

      const suggestionsByBlock = analyzeResume(blocks);

      // Should not throw error
      expect(suggestionsByBlock).toBeDefined();
    });
  });
});
