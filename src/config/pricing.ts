/**
 * Pricing Configuration
 *
 * Central source of truth for all pricing-related values.
 * Update these values to change pricing across the application.
 */

/**
 * Base pricing plan structure
 */
interface PricingPlan {
  title: string;
  price: string;
  totalPrice: string;
  interval: 'month' | 'year';
  savings?: string;
  savingsPercentage?: string;
}

/**
 * Complete pricing configuration structure
 */
interface PricingConfig {
  monthly: Omit<PricingPlan, 'savings' | 'savingsPercentage'>;
  annual: Required<PricingPlan>;
}

export const PRICING: PricingConfig = {
  monthly: {
    title: 'Pro Monthly',
    price: '$30',
    totalPrice: '$30',
    interval: 'month',
  },
  annual: {
    title: 'Pro Annual',
    price: '$20', // Per month when billed annually
    totalPrice: '$240', // Total annual cost
    savings: 'Save $120/year',
    savingsPercentage: '33%',
    interval: 'year',
  },
} as const;

export const PLAN_FEATURES: string[] = [
  'Advanced application tracking',
  'Smart career path insights',
  'Resume & Cover Letter Studios',
  'AI Career Coach',
  'Priority Support',
];
