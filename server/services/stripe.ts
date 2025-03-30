import Stripe from 'stripe';
import crypto from 'crypto';
import { z } from 'zod';
import { storage } from '../storage';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16' as any, // Casting as any to bypass type checking
});

// Product price IDs - these would be set in your Stripe dashboard
const PRICE_IDS = {
  premium: {
    monthly: 'price_monthly_premium',  // Replace with actual Stripe price ID
    annual: 'price_annual_premium',   // Replace with actual Stripe price ID
  },
  university: {
    monthly: 'price_monthly_university',  // Replace with actual Stripe price ID
    annual: 'price_annual_university',    // Replace with actual Stripe price ID
  }
};

export const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  description: z.string().optional(),
});

export const createSubscriptionSchema = z.object({
  plan: z.enum(['premium', 'university']),
  interval: z.enum(['monthly', 'annual']).default('monthly'),
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
    // Retrieve existing customer
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
    
    // Cancel at period end to allow user to use service until the end of the billing period
    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    
    // Update user record to mark subscription as pending cancellation
    await storage.updateUserStripeInfo(userId, {
      subscriptionStatus: 'cancelled',
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