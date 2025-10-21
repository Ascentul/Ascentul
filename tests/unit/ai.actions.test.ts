/**
 * Phase 7 - Part B: AI Actions Unit Tests
 * Test action type definitions and prompt generation
 */

import { describe, test, expect } from '@jest/globals';
import {
  getActionPrompt,
  validateActionContext,
  getActionDescription,
  type AIAction,
} from '@/features/resume/ai/actions';

describe('getActionPrompt', () => {
  describe('generateSummary', () => {
    it('generates prompts with target role', () => {
      const result = getActionPrompt('generateSummary', {
        targetRole: 'Senior Software Engineer',
        experienceYears: 10,
      });

      expect(result.action).toBe('generateSummary');
      expect(result.systemPrompt).toContain('professional summary');
      expect(result.userPrompt).toContain('Senior Software Engineer');
      expect(result.userPrompt).toContain('10+');
    });

    it('generates prompts with key skills', () => {
      const result = getActionPrompt('generateSummary', {
        keySkills: ['TypeScript', 'React', 'Node.js'],
      });

      expect(result.userPrompt).toContain('TypeScript');
      expect(result.userPrompt).toContain('React');
      expect(result.userPrompt).toContain('Node.js');
    });

    it('generates prompts with current content for reference', () => {
      const result = getActionPrompt('generateSummary', {
        currentContent: 'Software engineer with experience in web development.',
        targetRole: 'Senior Engineer',
      });

      expect(result.userPrompt).toContain('Current summary');
      expect(result.userPrompt).toContain('Software engineer');
    });

    it('generates minimal prompt with no context', () => {
      const result = getActionPrompt('generateSummary', {});

      expect(result.systemPrompt).toBeDefined();
      expect(result.userPrompt).toContain('Generate a professional summary');
    });
  });

  describe('rewriteExperience', () => {
    it('generates prompts for current role', () => {
      const result = getActionPrompt('rewriteExperience', {
        bullets: ['Led team', 'Built features'],
        role: 'Senior Engineer',
        company: 'TechCorp',
        isCurrent: true,
      });

      expect(result.userPrompt).toContain('Senior Engineer');
      expect(result.userPrompt).toContain('TechCorp');
      expect(result.userPrompt).toContain('Current position');
      expect(result.userPrompt).toContain('present tense');
    });

    it('generates prompts for previous role', () => {
      const result = getActionPrompt('rewriteExperience', {
        bullets: ['Led team', 'Built features'],
        role: 'Engineer',
        company: 'StartupCo',
        isCurrent: false,
      });

      expect(result.userPrompt).toContain('Previous position');
      expect(result.userPrompt).toContain('past tense');
    });

    it('includes target role when provided', () => {
      const result = getActionPrompt('rewriteExperience', {
        bullets: ['Led team'],
        role: 'Engineer',
        company: 'TechCorp',
        isCurrent: false,
        targetRole: 'Director of Engineering',
      });

      expect(result.userPrompt).toContain('Director of Engineering');
    });

    it('throws error when bullets are missing', () => {
      expect(() =>
        getActionPrompt('rewriteExperience', {
          role: 'Engineer',
          company: 'TechCorp',
        })
      ).toThrow('rewriteExperience requires bullets');
    });

    it('throws error when role is missing', () => {
      expect(() =>
        getActionPrompt('rewriteExperience', {
          bullets: ['Led team'],
          company: 'TechCorp',
        })
      ).toThrow('requires role and company');
    });
  });

  describe('tailorToJob', () => {
    it('generates prompts with job description', () => {
      const result = getActionPrompt('tailorToJob', {
        jobText: 'Looking for engineer with React experience',
        currentContent: 'Built web applications',
        contentType: 'experience',
      });

      expect(result.userPrompt).toContain('Looking for engineer');
      expect(result.userPrompt).toContain('Built web applications');
      expect(result.userPrompt).toContain('experience content');
    });

    it('throws error when jobText is missing', () => {
      expect(() =>
        getActionPrompt('tailorToJob', {
          currentContent: 'Some content',
        })
      ).toThrow('tailorToJob requires jobText');
    });

    it('throws error when currentContent is missing', () => {
      expect(() =>
        getActionPrompt('tailorToJob', {
          jobText: 'Job description',
        })
      ).toThrow('tailorToJob requires currentContent');
    });
  });

  describe('improveBullet', () => {
    it('generates prompts for bullet improvement', () => {
      const result = getActionPrompt('improveBullet', {
        bullet: 'Worked on features',
      });

      expect(result.userPrompt).toContain('Worked on features');
      expect(result.userPrompt).toContain('Improve this bullet');
    });

    it('includes target role when provided', () => {
      const result = getActionPrompt('improveBullet', {
        bullet: 'Built features',
        targetRole: 'Senior Engineer',
      });

      expect(result.userPrompt).toContain('Senior Engineer');
    });

    it('throws error when bullet is missing', () => {
      expect(() => getActionPrompt('improveBullet', {})).toThrow('improveBullet requires bullet');
    });
  });

  describe('fixTense', () => {
    it('generates prompts for current role', () => {
      const result = getActionPrompt('fixTense', {
        currentContent: 'Led team and managed projects',
        isCurrent: true,
      });

      expect(result.userPrompt).toContain('present tense');
      expect(result.userPrompt).toContain('current role');
    });

    it('generates prompts for previous role', () => {
      const result = getActionPrompt('fixTense', {
        currentContent: 'Leads team and manages projects',
        isCurrent: false,
      });

      expect(result.userPrompt).toContain('past tense');
      expect(result.userPrompt).toContain('previous role');
    });

    it('throws error when currentContent is missing', () => {
      expect(() =>
        getActionPrompt('fixTense', {
          isCurrent: true,
        })
      ).toThrow('fixTense requires currentContent');
    });

    it('throws error when isCurrent is missing', () => {
      expect(() =>
        getActionPrompt('fixTense', {
          currentContent: 'Some content',
        })
      ).toThrow('fixTense requires isCurrent');
    });
  });

  describe('translate', () => {
    it('generates prompts for translation', () => {
      const result = getActionPrompt('translate', {
        currentContent: 'Led development of web applications',
        targetLang: 'Spanish',
      });

      expect(result.userPrompt).toContain('Led development');
      expect(result.userPrompt).toContain('Spanish');
    });

    it('includes content type when provided', () => {
      const result = getActionPrompt('translate', {
        currentContent: 'Some content',
        targetLang: 'French',
        contentType: 'professional summary',
      });

      expect(result.userPrompt).toContain('professional summary');
    });

    it('throws error when currentContent is missing', () => {
      expect(() =>
        getActionPrompt('translate', {
          targetLang: 'Spanish',
        })
      ).toThrow('translate requires currentContent');
    });

    it('throws error when targetLang is missing', () => {
      expect(() =>
        getActionPrompt('translate', {
          currentContent: 'Some content',
        })
      ).toThrow('translate requires targetLang');
    });
  });
});

describe('validateActionContext', () => {
  it('validates generateSummary context (all optional)', () => {
    const result = validateActionContext('generateSummary', {});
    expect(result.valid).toBe(true);
  });

  it('validates rewriteExperience with required fields', () => {
    const result = validateActionContext('rewriteExperience', {
      bullets: ['Led team'],
      role: 'Engineer',
      company: 'TechCorp',
    });

    expect(result.valid).toBe(true);
  });

  it('detects missing bullets in rewriteExperience', () => {
    const result = validateActionContext('rewriteExperience', {
      role: 'Engineer',
      company: 'TechCorp',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.missing).toContain('bullets');
    }
  });

  it('detects missing role in rewriteExperience', () => {
    const result = validateActionContext('rewriteExperience', {
      bullets: ['Led team'],
      company: 'TechCorp',
    });

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.missing).toContain('role');
    }
  });

  it('validates tailorToJob with required fields', () => {
    const result = validateActionContext('tailorToJob', {
      jobText: 'Job description',
      currentContent: 'Current content',
    });

    expect(result.valid).toBe(true);
  });

  it('detects multiple missing fields', () => {
    const result = validateActionContext('fixTense', {});

    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.missing).toContain('currentContent');
      expect(result.missing).toContain('isCurrent');
    }
  });
});

describe('getActionDescription', () => {
  it('returns human-readable descriptions for all action types', () => {
    const actions: AIAction[] = [
      'generateSummary',
      'rewriteExperience',
      'tailorToJob',
      'improveBullet',
      'fixTense',
      'translate',
    ];

    for (const action of actions) {
      const description = getActionDescription(action);
      expect(description).toBeDefined();
      expect(description.length).toBeGreaterThan(0);
      expect(typeof description).toBe('string');
    }
  });

  it('returns specific descriptions', () => {
    expect(getActionDescription('generateSummary')).toContain('summary');
    expect(getActionDescription('rewriteExperience')).toContain('experience');
    expect(getActionDescription('tailorToJob')).toContain('job');
    expect(getActionDescription('improveBullet')).toContain('bullet');
    expect(getActionDescription('fixTense')).toContain('tense');
    expect(getActionDescription('translate')).toContain('Translate');
  });
});

describe('Prompt Determinism', () => {
  it('generates identical prompts for same inputs', () => {
    const context = {
      bullets: ['Led team', 'Built features'],
      role: 'Engineer',
      company: 'TechCorp',
      isCurrent: false,
    };

    const result1 = getActionPrompt('rewriteExperience', context);
    const result2 = getActionPrompt('rewriteExperience', context);

    expect(result1.systemPrompt).toBe(result2.systemPrompt);
    expect(result1.userPrompt).toBe(result2.userPrompt);
  });

  it('generates different prompts for different actions', () => {
    const summaryPrompt = getActionPrompt('generateSummary', {});
    const bulletPrompt = getActionPrompt('improveBullet', { bullet: 'Led team' });

    expect(summaryPrompt.systemPrompt).not.toBe(bulletPrompt.systemPrompt);
  });
});
