'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

/**
 * Hook for resume actions - create, generate, list templates/themes
 */
export function useResumeActions() {
  // Mutations
  const createResumeMutation = useMutation(api.builder_resumes_v2.create);

  // Queries
  const templates = useQuery(api.templates.listTemplatesAll, {});
  const themes = useQuery(api.themes.listThemesAll, {});

  /**
   * Create a new resume
   */
  const createResume = async (
    clerkId: string,
    title: string,
    templateSlug: string,
    themeId?: Id<'builder_resume_themes'>
  ) => {
    return await createResumeMutation({
      clerkId,
      title,
      templateSlug,
      themeId,
    });
  };

  /**
   * Generate resume with AI
   *
   * Note: Uses a 60-second timeout to prevent indefinite hanging.
   * The AbortController will cancel the request if it exceeds the timeout.
   */
  const generate = async (
    resumeId: Id<'builder_resumes'>,
    targetRole: string,
    targetCompany?: string
  ) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch('/api/resume/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          resumeId,
          targetRole,
          targetCompany,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to generate resume');
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Resume generation timed out. Please try again.');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  return {
    createResume,
    generate,
    templates: {
      data: templates,
      isLoading: templates === undefined,
    },
    themes: {
      data: themes,
      isLoading: themes === undefined,
    },
  };
}
