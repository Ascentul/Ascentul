"use client";

/**
 * Enhanced Application Table Component
 *
 * Enterprise-grade table with:
 * - Multi-select checkboxes
 * - Inline editing for next steps
 * - Need-action indicators
 * - Quick actions menu
 * - Keyboard navigation
 * - Accessible markup
 *
 * Integrates with:
 * - useApplicationSelection hook for multi-select
 * - BulkActionBar for batch operations
 * - Need-action triage rules
 */

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  User,
  Calendar,
  ExternalLink,
  AlertCircle,
  MoreHorizontal,
  Edit2,
  Check,
  X,
  Clock,
  Plus,
  Activity,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { EnrichedApplication } from "@/app/(dashboard)/advisor/applications/types";
import { UseApplicationSelectionResult } from "@/app/(dashboard)/advisor/applications/hooks/useApplicationSelection";
import { cn } from "@/lib/utils";

// ============================================================================
// Types
// ============================================================================

interface ApplicationTableEnhancedProps {
  applications: EnrichedApplication[];
  isLoading?: boolean;
  clerkId?: string;
  selectionHook: UseApplicationSelectionResult;
}

const STAGE_BADGE_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  Prospect: "outline",
  Applied: "default",
  Interview: "secondary",
  Offer: "default",
  Accepted: "default",
  Rejected: "destructive",
  Withdrawn: "secondary",
  Archived: "outline",
};

// ============================================================================
// Main Component
// ============================================================================

export function ApplicationTableEnhanced({
  applications,
  isLoading,
  clerkId,
  selectionHook,
}: ApplicationTableEnhancedProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editNextStep, setEditNextStep] = useState("");
  const [editDueDate, setEditDueDate] = useState("");

  const updateNextStepMutation = useMutation(api.advisor_applications.updateApplicationNextStep);

  // ============================================================================
  // Selection Handlers
  // ============================================================================

  const handleSelectAll = useCallback(() => {
    const allIds = applications.map((app) => app._id);
    selectionHook.toggleAll(allIds);
  }, [applications, selectionHook]);

  const handleRowSelect = useCallback(
    (id: Id<'applications'>, shiftKey: boolean = false) => {
      if (shiftKey && selectionHook.selectedCount > 0) {
        // Find the last selected item and select range
        const selectedIds = selectionHook.getSelectedIds();
        const lastSelectedId = selectedIds[selectedIds.length - 1];
        const allIds = applications.map((app) => app._id);
        selectionHook.selectRange(lastSelectedId, id, allIds);
      } else {
        selectionHook.toggleSelection(id);
      }
    },
    [applications, selectionHook]
  );

  // ============================================================================
  // Inline Editing Handlers
  // ============================================================================

  const handleStartEdit = useCallback((app: EnrichedApplication) => {
    setEditingRowId(app._id.toString());
    setEditNextStep(app.next_step || "");
    setEditDueDate(
      app.next_step_date
        ? format(new Date(app.next_step_date), "yyyy-MM-dd")
        : ""
    );
  }, []);

  const handleSaveEdit = useCallback(
    async (appId: Id<'applications'>) => {
      if (!clerkId) return;

      try {
        let dueDateTimestamp: number | undefined = undefined;
        if (editDueDate) {
          const parsedDate = new Date(editDueDate);
          if (isNaN(parsedDate.getTime())) {
            console.error("Invalid date format");
            // TODO: Show toast notification
            return;
          }
          dueDateTimestamp = parsedDate.getTime();
        }

        await updateNextStepMutation({
          clerkId,
          applicationId: appId,
          nextStep: editNextStep,
          dueDate: dueDateTimestamp,
        });

        setEditingRowId(null);
        setEditNextStep("");
        setEditDueDate("");
      } catch (error) {
        console.error("Failed to update next step:", error);
        // TODO: Show toast notification
      }
    },
    [clerkId, editNextStep, editDueDate, updateNextStepMutation]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingRowId(null);
    setEditNextStep("");
    setEditDueDate("");
  }, []);

  // Keyboard shortcut: Escape to cancel editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingRowId) {
        handleCancelEdit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingRowId, handleCancelEdit]);

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No applications to display</p>
      </div>
    );
  }

  const allSelected = applications.length > 0 && selectionHook.isAllSelected;
  const someSelected = selectionHook.selectedCount > 0 && !allSelected;

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {/* Select All Checkbox */}
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Select all applications"
              />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Next Step</TableHead>
            <TableHead>Due</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => {
            const isSelected = selectionHook.isSelected(app._id);
            const isEditing = editingRowId === app._id.toString();

            return (
              <TableRow
                key={app._id}
                className={`
                  ${app.needsAction ? "bg-orange-50/50" : ""}
                  ${isSelected ? "bg-blue-50" : ""}
                  hover:bg-gray-50 transition-colors
                `}
              >
                {/* Checkbox */}
                <TableCell>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => handleRowSelect(app._id)}
                    onClick={(e: React.MouseEvent) => {
                      // Handle shift-click for range selection
                      if (e.shiftKey) {
                        e.preventDefault(); // Prevent default checkbox toggle
                        handleRowSelect(app._id, true);
                      }
                    }}
                    aria-label={`Select ${app.company_name} application`}
                  />
                </TableCell>

                {/* Student */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">
                        {app.student_name}
                      </div>
                      {app.student_graduation_year && (
                        <div className="text-xs text-muted-foreground">
                          Class of {app.student_graduation_year}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Company */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
                    <span className="font-medium truncate">{app.company_name}</span>
                  </div>
                </TableCell>

                {/* Position */}
                <TableCell>
                  <div className="max-w-xs truncate text-sm">
                    {app.position_title}
                  </div>
                </TableCell>

                {/* Stage */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={STAGE_BADGE_VARIANTS[app.stage] || "outline"}>
                      {app.stage}
                    </Badge>
                    {app.needsAction && (
                      <div className="flex items-center gap-1 text-xs text-orange-600">
                        <AlertCircle className="h-3 w-3" aria-hidden="true" />
                        <span className="hidden xl:inline">
                          {app.isOverdue ? "Overdue" : app.isDueSoon ? "Due soon" : "Needs action"}
                        </span>
                      </div>
                    )}
                  </div>
                </TableCell>

                {/* Next Step (Inline Editing) */}
                <TableCell>
                  {isEditing ? (
                    <Input
                      value={editNextStep}
                      onChange={(e) => setEditNextStep(e.target.value)}
                      placeholder="Next step..."
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSaveEdit(app._id);
                        }
                      }}
                    />
                  ) : (
                    <div className="max-w-xs">
                      {app.next_step ? (
                        <div className="text-sm truncate" title={app.next_step}>
                          {app.next_step}
                        </div>
                      ) : app.needsAction && app.needActionReasons.includes('no_next_step') ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartEdit(app)}
                          className="h-7 gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        >
                          <Plus className="h-3 w-3" aria-hidden="true" />
                          Add next step
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Due Date (Inline Editing) */}
                <TableCell>
                  {isEditing ? (
                    <Input
                      type="date"
                      value={editDueDate}
                      onChange={(e) => setEditDueDate(e.target.value)}
                      className="h-8 text-sm w-32"
                    />
                  ) : (
                    <div>
                      {app.next_step_date ? (
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <Clock
                              className={cn(
                                "h-3 w-3",
                                app.isOverdue ? "text-red-500" :
                                app.isDueSoon ? "text-orange-500" :
                                "text-muted-foreground"
                              )}
                              aria-hidden="true"
                            />
                            <span
                              className={cn(
                                "text-sm font-medium",
                                app.isOverdue ? "text-red-600" :
                                app.isDueSoon ? "text-orange-600" :
                                "text-muted-foreground"
                              )}
                            >
                              {format(new Date(app.next_step_date), "MMM d")}
                            </span>
                          </div>
                          <span className={cn(
                            "text-xs",
                            app.isOverdue ? "text-red-500" :
                            app.isDueSoon ? "text-orange-500" :
                            "text-muted-foreground"
                          )}>
                            {app.isOverdue ? "Overdue" : formatDistanceToNow(new Date(app.next_step_date), { addSuffix: true })}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  )}
                </TableCell>

                {/* Last Activity */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Activity
                      className={cn(
                        "h-3 w-3",
                        app.isStale ? "text-gray-400" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <div className="flex flex-col gap-0.5">
                      <span className={cn(
                        "text-sm",
                        app.isStale ? "text-gray-500 font-medium" : "text-muted-foreground"
                      )}>
                        {app.daysSinceUpdate === 0 ? "Today" :
                         app.daysSinceUpdate === 1 ? "Yesterday" :
                         `${app.daysSinceUpdate}d ago`}
                      </span>
                      {app.isStale && (
                        <span className="text-xs text-gray-400">Stale</span>
                      )}
                    </div>
                  </div>
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSaveEdit(app._id)}
                        className="h-7 px-2"
                      >
                        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
                        <span className="sr-only">Save</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancelEdit}
                        className="h-7 px-2"
                      >
                        <X className="h-4 w-4 text-red-600" aria-hidden="true" />
                        <span className="sr-only">Cancel</span>
                      </Button>
                    </div>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStartEdit(app)}>
                          <Edit2 className="h-4 w-4 mr-2" aria-hidden="true" />
                          Edit Next Step
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/advisor/students/${app.user_id}`}>
                            <User className="h-4 w-4 mr-2" aria-hidden="true" />
                            View Student
                          </Link>
                        </DropdownMenuItem>
                        {app.application_url && (
                          <DropdownMenuItem asChild>
                            <a
                              href={app.application_url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" aria-hidden="true" />
                              Open Application
                            </a>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
