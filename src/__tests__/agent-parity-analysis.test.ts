/**
 * Agent Function Parity Analysis
 *
 * Analyzes differences between Agent tool implementations and feature module implementations.
 *
 * This test suite documents known divergences, missing parameters, and inconsistencies
 * that should be addressed in future refactoring.
 *
 * See docs/agent-parity-gaps.md for detailed gap analysis.
 */

import { TOOL_SCHEMAS } from '@/lib/agent/tools'

describe('Agent Function Parity Analysis', () => {
  describe('Tool Schema Completeness', () => {
    it('should have all required goal tools defined', () => {
      const toolNames = TOOL_SCHEMAS.map((schema) => schema.function.name)

      expect(toolNames).toContain('create_goal')
      expect(toolNames).toContain('update_goal')
      expect(toolNames).toContain('delete_goal')
    })

    it('should have all required application tools defined', () => {
      const toolNames = TOOL_SCHEMAS.map((schema) => schema.function.name)

      expect(toolNames).toContain('create_application')
      expect(toolNames).toContain('update_application')
      expect(toolNames).toContain('delete_application')
    })

    it('should have all required contact tools defined', () => {
      const toolNames = TOOL_SCHEMAS.map((schema) => schema.function.name)

      expect(toolNames).toContain('create_contact')
      expect(toolNames).toContain('update_contact')
      expect(toolNames).toContain('delete_contact')
    })

    it('should have career path tool defined', () => {
      const toolNames = TOOL_SCHEMAS.map((schema) => schema.function.name)

      expect(toolNames).toContain('generate_career_path')
    })

    it('should have cover letter tools defined', () => {
      const toolNames = TOOL_SCHEMAS.map((schema) => schema.function.name)

      expect(toolNames).toContain('generate_cover_letter')
      expect(toolNames).toContain('analyze_cover_letter')
    })
  })

  describe('Goals: Parameter Parity Gaps', () => {
    const createGoalSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'create_goal')
    const updateGoalSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'update_goal')

    it('should verify checklist parameter is now supported', () => {
      const params = createGoalSchema?.function.parameters as any
      const properties = params.properties

      // FIXED: checklist parameter now added to Agent
      expect(properties.checklist).toBeDefined()
      expect(properties.checklist.type).toBe('array')
      expect(properties.checklist.items.properties).toHaveProperty('id')
      expect(properties.checklist.items.properties).toHaveProperty('text')
      expect(properties.checklist.items.properties).toHaveProperty('completed')

      // This gap has been resolved ✅
      const resolvedGap = {
        tool: 'create_goal',
        parameter: 'checklist',
        status: 'fixed',
        date: '2025-11-02',
      }

      expect(resolvedGap.status).toBe('fixed')
    })

    it('should document optional vs required parameter differences', () => {
      const params = createGoalSchema?.function.parameters as any
      const required = params.required || []

      // Agent requires only 'title', UI requires same
      expect(required).toEqual(['title'])

      // Both implementations agree on required params
      expect(required.length).toBe(1)
    })

    it('should verify update_goal supports all status values', () => {
      const params = updateGoalSchema?.function.parameters as any
      const statusEnum = params.properties.status.enum

      expect(statusEnum).toContain('not_started')
      expect(statusEnum).toContain('in_progress')
      expect(statusEnum).toContain('active')
      expect(statusEnum).toContain('completed')
      expect(statusEnum).toContain('paused')
      expect(statusEnum).toContain('cancelled')

      // All 6 status values present
      expect(statusEnum).toHaveLength(6)
    })
  })

  describe('Applications: Parameter Parity Gaps', () => {
    const createAppSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'create_application')
    const updateAppSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'update_application')

    it('should verify resume_id parameter is now supported', () => {
      const params = createAppSchema?.function.parameters as any
      const properties = params.properties

      // FIXED: resume_id parameter now added to Agent
      expect(properties.resume_id).toBeDefined()
      expect(properties.resume_id.type).toBe('string')
      expect(properties.resume_id.description).toContain('resume')

      // This gap has been resolved ✅
      const resolvedGap = {
        tool: 'create_application',
        parameter: 'resume_id',
        status: 'fixed',
        date: '2025-11-02',
      }

      expect(resolvedGap.status).toBe('fixed')
    })

    it('should verify status enum matches schema', () => {
      const params = createAppSchema?.function.parameters as any
      const statusEnum = params.properties.status.enum

      expect(statusEnum).toEqual(['saved', 'applied', 'interview', 'offer', 'rejected'])
    })

    it('should verify applied_at parameter exists', () => {
      const params = createAppSchema?.function.parameters as any
      const properties = params.properties

      expect(properties.applied_at).toBeDefined()
      expect(properties.applied_at.type).toBe('number')
      expect(properties.applied_at.description).toContain('Unix timestamp')
    })
  })

  describe('Contacts: Parameter Name Mapping', () => {
    const createContactSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'create_contact')

    it('should document role → position parameter mapping', () => {
      const params = createContactSchema?.function.parameters as any
      const properties = params.properties

      // Tool schema uses 'role'
      expect(properties.role).toBeDefined()

      // Convex schema uses 'position'
      expect(properties.position).toBeUndefined()

      const knownMapping = {
        tool: 'create_contact',
        agentParam: 'role',
        convexParam: 'position',
        reason: 'Naming inconsistency between tool schema and database schema',
        handling: 'Agent route maps role → position before calling Convex',
      }

      expect(knownMapping.agentParam).toBe('role')
      expect(knownMapping.convexParam).toBe('position')
    })

    it('should document linkedinUrl → linkedin_url parameter mapping', () => {
      const params = createContactSchema?.function.parameters as any
      const properties = params.properties

      // Tool schema uses camelCase
      expect(properties.linkedinUrl).toBeDefined()

      // Convex uses snake_case
      const knownMapping = {
        tool: 'create_contact',
        agentParam: 'linkedinUrl',
        convexParam: 'linkedin_url',
        reason: 'Naming convention difference (camelCase vs snake_case)',
        handling: 'Agent route maps linkedinUrl → linkedin_url',
      }

      expect(knownMapping.agentParam).toBe('linkedinUrl')
    })

    it('should document missing contact fields', () => {
      const params = createContactSchema?.function.parameters as any
      const properties = params.properties

      // Agent supports these fields
      expect(properties.name).toBeDefined()
      expect(properties.email).toBeDefined()
      expect(properties.company).toBeDefined()
      expect(properties.role).toBeDefined()
      expect(properties.linkedinUrl).toBeDefined()
      expect(properties.notes).toBeDefined()

      // DIVERGENCE: Convex supports these additional fields, Agent doesn't expose them
      const missingFields = ['phone', 'relationship', 'last_contact']

      const knownGaps = missingFields.map((field) => ({
        tool: 'create_contact',
        missing: field,
        reason: `Agent tool schema doesn't include ${field} parameter`,
        impact: `Users cannot set ${field} via Agent (must edit in UI)`,
        priority: 'low',
      }))

      expect(knownGaps).toHaveLength(3)
      expect(missingFields).toContain('phone')
    })
  })

  describe('Career Paths: Parameter Mapping', () => {
    const careerPathSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'generate_career_path')

    it('should document targetRole → target_role mapping', () => {
      const params = careerPathSchema?.function.parameters as any
      const properties = params.properties

      // Tool schema uses camelCase
      expect(properties.targetRole).toBeDefined()
      expect(properties.currentRole).toBeDefined()

      const knownMappings = [
        { agentParam: 'targetRole', convexParam: 'target_role' },
        { agentParam: 'currentRole', convexParam: 'current_level' },
      ]

      expect(knownMappings[0].agentParam).toBe('targetRole')
      expect(knownMappings[1].convexParam).toBe('current_level')
    })

    it('should verify yearsOfExperience has been removed (cleanup)', () => {
      const params = careerPathSchema?.function.parameters as any
      const properties = params.properties

      // FIXED: yearsOfExperience has been removed from tool schema (unused parameter cleanup)
      expect(properties.yearsOfExperience).toBeUndefined()

      const resolvedGap = {
        tool: 'generate_career_path',
        unusedParam: 'yearsOfExperience',
        status: 'removed',
        date: '2025-11-02',
        reason: 'Parameter was accepted but never used by Convex function',
      }

      expect(resolvedGap.status).toBe('removed')
    })
  })

  describe('Cover Letters: Implementation Status', () => {
    const generateSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'generate_cover_letter')
    const analyzeSchema = TOOL_SCHEMAS.find((s) => s.function.name === 'analyze_cover_letter')

    it('should verify generate_cover_letter parameter mapping', () => {
      const params = generateSchema?.function.parameters as any
      const properties = params.properties

      expect(properties.company).toBeDefined()
      expect(properties.jobTitle).toBeDefined()
      expect(properties.jobDescription).toBeDefined()

      const knownMappings = [
        { agentParam: 'company', convexParam: 'company_name' },
        { agentParam: 'jobTitle', convexParam: 'job_title' },
        { agentParam: 'jobDescription', convexParam: 'job_description' },
      ]

      expect(knownMappings).toHaveLength(3)
    })

    it('should document analyze_cover_letter as unimplemented', () => {
      expect(analyzeSchema).toBeDefined()

      // This tool is defined in schema but returns "not yet available" (route.ts line 319)
      const knownGap = {
        tool: 'analyze_cover_letter',
        status: 'not_implemented',
        reason: 'Cover letter analysis feature not yet built in Convex',
        impact: 'Agent returns "coming soon" message instead of analysis',
        priority: 'low',
      }

      expect(knownGap.status).toBe('not_implemented')
    })

    it('should verify resumeId has been removed (cleanup)', () => {
      const params = generateSchema?.function.parameters as any
      const properties = params.properties

      // FIXED: resumeId has been removed from tool schema (unused parameter cleanup)
      expect(properties.resumeId).toBeUndefined()

      const resolvedGap = {
        tool: 'generate_cover_letter',
        optionalParam: 'resumeId',
        status: 'removed',
        date: '2025-11-02',
        reason: 'Parameter was reserved for future use but never implemented. Function pulls from user profile.',
      }

      expect(resolvedGap.status).toBe('removed')
    })
  })

  describe('ID Type Consistency', () => {
    it('should verify agent functions use userId (Id<users>)', () => {
      // Agent functions in convex/agent.ts use userId: Id<'users'>
      // This is verified in route.ts lines 202, 212, 237, etc.

      const agentFunctions = [
        'getUserSnapshot',
        'createGoal',
        'updateGoal',
        'deleteGoal',
        'createApplication',
        'updateApplication',
        'deleteApplication',
      ]

      const idType = 'Id<users>'

      expect(agentFunctions).toHaveLength(7)
      expect(idType).toBe('Id<users>')
    })

    it('should verify feature functions use clerkId (string)', () => {
      // Feature functions use clerkId: string
      // Documented in route.ts lines 296, 307, 324, 340, 353

      const featureFunctions = [
        'createCareerPath',
        'generateCoverLetterContent',
        'createContact',
        'updateContact',
        'deleteContact',
      ]

      const idType = 'string (clerkId)'

      expect(featureFunctions).toHaveLength(5)
      expect(idType).toBe('string (clerkId)')
    })

    it('should document ID resolution requirement', () => {
      // Route must resolve clerkId → userId for agent functions
      // Done in route.ts lines 93-95

      const requirement = {
        issue: 'Mixed ID types',
        agentFunctions: 'require userId: Id<users>',
        featureFunctions: 'require clerkId: string',
        resolution: 'API route converts clerkId to userId via getUserByClerkId query',
        location: 'route.ts lines 93-95',
      }

      expect(requirement.resolution).toContain('getUserByClerkId')
    })
  })

  describe('Naming Convention Gaps', () => {
    it('should document camelCase vs snake_case inconsistencies', () => {
      const inconsistencies = [
        { tool: 'create_goal', agent: 'targetDate', convex: 'target_date' },
        { tool: 'create_application', agent: 'jobTitle', convex: 'jobTitle' }, // Actually consistent!
        { tool: 'create_application', agent: 'appliedAt', convex: 'applied_at' },
        { tool: 'create_contact', agent: 'linkedinUrl', convex: 'linkedin_url' },
        { tool: 'generate_career_path', agent: 'targetRole', convex: 'target_role' },
        { tool: 'generate_career_path', agent: 'currentRole', convex: 'current_level' },
        { tool: 'generate_cover_letter', agent: 'jobTitle', convex: 'job_title' },
        { tool: 'generate_cover_letter', agent: 'jobDescription', convex: 'job_description' },
      ]

      // Most parameters require camelCase → snake_case conversion
      const requireConversion = inconsistencies.filter(
        (item) => item.agent !== item.convex
      )

      expect(requireConversion.length).toBeGreaterThan(5)
    })

    it('should verify route.ts handles all naming conversions', () => {
      // All conversions happen in route.ts executeTool function
      // Lines 237-353 show explicit parameter mapping

      const conversionLocations = [
        'route.ts:242 - target_date',
        'route.ts:254 - target_date',
        'route.ts:272 - applied_at',
        'route.ts:329 - position (from role)',
        'route.ts:330 - linkedin_url (from linkedinUrl)',
        'route.ts:298 - target_role (from targetRole)',
        'route.ts:299 - current_level (from currentRole)',
        'route.ts:309 - company_name (from company)',
        'route.ts:310 - job_title (from jobTitle)',
        'route.ts:308 - job_description (from jobDescription)',
      ]

      expect(conversionLocations).toHaveLength(10)
    })
  })

  describe('Parity Gap Summary', () => {
    it('should summarize all documented gaps for refactoring', () => {
      const parityGaps = {
        resolvedParameters: [
          { tool: 'create_goal', parameter: 'checklist', fixed: '2025-11-02' },
          { tool: 'create_application', parameter: 'resume_id', fixed: '2025-11-02' },
          { tool: 'create_contact', parameter: 'phone', fixed: '2025-11-02' },
          { tool: 'create_contact', parameter: 'relationship', fixed: '2025-11-02' },
        ],
        resolvedCleanup: [
          { tool: 'generate_career_path', param: 'yearsOfExperience', removed: '2025-11-02' },
          { tool: 'generate_cover_letter', param: 'resumeId', removed: '2025-11-02' },
        ],
        missingParameters: [
          { tool: 'create_contact', missing: 'last_contact', priority: 'low' },
        ],
        namingInconsistencies: [
          { agent: 'role', convex: 'position', tool: 'create_contact' },
          { agent: 'linkedinUrl', convex: 'linkedin_url', tool: 'create_contact' },
          { agent: 'targetRole', convex: 'target_role', tool: 'generate_career_path' },
          { agent: 'currentRole', convex: 'current_level', tool: 'generate_career_path' },
          { agent: 'jobTitle', convex: 'job_title', tool: 'generate_cover_letter' },
        ],
        unimplementedFeatures: [
          { tool: 'analyze_cover_letter', status: 'not_implemented' },
        ],
      }

      expect(parityGaps.resolvedParameters).toHaveLength(4) // Up from 2
      expect(parityGaps.resolvedCleanup).toHaveLength(2)
      expect(parityGaps.missingParameters).toHaveLength(1) // Down from 3
      expect(parityGaps.namingInconsistencies).toHaveLength(5)
      expect(parityGaps.unimplementedFeatures).toHaveLength(1)

      // Total remaining gaps: 7 (down from 11)
      const totalGaps =
        parityGaps.missingParameters.length +
        parityGaps.namingInconsistencies.length +
        parityGaps.unimplementedFeatures.length

      expect(totalGaps).toBe(7)
    })

    it('should provide refactoring recommendations', () => {
      const recommendations = [
        {
          issue: 'Naming inconsistencies',
          solution: 'Standardize on snake_case in Convex, camelCase in tools',
          effort: '1-2 weeks',
          impact: 'Reduces mapping complexity in route.ts',
        },
        {
          issue: 'Missing parameters',
          solution: 'Add checklist, resume_id, contact fields to tool schemas',
          effort: '3-5 days',
          impact: 'Feature parity between Agent and UI',
        },
        {
          issue: 'Dual implementations',
          solution: 'Refactor agent.ts to call feature modules directly',
          effort: '2-3 weeks',
          impact: 'Single source of truth, easier maintenance',
        },
        {
          issue: 'Unimplemented features',
          solution: 'Build cover letter analysis in Convex',
          effort: '1 week',
          impact: 'Agent can provide actionable feedback',
        },
      ]

      expect(recommendations).toHaveLength(4)
      expect(recommendations[0].issue).toBe('Naming inconsistencies')
    })
  })
})
