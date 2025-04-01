import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ProPricingTiers = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 15,
    period: 'month',
    description: 'Billed monthly',
    totalPrice: '$15',
    saveText: '',
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 30,
    period: '3 months',
    description: 'Billed every 3 months',
    totalPrice: '$30',
    saveText: 'Save $15',
  },
  {
    id: 'annually',
    name: 'Annually',
    price: 72,
    period: 'year',
    description: 'Billed yearly',
    totalPrice: '$72',
    saveText: 'Save $108',
  },
];

interface PricingFeature {
  name: string;
  included: boolean;
  pro: boolean;
}

const features: PricingFeature[] = [
  { name: 'Basic career goal tracking', included: true, pro: true },
  { name: 'Career profile builder', included: true, pro: true },
  { name: 'Resume builder (1 resume)', included: true, pro: true },
  { name: 'Basic AI career advice', included: true, pro: true },
  { name: 'Unlimited resumes & templates', included: false, pro: true },
  { name: 'Advanced AI mentor features', included: false, pro: true },
  { name: 'Unlimited cover letters', included: false, pro: true },
  { name: 'Interview process tracking', included: false, pro: true },
  { name: 'Priority support', included: false, pro: true },
];

export default function PricingPage() {
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [showCycleDialog, setShowCycleDialog] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleFreePlanClick = () => {
    navigate('/auth?plan=free');
  };

  const handleProPlanClick = () => {
    setShowCycleDialog(true);
  };

  const handleContinueToPro = () => {
    setShowCycleDialog(false);
    navigate(`/auth?plan=pro&cycle=${selectedPlan}`);
  };

  return (
    <div className="container px-4 py-12 mx-auto max-w-6xl">
      <div className="text-center mb-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose the plan that's right for your career journey, with no hidden fees
          </p>
        </motion.div>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:gap-12">
        {/* Free Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl">Free Plan</CardTitle>
              <CardDescription>Essential tools to start your career journey</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground ml-2">/ forever</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start">
                    {feature.included ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={cn(!feature.included && "text-muted-foreground")}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleFreePlanClick} 
                variant="outline" 
                className="w-full text-lg font-medium p-6"
              >
                Create Account
              </Button>
            </CardFooter>
          </Card>
        </motion.div>

        {/* Pro Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="h-full flex flex-col bg-primary/5 border-primary/30">
            <CardHeader className="pb-6">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Pro Plan</CardTitle>
                <div className="bg-primary text-primary-foreground text-xs font-semibold py-1 px-3 rounded-full">
                  RECOMMENDED
                </div>
              </div>
              <CardDescription>Full suite of advanced career tools</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$15</span>
                <span className="text-muted-foreground ml-2">/ month</span>
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-4">
                {features.map((feature) => (
                  <li key={feature.name} className="flex items-start">
                    {feature.pro ? (
                      <Check className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <X className="h-5 w-5 text-muted-foreground mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={cn(!feature.pro && "text-muted-foreground")}>{feature.name}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleProPlanClick} 
                className="w-full text-lg font-medium p-6 bg-primary hover:bg-primary/90"
              >
                Get Pro
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>

      {/* Billing Cycle Selection Dialog */}
      <Dialog open={showCycleDialog} onOpenChange={setShowCycleDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose your billing cycle</DialogTitle>
            <DialogDescription>
              Select a billing cycle that works best for you. Longer plans offer bigger savings.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <RadioGroup value={selectedPlan} onValueChange={setSelectedPlan} className="space-y-4">
              {ProPricingTiers.map((tier) => (
                <div key={tier.id} className="border rounded-lg p-4 cursor-pointer hover:border-primary">
                  <RadioGroupItem 
                    value={tier.id} 
                    id={tier.id} 
                    className="peer sr-only" 
                  />
                  <Label 
                    htmlFor={tier.id} 
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="font-medium">{tier.name}</div>
                      <div className="text-muted-foreground text-sm">{tier.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{tier.totalPrice}</div>
                      {tier.saveText && (
                        <div className="text-green-600 text-xs font-medium">{tier.saveText}</div>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCycleDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleContinueToPro}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}