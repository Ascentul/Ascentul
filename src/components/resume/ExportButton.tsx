'use client';

import { Button } from '@/components/ui/button';
import { Download, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useResumeExport } from '@/hooks/useResumeExport';
import type { Id } from '../../../convex/_generated/dataModel';

interface ExportButtonProps {
  resumeId: Id<'builder_resumes'>;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Button component for exporting resumes to PDF
 * Shows loading states and handles automatic download
 */
export function ExportButton({
  resumeId,
  variant = 'default',
  size = 'default',
  className,
}: ExportButtonProps) {
  const { isExporting, progress, error, exportResume, reset } = useResumeExport();

  const handleExport = () => {
    exportResume({
      resumeId,
      format: 'pdf',
      onSuccess: (url) => {
        console.log('Export successful:', url);
        // Show success toast
        setTimeout(() => reset(), 2000); // Reset after 2 seconds
      },
      onError: (error) => {
        console.error('Export failed:', error);
        // Show error toast
      },
    });
  };

  // Icon based on progress
  const icon = (() => {
    if (isExporting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (progress === 'complete') {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (progress === 'error') {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Download className="h-4 w-4" />;
  })();

  // Button text based on progress
  const text = (() => {
    if (isExporting) {
      if (progress === 'generating') return 'Generating PDF...';
      return 'Exporting...';
    }
    if (progress === 'complete') return 'Downloaded!';
    if (progress === 'error') return 'Try Again';
    return 'Export PDF';
  })();

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleExport}
        disabled={isExporting}
      >
        {icon}
        <span className="ml-2">{text}</span>
      </Button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

interface ExportButtonCompactProps extends Omit<ExportButtonProps, 'variant' | 'size'> {
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

/**
 * Compact export button (icon only)
 */
export function ExportButtonCompact({
  resumeId,
  className,
  onSuccess,
  onError,
}: ExportButtonCompactProps) {
  const { isExporting, progress, exportResume, reset } = useResumeExport();

  const handleExport = () => {
    exportResume({
      resumeId,
      format: 'pdf',
      onSuccess: (url) => {
        onSuccess?.(url);
        setTimeout(() => reset(), 2000); // Reset after 2 seconds
      },
      onError: (error) => {
        onError?.(error);
      },
    });
  };

  // Icon based on progress
  const icon = (() => {
    if (isExporting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (progress === 'complete') {
      return <CheckCircle className="h-4 w-4" />;
    }
    if (progress === 'error') {
      return <AlertCircle className="h-4 w-4" />;
    }
    return <Download className="h-4 w-4" />;
  })();

  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={handleExport}
      disabled={isExporting}
      title="Export to PDF"
    >
      {icon}
    </Button>
  );
}
