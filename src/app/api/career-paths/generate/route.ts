import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import OpenAI from 'openai'
import { api } from 'convex/_generated/api'
import { checkPremiumAccess } from '@/lib/subscription-server'
import { convexServer } from '@/lib/convex-server';

export const runtime = 'nodejs'

type SkillLevel = 'basic' | 'intermediate' | 'advanced'
type StageLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'executive'
type GrowthPotential = 'low' | 'medium' | 'high'
type DomainKey =
  | 'software'
  | 'data'
  | 'product'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'security'
  | 'people'
  | 'finance'
  | 'operations'
  | 'general'

type StageNode = {
  id: string
  title: string
  level: StageLevel
  salaryRange: string
  yearsExperience: string
  skills: Array<{ name: string; level: SkillLevel }>
  description: string
  growthPotential: GrowthPotential
  icon: string
}

type CareerPath = {
  id: string
  name: string
  nodes: StageNode[]
}

type PromptVariant = 'base' | 'refine'

const DOMAIN_KEYWORDS: Record<Exclude<DomainKey, 'general'>, string[]> = {
  software: [
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
  data: [
    'data',
    'analytics',
    'analysis',
    'scientist',
    'science',
    'business intelligence',
    'bi',
    'machine learning',
    'ml',
    'ai',
    'statistician',
  ],
  product: [
    'product',
    'pm',
    'product manager',
    'product owner',
    'roadmap',
    'portfolio',
    'product lead',
    'product director',
  ],
  design: [
    'design',
    'designer',
    'ux',
    'ui',
    'experience',
    'visual',
    'interaction',
    'creative',
  ],
  marketing: [
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
  sales: [
    'sales',
    'account',
    'business development',
    'bdr',
    'sdr',
    'revenue',
    'pipeline',
    'quota',
    'seller',
  ],
  security: [
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
  people: [
    'people',
    'talent',
    'recruit',
    'hr',
    'human resource',
    'people operations',
    'people ops',
    'employee',
  ],
  finance: [
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
  operations: [
    'operations',
    'program',
    'project',
    'delivery',
    'strategy',
    'chief of staff',
    'business operations',
    'process',
  ],
}

const domainDisplayNames: Record<DomainKey, string> = {
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

const domainSkillRecommendations: Record<DomainKey, string[]> = {
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

const allowedLevels = new Set<StageLevel>(['entry', 'mid', 'senior', 'lead', 'executive'])
const allowedSkillLevels = new Set<SkillLevel>(['basic', 'intermediate', 'advanced'])

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)

const stripLevelQualifiers = (value: string) => {
  const pattern =
    /^(senior|sr\.?|junior|jr\.?|lead|principal|staff|associate|assistant|apprentice|mid-level|midlevel|mid level|entry-level|entry level)\s+/i
  let result = value.trim()
  while (pattern.test(result)) {
    result = result.replace(pattern, '')
  }
  result = result.replace(/\b(i{1,3}|iv|v)\b$/i, '').trim()
  return result || value.trim()
}

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (!word) return ''
      const clean = word.replace(/[^a-z0-9/+-]/gi, '')
      if (clean.length <= 3 && /^[a-z]+$/i.test(clean)) {
        return clean.toUpperCase()
      }
      return `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`
    })
    .join(' ')

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

const extractWorkHistory = (
  raw: unknown,
): Array<{ title?: string; company?: string; description?: string }> => {
  if (!raw || !Array.isArray(raw)) return []
  return raw.map((item: any) => ({
    title: String(item?.role || item?.title || '').trim(),
    company: item?.company ? String(item.company).trim() : undefined,
    description: item?.summary
      ? String(item.summary).trim()
      : item?.description
        ? String(item.description).trim()
        : undefined,
  }))
}

const detectDomainFromText = (value?: string | null): DomainKey | null => {
  if (!value) return null
  const lower = value.toLowerCase()
  let best: DomainKey | null = null
  let bestScore = 0
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0
    for (const keyword of keywords) {
      if (lower.includes(keyword)) score++
    }
    if (score > bestScore) {
      bestScore = score
      best = domain as DomainKey
    }
  }
  return bestScore > 0 ? best : null
}

const determineProfileDomain = (profile: any): DomainKey => {
  const candidates: Array<string | null | undefined> = [
    profile?.career_goals,
    profile?.careerGoals,
    profile?.desiredRole,
    profile?.targetRole,
    profile?.currentRole,
    profile?.currentPosition,
    profile?.industry,
    profile?.skills,
  ]
  for (const candidate of candidates) {
    const domain = detectDomainFromText(candidate)
    if (domain) return domain
  }
  return 'general'
}

const cleanTargetRole = (raw: string | null | undefined): string | null => {
  if (!raw) return null
  let candidate = String(raw).trim()
  if (!candidate) return null
  candidate = candidate.replace(/i (want|would like|plan|hope|aim)\s+to\s+/gi, '')
  candidate = candidate.replace(/(?:to\s+)?become\s+/gi, '')
  candidate = candidate.replace(/(?:to\s+)?be\s+/gi, '')
  candidate = candidate.replace(/^(?:an?\s+)/i, '')
  candidate = candidate.split(/[.,;]|(?:in\s+order)/i)[0]
  candidate = candidate.trim()
  if (!candidate) return null
  if (candidate.length > 60) {
    candidate = candidate.slice(0, 60)
  }
  return toTitleCase(candidate)
}

const determineTargetRole = (profile: any, domain: DomainKey): string => {
  const fromGoal =
    cleanTargetRole(profile?.career_goals) ||
    cleanTargetRole(profile?.careerGoals) ||
    cleanTargetRole(profile?.desiredRole) ||
    cleanTargetRole(profile?.targetRole)
  if (fromGoal) return fromGoal

  const current = profile?.currentRole || profile?.currentPosition
  if (typeof current === 'string' && current.trim()) {
    const stripped = stripLevelQualifiers(current)
    return toTitleCase(
      stripped.toLowerCase().includes('manager') || stripped.toLowerCase().includes('lead')
        ? `Director of ${domainDisplayNames[domain]}`
        : `Senior ${stripped}`,
    )
  }

  const domainName = domainDisplayNames[domain] || 'Career'
  return domain === 'general' ? 'Next Leadership Role' : `Head of ${domainName}`
}

const buildProfilePrompt = (
  profile: any,
  variant: PromptVariant,
  domain: DomainKey,
): string => {
  const domainName = domainDisplayNames[domain]
  const skillExamples = (domainSkillRecommendations[domain] || []).slice(0, 3).join(', ')
  const variantAdditions =
    variant === 'refine'
      ? `
Reinforce quality rules:
- Provide two distinct paths tailored to the profile, each with at least four stages.
- The first three stages must reference real job titles seen in the ${domainName} space (avoid repeating the target title with modifiers like "Junior/Mid/Senior").
- Include measurable, resume-ready responsibilities in each description (20+ words).`
      : `
Quality rules:
- Provide exactly two paths tailored to this profile.
- Each path must have at least four stages (three feeder roles plus the target role).
- Titles must be realistic ${domainName} roles, not generic placeholders like "Junior User" or "Mid-level Professional".
- Include salary ranges, experience ranges, growth potential, and the top 2-3 skills for each stage.`

  const snapshot = JSON.stringify(profile ?? {}).slice(0, 6000)

  return `You are a senior career strategist designing advancement paths for a user. The domain focus is ${domainName}.

Profile summary (JSON): ${snapshot}

Expectations:
- Produce two distinct, high-quality career paths that build upon the user's profile.
- Use industry-recognized job titles for the ${domainName} domain.
- Ensure feeder stages mention skill growth relevant to the target roles (examples: ${skillExamples || 'Leadership, Business Strategy'}).
- The final stage in each path should be an executive or staff-level role that aligns with the profile trajectory.

${variantAdditions}

Return strictly valid JSON:
{
  "paths": [
    {
      "id": string,
      "name": string,
      "nodes": [
        {
          "id": string,
          "title": string,
          "level": "entry" | "mid" | "senior" | "lead" | "executive",
          "salaryRange": string,
          "yearsExperience": string,
          "skills": Array<{ "name": string, "level": "basic" | "intermediate" | "advanced" }>,
          "description": string,
          "growthPotential": "low" | "medium" | "high",
          "icon": string
        }
      ]
    }
  ]
}`
}

const evaluateGeneratedPath = (
  path: any,
  profile: any,
  fallbackDomain: DomainKey,
): { valid: boolean; reason?: string; domain: DomainKey; targetRole: string } => {
  if (!path || !Array.isArray(path.nodes)) {
    return { valid: false, reason: 'Missing nodes array', domain: fallbackDomain, targetRole: '' }
  }

  const nodes = path.nodes
  if (nodes.length < 4) {
    return { valid: false, reason: 'Requires at least four stages', domain: fallbackDomain, targetRole: '' }
  }

  const targetNode = nodes[nodes.length - 1] || {}
  const targetTitleRaw = String(targetNode?.title || path?.name || '').trim()
  const targetRole = targetTitleRaw ? toTitleCase(targetTitleRaw) : 'Target Role'

  const inferredDomain =
    detectDomainFromText(targetTitleRaw) ||
    detectDomainFromText(path?.name) ||
    fallbackDomain
  const domainKeywords =
    inferredDomain === 'general' ? [] : DOMAIN_KEYWORDS[inferredDomain as Exclude<DomainKey, 'general'>]

  const normalizedTarget = stripLevelQualifiers(targetRole).toLowerCase()
  const feeders = nodes.slice(0, -1)
  const feederCores = feeders.map((node: any) =>
    stripLevelQualifiers(String(node?.title || '')).toLowerCase(),
  )

  const uniqueFeeders = new Set(feederCores)
  if (uniqueFeeders.size < Math.min(feeders.length, 3)) {
    return {
      valid: false,
      reason: 'Feeder roles are not distinct enough',
      domain: inferredDomain,
      targetRole,
    }
  }

  const baseCore =
    typeof profile?.currentRole === 'string'
      ? stripLevelQualifiers(profile.currentRole).toLowerCase()
      : ''
  const duplicates = feederCores.filter(
    (core: string) => core === normalizedTarget || (!!baseCore && core === baseCore),
  )
  if (duplicates.length >= 2) {
    return {
      valid: false,
      reason: 'Feeder roles reuse the base or target title',
      domain: inferredDomain,
      targetRole,
    }
  }

  if (
    inferredDomain !== 'general' &&
    domainKeywords &&
    domainKeywords.length > 0 &&
    feeders.filter((node: any) => {
      const title = String(node?.title || '').toLowerCase()
      return domainKeywords.some((keyword) => title.includes(keyword))
    }).length < 2
  ) {
    return {
      valid: false,
      reason: 'Feeder roles are not domain-specific enough',
      domain: inferredDomain,
      targetRole,
    }
  }

  const descriptionsValid = nodes.every(
    (node: any) =>
      typeof node?.description === 'string' && node.description.trim().length >= 20,
  )
  if (!descriptionsValid) {
    return {
      valid: false,
      reason: 'Descriptions are missing or too short',
      domain: inferredDomain,
      targetRole,
    }
  }

  return { valid: true, domain: inferredDomain, targetRole }
}

const normalizePath = (
  rawPath: any,
  domain: DomainKey,
  targetRole: string,
  index: number,
): CareerPath => {
  const baseId = slugify(`${targetRole}-${index}`)
  const nodes = Array.isArray(rawPath?.nodes) ? rawPath.nodes.slice(0, 5) : []

  const normalizedNodes = nodes.map((node: any, nodeIndex: number) => {
    const rawLevel = String(node?.level || '').toLowerCase() as StageLevel
    const level = allowedLevels.has(rawLevel) ? rawLevel : (['entry', 'mid', 'senior', 'lead', 'executive'][Math.min(nodeIndex, 4)] as StageLevel)

    let skills: Array<{ name: string; level: SkillLevel }> = []
    if (Array.isArray(node?.skills)) {
      skills = node.skills
        .map((skill: any) => {
          const name = String(skill?.name || '').trim()
          const levelValue = String(skill?.level || '').toLowerCase() as SkillLevel
          if (!name || !allowedSkillLevels.has(levelValue)) return null
          return { name, level: levelValue }
        })
        .filter(
          (
            skill: { name: string; level: SkillLevel } | null,
          ): skill is { name: string; level: SkillLevel } => Boolean(skill),
        )
        .slice(0, 3)
    }
    if (!skills.length) {
      const recommended = domainSkillRecommendations[domain] || domainSkillRecommendations.general
      skills = [
        { name: recommended[0] || 'Strategic Impact', level: 'intermediate' },
        { name: recommended[1] || 'Stakeholder Alignment', level: 'basic' },
      ]
    }

    return {
      id: String(node?.id || `${baseId}-stage-${nodeIndex + 1}`),
      title: toTitleCase(String(node?.title || `Stage ${nodeIndex + 1}`)),
      level,
      salaryRange:
        typeof node?.salaryRange === 'string' && node.salaryRange.trim()
          ? node.salaryRange
          : salaryByLevel[level],
      yearsExperience:
        typeof node?.yearsExperience === 'string' && node.yearsExperience.trim()
          ? node.yearsExperience
          : experienceByLevel[level],
      skills,
      description:
        typeof node?.description === 'string' && node.description.trim()
          ? node.description.trim()
          : 'Deliver measurable outcomes and expand leadership scope toward the target role.',
      growthPotential:
        node?.growthPotential === 'low' ||
        node?.growthPotential === 'medium' ||
        node?.growthPotential === 'high'
          ? node.growthPotential
          : 'high',
      icon:
        typeof node?.icon === 'string' && node.icon.trim()
          ? node.icon.trim()
          : ['graduation', 'book', 'layers', 'linechart', 'briefcase', 'award'][
              Math.min(nodeIndex, 5)
            ],
    }
  })

  const safeName =
    typeof rawPath?.name === 'string' && rawPath.name.trim()
      ? rawPath.name.trim()
      : `${domainDisplayNames[domain]} Advancement`

  return {
    id: String(rawPath?.id || `${baseId}-profile`),
    name: safeName,
    nodes: normalizedNodes,
  }
}

const buildGuidancePath = (
  profile: any,
  domain: DomainKey,
  targetRole: string,
): CareerPath => {
  const domainName = domainDisplayNames[domain]
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

  const domainKeywords =
    domain === 'general' ? [] : DOMAIN_KEYWORDS[domain as Exclude<DomainKey, 'general'>]

  const hasDomainWorkHistory =
    workHistory.length > 0 &&
    workHistory.some((item) => {
      const title = (item.title || '').toLowerCase()
      const description = (item.description || '').toLowerCase()
      return domainKeywords.some(
        (keyword) => title.includes(keyword) || description.includes(keyword),
      )
    })

  const hasDomainSkills =
    skills.length > 0 &&
    domainKeywords.some((keyword) => skills.some((skill) => skill.includes(keyword)))

  const recommendations = domainSkillRecommendations[domain] || domainSkillRecommendations.general

  const stages: StageNode[] = []
  const baseId = slugify(`${targetRole}-profile`)

  if (!hasDomainWorkHistory) {
    stages.push({
      id: `${baseId}-work`,
      title: `Showcase ${domainName} Leadership`,
      level: 'entry',
      salaryRange: 'Profile update',
      yearsExperience: 'Add roles now',
      skills: [
        { name: `${domainName} Achievements`, level: 'basic' },
        { name: 'Career Storytelling', level: 'intermediate' },
      ],
      description:
        `Open Career Profile → Work History and add accomplishment-driven bullets that highlight ${domainName.toLowerCase()} impact that supports your path to ${targetRole}.`,
      growthPotential: 'high',
      icon: 'book',
    })
  }

  if (!hasDomainSkills || skills.length < 5) {
    stages.push({
      id: `${baseId}-skills`,
      title: `Expand ${domainName} Skill Highlights`,
      level: 'mid',
      salaryRange: 'Profile update',
      yearsExperience: 'List top skills',
      skills: [
        { name: recommendations[0] || 'Strategic Planning', level: 'intermediate' },
        { name: recommendations[1] || 'Stakeholder Alignment', level: 'basic' },
      ],
      description:
        `Update Career Profile → Skills with executive-caliber capabilities (e.g., ${recommendations
          .slice(0, 2)
          .join(', ')}). This gives the generator richer data for senior steps.`,
      growthPotential: 'high',
      icon: 'layers',
    })
  }

  if (!hasCareerGoal) {
    stages.push({
      id: `${baseId}-goals`,
      title: 'Set a Targeted Career Goal',
      level: 'senior',
      salaryRange: 'Profile update',
      yearsExperience: 'Clarify direction',
      skills: [
        { name: 'Goal Setting', level: 'basic' },
        { name: 'Success Metrics', level: 'intermediate' },
      ],
      description:
        `Head to Goals → Add Goal and explain why you’re pursuing ${targetRole}. This helps the explorer suggest domain-aligned transitions.`,
      growthPotential: 'high',
      icon: 'linechart',
    })
  }

  if (!hasSummary) {
    stages.push({
      id: `${baseId}-summary`,
      title: 'Polish Your Executive Summary',
      level: 'lead',
      salaryRange: 'Profile update',
      yearsExperience: 'Craft narrative',
      skills: [
        { name: 'Executive Presence', level: 'intermediate' },
        { name: 'Storytelling', level: 'intermediate' },
      ],
      description:
        'Add a concise executive summary that signals the scale of teams, budgets, and business outcomes you have driven.',
      growthPotential: 'medium',
      icon: 'briefcase',
    })
  }

  if (!hasIndustry) {
    stages.push({
      id: `${baseId}-industry`,
      title: 'Specify Industry Focus',
      level: 'mid',
      salaryRange: 'Profile update',
      yearsExperience: '2 minutes',
      skills: [
        { name: 'Market Positioning', level: 'basic' },
        { name: 'Domain Credibility', level: 'basic' },
      ],
      description:
        'Set your primary industry in Career Profile → Basics so recommendations align with the sectors you care about.',
      growthPotential: 'medium',
      icon: 'lightbulb',
    })
  }

  if (!stages.length) {
    stages.push({
      id: `${baseId}-refresh`,
      title: 'Refresh Recent Achievements',
      level: 'entry',
      salaryRange: 'Profile update',
      yearsExperience: '15 minutes',
      skills: [
        { name: 'Impact Narratives', level: 'basic' },
        { name: 'Executive Alignment', level: 'intermediate' },
      ],
      description:
        'Document the latest wins, metrics, and cross-functional partnerships that prove readiness for bigger scope.',
      growthPotential: 'high',
      icon: 'book',
    })
  }

  stages.push({
    id: `${baseId}-rerun`,
    title: `Regenerate the ${targetRole} Path`,
    level: 'lead',
    salaryRange: 'Next step',
    yearsExperience: 'After updates',
    skills: [
      { name: 'Continuous Iteration', level: 'intermediate' },
      { name: `${domainName} Vision`, level: 'advanced' },
    ],
    description:
      'Once these updates are in place, rerun Suggested Paths so the explorer can surface richer, domain-specific progressions.',
    growthPotential: 'high',
    icon: 'award',
  })

  return {
    id: `${baseId}-guidance`,
    name: `${domainName} Profile Prep`,
    nodes: stages,
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check free plan limit before generating (using Clerk Billing)
    try {
      const hasPremium = await checkPremiumAccess()

      if (!hasPremium) {
        // User is on free plan, check limit
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

    const body = await request.json().catch(() => ({}))
    const profileData = body?.profileData || {}

    const fallbackDomain = determineProfileDomain(profileData)
    const targetRole = determineTargetRole(profileData, fallbackDomain)

    let client: OpenAI | null = null
    if (process.env.OPENAI_API_KEY) {
      try {
        client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      } catch {
        client = null
      }
    }

    if (client) {
      const promptVariants: PromptVariant[] = ['base', 'refine']
      const models = ['gpt-5', 'gpt-4o', 'gpt-4o-mini']
      let lastFailure: string | null = null

      for (const variant of promptVariants) {
        const prompt = buildProfilePrompt(profileData, variant, fallbackDomain)
        for (const model of models) {
          try {
            const completion = await client.chat.completions.create({
              model,
              temperature: 0.4,
              messages: [
                { role: 'system', content: 'Respond with strictly valid JSON.' },
                { role: 'user', content: prompt },
              ],
            })
            const content = completion.choices[0]?.message?.content || ''
            if (!content.trim()) continue

            let parsed: any
            try {
              parsed = JSON.parse(content)
            } catch {
              continue
            }
            if (!Array.isArray(parsed?.paths) || parsed.paths.length === 0) {
              continue
            }

            const evaluations = parsed.paths.map((generatedPath: any) =>
              evaluateGeneratedPath(generatedPath, profileData, fallbackDomain),
            )
            const firstFailure = evaluations.find(
              (result: { valid: boolean }) => !result.valid,
            )
            if (firstFailure) {
              lastFailure = firstFailure.reason || 'quality check failed'
              continue
            }

            const sanitizedPaths = parsed.paths.map((path: any, index: number) => {
              const { domain, targetRole: evaluatedTarget } = evaluations[index]
              return normalizePath(path, domain, evaluatedTarget, index)
            })

            try {
              const mainPath = sanitizedPaths[0]
              await convexServer.mutation(api.career_paths.createCareerPath, {
                clerkId: userId,
                target_role: String(mainPath?.name || targetRole),
                current_level: undefined,
                estimated_timeframe: undefined,
                steps: {
                  source: 'profile',
                  path: mainPath,
                  usedModel: model,
                  promptVariant: variant,
                },
                status: 'active',
              })
            } catch (convexError) {
              console.error('CareerPath profile persistence failed', convexError)
              return NextResponse.json(
                { error: 'Failed to save career path. Please try again.' },
                { status: 500 }
              )
            }

            return NextResponse.json({
              paths: sanitizedPaths,
              usedModel: model,
              usedFallback: false,
              promptVariant: variant,
            })
          } catch (error) {
            continue
          }
        }
      }

      if (lastFailure) {
        console.warn('Profile path fallback triggered after quality failures', {
          userId,
          reason: lastFailure,
        })
      }
    }

    const guidancePath = buildGuidancePath(profileData, fallbackDomain, targetRole)
    try {
      await convexServer.mutation(api.career_paths.createCareerPath, {
        clerkId: userId,
        target_role: String(guidancePath?.name || targetRole),
        current_level: undefined,
        estimated_timeframe: undefined,
        steps: { source: 'profile', path: guidancePath, usedModel: 'profile-guidance' },
        status: 'active',
      })
    } catch (persistenceError) {
      console.error('CareerPath guidance persistence failed', persistenceError)
      return NextResponse.json(
        { error: 'Failed to save guidance path. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      paths: [guidancePath],
      usedFallback: true,
      guidance: true,
    })
  } catch (error: any) {
    console.error('POST /api/career-paths/generate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
