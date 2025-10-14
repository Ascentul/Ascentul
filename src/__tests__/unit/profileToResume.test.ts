/**
 * Profile-to-Resume Mapper Tests
 *
 * Test cases:
 * 1. Full profile mapping - all fields present
 * 2. Missing summary and LinkedIn - partial profile
 * 3. Invalid link formats - URL validation
 * 4. Phone normalization - E.164 to display format
 * 5. Snapshot test - full DTO to Document mapping
 */

import {
  profileToResume,
  hasMinimalResumeData,
  SUMMARY_PLACEHOLDER,
} from '@/lib/resume/profileToResume';
import type { CareerProfileDTO } from '@/types/profile';
import type { ResumeDocument } from '@/types/resume';

describe('profileToResume', () => {
  // Helper to create a minimal valid profile
  const createMinimalProfile = (): CareerProfileDTO => ({
    fullName: 'Test User',
    contact: {
      links: [],
    },
    experience: [],
    education: [],
    skills: { primary: [] },
    projects: [],
  });

  // Helper to create a full profile with all fields
  const createFullProfile = (): CareerProfileDTO => ({
    version: '1.0',
    fullName: 'Jane Doe',
    title: 'Senior Software Engineer',
    contact: {
      email: 'jane.doe@example.com',
      phone: '+14155551234',
      location: 'San Francisco, CA',
      links: [
        { label: 'LinkedIn', url: 'https://linkedin.com/in/janedoe' },
        { label: 'GitHub', url: 'https://github.com/janedoe' },
        { label: 'Portfolio', url: 'https://janedoe.com' },
      ],
    },
    bio: 'Experienced software engineer with 10+ years building scalable web applications. Passionate about clean code, mentoring, and open-source contributions.',
    experience: [
      {
        company: 'Google',
        role: 'Senior Software Engineer',
        location: 'Mountain View, CA',
        start: 'Jan 2020',
        end: 'Present',
        bullets: [
          'Led team of 8 engineers building distributed systems',
          'Improved API performance by 40% through caching optimizations',
          'Mentored 5 junior engineers to senior level',
        ],
      },
      {
        company: 'Facebook',
        role: 'Software Engineer',
        location: 'Menlo Park, CA',
        start: 'Jun 2016',
        end: 'Dec 2019',
        bullets: [
          'Developed newsfeed ranking algorithms serving 2B+ users',
          'Reduced infrastructure costs by $500K annually',
        ],
      },
    ],
    education: [
      {
        school: 'MIT',
        degree: 'BS Computer Science',
        field: 'Artificial Intelligence',
        end: '2016',
        details: ['GPA: 3.9/4.0', 'Summa Cum Laude'],
      },
    ],
    skills: {
      primary: ['TypeScript', 'React', 'Node.js', 'Python', 'PostgreSQL'],
      secondary: ['Docker', 'Kubernetes', 'AWS', 'GraphQL'],
    },
    projects: [
      {
        name: 'Open Source Contributions',
        description: 'Maintainer of popular React library with 50K+ stars',
        bullets: [
          'Technologies: TypeScript, React, Jest',
          'URL: https://github.com/janedoe/react-library',
        ],
      },
      {
        name: 'Personal Portfolio',
        description: 'Modern portfolio website built with Next.js',
        bullets: ['Technologies: Next.js, Tailwind CSS, Vercel'],
      },
    ],
  });

  describe('full profile mapping', () => {
    it('should map all fields when present', () => {
      const profile = createFullProfile();
      const result = profileToResume(profile);

      // Verify document structure
      expect(result.title).toBe("Jane Doe's Resume");
      expect(result.templateSlug).toBe('modern-minimal');
      expect(result.blocks).toHaveLength(6); // header, summary, experience, skills, education, projects
      expect(result.version).toBe(1);

      // Verify block types and ordering
      expect(result.blocks[0].type).toBe('header');
      expect(result.blocks[0].order).toBe(0);
      expect(result.blocks[1].type).toBe('summary');
      expect(result.blocks[1].order).toBe(1);
      expect(result.blocks[2].type).toBe('experience');
      expect(result.blocks[2].order).toBe(2);
      expect(result.blocks[3].type).toBe('skills');
      expect(result.blocks[3].order).toBe(3);
      expect(result.blocks[4].type).toBe('education');
      expect(result.blocks[4].order).toBe(4);
      expect(result.blocks[5].type).toBe('projects');
      expect(result.blocks[5].order).toBe(5);

      // Verify header block data
      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.fullName).toBe('Jane Doe');
        expect(headerBlock.data.title).toBe('Senior Software Engineer');
        expect(headerBlock.data.contact.email).toBe('jane.doe@example.com');
        expect(headerBlock.data.contact.phone).toBe('(415) 555-1234'); // Normalized
        expect(headerBlock.data.contact.location).toBe('San Francisco, CA');
        expect(headerBlock.data.contact.links).toHaveLength(3);
      }

      // Verify summary block
      const summaryBlock = result.blocks[1];
      if (summaryBlock.type === 'summary') {
        expect(summaryBlock.data.paragraph).toContain('Experienced software engineer');
      }

      // Verify experience block
      const experienceBlock = result.blocks[2];
      if (experienceBlock.type === 'experience') {
        expect(experienceBlock.data.items).toHaveLength(2);
        expect(experienceBlock.data.items[0].company).toBe('Google');
        expect(experienceBlock.data.items[0].role).toBe('Senior Software Engineer');
        expect(experienceBlock.data.items[0].bullets).toHaveLength(3);
      }

      // Verify skills block
      const skillsBlock = result.blocks[3];
      if (skillsBlock.type === 'skills') {
        expect(skillsBlock.data.primary).toHaveLength(5);
        expect(skillsBlock.data.secondary).toHaveLength(4);
      }

      // Verify education block
      const educationBlock = result.blocks[4];
      if (educationBlock.type === 'education') {
        expect(educationBlock.data.items).toHaveLength(1);
        expect(educationBlock.data.items[0].school).toBe('MIT');
        expect(educationBlock.data.items[0].details).toHaveLength(2);
      }

      // Verify projects block
      const projectsBlock = result.blocks[5];
      if (projectsBlock.type === 'projects') {
        expect(projectsBlock.data.items).toHaveLength(2);
        expect(projectsBlock.data.items[0].name).toBe('Open Source Contributions');
      }
    });

    it('should allow custom title and template', () => {
      const profile = createMinimalProfile();
      profile.skills.primary = ['JavaScript'];

      const result = profileToResume(profile, {
        title: 'My Custom Resume',
        templateSlug: 'professional',
      });

      expect(result.title).toBe('My Custom Resume');
      expect(result.templateSlug).toBe('professional');
    });
  });

  describe('missing fields', () => {
    it('should handle missing summary and LinkedIn', () => {
      const profile = createMinimalProfile();
      profile.skills.primary = ['JavaScript', 'TypeScript'];
      // No bio, no LinkedIn

      const result = profileToResume(profile);

      // Should only have header + skills (summary skipped, no experience/education/projects)
      expect(result.blocks).toHaveLength(2);
      expect(result.blocks[0].type).toBe('header');
      expect(result.blocks[1].type).toBe('skills');

      // Header should have no links
      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.contact.links).toHaveLength(0);
      }
    });

    it('should use placeholder for empty full name', () => {
      const profile = createMinimalProfile();
      profile.fullName = '';
      profile.skills.primary = ['React'];

      const result = profileToResume(profile);

      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.fullName).toBe('Full Name');
      }
    });

    it('should skip empty sections', () => {
      const profile = createMinimalProfile();
      profile.fullName = 'John Doe';
      profile.skills.primary = ['TypeScript'];
      // All other sections empty

      const result = profileToResume(profile);

      // Only header and skills
      expect(result.blocks).toHaveLength(2);
      expect(result.blocks.find(b => b.type === 'experience')).toBeUndefined();
      expect(result.blocks.find(b => b.type === 'education')).toBeUndefined();
      expect(result.blocks.find(b => b.type === 'projects')).toBeUndefined();
      expect(result.blocks.find(b => b.type === 'summary')).toBeUndefined();
    });
  });

  describe('invalid link formats', () => {
    it('should filter out invalid URLs', () => {
      const profile = createMinimalProfile();
      profile.contact.links = [
        { label: 'Valid HTTPS', url: 'https://example.com' },
        { label: 'Valid HTTP', url: 'http://example.org' },
        { label: 'Invalid', url: 'not-a-url' },
        { label: 'Malformed', url: 'htp://wrong' },
        { label: 'Empty', url: '' },
      ];
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile);

      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        // Should only include the 2 valid URLs
        expect(headerBlock.data.contact.links).toHaveLength(2);
        expect(headerBlock.data.contact.links[0].url).toBe('https://example.com');
        expect(headerBlock.data.contact.links[1].url).toBe('http://example.org');
      }
    });

    it('should warn about invalid links in debug mode', () => {
      const originalEnv = process.env.NEXT_PUBLIC_DEBUG_UI;
      process.env.NEXT_PUBLIC_DEBUG_UI = 'true';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const profile = createMinimalProfile();
      profile.contact.links = [
        { label: 'Invalid', url: 'not-a-url' },
      ];
      profile.skills.primary = ['TypeScript'];

      profileToResume(profile);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('[profileToResume] Invalid link URL: not-a-url')
      );

      consoleWarnSpy.mockRestore();
      process.env.NEXT_PUBLIC_DEBUG_UI = originalEnv;
    });

    it('should not warn in production mode', () => {
      const originalEnv = process.env.NEXT_PUBLIC_DEBUG_UI;
      process.env.NEXT_PUBLIC_DEBUG_UI = 'false';
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const profile = createMinimalProfile();
      profile.contact.links = [
        { label: 'Invalid', url: 'not-a-url' },
      ];
      profile.skills.primary = ['TypeScript'];

      profileToResume(profile);

      expect(consoleWarnSpy).not.toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
      process.env.NEXT_PUBLIC_DEBUG_UI = originalEnv;
    });
  });

  describe('phone normalization', () => {
    it('should normalize US phone numbers for display', () => {
      const profile = createMinimalProfile();
      profile.contact.phone = '+14155551234';
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile, { country: 'US' });

      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.contact.phone).toBe('(415) 555-1234');
      }
    });

    it('should normalize UK phone numbers for display', () => {
      const profile = createMinimalProfile();
      profile.contact.phone = '+442012345678';
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile, { country: 'UK' });

      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.contact.phone).toBe('+44 20 1234 5678');
      }
    });

    it('should display non-E.164 phone as-is', () => {
      const profile = createMinimalProfile();
      profile.contact.phone = '(555) 123-4567'; // Already formatted
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile);

      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.contact.phone).toBe('(555) 123-4567');
      }
    });

    it('should handle missing phone gracefully', () => {
      const profile = createMinimalProfile();
      // No phone provided
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile);

      const headerBlock = result.blocks[0];
      if (headerBlock.type === 'header') {
        expect(headerBlock.data.contact.phone).toBeUndefined();
      }
    });
  });

  describe('snapshot test', () => {
    it('should match full DTO to Document mapping', () => {
      const profile = createFullProfile();
      const result = profileToResume(profile);

      // Snapshot test for regression detection
      expect(result).toMatchSnapshot();
    });

    it('should match minimal DTO to Document mapping', () => {
      const profile = createMinimalProfile();
      profile.fullName = 'Minimal User';
      profile.skills.primary = ['JavaScript'];

      const result = profileToResume(profile);

      expect(result).toMatchSnapshot();
    });
  });

  describe('hasMinimalResumeData', () => {
    it('should be a function', () => {
      expect(typeof hasMinimalResumeData).toBe('function');
    });

    it('should return true for profile with name and content', () => {
      const profile = createMinimalProfile();
      profile.fullName = 'John Doe';
      profile.skills.primary = ['TypeScript'];

      expect(hasMinimalResumeData(profile)).toBe(true);
    });

    it('should return false for profile without name', () => {
      const profile = createMinimalProfile();
      profile.fullName = '';
      profile.skills.primary = ['TypeScript'];

      expect(hasMinimalResumeData(profile)).toBe(false);
    });

    it('should return false for profile without content', () => {
      const profile = createMinimalProfile();
      profile.fullName = 'John Doe';
      // All content arrays empty

      expect(hasMinimalResumeData(profile)).toBe(false);
    });

    it('should return true if bio exists', () => {
      const profile = createMinimalProfile();
      profile.fullName = 'John Doe';
      profile.bio = 'Software engineer with 5 years of experience.';

      expect(hasMinimalResumeData(profile)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle experience with empty bullets', () => {
      const profile = createMinimalProfile();
      profile.experience = [
        {
          company: 'Acme Corp',
          role: 'Developer',
          start: '2020',
          end: '2022',
          location: 'NYC',
          bullets: [],
        },
      ];
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile);

      const experienceBlock = result.blocks.find(b => b.type === 'experience');
      expect(experienceBlock).toBeDefined();
      if (experienceBlock && experienceBlock.type === 'experience') {
        expect(experienceBlock.data.items[0].bullets).toEqual([]);
      }
    });

    it('should handle education with empty details', () => {
      const profile = createMinimalProfile();
      profile.education = [
        {
          school: 'University',
          degree: 'BS',
          end: '2020',
          details: [],
        },
      ];
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile);

      const educationBlock = result.blocks.find(b => b.type === 'education');
      expect(educationBlock).toBeDefined();
      if (educationBlock && educationBlock.type === 'education') {
        expect(educationBlock.data.items[0].details).toEqual([]);
      }
    });

    it('should handle very long bio', () => {
      const profile = createMinimalProfile();
      profile.bio = 'A'.repeat(5000); // 5000 character bio
      profile.skills.primary = ['TypeScript'];

      const result = profileToResume(profile);

      const summaryBlock = result.blocks.find(b => b.type === 'summary');
      expect(summaryBlock).toBeDefined();
      if (summaryBlock && summaryBlock.type === 'summary') {
        expect(summaryBlock.data.paragraph.length).toBe(5000);
      }
    });
  });
});
