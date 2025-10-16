"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "../../../../convex/_generated/api";
import { NewResumeDialog } from "./components/NewResumeDialog";
import { useToast } from "@/hooks/use-toast";
import type { Id } from "../../../../convex/_generated/dataModel";
import { RecordCard } from "@/components/records/RecordCard";
import { useResumeExport } from "@/hooks/useResumeExport";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const duplicateResumeMutation = useMutation(api.builder_resumes.duplicateResume);
  const deleteResumeMutation = useMutation(api.builder_resumes.deleteResume);
  const { exportResume } = useResumeExport();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyRecord, setBusyRecord] = useState<{ id: string; action: "duplicate" | "export" | "delete" } | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sortedResumes = useMemo(() => {
    if (!resumes) return [];
    return [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [resumes]);

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

  const handleOpen = (resumeId: string) => {
    router.push(`/resume/${resumeId}`);
  };

  const handleDuplicate = async (resumeId: string) => {
    if (!user?.id) return;
    setBusyRecord({ id: resumeId, action: "duplicate" });
    try {
      const result = await duplicateResumeMutation({
        clerkId: user.id,
        resumeId: resumeId as Id<"builder_resumes">,
      });

      toast({
        title: "Resume duplicated",
        description: `Created ${result.title}.`,
      });

      router.push(`/resume/${result.id}`);
    } catch (error) {
      console.error("Failed to duplicate resume:", error);
      toast({
        title: "Error duplicating resume",
        description: "We couldn't duplicate that resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyRecord(null);
    }
  };

  const handleExport = async (resumeId: string) => {
    setBusyRecord({ id: resumeId, action: "export" });
    let handledByCallback = false;
    try {
      await exportResume({
        resumeId: resumeId as Id<"builder_resumes">,
        format: "pdf",
        onSuccess: () => {
          toast({
            title: "Export ready",
            description: "Your resume PDF is downloading.",
          });
        },
        onError: (errorMessage) => {
          handledByCallback = true;
          toast({
            title: "Export failed",
            description: errorMessage,
            variant: "destructive",
          });
        },
      });
    } catch (error) {
      if (!handledByCallback) {
        console.error("Failed to export resume:", error);
        toast({
          title: "Export failed",
          description: error instanceof Error ? error.message : "We hit an issue exporting this resume.",
          variant: "destructive",
        });
      }
    } finally {
      setBusyRecord(null);
    }
  };

  const handleDelete = (resumeId: string) => {
    setDeleteConfirmId(resumeId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setBusyRecord({ id: deleteConfirmId, action: "delete" });
    try {
      await deleteResumeMutation({ id: deleteConfirmId as Id<"builder_resumes"> });
      toast({
        title: "Resume deleted",
        description: "The resume was removed successfully.",
      });
    } catch (error) {
      console.error("Failed to delete resume:", error);
      toast({
        title: "Delete failed",
        description: "We couldn't delete that resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBusyRecord(null);
      setDeleteConfirmId(null);
    }
  };

  return (
    <>
      <NewResumeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={onNew}
      />

      <AlertDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => {
          const isDeletionInProgress =
            busyRecord?.id === deleteConfirmId && busyRecord?.action === "delete";
          if (!open && !isDeletionInProgress) {
            setDeleteConfirmId(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Resume</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this resume? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={busyRecord?.id === deleteConfirmId && busyRecord?.action === "delete"}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-60"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        {resumes && sortedResumes.length === 0 && (
          <div className="text-gray-600">No resumes yet. Click New Resume to get started.</div>
        )}
        {sortedResumes.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sortedResumes.map((resume) => (
              <RecordCard
                key={resume._id}
                resume={resume}
                onOpen={handleOpen}
                onDuplicate={handleDuplicate}
                onExport={handleExport}
                onDelete={handleDelete}
                busyAction={busyRecord?.id === resume._id ? busyRecord.action : null}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
