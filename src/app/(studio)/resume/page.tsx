"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { NewResumeDialog } from "./components/NewResumeDialog";
import { useToast } from "@/hooks/use-toast";
import type { Id } from "../../../../convex/_generated/dataModel";
import { FileText } from "lucide-react";

type Resume = {
  _id: string;
  title?: string;
  updatedAt?: number;
  thumbnailDataUrl?: string;
  templateSlug?: string;
};

export default function ResumeListPage() {
  const router = useRouter();
  const { user } = useUser();
  const { toast } = useToast();
  const resumes = useQuery(
    api.builder_resumes.listUserResumes,
    user?.id ? { clerkId: user.id } : "skip"
  ) as Resume[] | undefined;
  const createResumeWithBlocks = useMutation(api.builder_resumes.createResumeWithBlocks);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const showAiGenerationError = () => {
    toast({
      title: 'AI generation failed',
      description: 'Resume was created, but AI generation encountered an error.',
      variant: 'destructive',
    });
  };

  const onNew = async (data: {
    title: string;
    templateSlug: string;
    themeId?: Id<'builder_resume_themes'>;
    targetRole?: string;
    targetCompany?: string;
    generateWithAI: boolean;
    autoPopulate: boolean;
  }) => {
    if (!user?.id) return;

    try {
      // Create the resume with optional auto-population
      const result = await createResumeWithBlocks({
        clerkId: user.id,
        title: data.title,
        templateSlug: data.templateSlug,
        themeId: data.themeId,
        autoPopulate: data.autoPopulate,
      });

      // Show success message with blocks count
      if (data.autoPopulate && result.blocksCreated > 0) {
        toast({
          title: 'Resume created successfully!',
          description: `Imported ${result.blocksCreated} section${result.blocksCreated !== 1 ? 's' : ''} from your profile.`,
        });
      } else if (data.autoPopulate && result.blocksCreated === 0) {
        toast({
          title: 'Resume created',
          description: 'No profile data found to import. You can add sections manually.',
        });
      } else {
        toast({
          title: 'Resume created successfully!',
        });
      }

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
            showAiGenerationError();
          } else {
            const aiResult = await response.json();
            console.log('AI generated blocks:', aiResult.blocks?.length);
            toast({
              title: 'AI content generated!',
              description: `Added ${aiResult.blocks?.length || 0} AI-generated sections.`,
            });
          }
        } catch (error) {
          console.error('AI generation error:', error);
          showAiGenerationError();
        }
      }

      // Navigate to the editor
      router.push(`/resume/${result.id}`);
    } catch (error) {
      console.error('Failed to create resume:', error);
      toast({
        title: 'Error',
        description: 'Failed to create resume. Please try again.',
        variant: 'destructive',
      });
      // Re-throw to allow error boundary to handle if present
      // This ensures the error is properly logged and can trigger
      // error recovery mechanisms while still showing user feedback
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((r) => {
              const previewBase = process.env.NEXT_PUBLIC_PREVIEW_BASE_URL || '/previews';
              const isSafeDataUrl = r.thumbnailDataUrl?.startsWith('data:image/');
              const isSafeHttpUrl = r.thumbnailDataUrl?.startsWith('http://') || r.thumbnailDataUrl?.startsWith('https://');
              const safeThumbnailDataUrl = (isSafeDataUrl || isSafeHttpUrl) ? r.thumbnailDataUrl : null;
              const thumbnailUrl = safeThumbnailDataUrl || (r.templateSlug ? `${previewBase}/template-${r.templateSlug}.png` : null);
              const hasImageError = imageLoadErrors.has(r._id);

              return (
                <div
                  key={r._id}
                  className="group cursor-pointer rounded-lg border bg-white hover:shadow-lg transition-all overflow-hidden"
                  onClick={() => router.push(`/resume/${r._id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative h-40 bg-gray-50 flex items-center justify-center">
                    {thumbnailUrl && !hasImageError ? (
                      <img
                        src={thumbnailUrl}
                        alt={r.title || "Resume thumbnail"}
                        className="w-full h-full object-cover"
                        onError={() =>
                          setImageLoadErrors((prev) => {
                            const next = new Set(prev);
                            next.add(r._id);
                            return next;
                          })
                        }
                      />
                    ) : null}
                    {(!thumbnailUrl || hasImageError) && (
                      <div className="flex items-center justify-center">
                        <FileText className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>

                  {/* Card content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 truncate">
                      {r.title || "Untitled resume"}
                    </h3>
                    {r.updatedAt ? (
                      <p className="text-sm text-gray-500 mt-1">
                        Updated {new Date(r.updatedAt).toLocaleDateString()}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
