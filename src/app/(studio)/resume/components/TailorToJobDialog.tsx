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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import type { Id } from '../../../../../convex/_generated/dataModel';
import type {
  ResumeBlock,
  HeaderBlockData,
  SummaryBlockData,
  SkillsBlockData,
  ExperienceItem as ResumeExperienceItem,
  EducationItem,
  ProjectItem as ResumeProjectItem,
  CustomBlockData,
} from '@/lib/validators/resume';

interface TailorToJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: Id<'builder_resumes'>;
  currentBlocks: ResumeBlock[];
  onAccept: (tailoredBlocks: ResumeBlock[]) => void;
}

type TailoredHeaderData = {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
} & Partial<HeaderBlockData>;

type TailoredSummaryData = {
  text?: string;
} & Partial<SummaryBlockData>;

type TailoredSkillsCategory = {
  name?: string;
  skills?: string[];
};

type TailoredSkillsData = {
  categories?: TailoredSkillsCategory[];
} & Partial<SkillsBlockData>;

type TailoredExperienceItem = {
  title?: string;
  startDate?: string;
  endDate?: string;
} & Partial<ResumeExperienceItem>;

type TailoredEducationItem = {
  graduationDate?: string;
  startDate?: string;
} & Partial<EducationItem>;

type TailoredProjectItem = {
  technologies?: string[];
} & Partial<ResumeProjectItem>;

type TailoredCustomData = {
  title?: string;
} & Partial<CustomBlockData>;

export function TailorToJobDialog({
  open,
  onOpenChange,
  resumeId,
  currentBlocks,
  onAccept,
}: TailorToJobDialogProps) {
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [tailoredBlocks, setTailoredBlocks] = useState<ResumeBlock[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setStep('input');
    setJobDescription('');
    setTailoredBlocks([]);
    setError(null);
    onOpenChange(false);
  };



  const handleGenerate = async () => {
    if (!jobDescription.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/resume/tailor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          jobDescription: jobDescription.trim(),
          currentBlocks,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to tailor resume');
      }

      const result = await response.json();
      setTailoredBlocks(result.blocks);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Failed to tailor resume');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    onAccept(tailoredBlocks);
    handleClose();
  };

  const handleBack = () => {
    setStep('input');
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'input' ? 'Tailor Resume to Job' : 'Preview Tailored Resume'}
          </DialogTitle>
          <DialogDescription>
            {step === 'input'
              ? 'Paste the job description and AI will tailor your resume to match'
              : 'Review the changes and accept to update your resume'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="job-description">Job Description</Label>
                <Textarea
                  id="job-description"
                  placeholder="Paste the job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>

              {error && (
                <div className="p-3 rounded bg-red-50 border border-red-200 text-red-800 text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-4">
              <DiffPreview
                originalBlocks={currentBlocks}
                tailoredBlocks={tailoredBlocks}
              />
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={step === 'input' ? handleClose : handleBack}
            disabled={loading}
          >
            {step === 'input' ? 'Cancel' : 'Back'}
          </Button>

          {step === 'input' && (
            <Button
              onClick={handleGenerate}
              disabled={loading || !jobDescription.trim()}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Tailoring...
                </>
              ) : (
                'Tailor Resume'
              )}
            </Button>
          )}

          {step === 'preview' && (
            <Button onClick={handleAccept}>
              Accept Changes
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DiffPreviewProps {
  originalBlocks: ResumeBlock[];
  tailoredBlocks: ResumeBlock[];
}

function DiffPreview({ originalBlocks, tailoredBlocks }: DiffPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground">
        Showing changes from original to tailored version
      </div>

      {tailoredBlocks.map((tailoredBlock, index) => {
        const originalBlock = originalBlocks.find(
          (b) => b.type === tailoredBlock.type && Math.abs(b.order - tailoredBlock.order) <= 1
        ) || originalBlocks[index];

        return (
          <BlockDiff
            key={index}
            original={originalBlock}
            tailored={tailoredBlock}
          />
        );
      })}
    </div>
  );
}

interface BlockDiffProps {
  original: ResumeBlock;
  tailored: ResumeBlock;
}

function BlockDiff({ original, tailored }: BlockDiffProps) {
  const hasChanges = JSON.stringify(original?.data) !== JSON.stringify(tailored.data);

  if (!hasChanges) {
    return (
      <div className="p-4 rounded border border-gray-200 bg-gray-50">
        <div className="text-sm font-medium text-gray-700 mb-2">
          {tailored.type} - No changes
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 rounded border border-blue-200 bg-blue-50">
      <div className="text-sm font-medium text-blue-900 mb-3">
        {tailored.type} - Modified
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs font-medium text-gray-600 mb-2">Original</div>
          <div className="p-3 rounded bg-white border text-sm space-y-2">
            {renderBlockContent(original)}
          </div>
        </div>

        <div>
          <div className="text-xs font-medium text-blue-600 mb-2">Tailored</div>
          <div className="p-3 rounded bg-white border border-blue-300 text-sm space-y-2">
            {renderBlockContent(tailored)}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderBlockContent(block: ResumeBlock): React.ReactNode {
  if (!block?.data) return <div className="text-gray-400">No content</div>;

  const { data } = block;

  // Header block
  if (block.type === 'header') {
    const headerData = data as TailoredHeaderData;
    const fullName = headerData.fullName ?? headerData.name;
    const title = headerData.title;
    const contactEmail = headerData.contact?.email ?? headerData.email;
    const contactPhone = headerData.contact?.phone ?? headerData.phone;
    const contactLocation = headerData.contact?.location ?? headerData.location;

    return (
      <>
        {fullName && <div className="font-semibold">{fullName}</div>}
        {title && <div className="text-gray-600">{title}</div>}
        {contactEmail && <div className="text-sm">{contactEmail}</div>}
        {contactPhone && <div className="text-sm">{contactPhone}</div>}
        {contactLocation && <div className="text-sm">{contactLocation}</div>}
      </>
    );
  }

  // Summary block
  if (block.type === 'summary') {
    const summaryData = data as TailoredSummaryData;
    const content = summaryData.paragraph ?? summaryData.text ?? '';
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // Skills block
  if (block.type === 'skills') {
    const skillsData = data as TailoredSkillsData;
    const categories = skillsData.categories ?? [];
    const primary = skillsData.primary ?? [];
    const secondary = skillsData.secondary ?? [];

    if (categories.length > 0) {
      return (
        <>
          {categories.map((category, i) => {
            if (!category?.name && !(category?.skills && category.skills.length > 0)) return null;
            return (
              <div key={`${category.name ?? 'category'}-${i}`}>
                {category.name && (
                  <>
                    <span className="font-medium">{category.name}:</span>{' '}
                  </>
                )}
                {category.skills?.join(', ')}
              </div>
            );
          })}
        </>
      );
    }

    return (
      <>
        {primary.length > 0 && (
          <div>
            <span className="font-medium">Primary:</span>{' '}
            {primary.join(', ')}
          </div>
        )}
        {secondary.length > 0 && (
          <div>
            <span className="font-medium">Secondary:</span>{' '}
            {secondary.join(', ')}
          </div>
        )}
      </>
    );
  }

  // Experience block
  if (block.type === 'experience') {
    const experienceData = data as TailoredExperienceData;
    const items = experienceData.items ?? [];

    return (
      <>
        {items.map((item, i) => {
          const role = item.role ?? item.title ?? '';
          const company = item.company ?? '';
          const heading = [role, company].filter(Boolean).join(' - ');
          const start = item.start ?? item.startDate ?? '';
          const end = item.end ?? item.endDate ?? '';
          const timeframe = [start, end].filter(Boolean).join(' - ');
          const bullets = item.bullets ?? [];

          return (
            <div key={`experience-${i}`} className="mb-3 last:mb-0">
              {heading && <div className="font-medium">{heading}</div>}
              {timeframe && (
                <div className="text-xs text-gray-600">{timeframe}</div>
              )}
              {bullets.length > 0 && (
                <ul className="list-disc list-inside mt-1 text-sm">
                  {bullets.map((bullet, j) => (
                    <li key={`experience-${i}-bullet-${j}`}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // Education block
  if (block.type === 'education') {
    const educationData = data as TailoredEducationData;
    const items = educationData.items ?? [];

    return (
      <>
        {items.map((item, i) => {
          const degree = item.degree ?? '';
          const school = item.school ?? '';
          const graduationValue =
            item.graduationDate ?? item.end ?? item.startDate ?? '';
          const graduationLabel = item.graduationDate
            ? 'Graduated'
            : item.end
            ? 'Ended'
            : item.startDate
            ? 'Started'
            : '';

          return (
            <div key={`education-${i}`} className="mb-2 last:mb-0">
              {degree && <div className="font-medium">{degree}</div>}
              {school && <div className="text-sm">{school}</div>}
              {graduationValue && (
                <div className="text-xs text-gray-600">
                  {graduationLabel ? `${graduationLabel}: ` : ''}
                  {graduationValue}
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // Projects block
  if (block.type === 'projects') {
    const projectsData = data as TailoredProjectsData;
    const items = projectsData.items ?? [];

    return (
      <>
        {items.map((item, i) => {
          const technologies = item.technologies ?? [];
          const bullets = item.bullets ?? [];

          return (
            <div key={`project-${i}`} className="mb-3 last:mb-0">
              {item.name && <div className="font-medium">{item.name}</div>}
              {item.description && (
                <div className="text-sm">{item.description}</div>
              )}
              {technologies.length > 0 && (
                <div className="text-xs text-gray-600 mt-1">
                  Tech: {technologies.join(', ')}
                </div>
              )}
              {bullets.length > 0 && (
                <ul className="list-disc list-inside mt-1 text-sm">
                  {bullets.map((bullet, j) => (
                    <li key={`project-${i}-bullet-${j}`}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </>
    );
  }

  // Custom block
  if (block.type === 'custom') {
    const customData = data as TailoredCustomData;
    const heading = customData.heading ?? customData.title;
    const bullets = customData.bullets ?? [];
    const content = customData.content ?? '';

    return (
      <>
        {heading && <div className="font-medium">{heading}</div>}
        {content && <div className="whitespace-pre-wrap text-sm">{content}</div>}
        {bullets.length > 0 && (
          <ul className="list-disc list-inside mt-1 text-sm">
            {bullets.map((bullet, index) => (
              <li key={`custom-bullet-${index}`}>{bullet}</li>
            ))}
          </ul>
        )}
      </>
    );
  }

  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}
