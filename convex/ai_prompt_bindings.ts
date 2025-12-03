/**
 * AI Prompt Bindings - Maps tools to prompt versions
 *
 * Manages the relationship between AI tools and their active prompt versions.
 * Supports:
 * - Single version bindings (default)
 * - A/B experiment bindings with traffic splits
 * - Environment-specific bindings (dev, prod)
 */

import { v } from 'convex/values';

import { internalQuery, mutation, query } from './_generated/server';
import { requireSuperAdmin } from './lib/roles';

// ============================================================================
// QUERIES
// ============================================================================

/**
 * List all bindings with optional filters
 */
export const listBindings = query({
  args: {
    toolId: v.optional(v.string()),
    env: v.optional(v.union(v.literal('dev'), v.literal('prod'))),
    activeOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    let bindings;
    if (args.toolId && args.env) {
      bindings = await ctx.db
        .query('prompt_bindings')
        .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId!).eq('env', args.env!))
        .collect();
    } else if (args.toolId) {
      bindings = await ctx.db
        .query('prompt_bindings')
        .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId!))
        .collect();
    } else {
      bindings = await ctx.db.query('prompt_bindings').collect();
    }

    if (args.activeOnly) {
      bindings = bindings.filter((b) => b.is_active);
    }

    // Enrich with version info
    const enrichedBindings = await Promise.all(
      bindings.map(async (binding) => {
        const activeVersion = binding.active_version_id
          ? await ctx.db.get(binding.active_version_id)
          : null;

        const variants = binding.variants
          ? await Promise.all(
              binding.variants.map(async (variant) => ({
                ...variant,
                version: await ctx.db.get(variant.version_id),
              })),
            )
          : null;

        return {
          ...binding,
          activeVersion,
          variants,
        };
      }),
    );

    return enrichedBindings;
  },
});

/**
 * Get a single binding by ID
 */
export const getBinding = query({
  args: {
    bindingId: v.id('prompt_bindings'),
  },
  handler: async (ctx, args) => {
    await requireSuperAdmin(ctx);

    const binding = await ctx.db.get(args.bindingId);
    if (!binding) return null;

    const activeVersion = binding.active_version_id
      ? await ctx.db.get(binding.active_version_id)
      : null;

    return {
      ...binding,
      activeVersion,
    };
  },
});

/**
 * Get all active experiments
 */
export const getActiveExperiments = query({
  args: {},
  handler: async (ctx) => {
    await requireSuperAdmin(ctx);

    const experiments = await ctx.db
      .query('prompt_bindings')
      .filter((q) =>
        q.and(q.eq(q.field('strategy'), 'experiment'), q.eq(q.field('is_active'), true)),
      )
      .collect();

    // Enrich with version info
    return Promise.all(
      experiments.map(async (exp) => {
        const variants = exp.variants
          ? await Promise.all(
              exp.variants.map(async (variant) => ({
                ...variant,
                version: await ctx.db.get(variant.version_id),
              })),
            )
          : [];

        return {
          ...exp,
          variants,
        };
      }),
    );
  },
});

// ============================================================================
// INTERNAL QUERIES (for prompt resolver)
// ============================================================================

/**
 * Resolve the prompt for a given tool in an environment
 * This is the core resolver used by AI routes
 *
 * Returns the prompt text and metadata needed for the AI call
 */
export const resolvePromptForTool = internalQuery({
  args: {
    toolId: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find active binding for this tool/env
    const binding = await ctx.db
      .query('prompt_bindings')
      .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId).eq('env', args.env))
      .filter((q) => q.eq(q.field('is_active'), true))
      .first();

    if (!binding) {
      // No binding found - return null to signal fallback needed
      return null;
    }

    // Handle experiment bindings
    if (binding.strategy === 'experiment' && binding.variants && binding.variants.length > 0) {
      // Simple weighted random selection based on traffic percentage
      const rand = Math.random() * 100;
      let cumulative = 0;

      for (const variant of binding.variants) {
        cumulative += variant.traffic_pct;
        if (rand < cumulative) {
          const version = await ctx.db.get(variant.version_id);
          if (!version) continue;

          return {
            versionId: variant.version_id,
            versionString: version.version_string,
            promptText: version.prompt_text,
            model: version.model,
            temperature: version.temperature,
            maxTokens: version.max_tokens,
            isExperiment: true,
            variantName: variant.variant_name,
            experimentId: binding._id,
          };
        }
      }
    }

    // Handle single version bindings
    if (binding.active_version_id) {
      const version = await ctx.db.get(binding.active_version_id);
      if (!version) {
        return null;
      }

      return {
        versionId: binding.active_version_id,
        versionString: version.version_string,
        promptText: version.prompt_text,
        model: version.model,
        temperature: version.temperature,
        maxTokens: version.max_tokens,
        isExperiment: false,
        variantName: null,
        experimentId: null,
      };
    }

    return null;
  },
});

// ============================================================================
// MUTATIONS
// ============================================================================

/**
 * Create or update a single-version binding for a tool/env
 * This activates a prompt version for an environment
 */
export const createBinding = mutation({
  args: {
    toolId: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
    versionId: v.id('prompt_versions'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    // Verify version exists
    const version = await ctx.db.get(args.versionId);
    if (!version) {
      throw new Error('Version not found');
    }

    // Verify version can be activated in this environment
    if (version.env_scope !== 'any' && version.env_scope !== args.env) {
      throw new Error(
        `Version scope (${version.env_scope}) doesn't allow activation in ${args.env}`,
      );
    }

    // Check governance requirements for prod
    if (args.env === 'prod') {
      // High risk needs approvals
      if (version.risk_level === 'high') {
        const approvals = version.approvals || [];
        if (approvals.length < 1) {
          throw new Error('High-risk versions require at least 1 approval for production');
        }
      }

      // Medium/high risk needs PCR
      if ((version.risk_level === 'medium' || version.risk_level === 'high') && !version.pcr_link) {
        throw new Error('Medium and high risk versions require a PCR link for production');
      }
    }

    const now = Date.now();

    // Find existing binding
    const existingBinding = await ctx.db
      .query('prompt_bindings')
      .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId).eq('env', args.env))
      .first();

    let bindingId;
    let previousVersionId = null;

    if (existingBinding) {
      previousVersionId = existingBinding.active_version_id;

      // Update existing binding
      await ctx.db.patch(existingBinding._id, {
        active_version_id: args.versionId,
        strategy: 'single',
        variants: undefined,
        is_active: true,
        updated_by_user_id: user._id,
        updated_at: now,
      });
      bindingId = existingBinding._id;
    } else {
      // Create new binding
      bindingId = await ctx.db.insert('prompt_bindings', {
        tool_id: args.toolId,
        env: args.env,
        scope_type: 'all',
        strategy: 'single',
        active_version_id: args.versionId,
        is_active: true,
        created_by_user_id: user._id,
        created_at: now,
        updated_at: now,
      });
    }

    // Update version status to active
    if (version.status !== 'active') {
      await ctx.db.patch(args.versionId, {
        status: 'active',
        updated_at: now,
      });
    }

    // Mark previous version as inactive if different
    if (previousVersionId && previousVersionId !== args.versionId) {
      const prevVersion = await ctx.db.get(previousVersionId);
      if (prevVersion && prevVersion.status === 'active') {
        // Check if this version is active in any other binding
        const otherBindings = await ctx.db
          .query('prompt_bindings')
          .filter((q) =>
            q.and(
              q.eq(q.field('active_version_id'), previousVersionId),
              q.eq(q.field('is_active'), true),
              q.neq(q.field('_id'), bindingId),
            ),
          )
          .first();

        if (!otherBindings) {
          await ctx.db.patch(previousVersionId, {
            status: 'inactive',
            updated_at: now,
          });
        }
      }
    }

    // Log activation event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'activation',
      tool_id: args.toolId,
      version_id: args.versionId,
      previous_version_id: previousVersionId || undefined,
      env: args.env,
      user_id: user._id,
      reason: args.reason,
      metadata: {
        version: version.version_string,
        binding_id: bindingId,
      },
      timestamp: now,
    });

    return { success: true, bindingId };
  },
});

/**
 * Create an A/B experiment binding with multiple variants
 */
export const createExperimentBinding = mutation({
  args: {
    toolId: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
    experimentName: v.string(),
    variants: v.array(
      v.object({
        versionId: v.id('prompt_versions'),
        variantName: v.string(),
        trafficPct: v.number(),
      }),
    ),
    hypothesis: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    // Validate traffic percentages sum to 100
    const totalTraffic = args.variants.reduce((sum, v) => sum + v.trafficPct, 0);
    if (Math.abs(totalTraffic - 100) > 0.01) {
      throw new Error(`Traffic percentages must sum to 100 (got ${totalTraffic})`);
    }

    // Validate all versions exist and are compatible with env
    for (const variant of args.variants) {
      const version = await ctx.db.get(variant.versionId);
      if (!version) {
        throw new Error(`Version ${variant.versionId} not found`);
      }
      if (version.env_scope !== 'any' && version.env_scope !== args.env) {
        throw new Error(`Version ${version.version_string} scope doesn't allow ${args.env}`);
      }
    }

    const now = Date.now();

    // Deactivate existing binding for this tool/env
    const existingBinding = await ctx.db
      .query('prompt_bindings')
      .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId).eq('env', args.env))
      .filter((q) => q.eq(q.field('is_active'), true))
      .first();

    if (existingBinding) {
      await ctx.db.patch(existingBinding._id, {
        is_active: false,
        updated_at: now,
      });
    }

    // Create experiment binding
    const bindingId = await ctx.db.insert('prompt_bindings', {
      tool_id: args.toolId,
      env: args.env,
      scope_type: 'all',
      strategy: 'experiment',
      variants: args.variants.map((v) => ({
        version_id: v.versionId,
        variant_name: v.variantName,
        traffic_pct: v.trafficPct,
      })),
      experiment_name: args.experimentName,
      experiment_hypothesis: args.hypothesis,
      experiment_started_at: now,
      is_active: true,
      created_by_user_id: user._id,
      created_at: now,
      updated_at: now,
    });

    // Mark all variant versions as active
    for (const variant of args.variants) {
      await ctx.db.patch(variant.versionId, {
        status: 'active',
        updated_at: now,
      });
    }

    // Log experiment start event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'experiment_start',
      tool_id: args.toolId,
      env: args.env,
      user_id: user._id,
      metadata: {
        experiment_name: args.experimentName,
        variant_count: args.variants.length,
        variants: args.variants.map((v) => v.variantName),
      },
      timestamp: now,
    });

    return { success: true, bindingId };
  },
});

/**
 * Stop an experiment and pick a winner
 */
export const stopExperiment = mutation({
  args: {
    bindingId: v.id('prompt_bindings'),
    winnerVersionId: v.id('prompt_versions'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const binding = await ctx.db.get(args.bindingId);
    if (!binding) {
      throw new Error('Binding not found');
    }

    if (binding.strategy !== 'experiment') {
      throw new Error('This binding is not an experiment');
    }

    // Verify winner was part of experiment
    const wasInExperiment = binding.variants?.some((v) => v.version_id === args.winnerVersionId);
    if (!wasInExperiment) {
      throw new Error('Winner version was not part of this experiment');
    }

    const now = Date.now();

    // Convert to single binding with winner
    await ctx.db.patch(args.bindingId, {
      strategy: 'single',
      active_version_id: args.winnerVersionId,
      variants: undefined,
      experiment_ended_at: now,
      updated_by_user_id: user._id,
      updated_at: now,
    });

    // Mark non-winner versions as inactive
    if (binding.variants) {
      for (const variant of binding.variants) {
        if (variant.version_id !== args.winnerVersionId) {
          const version = await ctx.db.get(variant.version_id);
          if (version && version.status === 'active') {
            await ctx.db.patch(variant.version_id, {
              status: 'inactive',
              updated_at: now,
            });
          }
        }
      }
    }

    // Log experiment end
    const winnerVersion = await ctx.db.get(args.winnerVersionId);
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'experiment_stop',
      tool_id: binding.tool_id,
      version_id: args.winnerVersionId,
      env: binding.env,
      user_id: user._id,
      reason: args.reason,
      metadata: {
        experiment_name: binding.experiment_name,
        winner_version: winnerVersion?.version_string,
        duration_ms: now - (binding.experiment_started_at || binding.created_at),
      },
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Deactivate a binding (stop serving this tool from the binding)
 */
export const deactivateBinding = mutation({
  args: {
    bindingId: v.id('prompt_bindings'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    const binding = await ctx.db.get(args.bindingId);
    if (!binding) {
      throw new Error('Binding not found');
    }

    const now = Date.now();

    await ctx.db.patch(args.bindingId, {
      is_active: false,
      updated_by_user_id: user._id,
      updated_at: now,
    });

    // Log deactivation
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'deactivation',
      tool_id: binding.tool_id,
      version_id: binding.active_version_id,
      env: binding.env,
      user_id: user._id,
      reason: args.reason,
      timestamp: now,
    });

    return { success: true };
  },
});

/**
 * Quick rollback to a previous version
 */
export const rollbackBinding = mutation({
  args: {
    toolId: v.string(),
    env: v.union(v.literal('dev'), v.literal('prod')),
    targetVersionId: v.id('prompt_versions'),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireSuperAdmin(ctx);

    if (!args.reason || args.reason.trim().length < 10) {
      throw new Error('A detailed reason is required for rollbacks (min 10 characters)');
    }

    // Verify target version exists
    const targetVersion = await ctx.db.get(args.targetVersionId);
    if (!targetVersion) {
      throw new Error('Target version not found');
    }

    // Find current binding
    const currentBinding = await ctx.db
      .query('prompt_bindings')
      .withIndex('by_tool_env', (q) => q.eq('tool_id', args.toolId).eq('env', args.env))
      .filter((q) => q.eq(q.field('is_active'), true))
      .first();

    const now = Date.now();
    const previousVersionId = currentBinding?.active_version_id;

    if (currentBinding) {
      // Update existing binding
      await ctx.db.patch(currentBinding._id, {
        active_version_id: args.targetVersionId,
        strategy: 'single',
        variants: undefined,
        updated_by_user_id: user._id,
        updated_at: now,
      });

      // Mark current version as rolled_back
      if (previousVersionId && previousVersionId !== args.targetVersionId) {
        await ctx.db.patch(previousVersionId, {
          status: 'rolled_back',
          updated_at: now,
        });
      }
    } else {
      // Create new binding (unusual but handle it)
      await ctx.db.insert('prompt_bindings', {
        tool_id: args.toolId,
        env: args.env,
        scope_type: 'all',
        strategy: 'single',
        active_version_id: args.targetVersionId,
        is_active: true,
        created_by_user_id: user._id,
        created_at: now,
        updated_at: now,
      });
    }

    // Mark target as active
    if (targetVersion.status !== 'active') {
      await ctx.db.patch(args.targetVersionId, {
        status: 'active',
        updated_at: now,
      });
    }

    // Log rollback event
    await ctx.db.insert('ai_prompt_events', {
      event_type: 'rollback',
      tool_id: args.toolId,
      version_id: args.targetVersionId,
      previous_version_id: previousVersionId || undefined,
      env: args.env,
      user_id: user._id,
      reason: args.reason,
      metadata: {
        target_version: targetVersion.version_string,
      },
      timestamp: now,
    });

    return { success: true };
  },
});
