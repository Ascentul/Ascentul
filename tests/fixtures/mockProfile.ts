import type { CareerProfileDTO } from '@/types/profile';

/**
 * Mock profile fixture for testing resume builder
 *
 * Provides a complete, realistic profile for smoke tests
 */
export const mockProfile: CareerProfileDTO = {
  contact: {
    firstName: 'Test',
    lastName: 'User',
    email: 'test.user@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/testuser' },
      { label: 'GitHub', url: 'https://github.com/testuser' },
      { label: 'Portfolio', url: 'https://testuser.dev' },
    ],
  },
  summary: {
    bio: 'Experienced software engineer with 5+ years building scalable web applications.',
  },
  experience: [
    {
      company: 'Tech Corp',
      role: 'Senior Software Engineer',
      startDate: '2021-01',
      endDate: null,
      location: 'San Francisco, CA',
      description: 'Lead engineer on platform team',
      bullets: [
        'Built microservices architecture serving 10M+ users',
        'Reduced API latency by 40% through caching optimizations',
        'Mentored 5 junior engineers on best practices',
      ],
    },
    {
      company: 'Startup Inc',
      role: 'Software Engineer',
      startDate: '2019-06',
      endDate: '2021-01',
      location: 'Remote',
      description: 'Full-stack engineer',
      bullets: [
        'Developed React frontend and Node.js backend',
        'Implemented CI/CD pipeline with 95% uptime',
      ],
    },
  ],
  education: [
    {
      school: 'University of California',
      degree: 'Bachelor of Science',
      field: 'Computer Science',
      startDate: '2015-09',
      endDate: '2019-05',
      gpa: '3.8',
      location: 'Berkeley, CA',
      details: ['Dean\'s List (4 semesters)', 'CS Honor Society'],
    },
  ],
  skills: {
    primary: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL'],
    secondary: ['AWS', 'Docker', 'Git', 'REST APIs', 'GraphQL', 'PostgreSQL'],
  },
  projects: [
    {
      name: 'Open Source Dashboard',
      description: 'Analytics dashboard for monitoring open source projects',
      technologies: ['React', 'TypeScript', 'D3.js'],
      url: 'https://github.com/testuser/dashboard',
      startDate: '2023-01',
      endDate: null,
      bullets: [
        'Visualizes GitHub activity with interactive charts',
        '500+ stars on GitHub',
      ],
    },
  ],
};

/**
 * Minimal valid profile for edge case testing
 */
export const minimalProfile: Partial<CareerProfileDTO> = {
  contact: {
    firstName: 'Min',
    lastName: 'User',
    email: 'min@example.com',
  },
};
