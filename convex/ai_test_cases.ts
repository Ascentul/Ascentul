/**
 * AI Test Cases - Test case management for AI tools
 *
 * Manages golden test cases for each AI tool:
 * - Input/expected behavior pairs
 * - Suite organization
 * - Git-first workflow support
 */

import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireSuperAdmin } from './lib/roles';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List test cases for a tool
 */
export const listTestCases = query({
  args: {
    toolId: v.string(),
    suiteName: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let testCases = await ctx.db
      .query('ai_test_cases')
      .withIndex('by_tool_id', (q) => q.eq('tool_id', args.toolId))
      .collect();

    // Apply filters
    if (args.suiteName) {
      testCases = testCases.filter((tc) => tc.suite_name === args.suiteName);
    }
    if (args.isActive !== undefined) {
      testCases = testCases.filter((tc) => tc.is_active === args.isActive);
    }

    // Enrich with user info
    return Promise.all(
      testCases.map(async (tc) => {
        const createdBy = await ctx.db.get(tc.created_by_user_id);
        return {
          ...tc,
          createdBy: createdBy
            ? {
                _id: createdBy._id,
                name: createdBy.name,
                email: createdBy.email,
              }
            : null,
        };
      }),
    );
  },
});

/**
 * Get a single test case by ID
 */
export const getTestCase = query({
  args: {
    testCaseId: v.id('ai_test_cases'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);
    return await ctx.db.get(args.testCaseId);
  },
});

/**
 * Get test case counts by tool
 */
export const getTestCaseCounts = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const testCases = await ctx.db.query('ai_test_cases').collect();

    // Group by tool
    const byTool: Record<
      string,
      { total: number; active: number; bySuite: Record<string, number> }
    > = {};

    for (const tc of testCases) {
      if (!byTool[tc.tool_id]) {
        byTool[tc.tool_id] = { total: 0, active: 0, bySuite: {} };
      }
      byTool[tc.tool_id].total++;
      if (tc.is_active) {
        byTool[tc.tool_id].active++;
      }
      byTool[tc.tool_id].bySuite[tc.suite_name] =
        (byTool[tc.tool_id].bySuite[tc.suite_name] || 0) + 1;
    }

    return byTool;
  },
});

/**
 * Get active test cases for running evals
 */
export const getActiveTestCasesForTool = query({
  args: {
    toolId: v.string(),
  },
  handler: async (ctx, args) => {
    const testCases = await ctx.db
      .query('ai_test_cases')
      .withIndex('by_tool_id', (q) => q.eq('tool_id', args.toolId))
      .filter((q) => q.eq(q.field('is_active'), true))
      .collect();

    return testCases;
  },
});

/**
 * Get test suites for a tool
 */
export const getTestSuites = query({
  args: {
    toolId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const testCases = await ctx.db
      .query('ai_test_cases')
      .withIndex('by_tool_id', (q) => q.eq('tool_id', args.toolId))
      .collect();

    // Group by suite
    const suites: Record<string, { total: number; active: number }> = {};
    for (const tc of testCases) {
      if (!suites[tc.suite_name]) {
        suites[tc.suite_name] = { total: 0, active: 0 };
      }
      suites[tc.suite_name].total++;
      if (tc.is_active) {
        suites[tc.suite_name].active++;
      }
    }

    return suites;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create a new test case
 */
export const createTestCase = mutation({
  args: {
    toolId: v.string(),
    suiteName: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    inputPayload: v.any(),
    expectedBehavior: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const now = Date.now();

    const testCaseId = await ctx.db.insert('ai_test_cases', {
      tool_id: args.toolId,
      suite_name: args.suiteName,
      name: args.name,
      description: args.description,
      input_payload: args.inputPayload,
      expected_behavior: args.expectedBehavior,
      tags: args.tags,
      is_active: true,
      source: 'manual',
      created_by_user_id: user._id,
      created_at: now,
      updated_at: now,
    });

    return testCaseId;
  },
});

/**
 * Update a test case
 */
export const updateTestCase = mutation({
  args: {
    testCaseId: v.id('ai_test_cases'),
    suiteName: v.optional(v.string()),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    inputPayload: v.optional(v.any()),
    expectedBehavior: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const testCase = await ctx.db.get(args.testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    const now = Date.now();

    const updates: Record<string, unknown> = {
      updated_at: now,
    };

    if (args.suiteName !== undefined) updates.suite_name = args.suiteName;
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.inputPayload !== undefined) updates.input_payload = args.inputPayload;
    if (args.expectedBehavior !== undefined) updates.expected_behavior = args.expectedBehavior;
    if (args.tags !== undefined) updates.tags = args.tags;
    if (args.isActive !== undefined) updates.is_active = args.isActive;

    await ctx.db.patch(args.testCaseId, updates);

    return { success: true };
  },
});

/**
 * Delete a test case
 */
export const deleteTestCase = mutation({
  args: {
    testCaseId: v.id('ai_test_cases'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const testCase = await ctx.db.get(args.testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    await ctx.db.delete(args.testCaseId);

    return { success: true };
  },
});

/**
 * Bulk import test cases
 */
export const bulkImportTestCases = mutation({
  args: {
    toolId: v.string(),
    suiteName: v.string(),
    testCases: v.array(
      v.object({
        name: v.string(),
        description: v.optional(v.string()),
        inputPayload: v.any(),
        expectedBehavior: v.optional(v.string()),
        tags: v.optional(v.array(v.string())),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const now = Date.now();
    const createdIds: string[] = [];

    for (const tc of args.testCases) {
      const id = await ctx.db.insert('ai_test_cases', {
        tool_id: args.toolId,
        suite_name: args.suiteName,
        name: tc.name,
        description: tc.description,
        input_payload: tc.inputPayload,
        expected_behavior: tc.expectedBehavior,
        tags: tc.tags,
        is_active: true,
        source: 'manual',
        created_by_user_id: user._id,
        created_at: now,
        updated_at: now,
      });
      createdIds.push(id);
    }

    return { success: true, count: createdIds.length, ids: createdIds };
  },
});

/**
 * Toggle test case active status
 */
export const toggleTestCaseActive = mutation({
  args: {
    testCaseId: v.id('ai_test_cases'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const testCase = await ctx.db.get(args.testCaseId);
    if (!testCase) {
      throw new Error('Test case not found');
    }

    await ctx.db.patch(args.testCaseId, {
      is_active: !testCase.is_active,
      updated_at: Date.now(),
    });

    return { success: true, isActive: !testCase.is_active };
  },
});
