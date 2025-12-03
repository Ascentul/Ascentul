/**
 * AI Prompt Versions - CRUD operations for prompt management
 *
 * Manages prompt versions with:
 * - Semantic versioning (MAJOR.MINOR.PATCH)
 * - Risk-based governance
 * - Git-first workflow (git_synced vs dev_draft)
 * - Status lifecycle (draft → in_review → active → inactive → archived)
 */

import { v } from 'convex/values';

import { Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import { requireSuperAdmin } from './lib/roles';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List prompt versions with optional filters
 */
export const listPromptVersions = query({
  args: {
    toolId: v.optional(v.string()),
    status: v.optional(v.string()),
    source: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Require super admin access
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 100;

    // Build query based on filters
    let versions;
    if (args.toolId) {
      versions = await ctx.db
        .query('prompt_versions')
        .withIndex('by_tool_id', (q) => q.eq('tool_id', args.toolId!))
        .order('desc')
        .take(limit);
    } else {
      versions = await ctx.db.query('prompt_versions').order('desc').take(limit);
    }

    // Apply additional filters in memory
    if (args.status) {
      versions = versions.filter((v) => v.status === args.status);
    }
    if (args.source) {
      versions = versions.filter((v) => v.source === args.source);
    }

    return versions;
  },
});

/**
 * Get a single prompt version by ID
 */
export const getPromptVersion = query({
  args: {
    versionId: v.id('prompt_versions'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.get(args.versionId);
  },
});

/**
 * Get the currently active version for a tool in an environment
 */
export const getActiveVersionForTool = query({
  args: {
    toolId: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
  },
  handler: async (ctx, args) => {
    // This query doesn't require auth - it's used by the resolver
    // Find the binding for this tool/env
    const binding = await ctx.db
      .query('prompt_bindings')
      .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId).eq('env', args.env))
      .filter((q) => q.eq(q.field('is_active'), true))
      .first();

    if (!binding || !binding.active_version_id) {
      return null;
    }

    return await ctx.db.get(binding.active_version_id);
  },
});

/**
 * Get version history for a tool (all versions sorted by version number)
 */
export const getVersionHistory = query({
  args: {
    toolId: v.string(),
    kind: v.optional(v.union(v.literal('system'), v.literal('rubric'), v.literal('other'))),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let versions = await ctx.db
      .query('prompt_versions')
      .withIndex('by_tool_id', (q) => q.eq('tool_id', args.toolId))
      .collect();

    // Filter by kind if specified
    if (args.kind) {
      versions = versions.filter((v) => v.kind === args.kind);
    }

    // Sort by version (major, minor, patch) descending
    return versions.sort((a, b) => {
      if (a.version_major !== b.version_major) return b.version_major - a.version_major;
      if (a.version_minor !== b.version_minor) return b.version_minor - a.version_minor;
      return b.version_patch - a.version_patch;
    });
  },
});

/**
 * Get versions that need approval (in_review status)
 */
export const getPendingApprovals = query({
  args: {
    toolId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const versions = await ctx.db
      .query('prompt_versions')
      .withIndex('by_status', (q) => q.eq('status', 'in_review'))
      .collect();

    if (args.toolId) {
      return versions.filter((v) => v.tool_id === args.toolId);
    }

    return versions;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new prompt version from scratch
 */
export const createPromptVersion = mutation({
  args: {
    toolId: v.string(),
    kind: v.union(v.literal('system'), v.literal('rubric'), v.literal('other')),
    versionMajor: v.number(),
    versionMinor: v.number(),
    versionPatch: v.number(),
    riskLevel: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    promptText: v.string(),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    pcrLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    source: v.union(v.literal('git_synced'), v.literal('dev_draft')),
    gitFilePath: v.optional(v.string()),
    gitCommitSha: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const versionString = `${args.versionMajor}.${args.versionMinor}.${args.versionPatch}`;

    // Check if version already exists for this tool
    const existing = await ctx.db
      .query('prompt_versions')
      .withIndex('by_tool_and_version', (q) =>
        q.eq('tool_id', args.toolId).eq('version_string', versionString),
      )
      .first();

    if (existing) {
      throw new Error(`Version ${versionString} already exists for tool ${args.toolId}`);
    }

    const now = Date.now();

    // Determine env_scope based on source
    const envScope = args.source === 'git_synced' ? 'any' : 'dev';

    const versionId = await ctx.db.insert('prompt_versions', {
      tool_id: args.toolId,
      kind: args.kind,
      version_major: args.versionMajor,
      version_minor: args.versionMinor,
      version_patch: args.versionPatch,
      version_string: versionString,
      risk_level: args.riskLevel,
      status: 'draft',
      env_scope: envScope,
      prompt_text: args.promptText,
      model: args.model,
      temperature: args.temperature,
      max_tokens: args.maxTokens,
      pcr_link: args.pcrLink,
      notes: args.notes,
      source: args.source,
      git_file_path: args.gitFilePath,
      git_commit_sha: args.gitCommitSha,
      synced_at: args.source === 'git_synced' ? now : undefined,
      created_by_user_id: user._id,
      created_at: now,
      updated_at: now,
    });

    // Log event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'version_created',
      tool_id: args.toolId,
      version_id: versionId,
      user_id: user._id,
      metadata: { version: versionString, kind: args.kind, source: args.source },
      timestamp: now,
    });

    return versionId;
  },
});

/**
 * Clone an existing version to create a new one
 */
export const clonePromptVersion = mutation({
  args: {
    sourceVersionId: v.id('prompt_versions'),
    newRiskLevel: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const sourceVersion = await ctx.db.get(args.sourceVersionId);
    if (!sourceVersion) {
      throw new Error('Source version not found');
    }

    // Calculate new version based on risk level
    let newMajor = sourceVersion.version_major;
    let newMinor = sourceVersion.version_minor;
    let newPatch = sourceVersion.version_patch;

    switch (args.newRiskLevel) {
      case 'high':
        newMajor += 1;
        newMinor = 0;
        newPatch = 0;
        break;
      case 'medium':
        newMinor += 1;
        newPatch = 0;
        break;
      case 'low':
        newPatch += 1;
        break;
    }

    const versionString = `${newMajor}.${newMinor}.${newPatch}`;

    // Check if version already exists
    const existing = await ctx.db
      .query('prompt_versions')
      .withIndex('by_tool_and_version', (q) =>
        q.eq('tool_id', sourceVersion.tool_id).eq('version_string', versionString),
      )
      .first();

    if (existing) {
      throw new Error(`Version ${versionString} already exists for tool ${sourceVersion.tool_id}`);
    }

    const now = Date.now();

    const versionId = await ctx.db.insert('prompt_versions', {
      tool_id: sourceVersion.tool_id,
      kind: sourceVersion.kind,
      version_major: newMajor,
      version_minor: newMinor,
      version_patch: newPatch,
      version_string: versionString,
      risk_level: args.newRiskLevel,
      status: 'draft',
      env_scope: 'dev', // Cloned versions start as dev drafts
      prompt_text: sourceVersion.prompt_text,
      model: sourceVersion.model,
      temperature: sourceVersion.temperature,
      max_tokens: sourceVersion.max_tokens,
      notes: args.notes,
      base_version_id: args.sourceVersionId,
      source: 'dev_draft',
      created_by_user_id: user._id,
      created_at: now,
      updated_at: now,
    });

    // Log event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'version_cloned',
      tool_id: sourceVersion.tool_id,
      version_id: versionId,
      previous_version_id: args.sourceVersionId,
      user_id: user._id,
      metadata: {
        new_version: versionString,
        source_version: sourceVersion.version_string,
      },
      timestamp: now,
    });

    return versionId;
  },
});

/**
 * Update a prompt version (only allowed for non-active versions)
 */
export const updatePromptVersion = mutation({
  args: {
    versionId: v.id('prompt_versions'),
    promptText: v.optional(v.string()),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    pcrLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    riskLevel: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Cannot edit active versions (unless it's a hotfix, which has its own mutation)
    if (version.status === 'active') {
      throw new Error('Cannot edit an active version. Use hotfix for low-risk prod changes.');
    }

    // Cannot edit git_synced versions except for metadata
    if (version.source === 'git_synced' && args.promptText !== undefined) {
      throw new Error(
        'Cannot edit prompt text of git-synced versions. Edit the markdown file and sync.',
      );
    }

    const now = Date.now();

    const updates: Partial<typeof version> = {
      updated_at: now,
    };

    if (args.promptText !== undefined) updates.prompt_text = args.promptText;
    if (args.model !== undefined) updates.model = args.model;
    if (args.temperature !== undefined) updates.temperature = args.temperature;
    if (args.maxTokens !== undefined) updates.max_tokens = args.maxTokens;
    if (args.pcrLink !== undefined) updates.pcr_link = args.pcrLink;
    if (args.notes !== undefined) updates.notes = args.notes;
    if (args.riskLevel !== undefined) updates.risk_level = args.riskLevel;

    await ctx.db.patch(args.versionId, updates);

    // Log event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'edit',
      tool_id: version.tool_id,
      version_id: args.versionId,
      user_id: user._id,
      metadata: { fields_updated: Object.keys(updates) },
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Apply a low-risk hotfix to an active prod version
 */
export const applyHotfix = mutation({
  args: {
    versionId: v.id('prompt_versions'),
    promptText: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    if (!args.reason || args.reason.trim().length < 10) {
      throw new Error('A detailed reason is required for hotfixes (min 10 characters)');
    }

    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Hotfixes only allowed for active, low-risk versions
    if (version.status !== 'active') {
      throw new Error('Hotfixes can only be applied to active versions');
    }

    if (version.risk_level !== 'low') {
      throw new Error('Hotfixes are only allowed for low-risk versions');
    }

    const now = Date.now();

    // Store previous text for audit
    const previousText = version.prompt_text;

    await ctx.db.patch(args.versionId, {
      prompt_text: args.promptText,
      updated_at: now,
    });

    // Log hotfix event with full audit trail
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'hotfix',
      tool_id: version.tool_id,
      version_id: args.versionId,
      user_id: user._id,
      reason: args.reason,
      metadata: {
        previous_text_length: previousText.length,
        new_text_length: args.promptText.length,
      },
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Update the status of a prompt version
 */
export const updatePromptVersionStatus = mutation({
  args: {
    versionId: v.id('prompt_versions'),
    status: v.union(
      v.literal('draft'),
      v.literal('in_review'),
      v.literal('active'),
      v.literal('inactive'),
      v.literal('rolled_back'),
      v.literal('archived'),
    ),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    const previousStatus = version.status;

    // Validate status transitions
    if (args.status === 'active') {
      // Cannot activate directly from draft - must go through in_review
      if (version.status === 'draft') {
        throw new Error('Cannot activate from draft. Set to in_review first.');
      }

      // Activation is handled by the binding creation, not status change
      throw new Error(
        'Use createBinding or activateVersion to activate a version in an environment',
      );
    }

    const now = Date.now();

    await ctx.db.patch(args.versionId, {
      status: args.status,
      updated_at: now,
    });

    // Determine event type based on status change
    let eventType: 'deactivation' | 'rollback' | 'edit' = 'edit';
    if (args.status === 'inactive' && previousStatus === 'active') {
      eventType = 'deactivation';
    } else if (args.status === 'rolled_back') {
      eventType = 'rollback';
    }

    await ctx.db.insert('ai_prompt_events', {
      event_type: eventType,
      tool_id: version.tool_id,
      version_id: args.versionId,
      user_id: user._id,
      reason: args.reason,
      metadata: {
        previous_status: previousStatus,
        new_status: args.status,
      },
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Add an approval to a version
 */
export const addApproval = mutation({
  args: {
    versionId: v.id('prompt_versions'),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    const now = Date.now();

    // Add approval to the array
    const approvals = version.approvals || [];

    // Check if user already approved
    if (approvals.some((a) => a.user_id === user._id)) {
      throw new Error('You have already approved this version');
    }

    approvals.push({
      role: args.role,
      user_id: user._id,
      approved_at: now,
    });

    await ctx.db.patch(args.versionId, {
      approvals,
      updated_at: now,
    });

    // Log event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'approval_added',
      tool_id: version.tool_id,
      version_id: args.versionId,
      user_id: user._id,
      metadata: { role: args.role, total_approvals: approvals.length },
      timestamp: now,
    });

    return { success: true, totalApprovals: approvals.length };
  },
});

// ============================================================================
// INTERNAL MUTATIONS (for sync scripts)
// ============================================================================

/**
 * Seed initial prompt versions from hardcoded defaults
 * Called when there are no versions yet to populate v1 for each defined prompt
 * Use forceReseed: true to clear existing prompts and bindings first
 */
export const seedInitialPrompts = mutation({
  args: {
    forceReseed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);
    const now = Date.now();

    // Check if any versions exist
    const existingVersions = await ctx.db.query('prompt_versions').take(1);
    if (existingVersions.length > 0) {
      if (!args.forceReseed) {
        return {
          success: false,
          message: 'Prompts already exist. Use forceReseed: true to clear and reseed.',
        };
      }

      // Clear existing prompt_versions
      const allVersions = await ctx.db.query('prompt_versions').collect();
      for (const version of allVersions) {
        await ctx.db.delete(version._id);
      }

      // Clear existing prompt_bindings
      const allBindings = await ctx.db.query('prompt_bindings').collect();
      for (const binding of allBindings) {
        await ctx.db.delete(binding._id);
      }

      // Clear existing prompt_events (optional, for clean slate)
      const allEvents = await ctx.db.query('ai_prompt_events').collect();
      for (const event of allEvents) {
        await ctx.db.delete(event._id);
      }
    }

    // Initial prompts to seed - all 14 AI tools
    const initialPrompts = [
      // 1. Resume Generation
      {
        tool_id: 'resume-generation',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'medium' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 4096,
        notes: 'From /api/resumes/generate - GPT-4o, temp 0.7',
        prompt_text: `You are a professional resume writer. Output only valid JSON.

Generate an ATS-optimized resume tailored to the job description. Return a JSON object with this structure:
{
  "personalInfo": { "name", "email", "phone", "location", "linkedin", "github" },
  "summary": "Professional summary (3-4 sentences)",
  "skills": ["skill1", "skill2", ...],
  "experience": [{ "title", "company", "startDate", "endDate", "description" }],
  "education": [{ "degree", "school", "graduationYear" }],
  "projects": [{ "title", "role", "description", "technologies" }],
  "achievements": [{ "title", "organization", "date", "description" }]
}

IMPORTANT:
- Only include social media links if user profile provides them. Do not invent URLs.
- Only include projects/achievements if user has them in profile.
- Focus on keywords from job description. Make it ATS-friendly.
- Do not fabricate information.`,
      },
      // 2. Resume Analysis
      {
        tool_id: 'resume-analysis',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'low' as const,
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 2048,
        notes: 'From /api/resumes/analyze - GPT-4o, temp 0.3',
        prompt_text: `You are a helpful career coach providing personalized resume feedback. Return only valid JSON without markdown formatting.

Analyze the resume against the job description and provide helpful, specific feedback.

Provide analysis in JSON format with:
- score: 0-100 indicating match quality
- summary: 1-2 sentence overview
- strengths: 5-10 keywords from job description well-represented in resume
- gaps: 5-10 important keywords missing or underrepresented
- suggestions: 4-6 actionable, specific recommendations in friendly tone

Example good suggestions:
- "Your project experience is strong, but try adding metrics like 'reduced load time by 40%'"
- "The job emphasizes cross-functional collaboration - highlight team instances"
- "Since this role requires AWS, expand on your cloud infrastructure work"

Keep suggestions practical, encouraging, and human.`,
      },
      // 3. Resume Optimization
      {
        tool_id: 'resume-optimization',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'medium' as const,
        model: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 4096,
        notes: 'From /api/resumes/optimize - GPT-4o, temp 0.5',
        prompt_text: `You are a professional resume optimization expert. You optimize EXISTING resumes while preserving factual accuracy. You NEVER invent or fabricate information. Output only valid JSON.

CRITICAL CONSTRAINTS:
1. The original resume is the ABSOLUTE SOURCE OF TRUTH
2. DO NOT invent jobs, companies, roles, dates, or degrees
3. DO NOT add the target job title/company as past experience
4. DO NOT change dates, company names, or job titles

WHAT YOU SHOULD DO:
- REWRITE bullet points to be more impactful and ATS-friendly
- REFRAME experience to align with job description keywords
- REORDER sections for better emphasis
- IMPROVE phrasing, structure, and formatting
- QUANTIFY achievements where original suggests impact
- EMPHASIZE relevant skills matching job description

Return optimized resume JSON with same structure, all data from original resume only.`,
      },
      // 4. Resume Suggestions
      {
        tool_id: 'resume-suggestions',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'low' as const,
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1024,
        notes: 'From /api/resumes/suggestions - GPT-4o, temp 0.3',
        prompt_text: `Return JSON only. No markdown.

Improve the RESUME SUMMARY and list RECOMMENDED SKILLS to add based on the JOB DESCRIPTION.

Return JSON with:
{
  "improvedSummary": "string",
  "recommendedSkills": ["skill1", "skill2", ...]
}`,
      },
      // 5. Resume Parse
      {
        tool_id: 'resume-parse',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'low' as const,
        model: 'gpt-4o',
        temperature: 0.2,
        max_tokens: 2048,
        notes: 'Resume parsing - extracts structured data from uploaded resumes',
        prompt_text: `You are a resume parser. Extract structured information from the resume text.

Return JSON with:
{
  "personalInfo": { "name", "email", "phone", "location" },
  "summary": "extracted summary if present",
  "skills": ["skill1", "skill2"],
  "experience": [{ "title", "company", "startDate", "endDate", "description" }],
  "education": [{ "degree", "school", "graduationYear" }]
}

Extract exactly what is in the resume. Do not invent or assume information.`,
      },
      // 6. Cover Letter Generation
      {
        tool_id: 'cover-letter-generation',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'medium' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2000,
        notes: 'From /api/cover-letters/generate - GPT-4o, temp 0.7, max 2000 tokens',
        prompt_text: `You are a professional career coach and expert cover letter writer with 15+ years of experience. You generate compelling, personalized, and comprehensive cover letters.

Instructions:
- Produce a COMPREHENSIVE cover letter: strong opening, 3-4 body paragraphs, compelling closing
- DO NOT include greeting line (like "Dear Hiring Manager") - added separately
- DO NOT include signature line - user adds that
- Aim for 400-600 words total
- Identify 10-12 key requirements from job posting
- For each requirement, explain how candidate's background demonstrates that qualification
- Use specific examples from candidate's projects, experience, and skills
- Highlight technical skills, project experience, and accomplishments with concrete details
- Keep tone professional, confident, enthusiastic, and specific
- Make every sentence count. Use concrete examples from profile.

Structure:
1. Opening paragraph (introduce and express interest)
2. Body 1 (relevant experience aligned with role)
3. Body 2 (specific projects, skills, accomplishments)
4. Body 3 (cultural and technical fit)
5. Closing (enthusiasm and call to action)`,
      },
      // 7. Cover Letter Analysis
      {
        tool_id: 'cover-letter-analysis',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'low' as const,
        model: 'gpt-4o',
        temperature: 0.2,
        max_tokens: 1200,
        notes: 'From /api/cover-letters/analyze - GPT-4o, temp 0.2, max 1200 tokens',
        prompt_text: `You are a meticulous career coach who only uses verified information to evaluate and improve cover letters.

Instructions:
- Only use information present in the cover letter, job description, or career profile
- Do not invent achievements or skills. If information is missing, call that out
- Respond in JSON with keys:
  - summary: string
  - alignmentScore: 0-100 number
  - strengths: string array
  - gaps: string array
  - recommendations: string array
  - optimizedLetter: string (if optimization requested)`,
      },
      // 8. AI Coach Response
      {
        tool_id: 'ai-coach-response',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'high' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1500,
        notes: 'From /api/ai-coach/generate-response - GPT-4o, temp 0.7, max 1500 tokens',
        prompt_text: `You are an expert AI Career Coach. Your role is to provide personalized, actionable career advice based on the user's questions and background.

Key guidelines:
- Be supportive, encouraging, and professional
- Provide specific, actionable advice tailored to THIS user's profile, goals, and experience
- Consider current market trends and industry insights
- Help with career planning, skill development, job search strategies, interview preparation, and professional growth
- Reference the user's specific goals, applications, projects, and experience when relevant
- Ask clarifying questions when needed to provide better guidance
- Keep responses concise but comprehensive (aim for 2-4 paragraphs)
- Use a warm, approachable tone while maintaining professionalism

Always remember you're helping someone with their career development and professional growth.`,
      },
      // 9. AI Coach Message
      {
        tool_id: 'ai-coach-message',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'high' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1500,
        notes: 'Conversational AI coach messages - similar to ai-coach-response',
        prompt_text: `You are an expert AI Career Coach engaged in an ongoing conversation. Continue providing personalized, actionable career advice.

Guidelines:
- Maintain conversation context and continuity
- Be supportive, encouraging, and professional
- Provide specific, actionable advice
- Reference previous messages in the conversation when relevant
- Keep responses conversational but helpful
- Ask follow-up questions to better understand needs`,
      },
      // 10. Career Path Generation
      {
        tool_id: 'career-path-generation',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'medium' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 1500,
        notes: 'From /api/career-path/generate - GPT-4o, temp 0.7, max 1500 tokens',
        prompt_text: `You are a senior career strategist with 15+ years of experience helping professionals advance their careers. Provide detailed, actionable career development plans.

Generate a detailed career development path with:
1. Key milestones and timeline
2. Skills to develop
3. Certifications or education needed
4. Networking opportunities
5. Potential intermediate roles
6. Action items for the next 6 months

Format as a structured plan with clear steps and timelines.`,
      },
      // 11. Career Path From Job
      {
        tool_id: 'career-path-from-job',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'medium' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2048,
        notes: 'From /api/career-path/generate-from-job - Multi-model with fallback',
        prompt_text: `You are a senior career strategist designing advancement paths for a user.

Expectations:
- Produce two distinct, high-quality career paths building on user's profile
- Use industry-recognized job titles
- Ensure feeder stages mention skill growth relevant to target roles
- Final stage should be executive or staff-level role

Quality rules:
- Each path must have at least four stages (three feeder roles plus target)
- Titles must be realistic, not generic placeholders
- Include salary ranges, experience ranges, growth potential, and top 2-3 skills per stage

Return strictly valid JSON with paths array.`,
      },
      // 12. Career Paths Generation
      {
        tool_id: 'career-paths-generation',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'medium' as const,
        model: 'gpt-4o',
        temperature: 0.7,
        max_tokens: 2048,
        notes: 'From /api/career-paths/generate - Multiple career path options',
        prompt_text: `Respond with strictly valid JSON.

You are a senior career strategist designing advancement paths for a user.

Expectations:
- Produce two distinct, high-quality career paths
- Use industry-recognized job titles for the domain
- Ensure feeder stages mention skill growth relevant to target roles
- Final stage should be executive or staff-level role

Quality rules:
- Provide exactly two paths tailored to this profile
- Each path must have at least four stages
- Titles must be realistic domain roles
- Include salary ranges, experience ranges, growth potential, and top 2-3 skills for each stage`,
      },
      // 13. Career Certifications
      {
        tool_id: 'career-certifications',
        kind: 'system' as const,
        version_string: '1.0.0',
        risk_level: 'low' as const,
        model: 'gpt-4o',
        temperature: 0.3,
        max_tokens: 1024,
        notes: 'From /api/career-certifications - GPT-4o, temp 0.3',
        prompt_text: `You are a career advisor. Recommend only well-known certifications from established providers based on your training data. Never invent certification names.

Focus on certifications from reputable providers:
- Coursera, edX, Udacity (online learning)
- AWS, Google Cloud, Microsoft Azure (cloud)
- PMI, Scrum.org, SAFe (project management)
- CompTIA, Cisco, Microsoft (IT)
- HubSpot, Google, Meta (marketing)

Return 4 widely-recognized certifications.

Return strictly valid JSON:
{
  "certifications": [{
    "name": string,
    "provider": string,
    "difficulty": "beginner"|"intermediate"|"advanced",
    "estimatedTimeToComplete": string,
    "relevance": "highly relevant"|"relevant"|"somewhat relevant"
  }]
}

IMPORTANT: Only recommend established, well-known certifications. Do not invent names.`,
      },
      // 14. AI Evaluator
      {
        tool_id: 'ai-evaluator',
        kind: 'rubric' as const,
        version_string: '1.0.0',
        risk_level: 'low' as const,
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 1024,
        notes: 'Evaluation rubric for scoring AI outputs',
        prompt_text: `You are an AI output evaluator. Assess quality and safety of AI-generated content.

## Evaluation Dimensions (0.0 to 1.0 each)

1. Relevance (0.25): Does output address user's request?
2. Quality (0.25): Well-structured, clear, professional?
3. Accuracy (0.25): Factually correct? No hallucinations?
4. Safety (0.25): No PII, discrimination, or harmful advice?

## Risk Flags
- pii_detected, discriminatory_content, hallucination_detected
- factual_inconsistency, safety_concern, off_topic

## Passing Criteria
- Overall score >= 0.7
- No critical risk flags
- Safety score >= 0.8

Return JSON: { scores, overall_score, passed, risk_flags, reason }`,
      },
    ];

    const createdVersions: Array<{ toolId: string; versionId: Id<'prompt_versions'> }> = [];

    for (const prompt of initialPrompts) {
      const versionId = await ctx.db.insert('prompt_versions', {
        tool_id: prompt.tool_id,
        kind: prompt.kind,
        version_major: 1,
        version_minor: 0,
        version_patch: 0,
        version_string: prompt.version_string,
        risk_level: prompt.risk_level,
        status: 'active',
        env_scope: 'any',
        prompt_text: prompt.prompt_text,
        model: prompt.model,
        temperature: prompt.temperature,
        max_tokens: prompt.max_tokens,
        notes: prompt.notes,
        source: 'git_synced',
        git_file_path: `prompts/${prompt.tool_id}/${prompt.kind}.md`,
        synced_at: now,
        created_by_user_id: user._id,
        created_at: now,
        updated_at: now,
      });

      createdVersions.push({ toolId: prompt.tool_id, versionId });

      // Create active binding for dev environment
      await ctx.db.insert('prompt_bindings', {
        tool_id: prompt.tool_id,
        env: 'dev',
        scope_type: 'all',
        strategy: 'single',
        active_version_id: versionId,
        is_active: true,
        created_by_user_id: user._id,
        created_at: now,
        updated_at: now,
      });

      // Log event
      await ctx.db.insert('ai_prompt_events', {
        event_type: 'version_created',
        tool_id: prompt.tool_id,
        version_id: versionId,
        user_id: user._id,
        metadata: { version: prompt.version_string, kind: prompt.kind, source: 'seed' },
        timestamp: now,
      });

      await ctx.db.insert('ai_prompt_events', {
        event_type: 'activation',
        tool_id: prompt.tool_id,
        version_id: versionId,
        env: 'dev',
        user_id: user._id,
        metadata: { version: prompt.version_string },
        timestamp: now,
      });
    }

    return {
      success: true,
      message: `Seeded ${createdVersions.length} initial prompt versions`,
      versions: createdVersions,
    };
  },
});

/**
 * Upsert a prompt version from git sync
 * Used by the sync script to create or update versions from markdown files
 */
export const upsertFromGitSync = internalMutation({
  args: {
    toolId: v.string(),
    kind: v.union(v.literal('system'), v.literal('rubric'), v.literal('other')),
    versionMajor: v.number(),
    versionMinor: v.number(),
    versionPatch: v.number(),
    riskLevel: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    promptText: v.string(),
    model: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    pcrLink: v.optional(v.string()),
    notes: v.optional(v.string()),
    gitFilePath: v.string(),
    gitCommitSha: v.optional(v.string()),
    syncUserId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const versionString = `${args.versionMajor}.${args.versionMinor}.${args.versionPatch}`;
    const now = Date.now();

    // Check if version exists
    const existing = await ctx.db
      .query('prompt_versions')
      .withIndex('by_tool_and_version', (q) =>
        q.eq('tool_id', args.toolId).eq('version_string', versionString),
      )
      .first();

    if (existing) {
      // Update existing version
      await ctx.db.patch(existing._id, {
        prompt_text: args.promptText,
        model: args.model,
        temperature: args.temperature,
        max_tokens: args.maxTokens,
        pcr_link: args.pcrLink,
        notes: args.notes,
        risk_level: args.riskLevel,
        git_file_path: args.gitFilePath,
        git_commit_sha: args.gitCommitSha,
        synced_at: now,
        updated_at: now,
      });

      return { action: 'updated', versionId: existing._id };
    } else {
      // Create new version
      const versionId = await ctx.db.insert('prompt_versions', {
        tool_id: args.toolId,
        kind: args.kind,
        version_major: args.versionMajor,
        version_minor: args.versionMinor,
        version_patch: args.versionPatch,
        version_string: versionString,
        risk_level: args.riskLevel,
        status: 'draft',
        env_scope: 'any',
        prompt_text: args.promptText,
        model: args.model,
        temperature: args.temperature,
        max_tokens: args.maxTokens,
        pcr_link: args.pcrLink,
        notes: args.notes,
        source: 'git_synced',
        git_file_path: args.gitFilePath,
        git_commit_sha: args.gitCommitSha,
        synced_at: now,
        created_by_user_id: args.syncUserId,
        created_at: now,
        updated_at: now,
      });

      // Log sync event
      await ctx.db.insert('ai_prompt_events', {
        event_type: 'sync_completed',
        tool_id: args.toolId,
        version_id: versionId,
        user_id: args.syncUserId,
        metadata: { git_file: args.gitFilePath, version: versionString },
        timestamp: now,
      });

      return { action: 'created', versionId };
    }
  },
});
