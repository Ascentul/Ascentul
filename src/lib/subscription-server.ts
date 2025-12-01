/**
 * Server-side subscription helpers using Clerk Billing
 *
 * These functions use Clerk's `has()` method and can only be used in:
 * - Server Components
 * - API Routes
 * - Server Actions
 */

import { auth } from '@clerk/nextjs/server';

/**
 * Check if the current user has premium access
 *
 * @returns Promise<boolean> - Whether user has an active premium subscription
 *
 * @example
 * ```tsx
 * // In a Server Component
 * import { checkPremiumAccess } from '@/lib/subscription-server'
 *
 * export default async function PremiumPage() {
 *   const hasPremium = await checkPremiumAccess()
 *   if (!hasPremium) {
 *     redirect('/pricing')
 *   }
 *   return <div>Premium Content</div>
 * }
 * ```
 */
export async function checkPremiumAccess(): Promise<boolean> {
  const { has } = await auth();

  // Check if user has the premium plan
  // Note: This plan includes both monthly and annual billing options
  return has({ plan: 'premium_monthly' });
}

/**
 * Check if user has a specific plan
 *
 * @param planSlug - Plan slug from Clerk Dashboard (e.g., 'premium_monthly')
 * @returns Promise<boolean>
 *
 * @example
 * ```tsx
 * const hasAnnual = await checkPlan('premium_annual')
 * ```
 */
export async function checkPlan(planSlug: string): Promise<boolean> {
  const { has } = await auth();
  return has({ plan: planSlug });
}

/**
 * Check if user has a specific feature
 *
 * @param featureName - Feature name from Clerk Dashboard
 * @returns Promise<boolean>
 *
 * @example
 * ```tsx
 * const canExport = await checkFeature('export_data')
 * ```
 */
export async function checkFeature(featureName: string): Promise<boolean> {
  const { has } = await auth();
  return has({ feature: featureName });
}
