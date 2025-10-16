"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Id } from "../../../../../../convex/_generated/dataModel";

interface GenerateOptions {
  resumeId: Id<"builder_resumes">;
  targetRole: string;
  targetCompany?: string;
}

export function useResumeActions() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async ({ resumeId, targetRole, targetCompany }: GenerateOptions) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/resume/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId,
          targetRole,
          targetCompany,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(errorData.error || "Failed to generate resume");
      }

      const data = await response.json();

      // Trigger a refetch/revalidation
      router.refresh();

      return { success: true, count: data.count };
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  const clearError = () => setError(null);

  return {
    generate,
    isGenerating,
    error,
    clearError,
  };
}
