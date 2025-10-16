"use client";

import { useEffect, useState } from "react";
import type { KeyboardEvent } from "react";
import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { Copy, Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import clsx from "clsx";
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
  busyAction = null,
}: RecordCardProps) {
  const [imageError, setImageError] = useState(false);
  const cachedThumbnail = getCachedThumbnail(resume._id, resume.updatedAt ?? undefined);

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
  const handlePreviewKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleOpen();
    }
  };

  return (
    <article
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <button
        type="button"
        onClick={handleOpen}
        className="relative h-48 w-full overflow-hidden bg-muted"
        aria-label={`Open ${title}`}
        onKeyDown={handlePreviewKeyDown}
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
            disabled={busyAction === "duplicate"}
            loading={busyAction === "duplicate"}
          />
          <CardAction
            icon={Download}
            label="Export"
            onClick={handleExport}
            disabled={busyAction === "export"}
            loading={busyAction === "export"}
          />
          <CardAction
            icon={Trash2}
            label="Delete"
            onClick={handleDelete}
            disabled={busyAction === "delete"}
            loading={busyAction === "delete"}
            tone="danger"
          />
        </div>
      </button>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 text-sm font-semibold text-foreground">{title}</h3>
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
      className={clsx(
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
