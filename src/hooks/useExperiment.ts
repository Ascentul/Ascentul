'use client';

/**
 * useExperiment Hook
 *
 * React hook for A/B experiments.
 * Uses deterministic bucketing based on user/tenant ID.
 *
 * @example
 * ```tsx
 * function OnboardingFlow() {
 *   const { variant, enrolled } = useExperiment('onboarding_v2');
 *
 *   if (!enrolled) {
 *     // User not in experiment
 *     return <StandardOnboarding />;
 *   }
 *
 *   switch (variant) {
 *     case 'treatment':
 *       return <NewOnboarding />;
 *     default:
 *       return <StandardOnboarding />;
 *   }
 * }
 * ```
 */

import { useMemo } from 'react';

import { useAuth } from '@/contexts/ClerkAuthProvider';
import {
  EXPERIMENT_IDS,
  type ExperimentConfig,
  EXPERIMENTS,
  getActiveExperiments,
  getExperimentVariant,
  isInVariant as isInVariantFn,
} from '@/lib/config/experiments';
import { ConfigContext, resolveTenantId } from '@/lib/config/types';

// ============================================================================
// TYPES
// ============================================================================

export interface UseExperimentResult {
  /** The assigned variant ID (e.g., 'control', 'treatment') */
  variant: string;
  /** Whether the user is enrolled in the experiment */
  enrolled: boolean;
  /** Whether the hook is still loading user context */
  isLoading: boolean;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get the variant for an experiment.
 *
 * @param experimentId - ID of the experiment
 * @returns Variant assignment and enrollment status
 *
 * @example
 * ```tsx
 * const { variant, enrolled } = useExperiment('onboarding_v2');
 * ```
 */
export function useExperiment(experimentId: string): UseExperimentResult {
  const { user, isLoading: authLoading } = useAuth();

  const result = useMemo(() => {
    if (authLoading) {
      return { variant: 'control', enrolled: false };
    }

    const context: ConfigContext = {
      userId: user?._id,
      clerkId: user?.clerkId,
      tenantId: resolveTenantId(user?.university_id),
      role: user?.role,
    };

    return getExperimentVariant(experimentId, context);
  }, [experimentId, user, authLoading]);

  return {
    ...result,
    isLoading: authLoading,
  };
}

/**
 * Hook to check if user is in a specific variant.
 *
 * @param experimentId - ID of the experiment
 * @param variantId - Variant to check
 * @returns Whether user is in that variant
 *
 * @example
 * ```tsx
 * const isInTreatment = useIsInVariant('onboarding_v2', 'treatment');
 *
 * return isInTreatment ? <NewUI /> : <CurrentUI />;
 * ```
 */
export function useIsInVariant(experimentId: string, variantId: string): boolean {
  const { variant, enrolled } = useExperiment(experimentId);
  return enrolled && variant === variantId;
}

/**
 * Hook to get all active experiments for the current user.
 *
 * @returns Map of experiment ID to variant
 *
 * @example
 * ```tsx
 * const experiments = useActiveExperiments();
 * // { onboarding_v2: 'treatment', advisor_dashboard: 'control' }
 * ```
 */
export function useActiveExperiments(): {
  experiments: Record<string, string>;
  isLoading: boolean;
} {
  const { user, isLoading: authLoading } = useAuth();

  const experiments = useMemo(() => {
    if (authLoading) {
      return {};
    }

    const context: ConfigContext = {
      userId: user?._id,
      clerkId: user?.clerkId,
      tenantId: resolveTenantId(user?.university_id),
      role: user?.role,
    };

    return getActiveExperiments(context);
  }, [user, authLoading]);

  return {
    experiments,
    isLoading: authLoading,
  };
}

/**
 * Hook to get experiment configuration (for admin/debugging).
 *
 * @param experimentId - ID of the experiment
 * @returns Experiment configuration or undefined
 */
export function useExperimentConfig(experimentId: string): ExperimentConfig | undefined {
  return EXPERIMENTS[experimentId];
}

// ============================================================================
// UTILITY COMPONENT
// ============================================================================

/**
 * Props for ExperimentVariant component.
 */
interface ExperimentVariantProps {
  /** Experiment ID */
  experiment: string;
  /** Variant ID to render for */
  variant: string;
  /** Content to render when user is in this variant */
  children: React.ReactNode;
  /** Optional fallback when user is not in this variant */
  fallback?: React.ReactNode;
}

/**
 * Component that renders children only if user is in a specific variant.
 *
 * @example
 * ```tsx
 * <ExperimentVariant experiment="onboarding_v2" variant="treatment">
 *   <NewOnboarding />
 * </ExperimentVariant>
 * ```
 */
export function ExperimentVariant({
  experiment,
  variant: targetVariant,
  children,
  fallback = null,
}: ExperimentVariantProps): React.ReactNode {
  const isInVariant = useIsInVariant(experiment, targetVariant);
  return isInVariant ? children : fallback;
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export {
  EXPERIMENT_IDS,
  EXPERIMENTS,
  getActiveExperiments,
  getExperimentVariant,
  isInVariantFn as isInVariant,
};
export type { ExperimentConfig };
