'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import type { ResumeBlock } from '@/lib/validators/resume';

interface DiffPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  originalBlocks: ResumeBlock[];
  improvedBlocks: ResumeBlock[];
  onApply: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

/**
 * Dialog showing side-by-side comparison of original vs improved resume blocks
 * Highlights changes and allows user to apply or cancel
 */
export function DiffPreviewDialog({
  open,
  onOpenChange,
  originalBlocks,
  improvedBlocks,
  onApply,
  onCancel,
  isApplying = false,
}: DiffPreviewDialogProps) {
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Calculate statistics
  const changesCount = improvedBlocks.filter((block, idx) => {
    const original = originalBlocks[idx];
    return JSON.stringify(block.data) !== JSON.stringify(original?.data);
  }).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review Improvements</DialogTitle>
          <DialogDescription>
            {changesCount} block{changesCount !== 1 ? 's' : ''} improved. Review the changes below and apply if satisfied.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {improvedBlocks.map((improvedBlock, index) => {
              const originalBlock = originalBlocks[index];
              if (!originalBlock) return null;

              const hasChanges = JSON.stringify(improvedBlock.data) !== JSON.stringify(originalBlock.data);
              const isSelected = selectedBlockIndex === index;

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-4 transition-colors ${
                    isSelected ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200'
                  } ${hasChanges ? 'bg-yellow-50/30' : ''}`}
                  onClick={() => setSelectedBlockIndex(index)}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant={hasChanges ? 'default' : 'secondary'}>
                      {improvedBlock.type}
                    </Badge>
                    {hasChanges ? (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        Improved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1 text-gray-500">
                        <XCircle className="h-3 w-3" />
                        No changes
                      </Badge>
                    )}
                  </div>

                  {hasChanges ? (
                    <div className="grid grid-cols-2 gap-4">
                      {/* Original */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-gray-500 uppercase">Original</div>
                        <div className="bg-white rounded border border-gray-200 p-3 text-sm">
                          <BlockContent block={originalBlock} />
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="flex items-center justify-center">
                        <ArrowRight className="h-6 w-6 text-blue-500" />
                      </div>

                      {/* Improved */}
                      <div className="space-y-2 col-start-2">
                        <div className="text-xs font-semibold text-green-600 uppercase">Improved</div>
                        <div className="bg-green-50 rounded border border-green-200 p-3 text-sm">
                          <BlockContent block={improvedBlock} highlightChanges={true} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      No changes made to this block
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isApplying}
          >
            Cancel
          </Button>
          <Button
            onClick={onApply}
            disabled={isApplying || changesCount === 0}
          >
            {isApplying ? 'Applying...' : `Apply ${changesCount} Change${changesCount !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Render block content based on type
 */
function BlockContent({ block, highlightChanges = false }: { block: ResumeBlock; highlightChanges?: boolean }) {
  const { type, data } = block;

  switch (type) {
    case 'header':
      return (
        <div className="space-y-1">
          <div className="font-semibold text-lg">{data.fullName}</div>
          {data.title && <div className="text-gray-600">{data.title}</div>}
          <div className="text-sm text-gray-500">
            {[data.contact?.email, data.contact?.phone, data.contact?.location]
              .filter(Boolean)
              .join(' • ')}
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className={highlightChanges ? 'font-medium' : ''}>
          {data.paragraph}
        </div>
      );

    case 'experience':
      return (
        <div className="space-y-3">
          {data.items?.map((item: any, idx: number) => (
            <div key={idx} className="space-y-1">
              <div className="font-semibold">{item.role}</div>
              <div className="text-sm text-gray-600">
                {item.company} • {item.start} - {item.end}
              </div>
              {item.bullets && item.bullets.length > 0 && (
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {item.bullets.map((bullet: string, bIdx: number) => (
                    <li key={bIdx} className={highlightChanges ? 'font-medium text-green-700' : ''}>
                      {bullet}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );

    case 'education':
      return (
        <div className="space-y-2">
          {data.items?.map((item: any, idx: number) => (
            <div key={idx}>
              <div className="font-semibold">{item.degree}</div>
              <div className="text-sm text-gray-600">
                {item.school} • {item.end}
              </div>
              {item.details && <div className="text-sm">{item.details}</div>}
            </div>
          ))}
        </div>
      );

    case 'skills':
      return (
        <div className="space-y-2">
          {data.primary && data.primary.length > 0 && (
            <div>
              <span className="font-semibold">Primary: </span>
              <span>{data.primary.join(', ')}</span>
            </div>
          )}
          {data.secondary && data.secondary.length > 0 && (
            <div>
              <span className="font-semibold">Secondary: </span>
              <span>{data.secondary.join(', ')}</span>
            </div>
          )}
        </div>
      );

    case 'projects':
      return (
        <div className="space-y-2">
          {data.items?.map((item: any, idx: number) => (
            <div key={idx}>
              <div className="font-semibold">{item.name}</div>
              {item.description && <div className="text-sm">{item.description}</div>}
              {item.bullets && item.bullets.length > 0 && (
                <ul className="list-disc list-inside text-sm">
                  {item.bullets.map((bullet: string, bIdx: number) => (
                    <li key={bIdx}>{bullet}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      );

    case 'custom':
      return (
        <div className="space-y-2">
          <div className="font-semibold">{data.heading}</div>
          {data.bullets && data.bullets.length > 0 && (
            <ul className="list-disc list-inside text-sm">
              {data.bullets.map((bullet: string, idx: number) => (
                <li key={idx}>{bullet}</li>
              ))}
            </ul>
          )}
        </div>
      );

    default:
      return <div className="text-gray-400">Unknown block type</div>;
  }
}
