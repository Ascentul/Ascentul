"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import { useQuery, useMutation } from "convex/react";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Plus, Edit, Trash2 } from "lucide-react";

export default function UniversityDepartmentsPage() {
  const { user, isAdmin, subscription } = useAuth();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();

  // Access control: Only university_admin or super_admin can manage departments
  // subscription.isUniversity is NOT sufficient - it includes regular students
  const canAccess =
    !!user &&
    (isAdmin || user.role === 'university_admin');

  const departments = useQuery(
    api.university_admin.listDepartments,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  ) as any[] | undefined;
  const students = useQuery(
    api.university_admin.listStudents,
    clerkUser?.id ? { clerkId: clerkUser.id, limit: 1000 } : "skip",
  ) as any[] | undefined;

  // Mutations for department management
  const createDepartment = useMutation(api.university_admin.createDepartment);
  const updateDepartment = useMutation(api.university_admin.updateDepartment);
  const deleteDepartment = useMutation(api.university_admin.deleteDepartment);

  // Modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ name: "", code: "" });
  const [editingDepartment, setEditingDepartment] = useState<any>(null);
  const [deletingDepartment, setDeletingDepartment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Card>
          <CardHeader>
            <CardTitle>Unauthorized</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              You do not have access to University Departments.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!departments || !students) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  // Helper function to get student count for a department
  const getStudentCount = (departmentId: string) => {
    return students.filter((s: any) => s.department_id === departmentId).length;
  };

  // Handle create department
  const handleCreate = async () => {
    if (!formData.name.trim() || !clerkUser?.id) return;
    setLoading(true);
    try {
      await createDepartment({
        clerkId: clerkUser.id,
        name: formData.name.trim(),
        code: formData.code.trim() || undefined,
      });
      toast({
        title: "Success",
        description: "Department created successfully",
        variant: "success",
      });
      setCreateOpen(false);
      setFormData({ name: "", code: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create department",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle edit department
  const handleEdit = async () => {
    if (!editingDepartment || !formData.name.trim() || !clerkUser?.id) return;
    setLoading(true);
    try {
      await updateDepartment({
        clerkId: clerkUser.id,
        departmentId: editingDepartment._id,
        patch: {
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
        },
      });
      toast({
        title: "Success",
        description: "Department updated successfully",
        variant: "success",
      });
      setEditOpen(false);
      setEditingDepartment(null);
      setFormData({ name: "", code: "" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update department",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete department
  const handleDelete = async () => {
    if (!deletingDepartment || !clerkUser?.id) return;
    setLoading(true);
    try {
      await deleteDepartment({
        clerkId: clerkUser.id,
        departmentId: deletingDepartment._id,
      });
      toast({
        title: "Success",
        description: "Department deleted successfully",
        variant: "success",
      });
      setDeleteOpen(false);
      setDeletingDepartment(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete department",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (department: any) => {
    setEditingDepartment(department);
    setFormData({ name: department.name, code: department.code || "" });
    setEditOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (department: any) => {
    setDeletingDepartment(department);
    setDeleteOpen(true);
  };

  return (
    <div className="max-w-screen-2xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">
            Departments
          </h1>
          <p className="text-muted-foreground">
            Manage academic departments and track student distribution.
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Department
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Total Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{departments.length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Students per Department
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {departments.length > 0
                  ? Math.round(students.length / departments.length)
                  : 0}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Average</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Active Departments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Building2 className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">{departments.length}</div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              All departments active
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              Department Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-muted-foreground mr-2" />
              <div className="text-2xl font-bold">
                {students.length > 0
                  ? Math.round((students.length / departments.length) * 100) /
                    100
                  : 0}
                %
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Utilization rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
          <CardDescription>
            Academic departments and student distribution
          </CardDescription>
        </CardHeader>
        <CardContent>
          {departments.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No departments found.</p>
              <p className="text-sm text-muted-foreground">
                Create your first department to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map((department: any) => {
                const studentCount = getStudentCount(department._id);
                return (
                  <Card key={String(department._id)} className="relative">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="text-lg">
                          {department.name}
                        </CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditModal(department)}
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteModal(department)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Students
                          </span>
                          <Badge variant="secondary">{studentCount}</Badge>
                        </div>
                        {department.code && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Code
                            </span>
                            <Badge variant="outline">{department.code}</Badge>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Status
                          </span>
                          <Badge variant="default">Active</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Department Modal */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deptName">Department Name *</Label>
              <Input
                id="deptName"
                placeholder="e.g., Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="deptCode">Department Code (Optional)</Label>
              <Input
                id="deptCode"
                placeholder="e.g., CS"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
              <div className="text-xs text-muted-foreground mt-1">
                Short code for the department (e.g., CS for Computer Science)
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? "Creating..." : "Create Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Department Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editDeptName">Department Name *</Label>
              <Input
                id="editDeptName"
                placeholder="e.g., Computer Science"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>
            <div>
              <Label htmlFor="editDeptCode">Department Code (Optional)</Label>
              <Input
                id="editDeptCode"
                placeholder="e.g., CS"
                value={formData.code}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, code: e.target.value }))
                }
              />
              <div className="text-xs text-muted-foreground mt-1">
                Short code for the department (e.g., CS for Computer Science)
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={loading || !formData.name.trim()}
            >
              {loading ? "Updating..." : "Update Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Modal */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete the department "
              {deletingDepartment?.name}"?
            </p>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone. All associated data will be
              permanently removed.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Department"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
