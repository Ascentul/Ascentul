import Stripe from 'stripe';
import crypto from 'crypto';
import { z } from 'zod';
import { storage } from '../storage';

// Check for Stripe API key but use mock mode if missing
const stripeKey = process.env.STRIPE_SECRET_KEY;
let useMockStripe = false;
let stripe: any;

if (!stripeKey) {
  console.warn('STRIPE_SECRET_KEY is not set. Using mock Stripe mode.');
  useMockStripe = true;
  // Create a mock Stripe instance that will use the mock methods
  stripe = {
    customers: { create: mockMethod, retrieve: mockMethod, update: mockMethod },
    paymentIntents: { create: mockMethod, retrieve: mockMethod, update: mockMethod },
    setupIntents: { create: mockMethod },
    subscriptions: { create: mockMethod, retrieve: mockMethod, update: mockMethod },
    paymentMethods: { list: mockMethod },
    webhooks: { constructEvent: mockMethod },
  };
} else {
  // Initialize Stripe with the real API key
  stripe = new Stripe(stripeKey, {
    apiVersion: '2023-10-16' as any, // Casting as any to bypass type checking
  });
}

// Mock method for Stripe operations in development
function mockMethod(params?: any) {
  console.log('Mock Stripe method called with params:', params);
  return Promise.resolve({
    id: `mock_${Math.random().toString(36).substring(2, 15)}`,
    client_secret: `mock_secret_${Math.random().toString(36).substring(2, 15)}`,
    status: 'succeeded',
    object: 'mock_object'
  });
}

export { stripe, useMockStripe };

// Helper function to calculate subscription expiry date based on interval
function getSubscriptionExpiryDate(interval: string): Date {
  const now = new Date();
  
  switch (interval) {
    case 'monthly':
      now.setMonth(now.getMonth() + 1);
      break;
    case 'quarterly':
      now.setMonth(now.getMonth() + 3);
      break;
    case 'annual':
      now.setFullYear(now.getFullYear() + 1);
      break;
    default:
      now.setMonth(now.getMonth() + 1); // Default to monthly
  }
  
  return now;
}

// Product price IDs - these would be set in your Stripe dashboard
// Using the values from the image for Pro plans
const PRICE_IDS = {
  premium: {
    monthly: 'price_monthly_premium15',    // $15.00 USD per month
    quarterly: 'price_quarterly_premium30', // $30.00 USD every 3 months
    annual: 'price_annual_premium72',      // $72.00 USD per year
  },
  university: {
    monthly: 'price_monthly_university',    // Replace with actual Stripe price ID
    quarterly: 'price_quarterly_university', // Replace with actual Stripe price ID
    annual: 'price_annual_university',      // Replace with actual Stripe price ID
  }
};

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  description: z.string().optional(),
});

export const createSubscriptionSchema = z.object({
  plan: z.enum(['premium', 'university']),
  interval: z.enum(['monthly', 'quarterly', 'annual']).default('monthly'),
  email: z.string().email(),
  userId: z.number(),
  userName: z.string(),
});

export async function createPaymentIntent(data: z.infer<typeof createPaymentIntentSchema>) {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency,
      description: data.description,
    });
    
    return { 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    };
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new Error(`Error creating payment intent: ${error.message}`);
  }
}

export async function createOrRetrieveCustomer(userId: number, email: string, name: string) {
  // Check if user already has a Stripe customer ID
  const user = await storage.getUser(userId);
  
  if (user?.stripeCustomerId) {
    // Check if this is a mock customer ID (for demo purposes)
    if (user.stripeCustomerId.startsWith('cus_mock')) {
      console.log('Using mock customer ID:', user.stripeCustomerId);
      return user.stripeCustomerId;
    }
    
    // Retrieve existing customer
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (customer.deleted) {
        // If customer was deleted, create a new one
        const newCustomer = await stripe.customers.create({
          email,
          name,
          metadata: { userId: userId.toString() },
        });
        
        // Update user with new customer ID
        await storage.updateUserStripeInfo(userId, {
          stripeCustomerId: newCustomer.id,
        });
        
        return newCustomer.id;
      }
      
      return user.stripeCustomerId;
    } catch (error: any) {
      console.error('Error retrieving customer, creating new one:', error.message);
      // If retrieving customer fails, create a new one
      const newCustomer = await stripe.customers.create({
        email,
        name,
        metadata: { userId: userId.toString() },
      });
      
      // Update user with new customer ID
      await storage.updateUserStripeInfo(userId, {
        stripeCustomerId: newCustomer.id,
      });
      
      return newCustomer.id;
    }
  } else {
    // Create new customer
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: { userId: userId.toString() },
    });
    
    // Update user with new customer ID
    await storage.updateUserStripeInfo(userId, {
      stripeCustomerId: customer.id,
    });
    
    return customer.id;
  }
}

export async function createSubscription(data: z.infer<typeof createSubscriptionSchema>) {
  try {
    // Ensure customer exists
    const customerId = await createOrRetrieveCustomer(
      data.userId,
      data.email,
      data.userName
    );
    
    // Check if this is a mock customer ID (for demo purposes)
    const isMockCustomer = customerId.startsWith('cus_mock');
    
    if (isMockCustomer) {
      console.log('Using mock subscription flow for customer:', customerId);
      
      // Generate mock subscription ID and client secret for demo
      const mockSubscriptionId = 'sub_mock_' + Math.random().toString(36).substr(2, 9);
      const mockClientSecret = 'pi_mock_secret_' + Math.random().toString(36).substr(2, 9);
      
      // Update user record with mock subscription information
      await storage.updateUserStripeInfo(data.userId, {
        stripeSubscriptionId: mockSubscriptionId,
        subscriptionStatus: 'active', // For demo, make it active immediately
        subscriptionPlan: data.plan,
        subscriptionCycle: data.interval,
        // Set mock expiration date for 1 month/quarter/year in the future
        subscriptionExpiresAt: getSubscriptionExpiryDate(data.interval),
      });
      
      return {
        subscriptionId: mockSubscriptionId,
        clientSecret: mockClientSecret,
      };
    }
    
    // For real customers, proceed with Stripe API
    // Get appropriate price ID
    const priceId = PRICE_IDS[data.plan][data.interval];
    
    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });
    
    // Update user record with subscription information
    await storage.updateUserStripeInfo(data.userId, {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: 'inactive', // Will be updated to 'active' after successful payment
      subscriptionPlan: data.plan,
      subscriptionCycle: data.interval,
    });
    
    // Get client secret for payment
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;
    
    return {
      subscriptionId: subscription.id,
      clientSecret: paymentIntent.client_secret,
    };
  } catch (error: any) {
    console.error('Error creating subscription:', error);
    throw new Error(`Error creating subscription: ${error.message}`);
  }
}

export async function handleSubscriptionUpdated(subscriptionId: string) {
  try {
    // Retrieve subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    // Find user with this subscription ID
    const user = await storage.getUserByStripeSubscriptionId(subscriptionId);
    
    if (!user) {
      throw new Error(`No user found with subscription ID: ${subscriptionId}`);
    }
    
    // Map Stripe status to our app status
    let subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'past_due';
    
    switch (subscription.status) {
      case 'active':
      case 'trialing':
        subscriptionStatus = 'active';
        break;
      case 'past_due':
        subscriptionStatus = 'past_due';
        break;
      case 'canceled':
      case 'unpaid':
        subscriptionStatus = 'cancelled';
        break;
      default:
        subscriptionStatus = 'inactive';
    }
    
    // Calculate expiration date
    const subscriptionExpiresAt = new Date(subscription.current_period_end * 1000);
    
    // Update user subscription info
    await storage.updateUserStripeInfo(user.id, {
      subscriptionStatus,
      subscriptionExpiresAt,
    });
    
    return { success: true };
  } catch (error: any) {
    console.error('Error handling subscription update:', error);
    throw new Error(`Error handling subscription update: ${error.message}`);
  }
}

export async function cancelSubscription(userId: number) {
  try {
    const user = await storage.getUser(userId);
    
    if (!user?.stripeSubscriptionId) {
      throw new Error('User has no active subscription to cancel');
    }
    
    // Check if this is a mock subscription ID (for demo purposes)
    const isMockSubscription = user.stripeSubscriptionId.startsWith('sub_mock');
    
    if (!isMockSubscription) {
      // Only call Stripe API for real subscription IDs
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
    }
    
    // Update user record to mark subscription as cancelled and revert to free plan
    await storage.updateUserStripeInfo(userId, {
      subscriptionStatus: 'cancelled',
      subscriptionPlan: 'free',  // Set back to free plan
      subscriptionCycle: undefined,   // Clear the subscription cycle
    });
    
    return { success: true, message: 'Subscription will be cancelled at the end of the billing period' };
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    throw new Error(`Error cancelling subscription: ${error.message}`);
  }
}

export async function generateEmailVerificationToken(userId: number, email: string) {
  // Generate a random token
  const token = crypto.randomBytes(32).toString('hex');
  
  // Set expiration time (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // Store token and expiration in user record
  await storage.updateUserVerificationInfo(userId, {
    verificationToken: token,
    verificationExpires: expiresAt,
  });
  
  return token;
}

export async function verifyEmail(token: string) {
  // Find user with this verification token
  const user = await storage.getUserByVerificationToken(token);
  
  if (!user) {
    throw new Error('Invalid verification token');
  }
  
  // Check if token is expired
  const now = new Date();
  if (user.verificationExpires && new Date(user.verificationExpires) < now) {
    throw new Error('Verification token has expired');
  }
  
  // Update user as verified
  await storage.updateUserVerificationInfo(user.id, {
    emailVerified: true,
    verificationToken: null,
    verificationExpires: null,
  });
  
  return { success: true };
}

// Create a setup intent for adding/updating payment methods
export async function createSetupIntent(userId: number) {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Check if user has a mock customer ID
    const isMockCustomer = !user.stripeCustomerId || user.stripeCustomerId.startsWith('cus_mock');
    
    if (isMockCustomer) {
      // Return a mock setup intent for demo purposes
      return {
        clientSecret: 'seti_mock_secret_' + Math.random().toString(36).substr(2, 9),
        setupIntentId: 'seti_mock_' + Math.random().toString(36).substr(2, 9)
      };
    }
    
    // For real customers, proceed with Stripe API
    // Ensure customer exists in Stripe
    const customerId = await createOrRetrieveCustomer(
      userId,
      user.email,
      user.name
    );
    
    // Create setup intent
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ['card'],
      usage: 'off_session', // Allow the payment method to be used for recurring billing
    });
    
    return {
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id
    };
  } catch (error: any) {
    console.error('Error creating setup intent:', error);
    throw new Error(`Error creating setup intent: ${error.message}`);
  }
}

// Get user's payment methods from Stripe
export async function getUserPaymentMethods(userId: number) {
  try {
    const user = await storage.getUser(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    if (!user.stripeCustomerId) {
      return { payment_methods: [] };
    }
    
    // Check if this is a mock customer ID (for demo purposes)
    const isMockCustomer = user.stripeCustomerId.startsWith('cus_mock');
    
    if (isMockCustomer) {
      // Return mock data for demo
      return { 
        payment_methods: [
          {
            id: 'pm_mock123',
            object: 'payment_method',
            billing_details: {
              address: {
                city: 'San Francisco',
                country: 'US',
                line1: '123 Market St',
                line2: null,
                postal_code: '94107',
                state: 'CA'
              },
              email: user.email,
              name: user.name,
              phone: null
            },
            card: {
              brand: 'visa',
              checks: {},
              country: 'US',
              exp_month: 12,
              exp_year: 2024,
              funding: 'credit',
              last4: '4242',
              networks: {},
              three_d_secure_usage: {},
              wallet: null
            },
            created: Math.floor(Date.now() / 1000) - 86400,
            customer: user.stripeCustomerId,
            type: 'card'
          }
        ],
        default_payment_method: 'pm_mock123'
      };
    }
    
    // For real customer IDs, call Stripe API
    // Retrieve customer with default payment method expanded
    const customer = await stripe.customers.retrieve(user.stripeCustomerId, {
      expand: ['default_source', 'invoice_settings.default_payment_method']
    }) as Stripe.Customer;
    
    // Retrieve all payment methods
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: 'card',
    });
    
    return {
      payment_methods: paymentMethods.data,
      default_payment_method: customer.invoice_settings.default_payment_method
    };
  } catch (error: any) {
    console.error('Error retrieving payment methods:', error);
    throw new Error(`Error retrieving payment methods: ${error.message}`);
  }
}