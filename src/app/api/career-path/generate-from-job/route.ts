import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { api } from 'convex/_generated/api'
import { checkPremiumAccess } from '@/lib/subscription-server'
import { convexServer } from '@/lib/convex-server';
import {
  GenerateCareerPathInputSchema,
  OpenAICareerPathOutputSchema,
  ProfileGuidanceResponse,
  QualityCheckResult,
  QualityFailureReason,
} from '@/lib/career-path/types'
import {
  mapAiCareerPathToUI,
  MapperResult,
} from '@/lib/career-path/mappers'
import {
  logGenerationAttempt,
  logGenerationSuccess,
  logQualityFailure,
  logFallbackToGuidance,
  buildQualitySuccess,
  buildQualityFailure,
  startTimer,
  logStructuredError,
} from '@/lib/career-path/telemetry'

export const runtime = 'nodejs'

type SkillLevel = 'basic' | 'intermediate' | 'advanced'
type StageLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
type GrowthPotential = 'low' | 'medium' | 'high'

type StageData = {
  title: string
  level: StageLevel
  salaryRange: string
  yearsExperience: string
  skills: Array<{ name: string; level: SkillLevel }>
  description: string
  growthPotential: GrowthPotential
  icon: string
}

type StageNode = StageData & { id: string }

type TemplateContext = {
  rawTitle: string
  normalizedTitle: string
  targetRole: string
  baseRole: string
  targetLevel: StageLevel
  domain: string
  isManager: boolean
  isExecutive: boolean
  keywords: string[]
  keywordSet: Set<string>
}

type StageFactory = (ctx: TemplateContext) => StageData
type CareerPathTemplate = {
  domain: string
  keywords: string[]
  qualityKeywords?: string[]
  minKeywordMatches?: number
  promptExamples?: string[]
  name: (ctx: TemplateContext) => string
  stages: StageFactory[]
  targetStage: StageFactory
}

type CareerPath = {
  id: string
  name: string
  nodes: StageNode[]
}

const salaryByLevel: Record<StageLevel, string> = {
  entry: '$50,000 - $75,000',
  mid: '$75,000 - $110,000',
  senior: '$110,000 - $150,000',
  lead: '$140,000 - $190,000',
  executive: '$190,000+',
}

const experienceByLevel: Record<StageLevel, string> = {
  entry: '0-2 years',
  mid: '2-5 years',
  senior: '5-8 years',
  lead: '8-12 years',
  executive: '12+ years',
}

const levelPrefixPattern = /^(senior|sr\.?|junior|jr\.?|lead|principal|staff|associate|assistant|apprentice|mid-level|midlevel|mid level|entry-level|entry level)\s+/i

const domainDisplayNames: Record<string, string> = {
  software: 'Engineering',
  data: 'Data & Analytics',
  product: 'Product Management',
  design: 'Design',
  marketing: 'Marketing',
  sales: 'Sales',
  security: 'Security',
  people: 'People Operations',
  finance: 'Finance',
  operations: 'Operations',
  general: 'Career',
}

const domainSkillRecommendations: Record<string, string[]> = {
  software: ['System Architecture', 'Engineering Leadership', 'Technical Strategy'],
  data: ['Advanced Analytics', 'Experimentation', 'Business Insight'],
  product: ['Portfolio Roadmapping', 'Customer Discovery', 'Experiment Design'],
  design: ['Experience Strategy', 'Design Systems', 'Stakeholder Workshops'],
  marketing: ['Growth Strategy', 'Brand Positioning', 'Revenue Planning'],
  sales: ['Enterprise Deal Strategy', 'Pipeline Forecasting', 'Team Coaching'],
  security: ['Risk Governance', 'Incident Response', 'Security Architecture'],
  people: ['Talent Strategy', 'Org Design', 'Change Management'],
  finance: ['Strategic Finance', 'Scenario Modeling', 'Stakeholder Reporting'],
  operations: ['Program Leadership', 'Cross-Functional Alignment', 'Process Optimization'],
  general: ['Career Storytelling', 'Stakeholder Alignment', 'Strategic Planning'],
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

const toTitleCase = (value: string) => {
  // Words that should stay lowercase in title case (unless first word)
  const lowercase = new Set(['of', 'at', 'by', 'in', 'on', 'to', 'up', 'and', 'but', 'or', 'for', 'nor', 'yet', 'so', 'the', 'a', 'an'])

  return value
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      if (!word) return ''
      const clean = word.replace(/[^a-z0-9/+-]/gi, '')
      const lowerWord = clean.toLowerCase()

      // First word always capitalized, even if it's a preposition
      if (index === 0) {
        return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
      }

      // Keep prepositions/articles lowercase (not acronyms)
      if (lowercase.has(lowerWord)) {
        return lowerWord
      }

      // Uppercase 2-3 letter acronyms (IT, HR, VP, etc.) but not prepositions
      if (clean.length <= 3 && /^[a-z]+$/i.test(clean) && !lowercase.has(lowerWord)) {
        return clean.toUpperCase()
      }

      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')
}

const stripLevelQualifiers = (value: string) => {
  let result = value.trim()
  while (levelPrefixPattern.test(result)) {
    result = result.replace(levelPrefixPattern, '')
  }
  result = result.replace(/\b(i{1,3}|iv|v)\b$/i, '').trim()
  return result || value.trim()
}

const inferLevelFromTitle = (value: string): StageLevel => {
  const lower = value.toLowerCase()
  if (
    /chief|c[eoif]o\b|vice president|vp\b|president|founder|partner/.test(
      lower,
    )
  )
    return 'executive'
  if (/\bhead\b|\bdirector\b/.test(lower)) return 'lead'
  if (/\b(manager|lead|principal|architect|staff)\b/.test(lower)) return 'lead'
  if (/\b(senior|sr\.?|iii|iv)\b/.test(lower)) return 'senior'
  if (/\b(mid|ii)\b/.test(lower)) return 'mid'
  if (/\b(junior|jr\.?|assistant|associate|intern|entry)\b/.test(lower))
    return 'entry'
  return 'mid'
}

const dedupeTitle = (candidate: string, ctx: TemplateContext, fallback: string) =>
  candidate.trim().toLowerCase() === ctx.targetRole.toLowerCase()
    ? fallback
    : candidate

const createContext = (jobTitle: string, domain: string): TemplateContext => {
  const rawTitle = jobTitle.trim()
  const normalizedTitle = rawTitle.toLowerCase()
  const keywords = normalizedTitle
    .split(/[^a-z0-9]+/i)
    .filter(Boolean)
    .map((v) => v.toLowerCase())
  const keywordSet = new Set(keywords)

  const targetRole = toTitleCase(rawTitle || 'Target Role')
  const baseRoleRaw = stripLevelQualifiers(rawTitle || '')
  const baseRole = toTitleCase(baseRoleRaw || targetRole)
  const targetLevel = inferLevelFromTitle(rawTitle)
  const isExecutive = /chief|c[eoif]o\b|vice president|vp\b|president|founder/.test(
    normalizedTitle,
  )
  const isManager =
    isExecutive ||
    /\b(manager|lead|principal|architect|staff|director|head)\b/.test(normalizedTitle)

  return {
    rawTitle,
    normalizedTitle,
    targetRole,
    baseRole,
    targetLevel,
    domain,
    isManager,
    isExecutive,
    keywords,
    keywordSet,
  }
}

const parseSkills = (rawSkills: unknown): string[] => {
  if (!rawSkills) return []
  if (Array.isArray(rawSkills)) {
    return rawSkills
      .map((skill) => String(skill || '').trim())
      .filter(Boolean)
      .map((skill) => skill.toLowerCase())
  }
  if (typeof rawSkills === 'string') {
    return rawSkills
      .split(/,|;|\n/)
      .map((skill) => skill.trim())
      .filter(Boolean)
      .map((skill) => skill.toLowerCase())
  }
  return []
}

const extractWorkHistory = (raw: unknown): Array<{ title?: string; company?: string; description?: string }> => {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item: any) => ({
    title: String(item?.role || item?.title || '').trim(),
    company: item?.company ? String(item.company).trim() : undefined,
    description: item?.summary ? String(item.summary).trim() : item?.description ? String(item.description).trim() : undefined,
  }))
}

const hasDomainKeywords = (text: string, keywords: string[]): boolean => {
  const lower = text.toLowerCase()
  return keywords.some((keyword) => lower.includes(keyword))
}

const detectSoftwareSpecialization = (ctx: TemplateContext) => {
  const t = ctx.normalizedTitle
  if (t.includes('front-end') || t.includes('frontend') || t.includes('ui'))
    return {
      label: 'Frontend Engineer',
      early: 'Front-End Developer',
      advancedIC: 'Senior Frontend Engineer',
    }
  if (t.includes('back-end') || t.includes('backend') || t.includes('api'))
    return {
      label: 'Backend Engineer',
      early: 'Backend Developer',
      advancedIC: 'Senior Backend Engineer',
    }
  if (t.includes('mobile') || t.includes('ios') || t.includes('android'))
    return {
      label: 'Mobile Engineer',
      early: 'Mobile Application Developer',
      advancedIC: 'Senior Mobile Engineer',
    }
  if (t.includes('devops') || t.includes('infrastructure') || t.includes('platform'))
    return {
      label: 'DevOps Engineer',
      early: 'DevOps Engineer',
      advancedIC: 'Senior DevOps Engineer',
    }
  if (
    t.includes('qa') ||
    t.includes('quality assurance') ||
    t.includes('test') ||
    t.includes('sdet')
  )
    return {
      label: 'QA Engineer',
      early: 'Quality Assurance Engineer',
      advancedIC: 'Senior QA Engineer',
    }
  return {
    label: 'Software Engineer',
    early: 'Software Developer I',
    advancedIC: 'Senior Software Engineer',
  }
}

const softwareTemplate: CareerPathTemplate = {
  domain: 'software',
  keywords: [
    'software',
    'developer',
    'engineer',
    'frontend',
    'front-end',
    'backend',
    'back-end',
    'fullstack',
    'full-stack',
    'mobile',
    'ios',
    'android',
    'qa',
    'sdet',
    'devops',
    'platform',
  ],
  qualityKeywords: [
    'software',
    'developer',
    'engineering',
    'engineer',
    'frontend',
    'backend',
    'full stack',
    'mobile',
    'devops',
    'qa',
    'platform',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'IT Support Specialist',
    'Software Developer',
    'Senior Software Engineer',
    'Director of Engineering',
  ],
  name: (ctx) => `${ctx.baseRole} Career Roadmap`,
  stages: [
    () => ({
      title: 'IT Support Specialist',
      level: 'entry',
      salaryRange: '$45,000 - $60,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Troubleshooting', level: 'basic' },
        { name: 'Customer Empathy', level: 'basic' },
      ],
      description:
        'Resolve frontline technical issues to build debugging instincts and user empathy.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => {
      const spec = detectSoftwareSpecialization(ctx)
      const title = dedupeTitle(
        spec.early,
        ctx,
        spec.label === 'Software Engineer' ? 'Application Developer' : spec.label,
      )
      return {
        title,
        level: 'entry',
        salaryRange: '$65,000 - $90,000',
        yearsExperience: '1-3 years',
        skills: [
          { name: 'Core Programming', level: 'basic' },
          { name: 'Version Control', level: 'basic' },
        ],
        description:
          'Ship scoped features with mentorship, practicing agile rituals and code reviews.',
        growthPotential: 'high',
        icon: 'cpu',
      }
    },
    (ctx) => {
      const spec = detectSoftwareSpecialization(ctx)
      let baseTitle: string
      if (ctx.isExecutive) {
        baseTitle = 'Director of Engineering'
      } else if (ctx.isManager) {
        baseTitle = `Senior ${spec.label}`
      } else {
        switch (ctx.targetLevel) {
          case 'senior':
            baseTitle = spec.label
            break
          case 'lead':
            baseTitle = `Senior ${spec.label}`
            break
          case 'mid':
            baseTitle =
              spec.label === 'Software Engineer'
                ? 'Associate Software Engineer'
                : `Associate ${spec.label}`
            break
          case 'entry':
            baseTitle =
              spec.label === 'Software Engineer'
                ? 'Software Developer I'
                : spec.early
            break
          default:
            baseTitle = `Advanced ${spec.label}`
        }
      }
      const fallback = ctx.isExecutive
        ? 'Engineering Program Lead'
        : ctx.isManager
          ? 'Technical Lead'
          : `Advanced ${spec.label}`
      const title = dedupeTitle(baseTitle, ctx, fallback)
      const level: StageLevel = ctx.isExecutive
        ? 'lead'
        : ctx.isManager
          ? 'senior'
          : ctx.targetLevel === 'lead'
            ? 'senior'
            : ctx.targetLevel === 'senior'
              ? 'mid'
              : ctx.targetLevel === 'mid'
                ? 'mid'
                : 'entry'
      const yearsExperience =
        level === 'entry'
          ? '2-3 years'
          : level === 'mid'
            ? '3-5 years'
            : level === 'senior'
              ? '5-7 years'
              : '7-10 years'
      const salaryRange =
        level === 'entry'
          ? '$70,000 - $90,000'
          : level === 'mid'
            ? '$90,000 - $120,000'
            : level === 'senior'
              ? '$115,000 - $150,000'
              : '$130,000 - $175,000'
      return {
        title,
        level,
        salaryRange,
        yearsExperience,
        skills: [
          {
            name: ctx.isManager || ctx.isExecutive ? 'Team Leadership' : 'System Design',
            level: 'intermediate',
          },
          { name: 'Cross-Functional Collaboration', level: 'intermediate' },
        ],
        description: ctx.isManager || ctx.isExecutive
          ? 'Mentor engineers, coordinate delivery, and partner with product as you prepare for people leadership.'
          : `Own core ${spec.label.toLowerCase()} features, drive quality, and model best practices to earn broader ownership.`,
        growthPotential: 'high',
        icon: 'layers',
      }
    },
  ],
  targetStage: (ctx) => {
    const spec = detectSoftwareSpecialization(ctx)
    const level = ctx.targetLevel === 'entry' ? 'mid' : ctx.targetLevel
    const salary =
      ctx.isExecutive
        ? '$180,000 - $230,000'
        : ctx.isManager
          ? '$140,000 - $190,000'
          : '$120,000 - $165,000'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isManager || ctx.isExecutive ? 'People Leadership' : 'System Architecture',
          level: 'advanced',
        },
        {
          name: 'Stakeholder Communication',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isManager || ctx.isExecutive
        ? `Set strategy, balance delivery, and scale teams to achieve ${spec.label.toLowerCase()} outcomes.`
        : `Deliver high-impact ${spec.label.toLowerCase()} systems, mentor engineers, and drive technical excellence.`,
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'linechart',
    }
  },
}

const dataTemplate: CareerPathTemplate = {
  domain: 'data',
  keywords: [
    'data',
    'analytics',
    'scientist',
    'bi analyst',
    'business intelligence',
    'machine learning',
    'ml',
    'ai',
    'statistician',
  ],
  qualityKeywords: [
    'data',
    'analytics',
    'analysis',
    'scientist',
    'science',
    'machine learning',
    'ml',
    'ai',
    'business intelligence',
    'bi',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Data Analyst Intern',
    'Business Intelligence Analyst',
    'Senior Data Scientist',
    'Director of Data Science',
  ],
  name: (ctx) => `${ctx.baseRole} Analytics Path`,
  stages: [
    () => ({
      title: 'Data Analyst Intern',
      level: 'entry',
      salaryRange: '$50,000 - $60,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'SQL', level: 'basic' },
        { name: 'Data Visualization', level: 'basic' },
      ],
      description:
        'Clean datasets, build dashboards, and answer directional business questions.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Business Intelligence Analyst', ctx, 'Operations Data Analyst'),
      level: 'entry',
      salaryRange: '$65,000 - $85,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'ETL Pipelines', level: 'basic' },
        { name: 'Stakeholder Requirements', level: 'intermediate' },
      ],
      description:
        'Model data sources, automate reporting, and partner with business teams on metrics.',
      growthPotential: 'high',
      icon: 'database',
    }),
    (ctx) => {
      const lower = ctx.normalizedTitle
      let baseTitle: string
      if (ctx.isExecutive) {
        baseTitle = 'Director of Data Science'
      } else if (lower.includes('director') || lower.includes('head')) {
        baseTitle = 'Senior Data Scientist'
      } else if (lower.includes('lead') || lower.includes('principal')) {
        baseTitle = 'Data Scientist'
      } else if (lower.includes('senior') && lower.includes('analyst')) {
        baseTitle = 'Analytics Manager'
      } else if (lower.includes('scientist')) {
        baseTitle = 'Senior Data Analyst'
      } else if (lower.includes('engineer')) {
        baseTitle = 'Data Engineer II'
      } else if (lower.includes('analyst')) {
        baseTitle = 'Analytics Engineer'
      } else {
        baseTitle = 'Insights Analyst'
      }
      const fallback = ctx.isExecutive
        ? 'Analytics Program Lead'
        : 'Senior Data Specialist'
      const title = dedupeTitle(baseTitle, ctx, fallback)
      const level: StageLevel = ctx.isExecutive
        ? 'lead'
        : lower.includes('director') || lower.includes('head')
          ? 'senior'
          : lower.includes('lead') || lower.includes('principal')
            ? 'senior'
            : lower.includes('senior') && lower.includes('analyst')
              ? 'senior'
              : 'mid'
      const salaryRange =
        level === 'mid'
          ? '$85,000 - $115,000'
          : level === 'senior'
            ? '$110,000 - $145,000'
            : '$130,000 - $175,000'
      const yearsExperience =
        level === 'mid'
          ? '3-5 years'
          : level === 'senior'
            ? '5-7 years'
            : '7-10 years'
      return {
        title,
        level,
        salaryRange,
        yearsExperience,
        skills: [
          {
            name:
              ctx.isExecutive || lower.includes('director') || lower.includes('head')
                ? 'Analytics Leadership'
                : lower.includes('engineer')
                  ? 'Data Pipeline Design'
                  : 'Model Deployment',
            level: 'intermediate',
          },
          { name: 'Experiment Design', level: 'intermediate' },
        ],
        description:
          ctx.isExecutive || lower.includes('director') || lower.includes('head')
            ? 'Direct data scientists, prioritize experimentation, and convert insights into company strategy.'
            : 'Own advanced analytics deliverables, operationalize models, and influence data-driven decisions.',
        growthPotential: 'high',
        icon: 'lightbulb',
      }
    },
  ],
  targetStage: (ctx) => {
    const level = ctx.targetLevel === 'entry' ? 'mid' : ctx.targetLevel
    const salary =
      ctx.isExecutive
        ? '$185,000 - $240,000'
        : ctx.isManager
          ? '$140,000 - $190,000'
          : '$115,000 - $160,000'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isManager || ctx.isExecutive ? 'Insight Storytelling' : 'Advanced Modeling',
          level: 'advanced',
        },
        {
          name: 'Data Governance',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isManager || ctx.isExecutive
        ? 'Define data strategy, mentor teams, and align analytics initiatives to company goals.'
        : 'Deliver sophisticated analyses, create production-ready models, and influence product bets.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'linechart',
    }
  },
}

const productTemplate: CareerPathTemplate = {
  domain: 'product',
  keywords: [
    'product',
    'pm',
    'product manager',
    'product owner',
    'product lead',
    'product director',
  ],
  qualityKeywords: [
    'product',
    'pm',
    'product manager',
    'product owner',
    'roadmap',
    'portfolio',
    'product lead',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Product Research Assistant',
    'Business Analyst',
    'Product Manager',
    'Director of Product',
  ],
  name: (ctx) => `${ctx.baseRole} Launch Plan`,
  stages: [
    () => ({
      title: 'Product Research Assistant',
      level: 'entry',
      salaryRange: '$50,000 - $65,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'User Interviews', level: 'basic' },
        { name: 'Competitive Analysis', level: 'basic' },
      ],
      description:
        'Partner with product teams to capture user insights, competitive signals, and discovery artifacts.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Business Analyst', ctx, 'Product Analyst'),
      level: 'entry',
      salaryRange: '$65,000 - $85,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Requirements Gathering', level: 'intermediate' },
        { name: 'Data-Informed Decisions', level: 'basic' },
      ],
      description:
        'Translate qualitative and quantitative findings into backlog priorities and baseline metrics.',
      growthPotential: 'high',
      icon: 'book',
    }),
    (ctx) => {
      const lower = ctx.normalizedTitle
      let baseTitle: string
      if (ctx.isExecutive) {
        baseTitle = 'Director of Product'
      } else if (lower.includes('director') || lower.includes('head')) {
        baseTitle = 'Senior Product Manager'
      } else if (
        lower.includes('senior') ||
        lower.includes('principal') ||
        lower.includes('group')
      ) {
        baseTitle = 'Product Manager'
      } else if (lower.includes('associate') || ctx.targetLevel === 'entry') {
        baseTitle = 'Product Analyst'
      } else {
        baseTitle = 'Associate Product Manager'
      }
      const fallback = ctx.isExecutive
        ? 'Product Portfolio Lead'
        : 'Product Strategist'
      const title = dedupeTitle(baseTitle, ctx, fallback)

      const level: StageLevel = ctx.isExecutive
        ? 'lead'
        : lower.includes('director') || lower.includes('head')
          ? 'senior'
          : lower.includes('senior') || lower.includes('principal') || lower.includes('group')
            ? 'mid'
            : lower.includes('associate') || ctx.targetLevel === 'entry'
              ? 'entry'
              : 'mid'

      const salaryRange =
        level === 'entry'
          ? '$70,000 - $85,000'
          : level === 'mid'
            ? '$85,000 - $115,000'
            : level === 'senior'
              ? '$110,000 - $140,000'
              : '$130,000 - $170,000'

      const yearsExperience =
        level === 'entry'
          ? '1-3 years'
          : level === 'mid'
            ? '3-5 years'
            : level === 'senior'
              ? '5-7 years'
              : '7-10 years'

      return {
        title,
        level,
        salaryRange,
        yearsExperience,
        skills: [
          { name: 'Roadmapping', level: 'intermediate' },
          {
            name:
              ctx.isExecutive || lower.includes('director') || lower.includes('head')
                ? 'Cross-Functional Leadership'
                : 'Experimentation',
            level: 'intermediate',
          },
        ],
        description:
          ctx.isExecutive || lower.includes('director') || lower.includes('head')
            ? 'Lead strategic planning, mentor PMs, and establish portfolio-wide success metrics.'
            : 'Shape backlog priorities, synthesize research into insights, and deliver iterative value with the squad.',
        growthPotential: 'high',
        icon: 'layers',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$190,000 - $250,000'
        : ctx.isManager
          ? '$140,000 - $195,000'
          : '$110,000 - $150,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'mid'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Portfolio Strategy' : 'Outcome Prioritization',
          level: 'advanced',
        },
        {
          name: 'Executive Communication',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Shape product portfolio vision, align org strategy, and guide leaders to execute flawlessly.'
        : 'Lead cross-functional squads, set roadmaps anchored in customer value, and deliver measurable impact.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'briefcase',
    }
  },
}

const designTemplate: CareerPathTemplate = {
  domain: 'design',
  keywords: ['design', 'designer', 'ux', 'ui', 'product design', 'visual', 'interaction'],
  qualityKeywords: [
    'design',
    'designer',
    'ux',
    'ui',
    'product',
    'experience',
    'visual',
    'interaction',
    'creative',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Design Apprentice',
    'UX/UI Designer',
    'Senior Product Designer',
    'Director of Design',
  ],
  name: (ctx) => `${ctx.baseRole} Design Journey`,
  stages: [
    () => ({
      title: 'Design Apprentice',
      level: 'entry',
      salaryRange: '$45,000 - $60,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Figma', level: 'basic' },
        { name: 'Design Critique', level: 'basic' },
      ],
      description:
        'Support senior designers with asset production, design QA, and foundational research exposure.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('UX/UI Designer', ctx, 'Product Designer'),
      level: 'entry',
      salaryRange: '$65,000 - $85,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Interaction Design', level: 'intermediate' },
        { name: 'Design Systems', level: 'basic' },
      ],
      description:
        'Design end-to-end experiences, run usability tests, and partner with engineering on implementation.',
      growthPotential: 'high',
      icon: 'lightbulb',
    }),
    (ctx) => {
      const isLeadership = ctx.isManager || ctx.isExecutive
      const baseTitle = isLeadership ? 'Design Lead' : 'Senior Product Designer'
      const title = dedupeTitle(baseTitle, ctx, 'Principal Product Designer')
      return {
        title,
        level: isLeadership ? 'senior' : 'senior',
        salaryRange: '$95,000 - $130,000',
        yearsExperience: '3-6 years',
        skills: [
          { name: 'Design Systems', level: 'intermediate' },
          {
            name: isLeadership ? 'Creative Direction' : 'Cross-Functional Facilitation',
            level: 'intermediate',
          },
        ],
        description: isLeadership
          ? 'Provide creative direction, align design strategy with product, and mentor the design team.'
          : 'Own complex product surfaces, synthesize research insights, and elevate visual systems.',
        growthPotential: 'high',
        icon: 'layers',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$170,000 - $220,000'
        : ctx.isManager
          ? '$125,000 - $170,000'
          : '$100,000 - $140,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'mid'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Org Leadership' : 'Experience Strategy',
          level: 'advanced',
        },
        {
          name: 'Stakeholder Alignment',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Lead multidisciplinary design teams, scale operations, and advocate for human-centered strategy at the exec table.'
        : 'Shape product vision with design thinking, mentor designers, and champion user advocacy.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'linechart',
    }
  },
}

const marketingTemplate: CareerPathTemplate = {
  domain: 'marketing',
  keywords: ['marketing', 'growth', 'content', 'brand', 'demand', 'communications'],
  qualityKeywords: [
    'marketing',
    'brand',
    'growth',
    'demand',
    'content',
    'communications',
    'campaign',
    'go-to-market',
    'digital',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Marketing Coordinator',
    'Digital Marketing Specialist',
    'Growth Marketing Manager',
    'Vice President of Marketing',
  ],
  name: (ctx) => `${ctx.baseRole} Growth Track`,
  stages: [
    () => ({
      title: 'Marketing Coordinator',
      level: 'entry',
      salaryRange: '$45,000 - $58,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Campaign Execution', level: 'basic' },
        { name: 'Copywriting', level: 'basic' },
      ],
      description:
        'Run campaign logistics, manage calendars, and measure first-party channels to learn fundamentals.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Digital Marketing Specialist', ctx, 'Content Strategist'),
      level: 'entry',
      salaryRange: '$60,000 - $80,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Marketing Automation', level: 'intermediate' },
        { name: 'Audience Segmentation', level: 'basic' },
      ],
      description:
        'Own channel playbooks, optimize funnels, and collaborate with product marketing on positioning.',
      growthPotential: 'high',
      icon: 'book',
    }),
    (ctx) => {
      const isLeadership = ctx.isManager || ctx.isExecutive
      const baseTitle = isLeadership ? 'Growth Marketing Manager' : 'Lifecycle Marketing Manager'
      const title = dedupeTitle(baseTitle, ctx, 'Demand Generation Manager')
      return {
        title,
        level: 'mid',
        salaryRange: '$85,000 - $115,000',
        yearsExperience: '3-5 years',
        skills: [
          { name: 'Channel Strategy', level: 'intermediate' },
          {
            name: isLeadership ? 'Team Coaching' : 'Experimentation',
            level: 'intermediate',
          },
        ],
        description: isLeadership
          ? 'Own growth OKRs, manage specialists, and align campaigns with revenue goals.'
          : 'Scale lifecycle programs, test messaging hypotheses, and tie tactics to pipeline.',
        growthPotential: 'high',
        icon: 'linechart',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$175,000 - $230,000'
        : ctx.isManager
          ? '$130,000 - $175,000'
          : '$95,000 - $135,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'mid'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Brand Leadership' : 'Integrated Campaigns',
          level: 'advanced',
        },
        {
          name: 'Marketing Analytics',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Define brand strategy, lead revenue partnerships, and guide a portfolio of marketing teams.'
        : 'Drive go-to-market strategy, manage high-performing teams, and prove marketing ROI.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'briefcase',
    }
  },
}

const salesTemplate: CareerPathTemplate = {
  domain: 'sales',
  keywords: ['sales', 'account executive', 'ae', 'business development', 'bdr', 'sdr', 'revenue'],
  qualityKeywords: [
    'sales',
    'account',
    'business development',
    'revenue',
    'customer',
    'pipeline',
    'quota',
    'seller',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Sales Development Representative',
    'Account Executive',
    'Sales Manager',
    'Vice President of Sales',
  ],
  name: (ctx) => `${ctx.baseRole} Revenue Path`,
  stages: [
    () => ({
      title: 'Sales Development Representative',
      level: 'entry',
      salaryRange: '$45,000 - $60,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Prospecting', level: 'basic' },
        { name: 'Cold Outreach', level: 'basic' },
      ],
      description:
        'Source and qualify pipeline, refine messaging, and learn the sales stack fundamentals.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Account Executive', ctx, 'Inside Sales Executive'),
      level: 'mid',
      salaryRange: '$70,000 - $100,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Discovery', level: 'intermediate' },
        { name: 'Deal Management', level: 'intermediate' },
      ],
      description:
        'Own full-cycle deals, tailor demos, and build multi-threaded relationships to close revenue.',
      growthPotential: 'high',
      icon: 'linechart',
    }),
    (ctx) => {
      const lower = ctx.normalizedTitle
      let baseTitle: string
      if (ctx.isExecutive) {
        baseTitle = 'Regional Sales Director'
      } else if (ctx.isManager) {
        baseTitle = 'Senior Account Executive'
      } else if (
        lower.includes('senior') ||
        lower.includes('enterprise') ||
        lower.includes('strategic')
      ) {
        baseTitle = 'Account Executive'
      } else {
        baseTitle = 'Mid-Market Account Executive'
      }
      const fallback = ctx.isExecutive ? 'Sales Program Lead' : 'Enterprise Account Executive'
      const title = dedupeTitle(baseTitle, ctx, fallback)
      const level: StageLevel = ctx.isExecutive
        ? 'lead'
        : ctx.isManager
          ? 'senior'
          : lower.includes('senior') || lower.includes('enterprise') || lower.includes('strategic')
            ? 'mid'
            : 'mid'
      const salaryRange =
        level === 'mid'
          ? '$85,000 - $120,000'
          : level === 'senior'
            ? '$100,000 - $135,000'
            : '$130,000 - $170,000'
      const yearsExperience =
        level === 'mid'
          ? '3-5 years'
          : level === 'senior'
            ? '5-7 years'
            : '7-10 years'
      return {
        title,
        level,
        salaryRange,
        yearsExperience,
        skills: [
          {
            name: ctx.isManager || ctx.isExecutive ? 'Coaching' : 'Enterprise Negotiation',
            level: 'intermediate',
          },
          { name: 'Forecasting', level: 'intermediate' },
        ],
        description:
          ctx.isManager || ctx.isExecutive
            ? 'Lead account executives, forecast accurately, and partner with marketing on pipeline goals.'
            : 'Move up-market, master multi-threaded deals, and establish repeatable closing motions.',
        growthPotential: 'high',
        icon: 'layers',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$185,000 - $260,000'
        : ctx.isManager
          ? '$140,000 - $190,000'
          : '$110,000 - $150,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'senior'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '5-8 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Revenue Strategy' : 'Pipeline Leadership',
          level: 'advanced',
        },
        {
          name: 'Executive Negotiation',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Own company revenue strategy, align GTM leaders, and scale predictable growth motions.'
        : 'Guide sales strategy, manage high-performing teams, and institutionalize best-practice playbooks.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'briefcase',
    }
  },
}

const securityTemplate: CareerPathTemplate = {
  domain: 'security',
  keywords: ['security', 'cyber', 'infosec', 'information security', 'soc', 'cloud security'],
  qualityKeywords: [
    'security',
    'cyber',
    'infosec',
    'information security',
    'soc',
    'threat',
    'incident',
    'risk',
    'governance',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'IT Support Analyst',
    'Security Operations Analyst',
    'Security Engineer',
    'Chief Information Security Officer',
  ],
  name: (ctx) => `${ctx.baseRole} Security Path`,
  stages: [
    () => ({
      title: 'IT Support Analyst',
      level: 'entry',
      salaryRange: '$48,000 - $62,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Endpoint Management', level: 'basic' },
        { name: 'Security Awareness', level: 'basic' },
      ],
      description:
        'Manage endpoint hygiene, respond to basic incidents, and learn security tooling essentials.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('SOC Analyst', ctx, 'Security Operations Analyst'),
      level: 'entry',
      salaryRange: '$65,000 - $85,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Threat Detection', level: 'intermediate' },
        { name: 'Incident Response', level: 'basic' },
      ],
      description:
        'Monitor alerts, triage incidents, and collaborate with engineering on containment plans.',
      growthPotential: 'high',
      icon: 'database',
    }),
    (ctx) => {
      const isLeadership = ctx.isManager || ctx.isExecutive
      const baseTitle = isLeadership ? 'Security Engineering Lead' : 'Security Engineer'
      const title = dedupeTitle(baseTitle, ctx, 'Security Specialist II')
      const level: StageLevel = isLeadership ? 'senior' : 'mid'
      return {
        title,
        level,
        salaryRange: isLeadership ? '$110,000 - $145,000' : '$95,000 - $125,000',
        yearsExperience: level === 'mid' ? '3-5 years' : '5-7 years',
        skills: [
          {
            name: isLeadership ? 'Security Program Leadership' : 'Threat Modeling',
            level: 'intermediate',
          },
          { name: 'Compliance Frameworks', level: 'intermediate' },
        ],
        description: isLeadership
          ? 'Direct detection and response programs, mentor analysts, and own security roadmap delivery.'
          : 'Engineer secure architectures, run pen tests, and embed security into product delivery.',
        growthPotential: 'high',
        icon: 'lightbulb',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$190,000 - $250,000'
        : ctx.isManager
          ? '$140,000 - $190,000'
          : '$115,000 - $155,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'senior'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Security Governance' : 'Advanced Incident Response',
          level: 'advanced',
        },
        {
          name: 'Risk Management',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Own enterprise security posture, align with executives, and orchestrate risk mitigation programs.'
        : 'Lead security initiatives, evangelize secure-by-default practices, and manage incident lifecycle.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'linechart',
    }
  },
}

const peopleTemplate: CareerPathTemplate = {
  domain: 'people',
  keywords: ['people', 'talent', 'recruiting', 'hr', 'human resources', 'people ops'],
  qualityKeywords: [
    'people',
    'talent',
    'recruit',
    'hr',
    'human resource',
    'people operations',
    'people ops',
    'employee',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'HR Coordinator',
    'People Operations Specialist',
    'HR Business Partner',
    'Vice President of People',
  ],
  name: (ctx) => `${ctx.baseRole} People Ops Path`,
  stages: [
    () => ({
      title: 'HR Coordinator',
      level: 'entry',
      salaryRange: '$45,000 - $58,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Employee Support', level: 'basic' },
        { name: 'HRIS Tools', level: 'basic' },
      ],
      description:
        'Manage onboarding logistics, maintain HR systems, and respond to employee inquiries.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('HR Generalist', ctx, 'People Operations Specialist'),
      level: 'entry',
      salaryRange: '$60,000 - $80,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Policy Development', level: 'intermediate' },
        { name: 'Employee Relations', level: 'basic' },
      ],
      description:
        'Support employee lifecycle, run compliance workflows, and partner with managers on people programs.',
      growthPotential: 'high',
      icon: 'user',
    }),
    (ctx) => {
      const isLeadership = ctx.isManager || ctx.isExecutive
      const baseTitle = isLeadership ? 'People Operations Manager' : 'HR Business Partner'
      const title = dedupeTitle(baseTitle, ctx, 'Senior HR Business Partner')
      return {
        title,
        level: isLeadership ? 'lead' : 'senior',
        salaryRange: isLeadership ? '$95,000 - $125,000' : '$85,000 - $110,000',
        yearsExperience: '3-6 years',
        skills: [
          {
            name: isLeadership ? 'Program Ownership' : 'Strategic Advising',
            level: 'intermediate',
          },
          { name: 'Change Management', level: 'intermediate' },
        ],
        description: isLeadership
          ? 'Lead people programs, steward culture initiatives, and partner with execs on headcount plans.'
          : 'Advise leaders on talent strategy, manage org design conversations, and drive engagement plans.',
        growthPotential: 'high',
        icon: 'layers',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$170,000 - $230,000'
        : ctx.isManager
          ? '$120,000 - $165,000'
          : '$95,000 - $130,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'senior'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Org Strategy' : 'Talent Strategy',
          level: 'advanced',
        },
        {
          name: 'Employee Advocacy',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Set people vision, partner with the exec team on culture, and scale equitable programs.'
        : 'Drive strategic people initiatives, advise leaders, and ensure healthy employee experiences.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'briefcase',
    }
  },
}

const financeTemplate: CareerPathTemplate = {
  domain: 'finance',
  keywords: ['finance', 'financial', 'accounting', 'fp&a', 'controller', 'analyst', 'auditor'],
  qualityKeywords: [
    'finance',
    'financial',
    'accounting',
    'analyst',
    'fp&a',
    'controller',
    'audit',
    'treasury',
    'budget',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Finance Analyst Intern',
    'Financial Analyst',
    'Finance Manager',
    'Chief Financial Officer',
  ],
  name: (ctx) => `${ctx.baseRole} Finance Track`,
  stages: [
    () => ({
      title: 'Finance Analyst Intern',
      level: 'entry',
      salaryRange: '$48,000 - $60,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Excel Modeling', level: 'basic' },
        { name: 'GAAP Basics', level: 'basic' },
      ],
      description:
        'Support budgeting cycles, reconcile accounts, and build foundational financial models.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Financial Analyst', ctx, 'Staff Accountant'),
      level: 'mid',
      salaryRange: '$65,000 - $85,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Forecasting', level: 'intermediate' },
        { name: 'Financial Reporting', level: 'basic' },
      ],
      description:
        'Own budget vs. actuals, partner with business units, and produce monthly financial packages.',
      growthPotential: 'high',
      icon: 'book',
    }),
    (ctx) => {
      const isLeadership = ctx.isManager || ctx.isExecutive
      const baseTitle = isLeadership ? 'Finance Manager' : 'Senior Financial Analyst'
      const title = dedupeTitle(baseTitle, ctx, 'FP&A Lead')
      return {
        title,
        level: isLeadership ? 'lead' : 'senior',
        salaryRange: isLeadership ? '$100,000 - $135,000' : '$90,000 - $120,000',
        yearsExperience: '3-6 years',
        skills: [
          {
            name: isLeadership ? 'Team Management' : 'Scenario Modeling',
            level: 'intermediate',
          },
          { name: 'Stakeholder Communication', level: 'intermediate' },
        ],
        description: isLeadership
          ? 'Lead planning cycles, manage analysts, and align forecasts with strategic objectives.'
          : 'Model scenarios, influence investment decisions, and advise on financial performance.',
        growthPotential: 'high',
        icon: 'linechart',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$190,000 - $260,000'
        : ctx.isManager
          ? '$135,000 - $180,000'
          : '$110,000 - $145,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'senior'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Capital Strategy' : 'Advanced Forecasting',
          level: 'advanced',
        },
        {
          name: 'Regulatory Compliance',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Steer capital allocation, guide executive decision-making, and ensure financial governance.'
        : 'Drive financial strategy, lead planning rituals, and own executive-ready reporting.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'briefcase',
    }
  },
}

const operationsTemplate: CareerPathTemplate = {
  domain: 'operations',
  keywords: [
    'operations',
    'program',
    'project',
    'project manager',
    'program manager',
    'chief of staff',
    'business operations',
    'strategy',
  ],
  qualityKeywords: [
    'operations',
    'program',
    'project',
    'delivery',
    'strategy',
    'chief of staff',
    'business operations',
    'process',
  ],
  minKeywordMatches: 3,
  promptExamples: [
    'Operations Coordinator',
    'Project Coordinator',
    'Program Manager',
    'Head of Operations',
  ],
  name: (ctx) => `${ctx.baseRole} Delivery Track`,
  stages: [
    () => ({
      title: 'Operations Coordinator',
      level: 'entry',
      salaryRange: '$45,000 - $60,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Process Documentation', level: 'basic' },
        { name: 'Stakeholder Support', level: 'basic' },
      ],
      description:
        'Own meeting cadences, document processes, and support project logistics to learn ops fundamentals.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Project Coordinator', ctx, 'Operations Analyst'),
      level: 'entry',
      salaryRange: '$60,000 - $80,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Project Planning', level: 'intermediate' },
        { name: 'Risk Tracking', level: 'basic' },
      ],
      description:
        'Scope initiatives, manage timelines, and communicate status to stakeholders across teams.',
      growthPotential: 'high',
      icon: 'book',
    }),
    (ctx) => {
      const isLeadership = ctx.isManager || ctx.isExecutive
      const baseTitle = isLeadership ? 'Program Manager' : 'Operations Manager'
      const title = dedupeTitle(baseTitle, ctx, 'Business Operations Manager')
      return {
        title,
        level: isLeadership ? 'lead' : 'mid',
        salaryRange: '$90,000 - $125,000',
        yearsExperience: '3-6 years',
        skills: [
          {
            name: isLeadership ? 'Portfolio Management' : 'Process Optimization',
            level: 'intermediate',
          },
          { name: 'Cross-Functional Influence', level: 'intermediate' },
        ],
        description: isLeadership
          ? 'Lead complex programs, manage cross-team dependencies, and align delivery with strategy.'
          : 'Streamline operations, analyze performance, and drive continuous improvement efforts.',
        growthPotential: 'high',
        icon: 'layers',
      }
    },
  ],
  targetStage: (ctx) => {
    const salary =
      ctx.isExecutive
        ? '$185,000 - $250,000'
        : ctx.isManager
          ? '$130,000 - $180,000'
          : '$100,000 - $140,000'
    const level =
      ctx.isExecutive ? 'executive' : ctx.isManager ? 'lead' : ctx.targetLevel || 'senior'
    const experience =
      ctx.isExecutive ? '12+ years' : ctx.isManager ? '7-10 years' : '4-7 years'
    return {
      title: ctx.targetRole,
      level,
      salaryRange: salary,
      yearsExperience: experience,
      skills: [
        {
          name: ctx.isExecutive ? 'Strategic Planning' : 'Portfolio Prioritization',
          level: 'advanced',
        },
        {
          name: 'Executive Communication',
          level: ctx.isExecutive ? 'advanced' : 'intermediate',
        },
      ],
      description: ctx.isExecutive
        ? 'Shape operational strategy, align leadership, and drive company-wide execution excellence.'
        : 'Lead mission-critical programs, balance resources, and deliver predictable outcomes.',
      growthPotential: ctx.isExecutive ? 'medium' : 'high',
      icon: ctx.isExecutive ? 'award' : 'briefcase',
    }
  },
}

const templates: CareerPathTemplate[] = [
  softwareTemplate,
  dataTemplate,
  productTemplate,
  designTemplate,
  marketingTemplate,
  salesTemplate,
  securityTemplate,
  peopleTemplate,
  financeTemplate,
  operationsTemplate,
]

const defaultTemplate: CareerPathTemplate = {
  domain: 'general',
  keywords: [],
  minKeywordMatches: 0,
  name: (ctx) => `${ctx.baseRole} Development Path`,
  stages: [
    () => ({
      title: 'Industry Apprentice',
      level: 'entry',
      salaryRange: '$45,000 - $58,000',
      yearsExperience: '0-1 years',
      skills: [
        { name: 'Professional Foundations', level: 'basic' },
        { name: 'Time Management', level: 'basic' },
      ],
      description:
        'Gain exposure to core workflows, shadow senior teammates, and develop foundational craft skills.',
      growthPotential: 'high',
      icon: 'graduation',
    }),
    (ctx) => ({
      title: dedupeTitle('Associate Specialist', ctx, 'Associate Contributor'),
      level: 'entry',
      salaryRange: '$60,000 - $80,000',
      yearsExperience: '1-3 years',
      skills: [
        { name: 'Delivering Independently', level: 'intermediate' },
        { name: 'Feedback Loops', level: 'basic' },
      ],
      description:
        'Execute scoped projects with light guidance, iterate on feedback, and build a portfolio of wins.',
      growthPotential: 'high',
      icon: 'book',
    }),
    (ctx) => ({
      title: dedupeTitle('Senior Specialist', ctx, 'Team Lead Contributor'),
      level: 'senior',
      salaryRange: '$90,000 - $120,000',
      yearsExperience: '3-6 years',
      skills: [
        { name: 'Mentorship', level: 'intermediate' },
        { name: 'Process Improvement', level: 'intermediate' },
      ],
      description:
        'Take ownership of complex initiatives, mentor teammates, and refine team processes.',
      growthPotential: 'high',
      icon: 'layers',
    }),
  ],
  targetStage: (ctx) => ({
    title: ctx.targetRole,
    level: ctx.targetLevel || 'mid',
    salaryRange: salaryByLevel[ctx.targetLevel] || '$100,000 - $140,000',
    yearsExperience: experienceByLevel[ctx.targetLevel] || '4-7 years',
    skills: [
      { name: 'Strategic Impact', level: 'advanced' },
      { name: 'Stakeholder Management', level: 'intermediate' },
    ],
    description:
      'Lead with expertise, deliver measurable outcomes, and act as the go-to partner in your discipline.',
    growthPotential: 'medium',
    icon: 'briefcase',
  }),
}

const selectTemplate = (jobTitle: string): CareerPathTemplate => {
  const normalized = jobTitle.toLowerCase()
  for (const template of templates) {
    if (template.keywords.some((keyword) => normalized.includes(keyword))) {
      return template
    }
  }
  return defaultTemplate
}

const fetchUserProfile = async (clerkId: string) => {
const fetchUserProfile = async (clerkId: string) => {
  try {
    const user = await convexServer.query(api.users.getUserByClerkId, { clerkId })
    return user
  try {
        const user = await convexServer.query(api.users.getUserByClerkId, { clerkId })
    return user
  } catch (error) {
    console.warn('CareerPath failed to fetch user profile', error)
    return null
  }
}

type PromptVariant = 'base' | 'refine'

const buildPrompt = (
  ctx: TemplateContext,
  variant: PromptVariant,
  template: CareerPathTemplate,
) => {
  const domainHint =
    ctx.domain === 'general'
      ? 'Focus on broadly applicable business roles when domain nuances are unclear.'
      : `The target role lives within the ${ctx.domain} discipline—use industry-standard roles from that space.`

  const exampleProgression =
    template.promptExamples && template.promptExamples.length
      ? `Example progression for context: ${template.promptExamples.join(' > ')}. Use this only as inspiration and craft your own realistic sequence.`
      : ''

  const variantAdditions =
    variant === 'refine'
      ? `
Reinforce quality rules:
- The first three stages must be distinct feeder roles that prepare for the target scope. None of them may simply be the target title with modifiers like "Junior", "Mid", "Senior", "Lead", or numerals.
- Keep progression realistic, gradually increasing scope, leadership, or specialization.
- Keep stages ordered from earliest to latest, ending with the exact target role "${ctx.targetRole}".`
      : `
Quality rules:
- Provide four total stages (three feeder roles plus the final target role "${ctx.targetRole}").
- At least two feeder roles must be different job titles that do not include the exact target role string.
- Avoid repeating the same base title with only seniority modifiers.`

  return `You are a career path analyst who designs realistic, data-backed progressions that people actually follow in industry.
Target role: "${ctx.targetRole}"
Base role (without level qualifiers): "${ctx.baseRole}"
${domainHint}
${exampleProgression}

Generate four ordered stages that show how a professional typically grows into this target role. Each stage must include:
- title (distinct, industry-recognizable job title)
- level (entry | mid | senior | lead | executive)
- salaryRange (USD range string)
- yearsExperience (string like "3-5 years")
- skills (array of 2-3 skill objects with { name, level })
- description (1-2 sentences focused on why this stage matters on the journey)
- growthPotential ("low" | "medium" | "high")
- icon (short identifier such as 'graduation', 'cpu', 'book', 'layers', 'linechart', 'briefcase', 'award', 'lightbulb')

${variantAdditions}

Return strictly valid JSON matching:
{
  "paths": [
    {
      "id": string,
      "name": string,
      "nodes": Array<{
        "id": string,
        "title": string,
        "level": "entry" | "mid" | "senior" | "lead" | "executive",
        "salaryRange": string,
        "yearsExperience": string,
        "skills": Array<{ "name": string, "level": "basic" | "intermediate" | "advanced" }>,
        "description": string,
        "growthPotential": "low" | "medium" | "high",
        "icon": string
      }>
    }
  ]
}`
}

// ============================================================================
// QUALITY VALIDATION CONSTANTS
// ============================================================================
// These thresholds balance success rate with output quality. All values have been
// carefully tuned based on expected AI outputs. Monitor telemetry to adjust.

const QUALITY_THRESHOLDS = {
  // Minimum number of career stages in a path (4-8 is typical)
  MIN_STAGES: 4,

  // Minimum unique titles (avoid "Senior X", "Mid X", "Junior X" as only variance)
  MIN_UNIQUE_TITLES: 3,

  // Minimum feeder roles that differ from target (avoid repetitive paths)
  MIN_UNIQUE_FEEDERS: 2,

  // Maximum feeder roles using target + modifier (avoid "Junior PM", "Senior PM" only)
  MAX_MODIFIER_VARIANTS: 2,

  // Minimum description length (15 chars = "Marketing role." vs 10 = "Some role")
  MIN_DESCRIPTION_LENGTH: 15,

  // Keyword match reduction factor (0.7 = 30% more lenient than template default)
  KEYWORD_REDUCTION_FACTOR: 0.7,
} as const

const allowedLevels = new Set<StageLevel>(['entry', 'mid', 'senior', 'lead', 'executive'])
const allowedSkillLevels = new Set<SkillLevel>(['basic', 'intermediate', 'advanced'])

const evaluatePathQuality = (
  path: any,
  ctx: TemplateContext,
  template: CareerPathTemplate,
): QualityCheckResult => {
  if (!path || !Array.isArray(path.nodes)) {
    return buildQualityFailure('missing_nodes_array', 'Path does not contain nodes array')
  }

  const nodes = path.nodes
  if (nodes.length < QUALITY_THRESHOLDS.MIN_STAGES) {
    return buildQualityFailure(
      'insufficient_stages',
      `Only ${nodes.length} stages provided, need at least ${QUALITY_THRESHOLDS.MIN_STAGES}`
    )
  }

  const normalizedTarget = stripLevelQualifiers(ctx.targetRole).toLowerCase()
  const normalizedTitles = nodes.map((node: any) =>
    stripLevelQualifiers(String(node?.title || '')).toLowerCase(),
  )

  const uniqueTitles = new Set(normalizedTitles)
  if (uniqueTitles.size < Math.min(nodes.length, QUALITY_THRESHOLDS.MIN_UNIQUE_TITLES)) {
    return buildQualityFailure(
      'titles_not_distinct',
      `Only ${uniqueTitles.size} unique titles out of ${nodes.length} stages (need ${QUALITY_THRESHOLDS.MIN_UNIQUE_TITLES})`
    )
  }

  const feederNodes = nodes.slice(0, -1)
  const nonTargetFeederCount = feederNodes.filter((node: any) => {
    const normalized = stripLevelQualifiers(String(node?.title || '')).toLowerCase()
    return normalized !== normalizedTarget
  }).length
  if (nonTargetFeederCount < QUALITY_THRESHOLDS.MIN_UNIQUE_FEEDERS) {
    return buildQualityFailure(
      'insufficient_unique_feeder_roles',
      `Only ${nonTargetFeederCount} unique feeder roles different from target (need ${QUALITY_THRESHOLDS.MIN_UNIQUE_FEEDERS})`
    )
  }

  const genericPrefixPattern = /^(junior|jr\.?|mid|mid-level|senior|sr\.?|lead|ii|iii|iv)\b/i
  const genericMatches = feederNodes.filter((node: any) => {
    const title = String(node?.title || '')
    const normalized = stripLevelQualifiers(title).toLowerCase()
    return normalized === normalizedTarget && genericPrefixPattern.test(title)
  }).length
  if (genericMatches >= QUALITY_THRESHOLDS.MAX_MODIFIER_VARIANTS) {
    return buildQualityFailure(
      'too_many_modifier_based_titles',
      `${genericMatches} feeder roles reuse target title with modifiers (max ${QUALITY_THRESHOLDS.MAX_MODIFIER_VARIANTS})`
    )
  }

  // VALIDATION THRESHOLD: Description minimum length
  // RATIONALE: Reduced from 20 → 15 chars to reduce false rejections while maintaining quality
  // - 20 chars: Too strict, rejected valid short descriptions like "Entry-level position"
  // - 10 chars: Too lenient, allows "Some role" which isn't helpful
  // - 15 chars: Balanced - allows "Marketing role" but rejects "Short desc"
  // TRADE-OFF: Slightly higher success rate while ensuring descriptions are still meaningful
  // TODO: Monitor telemetry - if < 15 char descriptions are common, consider lowering to 12
  const missingDescriptions = nodes.some(
    (node: any) => !node?.description || String(node.description).trim().length < QUALITY_THRESHOLDS.MIN_DESCRIPTION_LENGTH,
  )
  if (missingDescriptions) {
    return buildQualityFailure(
      'descriptions_missing_or_short',
      `One or more descriptions are shorter than ${QUALITY_THRESHOLDS.MIN_DESCRIPTION_LENGTH} characters`
    )
  }

  const invalidLevels = nodes.some(
    (node: any) => !allowedLevels.has(String(node?.level || '').toLowerCase() as StageLevel),
  )
  if (invalidLevels) {
    return buildQualityFailure(
      'invalid_level_values',
      'One or more nodes have invalid level values'
    )
  }

  const invalidSkills = nodes.some((node: any) => {
    if (!Array.isArray(node?.skills) || node.skills.length === 0) return true
    return node.skills.some(
      (skill: any) =>
        !skill ||
        !skill.name ||
        !allowedSkillLevels.has(String(skill.level || '').toLowerCase() as SkillLevel),
    )
  })
  if (invalidSkills) {
    return buildQualityFailure(
      'skills_missing_or_malformed',
      'One or more nodes have missing or malformed skills'
    )
  }

  // VALIDATION THRESHOLD: Domain-specific keyword matching
  // RATIONALE: Reduced strictness by 30% to allow more valid cross-functional career paths
  // - Original: Required 2+ keyword matches (e.g., "marketing", "sales", "digital")
  // - Relaxed: 30% reduction (2 → 1.4 → 1 match) OR template-defined * 0.7
  // EXAMPLES:
  //   - "Marketing Manager" → "Product Manager" → "VP Product" (1 "manager" match = PASS)
  //   - "Junior Dev" → "Senior Dev" → "Tech Lead" (0 specific matches but valid path)
  // TRADE-OFF: Accept more generic paths to reduce false rejections of valid transitions
  // TODO: Monitor 'insufficient_domain_specificity' telemetry - if < 10%, reduce further
  const keywordTargets =
    template.qualityKeywords && template.qualityKeywords.length
      ? template.qualityKeywords
      : template.keywords
  const minKeywordMatches =
    typeof template.minKeywordMatches === 'number'
      ? Math.max(1, Math.floor(template.minKeywordMatches * QUALITY_THRESHOLDS.KEYWORD_REDUCTION_FACTOR))
      : keywordTargets.length
        ? 1 // Reduced from 2
        : 0
  if (minKeywordMatches > 0 && keywordTargets.length > 0) {
    const keywordMatches = nodes.filter((node: any) => {
      const title = String(node?.title || '').toLowerCase()
      return keywordTargets.some((keyword) => title.includes(keyword))
    }).length
    if (keywordMatches < minKeywordMatches) {
      return buildQualityFailure(
        'insufficient_domain_specificity',
        `Only ${keywordMatches} domain-specific roles out of ${nodes.length} (need ${minKeywordMatches})`
      )
    }
  }

  return buildQualitySuccess()
}

const fallbackIcons = ['graduation', 'cpu', 'book', 'layers', 'linechart', 'briefcase', 'award']

const normalizeOpenAIPath = (
  rawPath: any,
  ctx: TemplateContext,
  index: number,
): CareerPath => {
  const baseId = slugify(`${ctx.baseRole}-${index}`)
  const nodes = Array.isArray(rawPath?.nodes) ? rawPath.nodes.slice(0, 5) : []

  const normalizedNodes = nodes.map((node: any, nodeIndex: number) => {
    const safeLevel = allowedLevels.has(String(node?.level || '').toLowerCase() as StageLevel)
      ? (String(node.level).toLowerCase() as StageLevel)
      : (['entry', 'mid', 'senior', 'lead', 'executive'][
          Math.min(nodeIndex, 4)
        ] as StageLevel)

    let skills: Array<{ name: string; level: SkillLevel }> = []
    if (Array.isArray(node?.skills)) {
      skills = node.skills
        .map((skill: any) => {
          const name = String(skill?.name || '').trim()
          const level = String(skill?.level || '').toLowerCase() as SkillLevel
          if (!name || !allowedSkillLevels.has(level)) return null
          return { name, level }
        })
        .filter(
          (
            skill: { name: string; level: SkillLevel } | null,
          ): skill is { name: string; level: SkillLevel } => Boolean(skill),
        )
        .slice(0, 3)
    }
    if (!skills.length) {
      skills = [
        { name: nodeIndex === 0 ? 'Foundational Skills' : 'Strategic Thinking', level: 'basic' },
        { name: 'Collaboration', level: 'intermediate' },
      ]
    }

    const fallbackIcon = fallbackIcons[Math.min(nodeIndex, fallbackIcons.length - 1)]

    return {
      id: String(node?.id || `${baseId}-stage-${nodeIndex + 1}`),
      title: toTitleCase(String(node?.title || `Stage ${nodeIndex + 1}`)),
      level: safeLevel,
      salaryRange:
        typeof node?.salaryRange === 'string' && node.salaryRange.trim()
          ? node.salaryRange
          : salaryByLevel[safeLevel],
      yearsExperience:
        typeof node?.yearsExperience === 'string' && node.yearsExperience.trim()
          ? node.yearsExperience
          : experienceByLevel[safeLevel],
      skills,
      description:
        typeof node?.description === 'string' && node.description.trim()
          ? node.description.trim()
          : 'Build practical experience and business impact to advance toward the target role.',
      growthPotential:
        node?.growthPotential === 'low' ||
        node?.growthPotential === 'medium' ||
        node?.growthPotential === 'high'
          ? node.growthPotential
          : 'high',
      icon:
        typeof node?.icon === 'string' && node.icon.trim()
          ? node.icon.trim()
          : fallbackIcon,
    }
  })

  const safeName =
    typeof rawPath?.name === 'string' && rawPath.name.trim()
      ? rawPath.name.trim()
      : `${ctx.baseRole} Path`

  return {
    id: String(rawPath?.id || `${baseId || 'path'}-ai`),
    name: safeName,
    nodes: normalizedNodes,
  }
}

const buildProfileGuidancePath = (
  jobTitle: string,
  template: CareerPathTemplate,
  ctx: TemplateContext,
  profile: any,
): ProfileGuidanceResponse => {
  const baseId = slugify(`${jobTitle || 'role'}-profile`)
  const displayDomain = domainDisplayNames[template.domain] || 'Career'
  const domainKeywords = template.qualityKeywords || template.keywords
  const skills = parseSkills(profile?.skills)
  const workHistory = extractWorkHistory(profile?.work_history)
  const hasSummary = Boolean(
    (profile?.summary && String(profile.summary).trim()) ||
      (profile?.career_summary && String(profile.career_summary).trim()) ||
      (profile?.bio && String(profile.bio).trim()),
  )
  const hasCareerGoal = Boolean(
    profile?.career_goals && String(profile.career_goals).trim().length > 0,
  )
  const hasIndustry = Boolean(
    profile?.industry && String(profile.industry).trim().length > 0,
  )

  const hasDomainWorkHistory =
    workHistory.length > 0 &&
    workHistory.some(
      (item) =>
        (item.title && hasDomainKeywords(item.title, domainKeywords)) ||
        (item.description && hasDomainKeywords(item.description, domainKeywords)),
    )

  const hasDomainSkills =
    skills.length > 0 && skills.some((skill) => domainKeywords.some((keyword) => skill.includes(keyword)))

  const tasks: ProfileGuidanceResponse['tasks'] = []

  const pushTask = (task: ProfileGuidanceResponse['tasks'][0]) => {
    tasks.push(task)
  }

  const skillRecommendations =
    domainSkillRecommendations[template.domain] ?? domainSkillRecommendations.general

  if (!hasDomainWorkHistory) {
    pushTask({
      id: `${baseId}-task-1`,
      title: `Showcase ${displayDomain} Leadership`,
      category: 'Work History',
      priority: 'high',
      estimated_duration_minutes: 20,
      description:
        `Open Career Profile > Work History and add accomplishment-driven bullets that highlight ${displayDomain.toLowerCase()} impact aligning with ${ctx.targetRole}.`,
      icon: 'book',
      action_url: '/career-profile',
    })
  }

  if (!hasDomainSkills || skills.length < 5) {
    const recommended = skillRecommendations.slice(0, 2)
    pushTask({
      id: `${baseId}-task-2`,
      title: `Expand ${displayDomain} Skill Highlights`,
      category: 'Skills',
      priority: 'high',
      estimated_duration_minutes: 10,
      description:
        `Update Career Profile > Skills with the capabilities executives expect for ${ctx.targetRole} (e.g., ${recommended.join(', ')}).`,
      icon: 'layers',
      action_url: '/career-profile',
    })
  }

  if (!hasCareerGoal) {
    pushTask({
      id: `${baseId}-task-3`,
      title: 'Set a Targeted Career Goal',
      category: 'Career Goals',
      priority: 'high',
      estimated_duration_minutes: 15,
      description:
        `Head to Goals > Add Goal and describe why you are pursuing ${ctx.targetRole}. This steers the Career Path Explorer toward executive-ready steps.`,
      icon: 'linechart',
      action_url: '/goals',
    })
  }

  if (!hasSummary) {
    pushTask({
      id: `${baseId}-task-4`,
      title: 'Polish Your Executive Summary',
      category: 'Profile Summary',
      priority: 'medium',
      estimated_duration_minutes: 15,
      description:
        'Add a concise executive summary in Career Profile > Summary that signals the scale of teams, budgets, and results you have led.',
      icon: 'briefcase',
      action_url: '/career-profile',
    })
  }

  if (!hasIndustry) {
    pushTask({
      id: `${baseId}-task-5`,
      title: 'Specify Industry Focus',
      category: 'Profile Basics',
      priority: 'medium',
      estimated_duration_minutes: 2,
      description:
        'Set your primary industry in Career Profile > Basics so the explorer can recommend sector-appropriate transitions.',
      icon: 'lightbulb',
      action_url: '/career-profile',
    })
  }

  if (tasks.length === 0) {
    pushTask({
      id: `${baseId}-task-default`,
      title: 'Review Recent Achievements',
      category: 'Profile Update',
      priority: 'medium',
      estimated_duration_minutes: 15,
      description:
        'Refresh your profile with recent wins, measurable outcomes, and team leadership highlights relevant to your next role.',
      icon: 'book',
      action_url: '/career-profile',
    })
  }

  // Ensure at least three actionable steps before final recommendation
  while (tasks.length < 3) {
    const fillerIndex = tasks.length
    const fillerTitles = [
      `Highlight ${displayDomain} Metrics`,
      `Add Strategic Initiatives`,
      `Link Cross-Functional Wins`,
    ]
    const fillerTitle = fillerTitles[fillerIndex % fillerTitles.length]
    pushTask({
      id: `${baseId}-task-filler-${fillerIndex}`,
      title: fillerTitle,
      category: 'Profile Enhancement',
      priority: 'medium',
      estimated_duration_minutes: 10,
      description:
        'Document measurable outcomes (revenue, retention, efficiency) and the stakeholders you influenced to strengthen executive readiness.',
      icon: 'layers',
      action_url: '/career-profile',
    })
  }

  pushTask({
    id: `${baseId}-task-final`,
    title: `Regenerate the ${ctx.targetRole} Path`,
    category: 'Next Steps',
    priority: 'high',
    estimated_duration_minutes: 5,
    description:
      'Once your profile reflects these updates, rerun the Quick Career Path Generator to unlock tailored role-by-role recommendations.',
    icon: 'award',
    action_url: '/career-path',
  })

  const missingElements: string[] = []
  if (!hasDomainWorkHistory) missingElements.push('domain-relevant work history')
  if (!hasDomainSkills) missingElements.push('domain-specific skills')
  if (!hasCareerGoal) missingElements.push('career goal')
  if (!hasSummary) missingElements.push('executive summary')
  if (!hasIndustry) missingElements.push('industry specification')

  const message = missingElements.length > 0
    ? `We couldn't generate a career path for "${ctx.targetRole}" because your profile is missing: ${missingElements.join(', ')}. Complete the tasks below to improve your profile, then regenerate the path.`
    : `We couldn't generate a detailed career path for "${ctx.targetRole}" at this time. Complete the profile improvements below and try again.`

  return {
    type: 'profile_guidance',
    id: `${baseId}-guidance`,
    name: `${ctx.baseRole} Profile Prep`,
    target_role: ctx.targetRole,
    message,
    tasks,
  }
}

/**
 * Persists a career path or profile guidance to Convex
 * Handles both career_path and profile_guidance types
 */
const persistCareerPathToConvex = async (
  userId: string,
  targetRole: string,
  path: any,
  pathType: 'career_path' | 'profile_guidance',
  metadata: {
    usedModel: string
    promptVariant?: string
  }
): Promise<void> => {
  try {
    await convexServer.mutation(api.career_paths.createCareerPath, {
      clerkId: userId,
      target_role: targetRole,
      current_level: undefined,
      estimated_timeframe: undefined,
      steps: {
        type: pathType,
        source: 'job',
        path,
        ...metadata,
      },
      status: 'active',
    })
  } catch (convexError) {
    logStructuredError('Convex persistence failed', convexError, {
      userId,
      jobTitle: targetRole,
      pathType,
    })
  }
}

export async function POST(request: NextRequest) {
  const timer = startTimer('career_path_generation_total')

  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Parse and validate input with Zod
    const body = await request.json().catch((parseError) => {
      logStructuredError('Request JSON parse failed', parseError, {
        userId,
        url: request.url,
        contentType: request.headers.get('content-type'),
      })
      return {}
    })
    const inputValidation = GenerateCareerPathInputSchema.safeParse(body)

    if (!inputValidation.success) {
      logStructuredError('Invalid input to career path generation', inputValidation.error, {
        userId,
        body,
      })
      return NextResponse.json(
        {
          error: 'Invalid input',
          details: inputValidation.error.format(),
        },
        { status: 400 }
      )
    }

    const { jobTitle, region } = inputValidation.data

    // Check free plan limit before generating (using Clerk Billing)
    // Skip limit check entirely in development for testing
    if (process.env.NODE_ENV !== 'development') {
      try {
        const hasPremium = await checkPremiumAccess()

        if (!hasPremium) {
          // User is on free plan, check limit (production only)
          const existingPaths = await convexServer.query(api.career_paths.getUserCareerPaths, { clerkId: userId })

          if (existingPaths && existingPaths.length >= 1) {
            return NextResponse.json(
              { error: 'Free plan limit reached. Upgrade to Premium for unlimited career paths.' },
              { status: 403 }
            )
          }
        }
      } catch (limitCheckError) {
        console.warn('Career path limit check failed, proceeding with generation', limitCheckError)
      }
    }

    const template = selectTemplate(jobTitle)
    const promptContext = createContext(jobTitle, template.domain)
    const userProfile = await fetchUserProfile(userId)

    // Try OpenAI, fall back to mock
    let client: OpenAI | null = null
    let lastQualityFailure: string | null = null
    let lastQualityFailureReason: QualityFailureReason | null = null

    if (process.env.OPENAI_API_KEY) {
      try { client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) } catch { client = null }
    }

    console.log(`[Career Path] OpenAI client status: ${client ? 'initialized' : 'not available'}`)

    if (client) {
      const promptVariants: Array<{ name: PromptVariant; prompt: string }> = [
        { name: 'base', prompt: buildPrompt(promptContext, 'base', template) },
        { name: 'refine', prompt: buildPrompt(promptContext, 'refine', template) },
      ]
      const models: Array<string> = ['gpt-5', 'gpt-4o', 'gpt-4o-mini']
      let attemptNumber = 0

      for (const variant of promptVariants) {
        for (const model of models) {
          attemptNumber++

          try {
            logGenerationAttempt({
              userId,
              jobTitle,
              model,
              promptVariant: variant.name,
              attemptNumber,
            })

            const completion = await client.chat.completions.create({
              model,
              // GPT-5 only supports default temperature (1), other models support 0.4
              ...(model === 'gpt-5' ? {} : { temperature: 0.4 }),
              messages: [
                { role: 'system', content: 'You produce strictly valid JSON for apps to consume.' },
                { role: 'user', content: variant.prompt },
              ],
            })
            const content = completion.choices[0]?.message?.content || ''
            if (!content.trim()) continue

            // Parse and validate with Zod
            let parsed: any
            try {
              // Strip markdown code blocks if present (OpenAI sometimes wraps JSON in ```json blocks)
              let cleanContent = content.trim()
              if (cleanContent.startsWith('```')) {
                cleanContent = cleanContent
                  .replace(/^```json\n?/, '')
                  .replace(/^```\n?/, '')
                  .replace(/\n?```$/, '')
                  .trim()
              }
              parsed = JSON.parse(cleanContent)
              const validation = OpenAICareerPathOutputSchema.safeParse(parsed)
              if (!validation.success) {
                logStructuredError('OpenAI output validation failed', validation.error, {
                  userId,
                  jobTitle,
                  model,
                  promptVariant: variant.name,
                  attemptNumber,
                })
                continue
              }
              parsed = validation.data
            } catch (parseError) {
              logStructuredError('OpenAI JSON parse failed', parseError, {
                userId,
                jobTitle,
                model,
                attemptNumber,
              })
              continue
            }

            if (!Array.isArray(parsed?.paths) || parsed.paths.length === 0) {
              continue
            }

            const quality = evaluatePathQuality(parsed.paths[0], promptContext, template)
            if (!quality.valid) {
              lastQualityFailure = quality.reason || 'quality_check_failed'
              lastQualityFailureReason = quality.reason || null
              logQualityFailure({
                userId,
                jobTitle,
                model,
                promptVariant: variant.name,
                failureReason: quality.reason!,
                failureDetails: quality.details,
              })
              continue
            }

            // Use mapper instead of normalizeOpenAIPath
            const mapperResult = mapAiCareerPathToUI(
              parsed.paths[0],
              promptContext.targetRole
            )

            if (mapperResult.rejected) {
              lastQualityFailure = mapperResult.reason
              lastQualityFailureReason = 'titles_not_distinct'
              logQualityFailure({
                userId,
                jobTitle,
                model,
                promptVariant: variant.name,
                failureReason: 'titles_not_distinct',
                failureDetails: mapperResult.reason,
              })
              continue
            }

            const mainPath = mapperResult.data

            // Log success
            logGenerationSuccess({
              userId,
              jobTitle,
              model,
              promptVariant: variant.name,
            })

            timer.end({ success: true, model, promptVariant: variant.name })

            // Save first path to Convex (best-effort)
            await persistCareerPathToConvex(
              userId,
              mainPath.target_role,
              mainPath,
              'career_path',
              {
                usedModel: model,
                promptVariant: variant.name,
              }
            )

            // Return discriminated union response
            return NextResponse.json({
              ...mainPath, // Contains type: 'career_path', id, name, target_role, nodes
              usedModel: model,
              usedFallback: false,
              promptVariant: variant.name,
            })
          } catch (error) {
            // Log OpenAI errors for debugging
            logStructuredError('OpenAI generation attempt failed', error, {
              userId,
              jobTitle,
              model,
              promptVariant: variant.name,
              attemptNumber,
            })
            // try next model or prompt variant
            continue
          }
        }
      }

    }

    // Profile guidance fallback + save
    const guidancePath = buildProfileGuidancePath(jobTitle, template, promptContext, userProfile)

    logFallbackToGuidance({
      userId,
      jobTitle,
      reason: lastQualityFailure
        ? `Quality checks failed: ${lastQualityFailure}`
        : 'OpenAI not available or all attempts exhausted',
      failureReason: lastQualityFailureReason || undefined,
    })

    timer.end({ success: false, fallback: true })

    await persistCareerPathToConvex(
      userId,
      guidancePath.target_role,
      guidancePath,
      'profile_guidance',
      {
        usedModel: 'profile-guidance',
      }
    )

    // Return discriminated union response
    return NextResponse.json({
      ...guidancePath, // Contains type: 'profile_guidance', id, name, target_role, message, tasks
      usedFallback: true,
    })
  } catch (error: any) {
    console.error('POST /api/career-path/generate-from-job error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
