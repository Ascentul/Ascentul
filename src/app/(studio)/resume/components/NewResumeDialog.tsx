'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TemplatePicker } from '@/components/resume/studio/TemplatePicker';
import { ThemePanel } from '@/components/resume/studio/ThemePanel';
import type { Id } from '../../../../../convex/_generated/dataModel';

interface NewResumeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    templateSlug: string;
    themeId?: Id<'builder_resume_themes'>;
    targetRole?: string;
    targetCompany?: string;
    generateWithAI: boolean;
    autoPopulate: boolean; // NEW: import from profile
  }) => Promise<void>;
}

export function NewResumeDialog({ open, onOpenChange, onSubmit }: NewResumeDialogProps) {
  const [step, setStep] = useState<'details' | 'template' | 'theme'>('details');
  const [title, setTitle] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [generateWithAI, setGenerateWithAI] = useState(false);
  const [autoPopulate, setAutoPopulate] = useState(true); // NEW: default to true for better UX
  const [selectedTemplate, setSelectedTemplate] = useState('default');
  const [selectedTheme, setSelectedTheme] = useState<Id<'builder_resume_themes'> | undefined>();
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    setStep('details');
    setTitle('');
    setTargetRole('');
    setTargetCompany('');
    setGenerateWithAI(false);
    setAutoPopulate(true);
    setSelectedTemplate('default');
    setSelectedTheme(undefined);
    onOpenChange(false);
  };

  const handleNext = () => {
    if (step === 'details') {
      setStep('template');
    } else if (step === 'template') {
      setStep('theme');
    }
  };

  const handleBack = () => {
    if (step === 'theme') {
      setStep('template');
    } else if (step === 'template') {
      setStep('details');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit({
        title: title || 'New Resume',
        templateSlug: selectedTemplate,
        themeId: selectedTheme,
        targetRole: generateWithAI ? targetRole : undefined,
        targetCompany: generateWithAI ? targetCompany : undefined,
        generateWithAI,
        autoPopulate, // NEW: pass autoPopulate flag
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create resume:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' && 'Create New Resume'}
            {step === 'template' && 'Choose Template'}
            {step === 'theme' && 'Choose Theme'}
          </DialogTitle>
          <DialogDescription>
            {step === 'details' && 'Set up your resume with optional AI generation'}
            {step === 'template' && 'Select a layout for your resume'}
            {step === 'theme' && 'Customize fonts and colors'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'details' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Resume Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Software Engineer Resume"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="auto-populate"
                    checked={autoPopulate}
                    onChange={(e) => setAutoPopulate(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="auto-populate" className="cursor-pointer font-medium">
                    Import data from my profile
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Automatically populate your resume with experience, education, skills, and projects from your profile
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="generate-ai"
                    checked={generateWithAI}
                    onChange={(e) => setGenerateWithAI(e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="generate-ai" className="cursor-pointer font-medium">
                    Generate content with AI
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI will create professional resume content based on your target role
                  {autoPopulate && generateWithAI && (
                    <span className="block mt-1 text-amber-600 dark:text-amber-500">
                      Note: AI-generated content will override imported profile data
                    </span>
                  )}
                </p>
              </div>

              {generateWithAI && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="target-role">Target Role</Label>
                    <Input
                      id="target-role"
                      placeholder="e.g., Senior Software Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="target-company">Target Company (optional)</Label>
                    <Input
                      id="target-company"
                      placeholder="e.g., Google"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {step === 'template' && (
            <TemplatePicker
              currentTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />
          )}

          {step === 'theme' && (
            <ThemePanel
              currentThemeId={selectedTheme}
              onThemeChange={setSelectedTheme}
            />
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 'details' ? handleClose : handleBack}
            disabled={loading}
          >
            {step === 'details' ? 'Cancel' : 'Back'}
          </Button>

          <Button
            onClick={step === 'theme' ? handleSubmit : handleNext}
            disabled={loading || (step === 'details' && generateWithAI && !targetRole)}
          >
            {loading ? 'Creating...' : step === 'theme' ? 'Create Resume' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
