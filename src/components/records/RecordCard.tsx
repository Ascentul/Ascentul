"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Copy, Download, ExternalLink, FileText, Trash2, Edit2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCachedThumbnail } from "@/lib/thumbnail/cache";
import { getTemplateDefinitionBySlug } from "@/lib/templates";
import { getPreviewSrc } from "@/lib/templates/getPreviewSrc";

export interface ResumeRecord {
  _id: string;
  title?: string | null;
  updatedAt?: number | null;
  thumbnailDataUrl?: string | null;
  templateSlug?: string | null;
}

export interface RecordCardProps {
  resume: ResumeRecord;
  onOpen: (resumeId: string) => void;
  onDuplicate: (resumeId: string) => Promise<void> | void;
  onExport: (resumeId: string) => Promise<void> | void;
  onDelete: (resumeId: string) => Promise<void> | void;
  onRename?: (resumeId: string, newTitle: string) => Promise<void> | void; // Phase 8: Inline rename
  busyAction?: "duplicate" | "export" | "delete" | null;
}

function isSafeDataUrl(value: string | null | undefined) {
  return Boolean(value && value.startsWith("data:image/"));
}

function isSafeHttpUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getInitialUpdatedLabel(timestamp?: number | null) {
  if (!timestamp) return "Never updated";
  return `Updated ${new Date(timestamp).toISOString().split("T")[0]}`;
}

function formatUpdatedAt(timestamp?: number | null) {
  if (!timestamp) return "Never updated";

  const now = Date.now();
  const diff = now - timestamp;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Updated just now";
  if (diff < hour) {
    const minutes = Math.floor(diff / minute);
    return `Updated ${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  }
  if (diff < day) {
    const hours = Math.floor(diff / hour);
    return `Updated ${hours} hour${hours === 1 ? "" : "s"} ago`;
  }

  const days = Math.floor(diff / day);
  if (days <= 7) {
    return `Updated ${days} day${days === 1 ? "" : "s"} ago`;
  }

  return `Updated ${new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp))}`;
}

export function RecordCard({
  resume,
  onOpen,
  onDuplicate,
  onExport,
  onDelete,
  onRename,
  busyAction = null,
}: RecordCardProps) {
  const [imageError, setImageError] = useState(false);
  const cachedThumbnail = getCachedThumbnail(resume._id, resume.updatedAt ?? undefined);

  // Phase 8: Inline rename state
  const [isRenaming, setIsRenaming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const safeThumbnail =
    (isSafeDataUrl(resume.thumbnailDataUrl) || isSafeHttpUrl(resume.thumbnailDataUrl))
      ? resume.thumbnailDataUrl
      : null;

  const templateDefinition = resume.templateSlug
    ? getTemplateDefinitionBySlug(resume.templateSlug)
    : undefined;

  const templatePreview = templateDefinition
    ? getPreviewSrc({
        preview: templateDefinition.preview,
        previewAssetId: templateDefinition.id,
      })
    : null;

  const previewSrc = cachedThumbnail ?? safeThumbnail ?? templatePreview ?? "";
  const showImage = Boolean(previewSrc) && !imageError;

  const title = resume.title?.trim() || "Untitled resume";
  const [updatedLabel, setUpdatedLabel] = useState(() => getInitialUpdatedLabel(resume.updatedAt));
  useEffect(() => {
    setUpdatedLabel(formatUpdatedAt(resume.updatedAt));
  }, [resume.updatedAt]);
  const handleOpen = () => onOpen(resume._id);
  const handleDuplicate = () => onDuplicate(resume._id);
  const handleExport = () => onExport(resume._id);
  const handleDelete = () => onDelete(resume._id);

  // Phase 8: Inline rename handlers
  const startRename = () => {
    if (onRename) {
      setEditTitle(title);
      setIsRenaming(true);
    }
  };

  const saveRename = async () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title && onRename) {
      setIsSaving(true);
      try {
        await onRename(resume._id, trimmed);
      } catch (error) {
        console.error("Failed to rename resume:", error);
        // Optionally: show user-facing error message
        setIsSaving(false);
        return; // Don't exit rename mode on error
      }
      setIsSaving(false);
    }
    setIsRenaming(false);
  };

  const cancelRename = () => {
    setEditTitle(title);
    setIsRenaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      saveRename();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelRename();
    }
  };

  // Focus input when entering rename mode
  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isRenaming]);

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <button
        type="button"
        onClick={handleOpen}
        className="relative h-48 w-full overflow-hidden bg-muted"
        aria-label={`Open ${title}`}
      >
        {showImage ? (
          <Image
            src={previewSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <FileText className="h-12 w-12" aria-hidden="true" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />

        <div className="absolute inset-x-0 bottom-0 flex translate-y-6 items-center justify-center gap-2 opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <CardAction
            icon={ExternalLink}
            label="Open"
            onClick={handleOpen}
            disabled={busyAction !== null}
          />
          <CardAction
            icon={Copy}
            label="Duplicate"
            onClick={handleDuplicate}
            disabled={busyAction !== null}
            loading={busyAction === "duplicate"}
          />
          <CardAction
            icon={Download}
            label="Export"
            onClick={handleExport}
            disabled={busyAction !== null}
            loading={busyAction === "export"}
          />
          <CardAction
            icon={Trash2}
            label="Delete"
            onClick={handleDelete}
            disabled={busyAction !== null}
            loading={busyAction === "delete"}
            tone="danger"
          />
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Phase 8: Inline rename with Enter to save, Escape to cancel */}
        {isRenaming ? (
          <div className="flex items-center gap-1">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={saveRename}
              disabled={isSaving}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={100}
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                saveRename();
              }}
              disabled={isSaving}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
              aria-label="Save"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                cancelRename();
              }}
              disabled={isSaving}
              className="p-1 text-red-600 hover:bg-red-50 rounded"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="flex-1 line-clamp-2 text-sm font-semibold text-foreground">{title}</h3>
            {onRename && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startRename();
                }}
                className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Rename"
                data-testid="edit-icon"
              >
                <Edit2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
        <p className="text-xs text-muted-foreground">{updatedLabel}</p>
      </div>
    </article>
  );
}

interface CardActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "default" | "danger";
}

function CardAction({ icon: Icon, label, onClick, disabled = false, loading = false, tone = "default" }: CardActionProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        if (!disabled) {
          onClick();
        }
      }}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium backdrop-blur transition",
        tone === "danger"
          ? "border-red-200 bg-red-100/90 text-red-700 hover:bg-red-200/90"
          : "border-white/70 bg-white/80 text-foreground hover:bg-white",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {loading ? "Working..." : label}
    </button>
  );
}
