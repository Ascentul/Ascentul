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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate resume");
      }

      // Trigger a refetch/revalidation
      router.refresh();

      return { success: true, count: data.count };
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      throw err;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generate,
    isGenerating,
    error,
  };
}
