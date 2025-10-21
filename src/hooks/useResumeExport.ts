import { useState } from 'react';
import type { Id } from '../../convex/_generated/dataModel';
import { logEvent } from '@/lib/telemetry';

interface ExportState {
  isExporting: boolean;
  progress: 'idle' | 'generating' | 'complete' | 'error';
  url: string | null;
  error: string | null;
  exportId: Id<'builder_resume_exports'> | null;
}

interface ExportOptions {
  resumeId: Id<'builder_resumes'>;
  format: 'pdf';
  clickableLinks?: boolean; // Phase 8: Optional toggle for contact link hyperlinks
  onSuccess?: (url: string) => void;
  onError?: (error: string) => void;
}

/**
 * Custom hook for exporting resumes to PDF
 * Handles loading states and automatic download
 */
export function useResumeExport() {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: 'idle',
    url: null,
    error: null,
    exportId: null,
  });

  const exportResume = async (options: ExportOptions) => {
    const { resumeId, format, clickableLinks = false, onSuccess, onError } = options;

    // Reset state
    setState({
      isExporting: true,
      progress: 'generating',
      url: null,
      error: null,
      exportId: null,
    });

    logEvent('export_started', { format, resumeId });

    try {
      // Call export API
      const response = await fetch('/api/resume/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resumeId,
          format,
          clickableLinks, // Phase 8: Pass clickable links option
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to export resume';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (data.success && data.url) {
        setState({
          isExporting: false,
          progress: 'complete',
          url: data.url,
          error: null,
          exportId: data.exportId,
        });

        // Phase 8: Use fileName from API response if available
        const sanitizedFileName = data.fileName 
          ? data.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
          : `resume.${format}`;

        // Trigger automatic download
        triggerDownload(data.url, sanitizedFileName);

        logEvent('export_succeeded', { format, exportId: data.exportId });
        onSuccess?.(data.url);
      } else {
        throw new Error('Export failed: No URL returned');
      }
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to export resume';

      setState({
        isExporting: false,
        progress: 'error',
        url: null,
        error: errorMessage,
        exportId: null,
      });

      logEvent('export_failed', { format, error: errorMessage });
      onError?.(errorMessage);
    }
  };

  const reset = () => {
    setState({
      isExporting: false,
      progress: 'idle',
      url: null,
      error: null,
      exportId: null,
    });
  };

  return {
    ...state,
    exportResume,
    reset,
  };
}

/**
 * Trigger browser download for a URL
 */
function triggerDownload(url: string, filename: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
