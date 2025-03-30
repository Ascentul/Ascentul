import React from 'react';
import { Link } from 'wouter';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      description: 'Perfect for getting started with basic career planning.',
      features: [
        'Dashboard with career stats',
        'Resume builder (1 resume)',
        'Cover letter builder (1 letter)',
        'Basic interview preparation',
        'Limited goal tracking',
      ],
      buttonText: 'Get Started',
      buttonVariant: 'outline',
      highlighted: false
    },
    {
      name: 'Premium',
      price: '9.99',
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
      buttonText: 'Subscribe Now',
      buttonVariant: 'default',
      highlighted: true
    },
    {
      name: 'University Edition',
      price: '7.99',
      description: 'Special plan for university students with academic tools.',
      features: [
        'All Premium features',
        'Study plan creator',
        'Course tracking and management',
        'Learning modules',
        'Assignment tracking',
        'Academic goal integration',
        'University-specific career resources',
      ],
      buttonText: 'Get Student Access',
      buttonVariant: 'outline',
      highlighted: false,
      badge: 'For Students'
    }
  ];
  
  return (
    <div>
      {/* Pricing Header */}
      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Choose the plan that's right for your career stage. All plans include core features to help you succeed.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.name} 
                className={`${plan.highlighted ? 'border-primary shadow-lg relative' : 'border-border'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-6 bg-primary text-white text-xs font-semibold py-1 px-3 rounded-full">
                    {plan.badge}
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">${plan.price}</span>
                    <span className="text-muted-foreground ml-1">/month</span>
                  </div>
                  <CardDescription className="mt-3">{plan.description}</CardDescription>
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
                <CardFooter>
                  <Link href="/auth">
                    <Button 
                      variant={plan.buttonVariant as any} 
                      className={`w-full ${plan.highlighted ? 'bg-primary hover:bg-primary/90' : ''}`}
                    >
                      {plan.buttonText}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-12 bg-muted/50 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold mb-3">University Licensing Available</h3>
            <p className="text-muted-foreground mb-4">
              We offer special licensing for universities to provide CareerPilot to their students.
              Contact us for custom pricing and integration options.
            </p>
            <Button variant="outline">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-10">Frequently Asked Questions</h2>

            <div className="space-y-6">
              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I upgrade or downgrade my plan?</h3>
                <p className="text-muted-foreground">
                  Yes, you can change your plan at any time. When upgrading, you'll be charged the prorated amount for the remainder of your billing cycle. When downgrading, your new plan will take effect at the end of your current billing cycle.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">What happens when I reach conversation limits with the AI coach?</h3>
                <p className="text-muted-foreground">
                  Once you reach your monthly conversation limit with the AI coach, you'll need to wait until your plan resets at the beginning of your next billing cycle. You can also upgrade to a higher tier plan for more conversations.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">How do I verify my student status for the University Edition?</h3>
                <p className="text-muted-foreground">
                  You can verify your student status by signing up with your university email address (.edu or equivalent) or by providing your student ID. Our team will verify your status within 24 hours.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Is there a discount for annual subscriptions?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer a 20% discount when you subscribe annually. The discount will be applied automatically when you select the annual billing option during checkout.
                </p>
              </div>

              <div className="bg-card rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">Can I cancel my subscription?</h3>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period, after which it will revert to the Free plan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Accelerate Your Career?</h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of professionals using CareerPilot to achieve their career goals.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg">
                  Start Your Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Schedule a Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}