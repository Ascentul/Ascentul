"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Plus, Briefcase, Search } from "lucide-react";
import { ApplicationCard } from "@/components/applications/ApplicationCard";
import { ApplicationDetails } from "@/components/applications/ApplicationDetails";
import { UpgradeModal } from "@/components/modals/UpgradeModal";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import { useRouter } from "next/navigation";

interface Application {
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
}

export default function ApplicationsPage() {
  const router = useRouter();
  const { user, isLoaded: clerkLoaded } = useUser();
  const { user: authUser, hasPremium } = useAuth();
  const [creating, setCreating] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"applications" | "job-search">(
    "applications",
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | Application["status"]
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompletedApplications, setShowCompletedApplications] =
    useState(false);
  const [form, setForm] = useState({
    company: "",
    job_title: "",
    status: "saved" as Application["status"],
    url: "",
    notes: "",
  });

  const [showDetails, setShowDetails] = useState(false);
  const [selected, setSelected] = useState<Application | null>(null);

  // Check if user is on free plan (using Clerk Billing)
  const isFreeUser = !hasPremium;

  // Handle tab change to redirect to job-search page
  const handleTabChange = (tab: "applications" | "job-search") => {
    if (tab === "job-search") {
      router.push("/job-search");
    } else {
      setActiveTab(tab);
    }
  };

  // Convex data - use directly without state duplication
  const convexApps = useQuery(
    api.applications.getUserApplications,
    user?.id ? { clerkId: user.id } : "skip",
  );
  const createMutation = useMutation(api.applications.createApplication);
  const updateMutation = useMutation(api.applications.updateApplication);
  const deleteMutation = useMutation(api.applications.deleteApplication);

  // Map Convex docs to local Application shape - memoized
  const apps = useMemo(() => {
    if (!convexApps) return [];
    return convexApps.map((d: any) => ({
      id: d._id,
      company: d.company ?? "",
      job_title: d.job_title ?? "",
      status: d.status ?? "saved",
      url: d.url ?? null,
      notes: d.notes ?? null,
      created_at:
        typeof d.created_at === "number"
          ? new Date(d.created_at).toISOString()
          : d.created_at,
      updated_at:
        typeof d.updated_at === "number"
          ? new Date(d.updated_at).toISOString()
          : d.updated_at,
      resume_id: d.resume_id ?? null,
      cover_letter_id: d.cover_letter_id ?? null,
    })) as Application[];
  }, [convexApps]);

  // Filter applications
  const filteredApps = useMemo(() => {
    let filtered = apps;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (app) =>
          app.company.toLowerCase().includes(query) ||
          app.job_title.toLowerCase().includes(query),
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((app) => app.status === statusFilter);
    }

    return filtered;
  }, [apps, searchQuery, statusFilter]);

  // Separate active and completed applications
  const activeApps = useMemo(
    () =>
      filteredApps.filter(
        (app) => app.status !== "rejected" && app.status !== "offer",
      ),
    [filteredApps],
  );

  const completedApps = useMemo(
    () =>
      apps.filter((app) => app.status === "rejected" || app.status === "offer"),
    [apps],
  );

  const createApp = async () => {
    if (!form.company.trim() || !form.job_title.trim()) return;

    // Check free user limit (1 application max)
    if (isFreeUser && apps.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }

    setCreating(true);
    try {
      if (!user?.id) return;
      await createMutation({
        clerkId: user.id,
        company: form.company,
        job_title: form.job_title,
        status: form.status,
        url: form.url || undefined,
        notes: form.notes || undefined,
      } as any);
      // Reset form and close dialog
      setForm({
        company: "",
        job_title: "",
        status: "saved",
        url: "",
        notes: "",
      });
      setShowAddDialog(false);
      // Convex query will refresh automatically - no need for optimistic updates
    } finally {
      setCreating(false);
    }
  };

  // Handle "New Application" button click
  const handleNewApplicationClick = () => {
    // Check free user limit before opening dialog
    if (isFreeUser && apps.length >= 1) {
      setShowUpgradeModal(true);
      return;
    }
    setShowAddDialog(true);
  };

  return (
    <div className="w-full">
      <div className="w-full rounded-3xl bg-white p-5 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Application Tracker
            </h1>
            <p className="text-muted-foreground">
              Manage your job applications from first save to final offer
            </p>
          </div>
          <Button
            onClick={handleNewApplicationClick}
            className="bg-primary-500 hover:bg-primary-700"
        >
          <Plus className="h-4 w-4 mr-2" /> New Application
        </Button>
        </div>

      {/* Toggle between All Applications and Find Jobs */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "applications" ? "default" : "outline"}
          onClick={() => handleTabChange("applications")}
          className="flex items-center gap-2"
        >
          <Briefcase className="h-4 w-4" />
          All Applications
        </Button>
        <Button
          variant={activeTab === "job-search" ? "default" : "outline"}
          onClick={() => handleTabChange("job-search")}
          className="flex items-center gap-2"
        >
          <Search className="h-4 w-4" />
          Find Jobs
        </Button>
      </div>

      {/* Search bar */}
      <div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company, position, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {!clerkLoaded || !convexApps ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Active Applications Section */}
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-lg font-semibold mb-3">
                Active Applications
              </h2>

              {/* Status filter buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button
                  variant={statusFilter === "saved" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("saved")}
                >
                  In Progress
                </Button>
                <Button
                  variant={statusFilter === "applied" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("applied")}
                >
                  Applied
                </Button>
                <Button
                  variant={statusFilter === "interview" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("interview")}
                >
                  Interviewing
                </Button>
                <Button
                  variant={statusFilter === "offer" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("offer")}
                >
                  Offer
                </Button>
                <Button
                  variant={statusFilter === "rejected" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter("rejected")}
                >
                  Rejected
                </Button>
              </div>
            </div>

            <div className="grid gap-3">
              {activeApps.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No active applications. Use the form above to add one.
                </div>
              ) : (
                activeApps.map((a) => (
                  <ApplicationCard
                    key={a.id}
                    application={a}
                    onChanged={() => {
                      // Convex query will refresh automatically - no need for optimistic updates
                    }}
                    onClick={() => {
                      setSelected(a);
                      setShowDetails(true);
                    }}
                    saveFn={async (id, values) => {
                      if (!user?.id) throw new Error("Not signed in");
                      await updateMutation({
                        clerkId: user.id,
                        applicationId: id as any,
                        updates: {
                          company: values.company,
                          job_title: values.job_title,
                          status: values.status as any,
                          url: (values as any).url,
                          notes: (values as any).notes,
                        },
                      } as any);
                      const updated = { ...(a as any), ...values };
                      return updated as Application;
                    }}
                    deleteFn={async (id) => {
                      if (!user?.id) throw new Error("Not signed in");
                      await deleteMutation({
                        clerkId: user.id,
                        applicationId: id as any,
                      } as any);
                    }}
                  />
                ))
              )}
            </div>
          </div>

          {/* Completed Applications Section */}
          {completedApps.length > 0 && (
            <div className="mb-8">
              <button
                onClick={() =>
                  setShowCompletedApplications(!showCompletedApplications)
                }
                className="flex items-center gap-2 mb-4 text-lg font-semibold hover:text-primary transition-colors"
              >
                <span>{showCompletedApplications ? "▼" : "▶"}</span>
                <span>Completed Applications</span>
              </button>

              {showCompletedApplications && (
                <div className="grid gap-3">
                  {completedApps.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No completed applications
                    </div>
                  ) : (
                    completedApps.map((a) => (
                      <ApplicationCard
                        key={a.id}
                        application={a}
                        onChanged={() => {
                          // Convex query will refresh automatically - no need for optimistic updates
                        }}
                        onClick={() => {
                          setSelected(a);
                          setShowDetails(true);
                        }}
                        saveFn={async (id, values) => {
                          if (!user?.id) throw new Error("Not signed in");
                          await updateMutation({
                            clerkId: user.id,
                            applicationId: id as any,
                            updates: {
                              company: values.company,
                              job_title: values.job_title,
                              status: values.status as any,
                              url: (values as any).url,
                              notes: (values as any).notes,
                            },
                          } as any);
                          const updated = { ...(a as any), ...values };
                          return updated as Application;
                        }}
                        deleteFn={async (id) => {
                          if (!user?.id) throw new Error("Not signed in");
                          await deleteMutation({
                            clerkId: user.id,
                            applicationId: id as any,
                          } as any);
                        }}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {selected && (
        <ApplicationDetails
          open={showDetails}
          onOpenChange={setShowDetails}
          application={selected}
          onChanged={(updated) => {
            // Update selected state for immediate UI feedback
            setSelected((prev) =>
              prev && prev.id === updated.id ? { ...prev, ...updated } : prev,
            );
            // Convex query will refresh automatically
          }}
          saveFn={async (id, values) => {
            if (!user?.id) throw new Error("Not signed in");
            await updateMutation({
              clerkId: user.id,
              applicationId: id as any,
              updates: values as any,
            } as any);
            const updated = { ...(selected as any), ...values };
            return updated as Application;
          }}
        />
      )}

      {/* Add Application Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Manually enter details for a job application you want to track.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Company</label>
              <Input
                placeholder="Company name"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Job Title</label>
              <Input
                placeholder="Role title"
                value={form.job_title}
                onChange={(e) =>
                  setForm({ ...form, job_title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Status</label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm({ ...form, status: v as Application["status"] })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="saved">Saved</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Job URL (optional)</label>
              <Input
                placeholder="https://..."
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Input
                placeholder="Additional notes"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={createApp}
              disabled={
                creating || !form.company.trim() || !form.job_title.trim()
              }
            >
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Application"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      </div>

      {/* Upgrade Modal for Free User Limits */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="application"
      />
    </div>
  );
}
