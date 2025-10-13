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

interface TailorToJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: Id<'builder_resumes'>;
  currentBlocks: any[];
  onAccept: (tailoredBlocks: any[]) => void;
}

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
  const [tailoredBlocks, setTailoredBlocks] = useState<any[]>([]);
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
  originalBlocks: any[];
  tailoredBlocks: any[];
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
  original: any;
  tailored: any;
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

function renderBlockContent(block: any): React.ReactNode {
  if (!block?.data) return <div className="text-gray-400">No content</div>;

  const { data } = block;

  // Header block
  if (block.type === 'header') {
    return (
      <>
        <div className="font-semibold">{data.name}</div>
        {data.title && <div className="text-gray-600">{data.title}</div>}
        {data.email && <div className="text-sm">{data.email}</div>}
        {data.phone && <div className="text-sm">{data.phone}</div>}
        {data.location && <div className="text-sm">{data.location}</div>}
      </>
    );
  }

  // Summary block
  if (block.type === 'summary') {
    return <div className="whitespace-pre-wrap">{data.text}</div>;
  }

  // Skills block
  if (block.type === 'skills') {
    return (
      <>
        {data.categories?.map((cat: any, i: number) => (
          <div key={i}>
            <span className="font-medium">{cat.name}:</span>{' '}
            {cat.skills?.join(', ')}
          </div>
        ))}
      </>
    );
  }

  // Experience block
  if (block.type === 'experience') {
    return (
      <>
        {data.items?.map((item: any, i: number) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="font-medium">{item.title} - {item.company}</div>
            <div className="text-xs text-gray-600">{item.startDate} - {item.endDate}</div>
            {item.bullets && (
              <ul className="list-disc list-inside mt-1 text-sm">
                {item.bullets.map((bullet: string, j: number) => (
                  <li key={j}>{bullet}</li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </>
    );
  }

  // Education block
  if (block.type === 'education') {
    return (
      <>
        {data.items?.map((item: any, i: number) => (
          <div key={i} className="mb-2 last:mb-0">
            <div className="font-medium">{item.degree}</div>
            <div className="text-sm">{item.school}</div>
            <div className="text-xs text-gray-600">{item.graduationDate}</div>
          </div>
        ))}
      </>
    );
  }

  // Projects block
  if (block.type === 'projects') {
    return (
      <>
        {data.items?.map((item: any, i: number) => (
          <div key={i} className="mb-3 last:mb-0">
            <div className="font-medium">{item.name}</div>
            {item.description && <div className="text-sm">{item.description}</div>}
            {item.technologies && (
              <div className="text-xs text-gray-600 mt-1">
                Tech: {item.technologies.join(', ')}
              </div>
            )}
          </div>
        ))}
      </>
    );
  }

  // Custom block
  if (block.type === 'custom') {
    return (
      <>
        <div className="font-medium">{data.title}</div>
        <div className="whitespace-pre-wrap text-sm">{data.content}</div>
      </>
    );
  }

  return <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>;
}
