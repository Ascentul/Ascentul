/**
 * AI Eval Runs - Evaluation run recording and management
 *
 * Records results from running AI tool evaluations:
 * - Test case execution results
 * - Scores and pass/fail status
 * - Latency and model info
 */

import { v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { requireSuperAdmin } from './lib/roles';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List eval runs with filters
 */
export const listEvalRuns = query({
  args: {
    toolId: v.optional(v.string()),
    versionId: v.optional(v.id('prompt_versions')),
    status: v.optional(
      v.union(v.literal('pending'), v.literal('running'), v.literal('success'), v.literal('error')),
    ),
    passed: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 100;

    let runs;
    if (args.toolId) {
      runs = await ctx.db
        .query('ai_eval_runs')
        .withIndex('by_tool', (q) => q.eq('tool_id', args.toolId!))
        .order('desc')
        .take(limit * 2);
    } else if (args.versionId) {
      runs = await ctx.db
        .query('ai_eval_runs')
        .withIndex('by_version', (q) => q.eq('prompt_version_id', args.versionId!))
        .order('desc')
        .take(limit * 2);
    } else {
      runs = await ctx.db
        .query('ai_eval_runs')
        .order('desc')
        .take(limit * 2);
    }

    // Apply filters
    if (args.status) {
      runs = runs.filter((r) => r.status === args.status);
    }
    if (args.passed !== undefined) {
      runs = runs.filter((r) => r.passed === args.passed);
    }

    return runs.slice(0, limit);
  },
});

/**
 * Get a single eval run by ID
 */
export const getEvalRun = query({
  args: {
    evalRunId: v.id('ai_eval_runs'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const run = await ctx.db.get(args.evalRunId);
    if (!run) return null;

    // Get related data
    const version = await ctx.db.get(run.prompt_version_id);
    const testCase = run.test_case_id ? await ctx.db.get(run.test_case_id) : null;

    // Get feedback if any
    const feedback = await ctx.db
      .query('ai_eval_feedback')
      .withIndex('by_eval_run', (q) => q.eq('eval_run_id', run._id))
      .collect();

    return {
      ...run,
      version,
      testCase,
      feedback,
    };
  },
});

/**
 * Get eval stats for a version
 */
export const getVersionEvalStats = query({
  args: {
    versionId: v.id('prompt_versions'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const runs = await ctx.db
      .query('ai_eval_runs')
      .withIndex('by_version', (q) => q.eq('prompt_version_id', args.versionId))
      .collect();

    if (runs.length === 0) {
      return null;
    }

    const completedRuns = runs.filter((r) => r.status === 'success');
    const passedRuns = completedRuns.filter((r) => r.passed);
    const scores = completedRuns
      .map((r) => r.auto_score)
      .filter((s): s is number => s !== undefined);

    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    const latencies = completedRuns
      .map((r) => r.latency_ms)
      .filter((l): l is number => l !== undefined);
    const avgLatency =
      latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : null;

    return {
      totalRuns: runs.length,
      completedRuns: completedRuns.length,
      passedRuns: passedRuns.length,
      failedRuns: completedRuns.length - passedRuns.length,
      passRate: completedRuns.length > 0 ? passedRuns.length / completedRuns.length : 0,
      avgScore,
      avgLatency,
      lastRunAt: runs[0]?.created_at,
    };
  },
});

/**
 * Get eval stats for a tool
 */
export const getToolEvalStats = query({
  args: {
    toolId: v.string(),
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const days = args.days ?? 30;
    const since = Date.now() - days * 24 * 60 * 60 * 1000;

    const runs = await ctx.db
      .query('ai_eval_runs')
      .withIndex('by_tool', (q) => q.eq('tool_id', args.toolId))
      .collect();

    const recentRuns = runs.filter((r) => r.created_at >= since);
    const completedRuns = recentRuns.filter((r) => r.status === 'success');
    const passedRuns = completedRuns.filter((r) => r.passed);

    return {
      totalRuns: recentRuns.length,
      completedRuns: completedRuns.length,
      passedRuns: passedRuns.length,
      passRate: completedRuns.length > 0 ? passedRuns.length / completedRuns.length : 0,
      period: `Last ${days} days`,
    };
  },
});

/**
 * Get recent eval runs across all tools (dashboard view)
 */
export const getRecentEvalRuns = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const limit = args.limit ?? 20;

    const runs = await ctx.db
      .query('ai_eval_runs')
      .withIndex('by_created_at')
      .order('desc')
      .take(limit);

    // Enrich with version info
    return Promise.all(
      runs.map(async (run) => {
        const version = await ctx.db.get(run.prompt_version_id);
        return {
          ...run,
          version: version
            ? {
                _id: version._id,
                version_string: version.version_string,
              }
            : null,
        };
      }),
    );
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new eval run (called when starting an evaluation)
 */
export const createEvalRun = mutation({
  args: {
    toolId: v.string(),
    versionId: v.id('prompt_versions'),
    testCaseId: v.optional(v.id('ai_test_cases')),
    suiteName: v.optional(v.string()),
    model: v.string(),
    inputSnapshot: v.optional(v.any()),
    env: v.union(v.literal('dev'), v.literal('prod')),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const now = Date.now();

    const runId = await ctx.db.insert('ai_eval_runs', {
      tool_id: args.toolId,
      prompt_version_id: args.versionId,
      test_case_id: args.testCaseId,
      suite_name: args.suiteName,
      env: args.env,
      status: 'pending',
      model: args.model,
      input_snapshot: args.inputSnapshot,
      created_by_user_id: user._id,
      created_at: now,
    });

    return runId;
  },
});

/**
 * Update eval run with results
 */
export const updateEvalRunResult = mutation({
  args: {
    evalRunId: v.id('ai_eval_runs'),
    status: v.union(
      v.literal('pending'),
      v.literal('running'),
      v.literal('success'),
      v.literal('error'),
    ),
    outputSnapshot: v.optional(v.any()),
    autoScore: v.optional(v.number()),
    dimensionScores: v.optional(v.any()),
    passed: v.optional(v.boolean()),
    riskFlags: v.optional(v.array(v.string())),
    outputSummary: v.optional(v.string()),
    latencyMs: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const run = await ctx.db.get(args.evalRunId);
    if (!run) {
      throw new Error('Eval run not found');
    }

    const now = Date.now();

    const updates: Record<string, unknown> = {
      status: args.status,
    };

    if (args.outputSnapshot !== undefined) updates.output_snapshot = args.outputSnapshot;
    if (args.autoScore !== undefined) updates.auto_score = args.autoScore;
    if (args.dimensionScores !== undefined) updates.dimension_scores = args.dimensionScores;
    if (args.passed !== undefined) updates.passed = args.passed;
    if (args.riskFlags !== undefined) updates.risk_flags = args.riskFlags;
    if (args.outputSummary !== undefined) updates.output_summary = args.outputSummary;
    if (args.latencyMs !== undefined) updates.latency_ms = args.latencyMs;
    if (args.errorMessage !== undefined) updates.error_message = args.errorMessage;

    if (args.status === 'success' || args.status === 'error') {
      updates.completed_at = now;
    }

    await ctx.db.patch(args.evalRunId, updates);

    return { success: true };
  },
});

/**
 * Record eval run from internal evaluation (used by AI routes)
 */
export const recordEvalRun = internalMutation({
  args: {
    toolId: v.string(),
    versionId: v.id('prompt_versions'),
    env: v.union(v.literal('dev'), v.literal('prod')),
    model: v.string(),
    inputSnapshot: v.optional(v.any()),
    outputSnapshot: v.optional(v.any()),
    autoScore: v.optional(v.number()),
    passed: v.boolean(),
    riskFlags: v.optional(v.array(v.string())),
    latencyMs: v.optional(v.number()),
    userId: v.optional(v.id('users')),
    experimentVariant: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const runId = await ctx.db.insert('ai_eval_runs', {
      tool_id: args.toolId,
      prompt_version_id: args.versionId,
      env: args.env,
      status: 'success',
      model: args.model,
      input_snapshot: args.inputSnapshot,
      output_snapshot: args.outputSnapshot,
      auto_score: args.autoScore,
      passed: args.passed,
      risk_flags: args.riskFlags,
      latency_ms: args.latencyMs,
      experiment_variant: args.experimentVariant,
      created_by_user_id: args.userId,
      created_at: now,
      completed_at: now,
    });

    return runId;
  },
});

/**
 * Run batch evaluation for a version
 */
export const runBatchEval = mutation({
  args: {
    toolId: v.string(),
    versionId: v.id('prompt_versions'),
    testCaseIds: v.optional(v.array(v.id('ai_test_cases'))),
    suiteName: v.optional(v.string()),
    model: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    // Get test cases to run
    let testCases;
    if (args.testCaseIds && args.testCaseIds.length > 0) {
      testCases = await Promise.all(args.testCaseIds.map((id) => ctx.db.get(id)));
      testCases = testCases.filter((tc): tc is NonNullable<typeof tc> => tc !== null);
    } else if (args.suiteName) {
      testCases = await ctx.db
        .query('ai_test_cases')
        .withIndex('by_tool_and_suite', (q) =>
          q.eq('tool_id', args.toolId).eq('suite_name', args.suiteName!),
        )
        .filter((q) => q.eq(q.field('is_active'), true))
        .collect();
    } else {
      testCases = await ctx.db
        .query('ai_test_cases')
        .withIndex('by_tool_id', (q) => q.eq('tool_id', args.toolId))
        .filter((q) => q.eq(q.field('is_active'), true))
        .collect();
    }

    if (testCases.length === 0) {
      throw new Error('No test cases found for this tool');
    }

    const now = Date.now();

    // Create pending eval runs for each test case
    const runIds = [];
    for (const tc of testCases) {
      const runId = await ctx.db.insert('ai_eval_runs', {
        tool_id: args.toolId,
        prompt_version_id: args.versionId,
        test_case_id: tc._id,
        suite_name: tc.suite_name,
        env: args.env,
        status: 'pending',
        model: args.model,
        input_snapshot: tc.input_payload,
        created_by_user_id: user._id,
        created_at: now,
      });
      runIds.push(runId);
    }

    return {
      runIds,
      testCaseCount: testCases.length,
    };
  },
});
