import {
  Briefcase,
  Code,
  GraduationCap,
  type LucideIcon,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

export const goalTemplates = [
  {
    id: 'career-change',
    title: 'Career Change',
    description: 'Transition to a new career field',
    icon: Briefcase,
    category: 'Career',
    prefill: {
      title: 'Transition to [New Field]',
      description: 'Successfully transition from my current role to a new career in [target field]',
      milestones: [
        'Research target industry and roles',
        'Identify skill gaps and create learning plan',
        'Update resume and LinkedIn profile',
        'Network with professionals in target field',
        'Apply to relevant positions',
        'Complete transition successfully',
      ],
    },
  },
  {
    id: 'skill-development',
    title: 'Skill Development',
    description: 'Learn new technical or professional skills',
    icon: Code,
    category: 'Learning',
    prefill: {
      title: 'Master [Skill Name]',
      description: 'Develop proficiency in [specific skill] to advance my career',
      milestones: [
        'Complete foundational course or tutorial',
        'Build first practice project',
        'Join community or study group',
        'Complete intermediate-level project',
        'Obtain certification (if applicable)',
        'Apply skill in professional context',
      ],
    },
  },
  {
    id: 'promotion',
    title: 'Get Promoted',
    description: 'Advance to the next level in your current role',
    icon: TrendingUp,
    category: 'Career',
    prefill: {
      title: 'Get Promoted to [Target Position]',
      description: 'Earn promotion to [target role] within [timeframe]',
      milestones: [
        'Meet with manager to discuss promotion path',
        'Identify required skills and experience',
        'Take on additional responsibilities',
        'Complete relevant training or certifications',
        'Document achievements and impact',
        'Formally apply or interview for promotion',
      ],
    },
  },
  {
    id: 'networking',
    title: 'Build Network',
    description: 'Expand your professional network',
    icon: Users,
    category: 'Networking',
    prefill: {
      title: 'Build Professional Network',
      description: 'Expand my network to [target number] meaningful professional connections',
      milestones: [
        'Optimize LinkedIn profile',
        'Attend industry events or meetups',
        'Join professional associations',
        'Reach out to alumni network',
        'Schedule informational interviews',
        'Maintain regular contact with network',
      ],
    },
  },
  {
    id: 'education',
    title: 'Further Education',
    description: 'Pursue additional education or certifications',
    icon: GraduationCap,
    category: 'Education',
    prefill: {
      title: 'Complete [Degree/Certification]',
      description: 'Successfully complete [specific program] to advance my career',
      milestones: [
        'Research and select program',
        'Complete application process',
        'Secure funding or employer support',
        'Begin coursework',
        'Maintain good academic standing',
        'Complete program and earn credential',
      ],
    },
  },
  {
    id: 'leadership',
    title: 'Leadership Development',
    description: 'Develop leadership and management skills',
    icon: Target,
    category: 'Leadership',
    prefill: {
      title: 'Develop Leadership Skills',
      description: 'Build leadership capabilities to prepare for management roles',
      milestones: [
        'Complete leadership assessment',
        'Enroll in leadership development program',
        'Seek mentorship from senior leader',
        'Lead a project or initiative',
        'Practice public speaking and presentation',
        'Apply for leadership role or promotion',
      ],
    },
  },
];

// NOTE: This component has been replaced by GoalTemplatesStrip.tsx
// Keeping this file for the goalTemplates data export used by GoalForm and other components
