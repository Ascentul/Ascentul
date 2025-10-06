"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import {
  Loader2,
  ExternalLink,
  Pencil,
  Trash2,
  Check,
  Clock,
  X,
  Calendar,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";

export type DBApplication = {
  id: string | number;
  company: string;
  job_title: string;
  status: "saved" | "applied" | "interview" | "offer" | "rejected";
  url?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  resume_id?: string | null;
  cover_letter_id?: string | null;
};

function statusLabel(s: DBApplication["status"]): string {
  switch (s) {
    case "saved":
      return "In Progress";
    case "applied":
      return "Applied";
    case "interview":
      return "Interviewing";
    case "offer":
      return "Offer";
    case "rejected":
      return "Rejected";
    default:
      return "In Progress";
  }
}

export function ApplicationDetails({
  open,
  onOpenChange,
  application,
  onChanged,
  saveFn,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: DBApplication;
  onChanged?: (updated: DBApplication) => void;
  saveFn?: (
    id: string | number,
    values: Partial<DBApplication>,
  ) => Promise<DBApplication>;
}) {
  const [saving, setSaving] = useState(false);
  const [local, setLocal] = useState<DBApplication>(application);
  const { user } = useUser();
  const clerkId = user?.id;

  // Convex data for tabs
  const stages = useQuery(
    api.interviews.getStagesForApplication,
    clerkId ? { clerkId, applicationId: local.id as any } : "skip",
  );
  const followups = useQuery(
    api.followups.getFollowupsForApplication,
    clerkId ? { clerkId, applicationId: local.id as any } : "skip",
  );
  const resumes = useQuery(
    api.resumes.getUserResumes,
    clerkId ? { clerkId } : "skip",
  );
  const coverLetters = useQuery(
    api.cover_letters.getUserCoverLetters,
    clerkId ? { clerkId } : "skip",
  );

  // Mutations
  const createStage = useMutation(api.interviews.createStage);
  const updateStage = useMutation(api.interviews.updateStage);
  const deleteStage = useMutation(api.interviews.deleteStage);
  const createFollowup = useMutation(api.followups.createFollowup);
  const updateFollowup = useMutation(api.followups.updateFollowup);
  const deleteFollowup = useMutation(api.followups.deleteFollowup);
  const updateApplication = useMutation(api.applications.updateApplication);

  useEffect(() => setLocal(application), [application]);

  const save = async () => {
    setSaving(true);
    try {
      if (saveFn) {
        const updated = await saveFn(application.id, {
          status: local.status,
          notes: local.notes,
          company: local.company,
          job_title: local.job_title,
          url: local.url || undefined,
        });
        onChanged?.(updated);
        onOpenChange(false);
      } else {
        if (!clerkId) return;
        await updateApplication({
          clerkId,
          applicationId: application.id as any,
          updates: {
            status: local.status,
            notes: local.notes,
            company: local.company,
            job_title: local.job_title,
            url: local.url || undefined,
          } as any,
        } as any);
        onChanged?.({ ...local });
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  // Add Interview Stage form state
  const [stageForm, setStageForm] = useState({
    title: "",
    scheduled_at: "",
    location: "",
    notes: "",
  });
  const addStage = async () => {
    if (!clerkId || !stageForm.title.trim()) return;
    const scheduled = stageForm.scheduled_at
      ? new Date(stageForm.scheduled_at).getTime()
      : undefined;
    await createStage({
      clerkId,
      applicationId: local.id as any,
      title: stageForm.title,
      scheduled_at: scheduled,
      location: stageForm.location || undefined,
      notes: stageForm.notes || undefined,
    } as any);
    setStageForm({ title: "", scheduled_at: "", location: "", notes: "" });
  };

  const setStageOutcome = async (
    stageId: any,
    outcome: "pending" | "scheduled" | "passed" | "failed",
  ) => {
    if (!clerkId) return;
    await updateStage({ clerkId, stageId, updates: { outcome } } as any);
  };

  const removeStage = async (stageId: any) => {
    if (!clerkId) return;
    if (!confirm("Delete this interview stage?")) return;
    await deleteStage({ clerkId, stageId } as any);
  };

  const [editingStage, setEditingStage] = useState<any>(null);
  const saveStageEdit = async () => {
    if (!clerkId || !editingStage) return;
    const scheduled = editingStage.scheduled_at
      ? new Date(editingStage.scheduled_at).getTime()
      : undefined;
    await updateStage({
      clerkId,
      stageId: editingStage._id,
      updates: {
        title: editingStage.title,
        scheduled_at: scheduled,
        location: editingStage.location,
        notes: editingStage.notes,
      },
    } as any);
    setEditingStage(null);
  };

  // Status bubble helper with click to cycle through states
  const getStatusBubble = (stageId: any, outcome: string) => {
    const cycleStatus = () => {
      const statusOrder = ["pending", "scheduled", "passed", "failed"];
      const currentIndex = statusOrder.indexOf(outcome);
      const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
      setStageOutcome(stageId, nextStatus as any);
    };

    const baseClass =
      "flex items-center gap-1 text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity";

    switch (outcome) {
      case "passed":
        return (
          <div
            onClick={cycleStatus}
            className={`${baseClass} bg-green-100 text-green-700`}
          >
            <Check className="h-3 w-3" /> Passed
          </div>
        );
      case "failed":
        return (
          <div
            onClick={cycleStatus}
            className={`${baseClass} bg-red-100 text-red-700`}
          >
            <X className="h-3 w-3" /> Rejected
          </div>
        );
      case "scheduled":
        return (
          <div
            onClick={cycleStatus}
            className={`${baseClass} bg-blue-100 text-blue-700`}
          >
            <Calendar className="h-3 w-3" /> Scheduled
          </div>
        );
      default:
        return (
          <div
            onClick={cycleStatus}
            className={`${baseClass} bg-amber-100 text-amber-700`}
          >
            <Clock className="h-3 w-3" /> Pending
          </div>
        );
    }
  };

  // Follow-up form state
  const [followForm, setFollowForm] = useState({
    description: "",
    due_date: "",
  });
  const addFollowup = async () => {
    if (!clerkId || !followForm.description.trim()) return;
    const due = followForm.due_date
      ? new Date(followForm.due_date).getTime()
      : undefined;
    await createFollowup({
      clerkId,
      applicationId: local.id as any,
      description: followForm.description,
      due_date: due,
    } as any);
    setFollowForm({ description: "", due_date: "" });
  };

  const toggleFollowup = async (followupId: any, current: boolean) => {
    if (!clerkId) return;
    await updateFollowup({
      clerkId,
      followupId,
      updates: { completed: !current },
    } as any);
  };

  const removeFollowup = async (followupId: any) => {
    if (!clerkId) return;
    if (!confirm("Delete this follow-up action?")) return;
    await deleteFollowup({ clerkId, followupId } as any);
  };

  // Materials selection
  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(
    local.resume_id || undefined,
  );
  const [selectedCoverId, setSelectedCoverId] = useState<string | undefined>(
    local.cover_letter_id || undefined,
  );
  const saveMaterials = async () => {
    if (!clerkId) return;
    await updateApplication({
      clerkId,
      applicationId: local.id as any,
      updates: {
        resume_id: selectedResumeId ? (selectedResumeId as any) : undefined,
        cover_letter_id: selectedCoverId ? (selectedCoverId as any) : undefined,
      },
    } as any);
    const updated = {
      ...local,
      resume_id: selectedResumeId || null,
      cover_letter_id: selectedCoverId || null,
    };
    setLocal(updated);
    onChanged?.(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">
                {local.job_title || "Untitled Role"}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {local.company || "Company"}
              </p>
            </div>
            <ApplicationStatusBadge status={statusLabel(local.status)} />
          </div>
          {local.created_at && (
            <p className="text-xs text-muted-foreground">
              Applied{" "}
              {new Date(local.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              <Pencil className="h-3 w-3 mr-1" /> Edit
            </Button>
            {local.url && (
              <Button variant="outline" size="sm" asChild>
                <a href={local.url} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" /> View Job Posting
                </a>
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList className="grid grid-cols-4 mb-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="followups">Follow-up</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="space-y-3 text-sm">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Job Title
                </Label>
                <Input
                  value={local.job_title}
                  onChange={(e) =>
                    setLocal({ ...local, job_title: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Company</Label>
                <Input
                  value={local.company}
                  onChange={(e) =>
                    setLocal({ ...local, company: e.target.value })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Job Posting URL
                </Label>
                <Input
                  value={local.url || ""}
                  onChange={(e) => setLocal({ ...local, url: e.target.value })}
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select
                  value={local.status}
                  onValueChange={(v) =>
                    setLocal((p) => ({
                      ...p,
                      status: v as DBApplication["status"],
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved">In Progress</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interview">Interviewing</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label
                  htmlFor="notes"
                  className="text-xs text-muted-foreground"
                >
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  className="mt-1 min-h-[120px]"
                  value={local.notes ?? ""}
                  onChange={(e) =>
                    setLocal({ ...local, notes: e.target.value })
                  }
                  placeholder="Add notes about this application (job description, hiring manager, recruiter, etc.)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="interviews" className="space-y-3">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold">Interviews</h3>
                <p className="text-xs text-muted-foreground">
                  Manage interviews for this application
                </p>
              </div>
              <Button
                size="sm"
                onClick={addStage}
                disabled={!stageForm.title.trim()}
              >
                + Add Interview
              </Button>
            </div>
            <div className="rounded-md border p-3 bg-muted/30">
              <div className="grid md:grid-cols-4 gap-2">
                <Input
                  placeholder="Stage title (e.g., Phone Screen)"
                  value={stageForm.title}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, title: e.target.value })
                  }
                />
                <Input
                  type="datetime-local"
                  value={stageForm.scheduled_at}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, scheduled_at: e.target.value })
                  }
                />
                <Input
                  placeholder="Location / Link"
                  value={stageForm.location}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, location: e.target.value })
                  }
                />
                <Input
                  placeholder="Notes"
                  value={stageForm.notes}
                  onChange={(e) =>
                    setStageForm({ ...stageForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              {(stages || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No interview stages yet.
                </div>
              ) : (
                stages!.map((s: any) =>
                  editingStage && editingStage._id === s._id ? (
                    <div
                      key={s._id}
                      className="border rounded-md p-3 space-y-2 bg-blue-50"
                    >
                      <Input
                        placeholder="Stage title"
                        value={editingStage.title}
                        onChange={(e) =>
                          setEditingStage({
                            ...editingStage,
                            title: e.target.value,
                          })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="datetime-local"
                          value={editingStage.scheduled_at || ""}
                          onChange={(e) =>
                            setEditingStage({
                              ...editingStage,
                              scheduled_at: e.target.value,
                            })
                          }
                        />
                        <Input
                          placeholder="Location"
                          value={editingStage.location || ""}
                          onChange={(e) =>
                            setEditingStage({
                              ...editingStage,
                              location: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingStage(null)}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={saveStageEdit}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={s._id}
                      className="border rounded-md p-3 bg-white hover:bg-muted/20 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <Pencil
                            className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                            onClick={() =>
                              setEditingStage({
                                ...s,
                                scheduled_at: s.scheduled_at
                                  ? new Date(s.scheduled_at)
                                      .toISOString()
                                      .slice(0, 16)
                                  : "",
                              })
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">{s.title}</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              {s.scheduled_at && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(s.scheduled_at).toLocaleDateString(
                                    "en-US",
                                    {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    },
                                  )}
                                </span>
                              )}
                              {s.location && <span>📍 {s.location}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBubble(s._id, s.outcome)}
                          <Trash2
                            className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                            onClick={() => removeStage(s._id)}
                          />
                        </div>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          </TabsContent>

          <TabsContent value="followups" className="space-y-3">
            <div className="rounded-md border p-3">
              <div className="grid md:grid-cols-3 gap-2">
                <Input
                  placeholder="Description"
                  value={followForm.description}
                  onChange={(e) =>
                    setFollowForm({
                      ...followForm,
                      description: e.target.value,
                    })
                  }
                />
                <Input
                  type="datetime-local"
                  value={followForm.due_date}
                  onChange={(e) =>
                    setFollowForm({ ...followForm, due_date: e.target.value })
                  }
                />
                <Button onClick={addFollowup}>Add Follow-up</Button>
              </div>
            </div>
            <div className="space-y-2">
              {(followups || []).length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No follow-up actions yet.
                </div>
              ) : (
                followups!.map((f: any) => (
                  <div
                    key={f._id}
                    className="border rounded-md p-3 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-medium">{f.description}</div>
                      <div className="text-xs text-muted-foreground">
                        {f.due_date
                          ? new Date(f.due_date).toLocaleString()
                          : "No due date"}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={f.completed ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleFollowup(f._id, f.completed)}
                      >
                        {f.completed ? "Completed" : "Mark Completed"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFollowup(f._id)}
                      >
                        <Trash2 className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="space-y-3">
            <div>
              <Label>Resume used</Label>
              <Select
                value={selectedResumeId}
                onValueChange={(v) => setSelectedResumeId(v)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select resume" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {(resumes || []).map((r: any) => (
                    <SelectItem key={r._id} value={r._id}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cover Letter used</Label>
              <Select
                value={selectedCoverId}
                onValueChange={(v) => setSelectedCoverId(v)}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select cover letter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {(coverLetters || []).map((c: any) => (
                    <SelectItem key={c._id} value={c._id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end">
              <Button onClick={saveMaterials}>Save Materials</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
