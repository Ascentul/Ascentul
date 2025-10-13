"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { NewResumeDialog } from "./components/NewResumeDialog";
import type { Id } from "../../../../convex/_generated/dataModel";

type Resume = {
  _id: string;
  title?: string;
  updatedAt?: number;
};

export default function ResumeListPage() {
  const router = useRouter();
  const { user } = useUser();
  const resumes = useQuery(
    api.builder_resumes.listUserResumes,
    user?.id ? { clerkId: user.id } : "skip"
  ) as Resume[] | undefined;
  const createResume = useMutation(api.builder_resumes.createResume);
  const updateResume = useMutation(api.builder_resumes.updateResume);
  const [dialogOpen, setDialogOpen] = useState(false);

  const onNew = async (data: {
    title: string;
    templateSlug: string;
    themeId?: Id<'builder_resume_themes'>;
    targetRole?: string;
    targetCompany?: string;
    generateWithAI: boolean;
  }) => {
    if (!user?.id) return;

    try {
      // Create the resume
      const result = await createResume({
        clerkId: user.id,
        title: data.title,
        templateSlug: data.templateSlug,
        themeId: data.themeId,
      });

      // If AI generation is requested, call the generate API
      if (data.generateWithAI && data.targetRole) {
        try {
          const response = await fetch('/api/resume/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              resumeId: result.id,
              targetRole: data.targetRole,
              targetCompany: data.targetCompany,
            }),
          });

          if (!response.ok) {
            console.error('AI generation failed:', await response.text());
          } else {
            const aiResult = await response.json();
            console.log('AI generated blocks:', aiResult.blocks?.length);
          }
        } catch (error) {
          console.error('AI generation error:', error);
          // Continue to editor even if AI generation fails
        }
      }

      // Navigate to the editor
      router.push(`/resume/${result.id}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      throw error;
    }
  };

  return (
    <>
      <NewResumeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={onNew}
      />

      <div className="max-w-3xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Resume Builder v2</h1>
          <button
            className="px-4 py-2 rounded bg-black text-white disabled:opacity-50"
            onClick={() => setDialogOpen(true)}
          >
            New Resume
          </button>
        </div>

        {!resumes && <div>Loading...</div>}
        {resumes && resumes.length === 0 && (
          <div className="text-gray-600">No resumes yet. Click New Resume to get started.</div>
        )}
        {resumes && resumes.length > 0 && (
          <ul className="space-y-2">
            {resumes.map((r) => (
              <li key={r._id}>
                <button
                  className="w-full text-left px-3 py-2 rounded border hover:bg-gray-50"
                  onClick={() => router.push(`/resume/${r._id}`)}
                >
                  <div className="font-medium">{r.title || "Untitled resume"}</div>
                  {r.updatedAt ? (
                    <div className="text-sm text-gray-500">
                      Updated {new Date(r.updatedAt).toLocaleString()}
                    </div>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
