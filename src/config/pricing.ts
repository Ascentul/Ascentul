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

// Base price values in cents to ensure accurate calculations
const MONTHLY_PRICE_CENTS = 3000; // $30.00
const ANNUAL_PRICE_CENTS = 24000; // $240.00

// Computed values
const ANNUAL_MONTHLY_EQUIVALENT = ANNUAL_PRICE_CENTS / 12; // $20.00
const SAVINGS_CENTS = (MONTHLY_PRICE_CENTS * 12) - ANNUAL_PRICE_CENTS; // $120.00
const SAVINGS_PERCENTAGE = Math.round((SAVINGS_CENTS / (MONTHLY_PRICE_CENTS * 12)) * 100); // 33%

export const PRICING: PricingConfig = {
  monthly: {
    title: 'Pro Monthly',
    price: `$${MONTHLY_PRICE_CENTS / 100}`,
    totalPrice: `$${MONTHLY_PRICE_CENTS / 100}`,
    interval: 'month',
  },
  annual: {
    title: 'Pro Annual',
    price: `$${ANNUAL_MONTHLY_EQUIVALENT / 100}`, // Per month when billed annually
    totalPrice: `$${ANNUAL_PRICE_CENTS / 100}`, // Total annual cost
    savings: `Save $${SAVINGS_CENTS / 100}/year`,
    savingsPercentage: `${SAVINGS_PERCENTAGE}%`,
    interval: 'year',
  },
};

export const PLAN_FEATURES: string[] = [
  'Advanced application tracking',
  'Smart career path insights',
  'Resume & Cover Letter Studios',
  'AI Career Coach',
  'Priority Support',
];
