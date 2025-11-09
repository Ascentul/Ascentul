// Pricing configuration for the application
// Update these values to change pricing across all components
export const PRICING = {
  monthly: {
    price: '$30',
    title: 'Pro Monthly',
  },
  annual: {
    price: '$20',
    title: 'Pro Annual',
    savings: 'Save $120/year',
    savingsPercentage: '33%',
  },
} as const

export type PricingInterval = keyof typeof PRICING
