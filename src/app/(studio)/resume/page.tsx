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

const pluralize = (count: number, singular: string) =>
  `${count} ${singular}${count === 1 ? "" : "s"}`;

const TOAST_MESSAGES = {
  resumeCreatedWithBlocks: (count: number) => ({
    title: "Resume created successfully!",
    description: `Imported ${pluralize(count, "section")} from your profile.`,
  }),
  resumeCreatedNoData: {
    title: "Resume created",
    description: "No profile data found to import. You can add sections manually.",
  },
  resumeCreatedSuccess: {
    title: "Resume created successfully!",
  },
  resumeCreationError: {
    title: "Error",
    description: "Failed to create resume. Please try again.",
    variant: "destructive" as const,
  },
  aiGenerationError: {
    title: "AI generation failed",
    description: "Resume was created, but AI generation encountered an error.",
    variant: "destructive" as const,
  },
  aiContentGenerated: (count: number) => ({
    title: "AI content generated!",
    description: `Added ${pluralize(count, "AI-generated section")}.`,
  }),
  resumeDuplicated: (title: string) => ({
    title: "Resume duplicated",
    description: `Created ${title}.`,
  }),
  resumeDuplicateError: {
    title: "Error duplicating resume",
    description: "We couldn't duplicate that resume. Please try again.",
    variant: "destructive" as const,
  },
  exportReady: {
    title: "Export ready",
    description: "Your resume PDF is downloading.",
  },
  exportFailedWithMessage: (message: string) => ({
    title: "Export failed",
    description: message,
    variant: "destructive" as const,
  }),
  exportFailedGeneric: {
    title: "Export failed",
    description: "We hit an issue exporting this resume.",
    variant: "destructive" as const,
  },
  resumeDeleted: {
    title: "Resume deleted",
    description: "The resume was removed successfully.",
  },
  deleteFailed: {
    title: "Delete failed",
    description: "We couldn't delete that resume. Please try again.",
    variant: "destructive" as const,
  },
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
  const renameResumeMutation = useMutation(api.builder_resumes.renameResume); // Phase 8: Inline rename
  const { exportResume } = useResumeExport();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [busyRecords, setBusyRecords] = useState<Map<string, "duplicate" | "export" | "delete">>(new Map());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const sortedResumes = useMemo(() => {
    if (!resumes) return [];
    return [...resumes].sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  }, [resumes]);

  const showAiGenerationError = () => {
    toast(TOAST_MESSAGES.aiGenerationError);
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
        toast(TOAST_MESSAGES.resumeCreatedWithBlocks(result.blocksCreated));
      } else if (data.autoPopulate && result.blocksCreated === 0) {
        toast(TOAST_MESSAGES.resumeCreatedNoData);
      } else {
        toast(TOAST_MESSAGES.resumeCreatedSuccess);
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
            toast(TOAST_MESSAGES.aiContentGenerated(aiResult.blocks?.length ?? 0));
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
      toast(TOAST_MESSAGES.resumeCreationError);
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
    setBusyRecords(prev => new Map(prev).set(resumeId, "duplicate"));
    try {
      const result = await duplicateResumeMutation({
        clerkId: user.id,
        resumeId: resumeId as Id<"builder_resumes">,
      });

      toast(TOAST_MESSAGES.resumeDuplicated(result.title));

      router.push(`/resume/${result.id}`);
    } catch (error) {
      console.error("Failed to duplicate resume:", error);
      toast(TOAST_MESSAGES.resumeDuplicateError);
    } finally {
      setBusyRecords(prev => {
        const next = new Map(prev);
        next.delete(resumeId);
        return next;
      });
    }
  };

  const handleExport = async (resumeId: string) => {
    setBusyRecords(prev => new Map(prev).set(resumeId, "export"));
    let handledByCallback = false;
    try {
      await exportResume({
        resumeId: resumeId as Id<"builder_resumes">,
        format: "pdf",
        onSuccess: () => {
          toast(TOAST_MESSAGES.exportReady);
        },
        onError: (errorMessage) => {
          handledByCallback = true;
          toast(TOAST_MESSAGES.exportFailedWithMessage(errorMessage));
        },
      });
    } catch (error) {
      if (!handledByCallback) {
        console.error("Failed to export resume:", error);
        toast(
          error instanceof Error
            ? TOAST_MESSAGES.exportFailedWithMessage(error.message)
            : TOAST_MESSAGES.exportFailedGeneric,
        );
      }
    } finally {
      setBusyRecords(prev => {
        const next = new Map(prev);
        next.delete(resumeId);
        return next;
      });
    }
  };

  const handleDelete = (resumeId: string) => {
    setDeleteConfirmId(resumeId);
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;

    setBusyRecords(prev => new Map(prev).set(deleteConfirmId, "delete"));
    try {
      await deleteResumeMutation({ id: deleteConfirmId as Id<"builder_resumes"> });
      toast(TOAST_MESSAGES.resumeDeleted);
    } catch (error) {
      console.error("Failed to delete resume:", error);
      toast(TOAST_MESSAGES.deleteFailed);
    } finally {
      setBusyRecords(prev => {
        const next = new Map(prev);
        next.delete(deleteConfirmId);
        return next;
      });
      setDeleteConfirmId(null);
    }
  };

  // Phase 8: Handle inline rename
  const handleRename = async (resumeId: string, newTitle: string) => {
    try {
      await renameResumeMutation({ id: resumeId as Id<"builder_resumes">, title: newTitle });
      toast({
        title: "Resume renamed",
        description: `Updated to "${newTitle}"`,
      });
    } catch (error) {
      console.error("Failed to rename resume:", error);
      toast({
        title: "Rename failed",
        description: error instanceof Error ? error.message : "Could not rename resume",
        variant: "destructive",
      });
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
            deleteConfirmId !== null && busyRecords.get(deleteConfirmId) === "delete";
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
              disabled={deleteConfirmId !== null && busyRecords.get(deleteConfirmId) === "delete"}
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
                onRename={handleRename} // Phase 8: Inline rename
                busyAction={busyRecords.get(resume._id) ?? null}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
