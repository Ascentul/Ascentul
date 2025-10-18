import type { Meta, StoryObj } from '@storybook/react';
import { HeaderBlock } from '@/app/(studio)/resume/components/blocks/HeaderBlock';
import type { HeaderData } from '@/lib/resume/types';

const exampleData: HeaderData = {
  fullName: 'Jane Doe',
  title: 'Senior Software Engineer',
  contact: {
    email: 'jane.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/janedoe' },
      { label: 'GitHub', url: 'https://github.com/janedoe' },
      { label: 'Portfolio', url: 'https://janedoe.dev' },
    ],
  },
};

const minimalData: HeaderData = {
  fullName: 'John Smith',
  contact: {},
};

const emailOnlyData: HeaderData = {
  fullName: 'Alice Johnson',
  title: 'Product Manager',
  contact: {
    email: 'alice@example.com',
  },
};

const manyLinksData: HeaderData = {
  fullName: 'Bob Developer',
  title: 'Full Stack Engineer',
  contact: {
    email: 'bob@example.com',
    phone: '555-0123',
    location: 'Remote',
    links: [
      { label: 'LinkedIn', url: 'https://linkedin.com/in/bobdev' },
      { label: 'GitHub', url: 'https://github.com/bobdev' },
      { label: 'Portfolio', url: 'https://bobdev.com' },
      { label: 'Blog', url: 'https://blog.bobdev.com' },
      { label: 'Twitter', url: 'https://twitter.com/bobdev' },
    ],
  },
};

const longNamesData: HeaderData = {
  fullName: 'Dr. Alexandra Catherine Montgomery-Wellington III',
  title: 'Distinguished Research Scientist and Principal Software Architect',
  contact: {
    email: 'alexandra.montgomery-wellington@verylong-company-name.com',
    phone: '+44 (0) 20 7946 0958',
    location: 'London, United Kingdom',
    links: [
      { label: 'Professional Profile', url: 'https://research-institution.edu/profiles/montgomery-wellington' },
    ],
  },
};

const noContactData: HeaderData = {
  fullName: 'Sarah Williams',
  title: 'UX Designer',
  contact: {},
};

const allContactTypesData: HeaderData = {
  fullName: 'Michael Chen',
  title: 'DevOps Engineer',
  contact: {
    email: 'michael@example.com',
    phone: '(555) 987-6543',
    location: 'Austin, TX',
    links: [
      { label: 'Website', url: 'https://michaelchen.io' },
    ],
  },
};

const meta: Meta<typeof HeaderBlock> = {
  title: 'Resume/HeaderBlock',
  component: HeaderBlock,
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
      description: 'Header data including name, title, and contact information',
    },
  },
};

export default meta;

type Story = StoryObj<typeof HeaderBlock>;

export const Default: Story = {
  args: {
    data: exampleData,
  },
};

export const DefaultSelected: Story = {
  args: {
    data: exampleData,
    isSelected: true,
  },
};

export const MinimalInformation: Story = {
  args: {
    data: minimalData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the minimum viable header with just a name.',
      },
    },
  },
};

export const EmailOnly: Story = {
  args: {
    data: emailOnlyData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Header with name, title, and email only.',
      },
    },
  },
};

export const ManyLinks: Story = {
  args: {
    data: manyLinksData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates external link icons with multiple social/professional links. Each external link displays an icon indicator.',
      },
    },
  },
};

export const ManyLinksSelected: Story = {
  args: {
    data: manyLinksData,
    isSelected: true,
  },
};

export const LongNames: Story = {
  args: {
    data: longNamesData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests layout with very long names, titles, and URLs to ensure proper wrapping.',
      },
    },
  },
};

export const NoContactInfo: Story = {
  args: {
    data: noContactData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Header with name and title but no contact information.',
      },
    },
  },
};

export const AllContactTypes: Story = {
  args: {
    data: allContactTypesData,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates all contact field types: email, phone, location, and external link with icon.',
      },
    },
  },
};
