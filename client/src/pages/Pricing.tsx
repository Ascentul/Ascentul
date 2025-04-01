import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Check, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import ContactDialog from '@/components/ContactDialog';
import { useToast } from '@/hooks/use-toast';
import { useUser, useIsSubscriptionActive } from '@/lib/useUserData';
import { motion } from 'framer-motion';

type PlanInterval = 'monthly' | 'quarterly' | 'annual';

export default function Pricing() {
  const { user, isLoading: userLoading } = useUser();
  const isSubscriptionActive = useIsSubscriptionActive();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [billingInterval, setBillingInterval] = useState<PlanInterval>('monthly');
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.6 } }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  // Add state to track which plan is being processed
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  // Create subscription mutation
  const subscriptionMutation = useMutation({
    mutationFn: async ({ plan, interval }: { plan: 'premium' | 'university', interval: PlanInterval }) => {
      const response = await apiRequest('POST', '/api/payments/create-subscription', {
        plan: plan,
        interval: interval,
        email: user?.email,
        userId: user?.id,
        userName: user?.name
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subscription');
      }

      return await response.json();
    },
    onSuccess: (data) => {
      // For the Stripe checkout flow, redirect to the checkout page with the client secret
      if (data.clientSecret) {
        toast({
          title: "Redirecting to Checkout",
          description: "Please complete your payment to activate your subscription.",
        });

        // Navigate to the checkout page with the client secret
        navigate(`/checkout?client_secret=${data.clientSecret}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message,
        variant: "destructive",
      });
      setProcessingPlan(null);
    },
    onSettled: () => {
      setProcessingPlan(null);
    }
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/payments/cancel-subscription', {});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }

      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled and will end at the end of your billing period.",
      });

      // Refresh the page to update UI
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    },
    onError: (error: Error) => {
      toast({
        title: "Cancellation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Function that subscribes with the currently selected billing interval
  const handleSubscribeWithInterval = async (planType: 'premium' | 'university') => {
    if (!user) {
      // Redirect to auth page if not logged in
      navigate('/auth');
      return;
    }

    setProcessingPlan(planType);

    try {
      // Create the subscription with the selected billing interval
      const response = await subscriptionMutation.mutateAsync({ 
        plan: planType, 
        interval: billingInterval 
      });

      // If successful, redirect to checkout page with client_secret
      if (response?.clientSecret) {
        navigate(`/checkout?client_secret=${response.clientSecret}&plan=${planType}&interval=${billingInterval}`);
      }
    } catch (error) {
      // Error is handled by the mutation error handler
      setProcessingPlan(null);
    }
  };

  // Keep original function for detailed subscription flow
  const handleSubscribe = async (planType: 'premium' | 'university') => {
    if (!user) {
      // Redirect to auth page if not logged in
      navigate('/auth');
      return;
    }

    // Navigate to payment portal page for more detailed subscription options
    navigate(`/payment-portal/${planType}`);
  };

  const handleCancelSubscription = async () => {
    if (!user || !isSubscriptionActive) {
      return;
    }

    cancelSubscriptionMutation.mutate();
  };

  // Pro plan pricing based on billing interval
  const getPricing = (interval: PlanInterval) => {
    switch (interval) {
      case 'monthly':
        return { price: '30.00', period: 'month', savings: '', displayPrice: '30.00', displayPeriod: 'month' }; // Updated price here
      case 'quarterly':
        return { price: '60.00', period: '3 months', savings: 'Save $30', displayPrice: '22.00', displayPeriod: 'quarterly' }; // Updated price here
      case 'annual':
        return { price: '144.00', period: 'year', savings: 'Save $216', displayPrice: '15.00', displayPeriod: 'month' }; // Updated price here
      default:
        return { price: '30.00', period: 'month', savings: '', displayPrice: '30.00', displayPeriod: 'month' }; // Updated price here
    }
  };

  // Calculate university pricing (hypothetically at 20% discount of Pro)
  const getUniversityPricing = (interval: PlanInterval) => {
    switch (interval) {
      case 'monthly':
        return { price: '7.99', period: 'month', savings: '47% off Pro' };
      case 'quarterly':
        return { price: '21.99', period: '3 months', savings: '27% off Pro' };
      case 'annual':
        return { price: '59.99', period: 'year', savings: '17% off Pro' };
      default:
        return { price: '7.99', period: 'month', savings: '47% off Pro' };
    }
  };

  // Current plan pricing
  const proPricing = getPricing(billingInterval);
  const universityPricing = getUniversityPricing(billingInterval);

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '0',
      period: 'forever',
      description: 'Perfect for getting started with basic career planning.',
      features: [
        'Dashboard with career stats',
        'Resume builder (1 resume)',
        'Cover letter builder (1 letter)',
        'Basic interview preparation',
        'Limited goal tracking',
      ],
      buttonText: user ? 'Current Plan' : 'Get Started',
      buttonAction: () => navigate(user ? '/' : '/auth'),
      buttonVariant: 'outline' as const,
      highlighted: false
    },
    {
      id: 'premium',
      name: 'Pro',
      price: proPricing.price,
      period: proPricing.period,
      displayPrice: proPricing.displayPrice || proPricing.price,
      displayPeriod: proPricing.displayPeriod || proPricing.period,
      savings: proPricing.savings,
      description: 'Everything you need for professional career development.',
      features: [
        'All Free features',
        'Unlimited resumes and cover letters',
        'Advanced interview preparation',
        'AI career coach (10 conversations/mo)',
        'Comprehensive goal tracking',
        'Achievement system with rewards',
        'Work history management',
        'Interview process tracking',
      ],
      buttonText: isSubscriptionActive && user?.subscriptionPlan === 'premium' 
        ? 'Current Plan' 
        : (user ? 'Subscribe Now' : 'Sign Up'),
      buttonAction: () => user 
        ? (isSubscriptionActive && user.subscriptionPlan === 'premium' 
            ? navigate('/') 
            : handleSubscribeWithInterval('premium'))
        : navigate('/auth'),
      buttonVariant: 'default' as const,
      highlighted: true
    },
    {
      id: 'university',
      name: 'University Edition',
      price: null,
      period: null,
      savings: null,
      description: 'Special plan for university students with academic tools.',
      features: [
        'All Pro features',
        'Study plan creator',
        'Course tracking and management',
        'Learning modules',
        'Assignment tracking',
        'Academic goal integration',
        'University-specific career resources',
      ],
      buttonText: 'Sign Up',
      buttonAction: () => setContactDialogOpen(true),
      buttonVariant: 'outline' as const,
      highlighted: false
    }
  ];

  return (
    <div>
      {/* Pricing Header */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Choose the plan that's right for your career stage. All plans include core features to help you succeed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Save with Annual Text */}
      <section className="pb-2">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-md mx-auto text-center"
          >
            <p className="text-lg font-medium">
              Save up to <span className="text-primary font-bold">50%</span> with annual billing
            </p>
          </motion.div>
        </div>
      </section>

      {/* Billing Interval Toggle */}
      <section className="pb-8 pt-2">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-md mx-auto"
          >
            <Tabs 
              defaultValue="monthly" 
              className="w-full"
              onValueChange={(value) => setBillingInterval(value as PlanInterval)}
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
                <TabsTrigger value="annual">Annual</TabsTrigger>
              </TabsList>
            </Tabs>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {plans.map((plan) => (
              <motion.div key={plan.id} variants={staggerItem}>
                <Card 
                  className={`${plan.highlighted ? 'border-primary shadow-lg relative' : 'border-border'}`}
                >
                  {plan.savings && (
                    <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-semibold py-1 px-3 rounded-full">
                      {plan.savings}
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <div className="mt-2">
                      {plan.id !== 'university' ? (
                        <>
                          <span className="text-3xl font-bold">${plan.displayPrice || plan.price}</span>
                          <span className="text-muted-foreground ml-1">/{plan.displayPeriod || plan.period}</span>
                        </>
                      ) : (
                        <span className="text-3xl font-bold">Custom Pricing</span>
                      )}
                    </div>
                    <CardDescription className="mt-3 min-h-[60px]">{plan.description}</CardDescription>
                    
                    {/* Buttons moved up here with fixed height and extra padding */}
                    <div className="mt-6 mb-6 h-[48px]">
                      {plan.id === 'university' ? (
                        <Button
                          variant="outline"
                          className="w-full text-primary border-primary hover:bg-primary/10 py-6"
                          onClick={() => setContactDialogOpen(true)}
                        >
                          Contact Sales
                        </Button>
                      ) : (
                        <Button 
                          variant={plan.buttonVariant} 
                          className={`w-full py-6 ${plan.highlighted ? 'bg-primary hover:bg-primary/90' : ''}`}
                          onClick={plan.buttonAction}
                          disabled={processingPlan === plan.id || 
                                  (plan.id === 'free' && user?.subscriptionPlan !== 'free') ||
                                  (plan.id !== 'free' && isSubscriptionActive && user?.subscriptionPlan === plan.id)}
                        >
                          {processingPlan === plan.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              {plan.buttonText}
                              {!(plan.id !== 'free' && isSubscriptionActive && user?.subscriptionPlan === plan.id) && 
                                <ArrowRight className="ml-2 h-4 w-4" />
                              }
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="h-4 w-4 text-primary mr-3 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto mt-12 bg-muted/50 rounded-lg p-6 text-center"
          >
            <h3 className="text-xl font-semibold mb-3">University Licensing Available</h3>
            <p className="text-muted-foreground mb-4">
              We offer special licensing for universities to provide CareerTracker.io to their students.
              Contact us for custom pricing and integration options.
            </p>
            <Button variant="outline" onClick={() => setContactDialogOpen(true)}>
              Contact Sales
            </Button>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="space-y-6"
            >
              <motion.div variants={staggerItem} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I upgrade or downgrade my plan?</h3>
                <p className="text-muted-foreground">
                  Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated amount for the remainder of your billing cycle. When downgrading, your new plan will take effect at the end of your current billing cycle.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">What happens when I reach conversation limits with the AI coach?</h3>
                <p className="text-muted-foreground">
                  Once you reach your monthly conversation limit with the AI coach, you'll need to wait until your plan resets at the beginning of your next billing cycle. You can also upgrade to a higher tier plan for more conversations.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">How do I verify my student status for the University Edition?</h3>
                <p className="text-muted-foreground">
                  You can verify your student status by signing up with your university email address (.edu or equivalent) or by providing your student ID. Our team will verify your status within 24 hours.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Is there a discount for annual subscriptions?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer a significant discount when you subscribe annually. The discount will be applied automatically when you select the annual billing option during checkout.
                </p>
              </motion.div>

              <motion.div variants={staggerItem} className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I cancel my subscription?</h3>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, after which it will revert to the Free plan.
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-primary/10 to-primary/5">
        <div className="container mx-auto px-4">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Career?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals who are taking control of their future with CareerTracker.io.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => navigate('/auth')}
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full sm:w-auto"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Compare Plans <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cancellation Section (only visible to subscribed users) */}
      {isSubscriptionActive && (
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-lg p-6 border border-border">
                <h3 className="text-lg font-semibold mb-3">Manage Your Subscription</h3>
                <p className="text-muted-foreground mb-6">
                  You're currently subscribed to the {user?.subscriptionPlan === 'premium' ? 'Pro' : 'University Edition'} plan.
                  {/* Renewal date would be shown here when available */}
                </p>
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelSubscription}
                    disabled={cancelSubscriptionMutation.isPending}
                  >
                    {cancelSubscriptionMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Cancel Subscription'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
      <ContactDialog 
        open={contactDialogOpen} 
        onOpenChange={setContactDialogOpen}
        subject="University Sales Inquiry"
        description="Contact our sales team to learn more about our University Edition plan."
      />
    </div>
  );
}