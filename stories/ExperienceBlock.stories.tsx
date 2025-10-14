import type { Meta, StoryObj } from '@storybook/react';
import { ExperienceBlock } from '@/app/(studio)/resume/components/blocks/ExperienceBlock';
import type { ExperienceData } from '@/lib/resume/types';

const exampleData: ExperienceData = {
  items: [
    {
      company: 'Acme Corp',
      role: 'Senior Software Engineer',
      location: 'Remote',
      start: 'Jan 2021',
      end: 'Present',
      bullets: [
        'Led a cross-functional team of 6 to deliver a new onboarding flow, improving activation by 18%.',
        'Introduced automated performance regression testing that reduced production incidents by 30%.',
        'Mentored 4 engineers, leading knowledge-sharing sessions on architecture and testing best practices.',
      ],
    },
  ],
};

const multipleItemsData: ExperienceData = {
  items: [
    {
      company: 'Tech Innovators Inc',
      role: 'Senior Full Stack Developer',
      location: 'San Francisco, CA',
      start: 'Jan 2021',
      end: 'Present',
      bullets: [
        'Led migration of monolithic application to microservices architecture, reducing deployment time by 60%.',
        'Implemented CI/CD pipeline using GitHub Actions, improving team velocity by 40%.',
        'Mentored 5 junior developers on best practices and code review standards.',
      ],
    },
    {
      company: 'StartupXYZ',
      role: 'Full Stack Developer',
      location: 'New York, NY',
      start: 'Jun 2018',
      end: 'Dec 2020',
      bullets: [
        'Built RESTful APIs serving 1M+ requests per day with 99.9% uptime.',
        'Developed React-based dashboard reducing customer support tickets by 25%.',
        'Optimized database queries improving page load times by 50%.',
      ],
    },
    {
      company: 'Digital Solutions Co',
      role: 'Junior Developer',
      location: 'Austin, TX',
      start: 'Jan 2016',
      end: 'May 2018',
      bullets: [
        'Developed and maintained 10+ client websites using HTML, CSS, and JavaScript.',
        'Collaborated with design team to implement responsive UI components.',
      ],
    },
  ],
};

const minimalFieldsData: ExperienceData = {
  items: [
    {
      company: '',
      role: 'Freelance Developer',
      location: '',
      start: '2020',
      end: 'Present',
      bullets: ['Built custom web applications for small businesses.'],
    },
  ],
};

const veryLongTextData: ExperienceData = {
  items: [
    {
      company: 'International Technology Solutions and Consulting Services Corporation',
      role: 'Principal Software Architect and Technical Lead for Enterprise Applications',
      location: 'San Francisco Bay Area, California, United States',
      start: 'January 2020',
      end: 'Present',
      bullets: [
        'Architected and implemented a highly scalable, fault-tolerant, distributed microservices platform serving over 10 million users across multiple geographic regions with 99.99% uptime SLA, utilizing Kubernetes, Docker, and AWS infrastructure with auto-scaling capabilities and comprehensive monitoring solutions.',
        'Led a globally distributed team of 15 senior engineers across 4 time zones, establishing best practices for remote collaboration, code review processes, continuous integration and deployment pipelines, and implemented agile methodologies that improved sprint velocity by 45% while maintaining code quality standards.',
        'Spearheaded the migration of legacy monolithic application consisting of over 2 million lines of code to modern cloud-native architecture, reducing infrastructure costs by 60% and improving deployment frequency from monthly to multiple times per day.',
      ],
    },
  ],
};

const maxBulletsData: ExperienceData = {
  items: [
    {
      company: 'Big Tech Co',
      role: 'Software Engineer',
      location: 'Seattle, WA',
      start: 'Jan 2019',
      end: 'Present',
      bullets: [
        'First achievement demonstrating technical excellence.',
        'Second achievement showing leadership capabilities.',
        'Third achievement highlighting impact on business metrics.',
        'Fourth achievement demonstrating collaboration skills.',
        'Fifth achievement showing innovation and problem-solving.',
        'Sixth achievement illustrating long-term impact.',
        // Seventh+ bullets should be truncated by the component (MAX_BULLETS=6 in ExperienceBlock.tsx)
        'Seventh achievement (should be truncated).',
        'Eighth achievement (should also be truncated).',
      ],
    },
  ],
};

const noBulletsData: ExperienceData = {
  items: [
    {
      company: 'Simple Corp',
      role: 'Consultant',
      location: 'Remote',
      start: 'Mar 2023',
      end: 'Jun 2023',
      bullets: [],
    },
  ],
};

const emptyData: ExperienceData = {
  items: [],
};

const meta: Meta<typeof ExperienceBlock> = {
  title: 'Resume/ExperienceBlock',
  component: ExperienceBlock,
  parameters: {
    layout: 'padded',
  },
  args: {
    data: exampleData,
    isSelected: false,
  },
  argTypes: {
    isSelected: {
      control: 'boolean',
      description: 'Whether the block is currently selected (shows suggestions panel)',
    },
    data: {
      control: 'object',
      description: 'Experience data including items with company, role, and bullets',
    },
  },
};

export default meta;

type Story = StoryObj<typeof ExperienceBlock>;

export const Default: Story = {
  args: {
    data: exampleData,
  },
};

export const MultipleExperiences: Story = {
  args: {
    data: multipleItemsData,
  },
};

export const MinimalFields: Story = {
  args: {
    data: minimalFieldsData,
  },
};

export const VeryLongText: Story = {
  args: {
    data: veryLongTextData,
  },
};

export const MaxBulletPoints: Story = {
  args: {
    data: maxBulletsData,
  },
};

export const NoBulletPoints: Story = {
  args: {
    data: noBulletsData,
  },
};

export const EmptyState: Story = {
  args: {
    data: emptyData,
  },
};
