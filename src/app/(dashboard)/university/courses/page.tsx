"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Plus,
  Upload,
  Download,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

export default function UniversityCoursesPage() {
  const { user, isAdmin, subscription } = useAuth();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  const canAccess =
    !!user &&
    (isAdmin || subscription.isUniversity);

  const courses = useQuery(
    api.university_admin.listCourses,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  ) as any[] | undefined;
  const departments = useQuery(
    api.university_admin.listDepartments,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  ) as any[] | undefined;

  const createCourse = useMutation(api.university_admin.createCourse);
  const updateCourse = useMutation(api.university_admin.updateCourse);
  const deleteCourse = useMutation(api.university_admin.deleteCourse);

  const deptById = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of departments || []) map.set(String(d._id), d);
    return map;
  }, [departments]);

  // State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [deletingCourse, setDeletingCourse] = useState<any>(null);
  const [form, setForm] = useState<{
    title: string;
    category?: string;
    level?: string;
    departmentId?: string;
  }>({ title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have access to Programs Management.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!courses || !departments) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const exportCoursesCsv = () => {
    const headers = ["Title", "Department", "Category", "Level", "Published"];
    const rows = (courses || []).map((c: any) =>
      [
        `"${c.title ?? ""}"`,
        `"${(c.department_id && deptById.get(String(c.department_id))?.name) || ""}"`,
        `"${c.category ?? ""}"`,
        `"${c.level ?? ""}"`,
        c.published ? "Yes" : "No",
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "programs_export.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Exported",
      description: "Programs exported to CSV",
      variant: "success",
    });
  };

  const handleImportCsv = async (file: File) => {
    if (!clerkUser?.id) return;
    setImporting(true);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter(Boolean);
      if (lines.length <= 1) {
        toast({ title: "Empty file", variant: "destructive" });
        return;
      }
      const header = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, ""));
      const idx = (name: string) =>
        header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
      const iTitle = idx("title");
      const iCategory = idx("category");
      const iLevel = idx("level");
      const iDepartment = idx("department");

      let imported = 0;
      for (let i = 1; i < lines.length; i++) {
        const cols =
          lines[i]
            .match(/\"[^\"]*\"|[^,]+/g)
            ?.map((c) => c.replace(/^\"|\"$/g, "")) || [];
        const title = cols[iTitle]?.trim();
        if (!title) continue;

        const departmentName =
          iDepartment >= 0 ? cols[iDepartment]?.trim() : "";
        let departmentId: string | undefined;
        if (departmentName) {
          const found = (departments || []).find(
            (d: any) =>
              (d.name || "").toLowerCase() === departmentName.toLowerCase(),
          );
          if (found) departmentId = String(found._id);
        }

        await createCourse({
          clerkId: clerkUser.id,
          title,
          category: iCategory >= 0 ? cols[iCategory] : undefined,
          level: iLevel >= 0 ? cols[iLevel] : undefined,
          departmentId: departmentId ? (departmentId as any) : undefined,
          published: false,
        });
        imported++;
      }
      toast({
        title: "Import Complete",
        description: `Successfully imported ${imported} programs`,
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "Import Failed",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleCreate = async () => {
    if (!clerkUser?.id || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await createCourse({
        clerkId: clerkUser.id,
        title: form.title.trim(),
        category: form.category || undefined,
        level: form.level || undefined,
        departmentId: form.departmentId
          ? (form.departmentId as any)
          : undefined,
        published: false,
      });
      setForm({ title: "" });
      setCreateDialogOpen(false);
      toast({ title: "Program Created", variant: "success" });
    } catch (e: any) {
      toast({
        title: "Failed to create program",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (course: any) => {
    setEditingCourse(course);
    setForm({
      title: course.title,
      category: course.category || "",
      level: course.level || "",
      departmentId: course.department_id ? String(course.department_id) : "",
    });
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!clerkUser?.id || !editingCourse || !form.title.trim()) return;
    setSubmitting(true);
    try {
      await updateCourse({
        clerkId: clerkUser.id,
        courseId: editingCourse._id,
        patch: {
          title: form.title.trim(),
          category: form.category || undefined,
          level: form.level || undefined,
          department_id: form.departmentId
            ? (form.departmentId as any)
            : undefined,
        },
      });
      setEditDialogOpen(false);
      setEditingCourse(null);
      setForm({ title: "" });
      toast({ title: "Program Updated", variant: "success" });
    } catch (e: any) {
      toast({
        title: "Failed to update program",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePublished = async (course: any) => {
    if (!clerkUser?.id) return;
    try {
      await updateCourse({
        clerkId: clerkUser.id,
        courseId: course._id,
        patch: { published: !course.published },
      });
      toast({
        title: course.published ? "Program Unpublished" : "Program Published",
        variant: "success",
      });
    } catch (e: any) {
      toast({
        title: "Failed to update status",
        description: e?.message || String(e),
        variant: "destructive",
      });
    }
  };

  const openDeleteDialog = (course: any) => {
    setDeletingCourse(course);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!clerkUser?.id || !deletingCourse) return;
    setSubmitting(true);
    try {
      await deleteCourse({
        clerkId: clerkUser.id,
        courseId: deletingCourse._id,
      });
      setDeleteDialogOpen(false);
      setDeletingCourse(null);
      toast({ title: "Program Deleted", variant: "success" });
    } catch (e: any) {
      toast({
        title: "Failed to delete program",
        description: e?.message || String(e),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">
            Programs Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage academic programs and courses
          </p>
        </div>
        <div className="flex gap-2">
          <input
            id="coursesCsv"
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) =>
              e.target.files &&
              e.target.files[0] &&
              handleImportCsv(e.target.files[0])
            }
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("coursesCsv")?.click()}
            disabled={importing}
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Import CSV
          </Button>
          <Button variant="outline" onClick={exportCoursesCsv}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Program
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Programs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Published</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {courses.filter((c) => c.published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {courses.filter((c) => !c.published).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Departments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Programs Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Programs</CardTitle>
          <CardDescription>
            Manage academic programs, courses, and department assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground mb-4">No programs found.</p>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first program to get started
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((c: any) => {
                  const dept = c.department_id
                    ? deptById.get(String(c.department_id))
                    : undefined;
                  return (
                    <TableRow key={String(c._id)}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell>{dept?.name || "—"}</TableCell>
                      <TableCell>{c.category || "—"}</TableCell>
                      <TableCell>{c.level || "—"}</TableCell>
                      <TableCell>
                        {c.published ? (
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <XCircle className="h-3 w-3 mr-1" />
                            Draft
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleTogglePublished(c)}
                          >
                            {c.published ? "Unpublish" : "Publish"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(c)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(c)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Program</DialogTitle>
            <DialogDescription>
              Create a new academic program or course
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="create-title">Program Title *</Label>
              <Input
                id="create-title"
                placeholder="e.g., Introduction to Computer Science"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="create-category">Category</Label>
                <Input
                  id="create-category"
                  placeholder="e.g., Technology"
                  value={form.category || ""}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="create-level">Level</Label>
                <Input
                  id="create-level"
                  placeholder="e.g., Undergraduate"
                  value={form.level || ""}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="create-dept">Department</Label>
              <Select
                value={form.departmentId || ""}
                onValueChange={(v) => setForm({ ...form, departmentId: v })}
              >
                <SelectTrigger id="create-dept">
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d: any) => (
                    <SelectItem key={String(d._id)} value={String(d._id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!form.title.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Create Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Program</DialogTitle>
            <DialogDescription>Update program details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Program Title *</Label>
              <Input
                id="edit-title"
                placeholder="e.g., Introduction to Computer Science"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  placeholder="e.g., Technology"
                  value={form.category || ""}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-level">Level</Label>
                <Input
                  id="edit-level"
                  placeholder="e.g., Undergraduate"
                  value={form.level || ""}
                  onChange={(e) => setForm({ ...form, level: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-dept">Department</Label>
              <Select
                value={form.departmentId || ""}
                onValueChange={(v) => setForm({ ...form, departmentId: v })}
              >
                <SelectTrigger id="edit-dept">
                  <SelectValue placeholder="Select department (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((d: any) => (
                    <SelectItem key={String(d._id)} value={String(d._id)}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!form.title.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Program</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingCourse?.title}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
