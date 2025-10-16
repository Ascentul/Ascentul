/**
 * Thumbnail Generator Hook
 *
 * Generates thumbnail snapshots of resume canvas using html2canvas with debounced updates.
 *
 * Usage:
 * ```tsx
 * const { generateThumbnail, isGenerating } = useThumbnailGenerator(resumeId);
 *
 * <div ref={canvasRef}>
 *   <ResumeCanvas ... />
 * </div>
 *
 * useEffect(() => {
 *   if (canvasRef.current) {
 *     generateThumbnail(canvasRef.current);
 *   }
 * }, [blocks, generateThumbnail]);
 * ```
 */

import { useState, useCallback, useRef } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { renderThumbnail } from '@/lib/thumbnail/renderThumbnail';
import { setCachedThumbnail } from '@/lib/thumbnail/cache';

export interface ThumbnailGeneratorOptions {
  width?: number; // Target width in pixels (default: 800)
  debounceMs?: number; // Debounce delay in milliseconds (default: 800)
  scale?: number; // Canvas scale factor (default: 0.5 for performance)
  onSuccess?: (dataUrl: string) => void;
  onError?: (error: Error) => void;
}

export function useThumbnailGenerator(
  resumeId: Id<"builder_resumes"> | null,
  options: ThumbnailGeneratorOptions = {}
) {
  const {
    width = 800,
    debounceMs = 800,
    onSuccess,
    onError,
  } = options;

  const [isGenerating, setIsGenerating] = useState(false);
  const [thumbnailDataUrl, setThumbnailDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const uploadThumbnailMutation = useMutation(api.builder_resumes.updateThumbnail);

  /**
   * Generate thumbnail from a DOM element (canvas container)
   *
   * @param element - HTML element to capture (e.g., resume canvas container)
   * @param uploadToConvex - Whether to upload thumbnail to Convex storage (default: true)
   */
  const generateThumbnail = useCallback(
    async (element: HTMLElement, uploadToConvex: boolean = true) => {
      if (!element) {
        console.warn('useThumbnailGenerator: No element provided');
        return;
      }

      // Clear existing debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce the generation
      debounceTimerRef.current = setTimeout(async () => {
        setIsGenerating(true);
        setError(null);

        try {
          const renderTimestamp = Date.now();

          const dataUrl = await renderThumbnail(element, {
            documentId: resumeId ?? 'preview',
            lastUpdated: renderTimestamp,
            width,
            cacheResult: false,
          });

          setThumbnailDataUrl(dataUrl);

          // Upload to Convex storage if requested and resumeId is available
          if (uploadToConvex && resumeId) {
            try {
              const result = await uploadThumbnailMutation({
                resumeId,
                thumbnailDataUrl: dataUrl,
              });

              if (result?.updatedAt) {
                setCachedThumbnail(resumeId, result.updatedAt, dataUrl);
              }
            } catch (uploadError) {
              console.error('Failed to upload thumbnail to Convex:', uploadError);
              // Don't fail the entire generation if upload fails
            }
          }

          onSuccess?.(dataUrl);
        } catch (err) {
          const error = err instanceof Error ? err : new Error('Unknown error generating thumbnail');
          setError(error);
          onError?.(error);
          console.error('Thumbnail generation error:', error);
        } finally {
          setIsGenerating(false);
        }
      }, debounceMs);
    },
    [resumeId, width, debounceMs, uploadThumbnailMutation, onSuccess, onError]
  );

  /**
   * Cancel any pending thumbnail generation (does not cancel in-flight captures)
   *
   * Note: This only cancels debounced operations that haven't started yet.
   * Once html2canvas begins rendering, it cannot be interrupted.
   */
  const cancelPendingGeneration = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setIsGenerating(false);
  }, []);

  /**
   * Reset thumbnail state
   */
  const reset = useCallback(() => {
    cancelPendingGeneration();
    setThumbnailDataUrl(null);
    setError(null);
  }, [cancelPendingGeneration]);

  return {
    generateThumbnail,
    cancelPendingGeneration,
    reset,
    isGenerating,
    thumbnailDataUrl,
    error,
  };
}

/**
 * Hook to retrieve and display existing thumbnail for a resume
 *
 * Usage:
 * ```tsx
 * const { thumbnail, isLoading } = useResumeThumbnail(resumeId);
 *
 * {thumbnail && <img src={thumbnail} alt="Resume preview" />}
 * ```
 */
