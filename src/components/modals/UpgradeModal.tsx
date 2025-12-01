'use client';

import { Zap } from 'lucide-react';
import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature: string;
  limit?: string;
}

export function UpgradeModal({ open, onOpenChange, feature, limit }: UpgradeModalProps) {
  const handleUpgrade = () => {
    // Navigate to pricing or subscription page
    window.location.href = '/pricing';
  };

  const featureDescriptions: Record<string, { title: string; description: string }> = {
    application: {
      title: 'Application Limit Reached',
      description:
        'Free accounts can track only 1 application. Upgrade to Premium to track unlimited applications and get advanced analytics.',
    },
    goal: {
      title: 'Goal Limit Reached',
      description:
        'Free accounts can create only 1 career goal. Upgrade to Premium to create unlimited goals and track your progress.',
    },
    contact: {
      title: 'Network Contact Limit Reached',
      description:
        'Free accounts can add only 1 network contact. Upgrade to Premium to build your professional network with unlimited contacts.',
    },
    careerPath: {
      title: 'Career Path Limit Reached',
      description:
        'Free accounts can generate 1 career path. Upgrade to Premium to generate unlimited career paths and explore more opportunities.',
    },
    project: {
      title: 'Project Limit Reached',
      description:
        'Free accounts can create only 1 project. Upgrade to Premium to showcase unlimited projects in your portfolio.',
    },
    aiCoach: {
      title: 'Premium Feature',
      description:
        'AI Career Coach is a premium feature. Upgrade to Premium to get personalized career guidance and coaching.',
    },
  };

  const config = featureDescriptions[feature] || {
    title: 'Upgrade to Premium',
    description:
      'This feature requires a Premium subscription. Upgrade now to unlock all features.',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <DialogTitle>{config.title}</DialogTitle>
          </div>
          <DialogDescription>{config.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-blue-50 p-4 border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Premium Features Include:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Unlimited applications tracking</li>
              <li>✓ Unlimited career goals</li>
              <li>✓ Unlimited network contacts</li>
              <li>✓ Unlimited career paths</li>
              <li>✓ Unlimited projects portfolio</li>
              <li>✓ AI-powered career coaching</li>
              <li>✓ Advanced analytics & insights</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Continue with Free
          </Button>
          <Button onClick={handleUpgrade} className="bg-primary hover:bg-primary-700">
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
