"use client";

import React, { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useAuth } from "@/contexts/ClerkAuthProvider";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  ExternalLink,
  Github,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Edit,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "convex/_generated/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { ProjectPreviewModal } from "@/components/project-preview-modal";
import { UpgradeModal } from "@/components/modals/UpgradeModal";

interface Project {
  _id: string;
  title: string;
  description?: string;
  technologies: string[];
  url?: string;
  github_url?: string;
  image_url?: string;
  role?: string;
  start_date?: number;
  end_date?: number;
  company?: string;
  type?: string;
}

export default function ProjectsPage() {
  const { user: clerkUser } = useUser();
  const { hasPremium } = useAuth();
  const { toast } = useToast();

  const projects = useQuery(
    api.projects.getUserProjects,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  ) as Project[] | undefined;

  const userData = useQuery(
    api.users.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : "skip",
  );

  const createProjectMutation = useMutation(api.projects.createProject);
  const updateProjectMutation = useMutation(api.projects.updateProject);
  const deleteProjectMutation = useMutation(api.projects.deleteProject);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);

  const isFreeUser = !hasPremium; // Use Clerk Billing subscription check

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    technologies: "",
    github_url: "",
    url: "",
    role: "",
    company: "",
    start_date: "",
    end_date: "",
    image_url: "",
    type: "personal",
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      technologies: "",
      github_url: "",
      url: "",
      role: "",
      company: "",
      start_date: "",
      end_date: "",
      image_url: "",
      type: "personal",
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser?.id) return;

    try {
      await createProjectMutation({
        clerkId: clerkUser.id,
        title: formData.title,
        description: formData.description || undefined,
        technologies: formData.technologies
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        type: formData.type as "personal" | "professional",
        url: formData.url || undefined,
        github_url: formData.github_url || undefined,
        role: formData.role || undefined,
        company: formData.company || undefined,
        image_url: formData.image_url || undefined,
        start_date: formData.start_date
          ? new Date(formData.start_date).getTime()
          : undefined,
        end_date: formData.end_date
          ? new Date(formData.end_date).getTime()
          : undefined,
      });

      toast({
        title: "Project created",
        description: "Your project has been added successfully.",
        variant: "success",
      });
      setShowCreateForm(false);
      resetForm();
    } catch (error: any) {
      // Check if error is about free plan limit
      if (error?.message?.includes("Free plan limit reached")) {
        setShowCreateForm(false);
        setShowUpgradeModal(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to create project. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const startEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description || "",
      technologies: project.technologies.join(", "),
      github_url: project.github_url || "",
      url: project.url || "",
      role: project.role || "",
      company: project.company || "",
      start_date: project.start_date
        ? new Date(project.start_date).toISOString().split("T")[0]
        : "",
      end_date: project.end_date
        ? new Date(project.end_date).toISOString().split("T")[0]
        : "",
      image_url: project.image_url || "",
      type: project.type || "personal",
    });
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clerkUser?.id || !editingProject) return;

    try {
      await updateProjectMutation({
        clerkId: clerkUser.id,
        projectId: editingProject._id as any,
        updates: {
          title: formData.title,
          description: formData.description || undefined,
          technologies: formData.technologies
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          url: formData.url || undefined,
          github_url: formData.github_url || undefined,
          role: formData.role || undefined,
          company: formData.company || undefined,
          image_url: formData.image_url || undefined,
          start_date: formData.start_date
            ? new Date(formData.start_date).getTime()
            : undefined,
          end_date: formData.end_date
            ? new Date(formData.end_date).getTime()
            : undefined,
        },
      });

      toast({
        title: "Project updated",
        description: "Your project has been updated successfully.",
        variant: "success",
      });
      setEditingProject(null);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!clerkUser?.id || !deleteId) return;

    try {
      await deleteProjectMutation({
        clerkId: clerkUser.id,
        projectId: deleteId as any,
      });

      toast({
        title: "Project deleted",
        description: "Your project has been deleted successfully.",
        variant: "success",
      });
      setDeleteId(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete project. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    projectId?: string,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !clerkUser?.id) return;

    // For now, we'll use a placeholder. In production, you'd upload to a service like Cloudinary or S3
    const reader = new FileReader();
    reader.onloadend = async () => {
      const imageUrl = reader.result as string;

      if (projectId) {
        // Update existing project
        setUploadingImage(projectId);
        try {
          await updateProjectMutation({
            clerkId: clerkUser.id,
            projectId: projectId as any,
            updates: {
              image_url: imageUrl,
            },
          });
          toast({ title: "Image uploaded", variant: "success" });
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to upload image.",
            variant: "destructive",
          });
        } finally {
          setUploadingImage(null);
        }
      } else {
        // For create/edit form
        setFormData({ ...formData, image_url: imageUrl });
      }
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Projects
          </h1>
          <p className="text-muted-foreground">
            Showcase your projects and technical work
          </p>
        </div>
        <Button
          onClick={() => {
            // Check free user limit (1 project max)
            if (isFreeUser && projects && projects.length >= 1) {
              setShowUpgradeModal(true);
              return;
            }
            setShowCreateForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreateForm || !!editingProject}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreateForm(false);
            setEditingProject(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProject ? "Edit Project" : "Add New Project"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={editingProject ? handleEdit : handleCreate}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your project, technologies used, and your contributions..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="image">Project Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e)}
                  className="flex-1"
                />
                {formData.image_url && (
                  <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0 relative">
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="personal">Personal</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
              <div>
                <Label htmlFor="role">Your Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  placeholder="Full Stack Developer"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="company">Company/Organization</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                placeholder="Personal Project"
              />
            </div>

            <div>
              <Label htmlFor="technologies">
                Technologies (comma-separated)
              </Label>
              <Input
                id="technologies"
                value={formData.technologies}
                onChange={(e) =>
                  setFormData({ ...formData, technologies: e.target.value })
                }
                placeholder="React, Node.js, MongoDB"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="github_url">GitHub URL</Label>
                <Input
                  id="github_url"
                  type="url"
                  value={formData.github_url}
                  onChange={(e) =>
                    setFormData({ ...formData, github_url: e.target.value })
                  }
                  placeholder="https://github.com/username/project"
                />
              </div>
              <div>
                <Label htmlFor="url">Live Demo URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) =>
                    setFormData({ ...formData, url: e.target.value })
                  }
                  placeholder="https://myproject.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit">
                {editingProject ? "Save Changes" : "Create Project"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {previewProject && (
        <ProjectPreviewModal
          open={!!previewProject}
          onClose={() => setPreviewProject(null)}
          project={previewProject}
        />
      )}

      {/* Projects Grid */}
      {projects === undefined ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground mb-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <span className="text-2xl">📁</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-sm mb-4">
                Start building your portfolio by adding your first project.
              </p>
            </div>
            <Button
              onClick={() => {
                // Check free user limit (1 project max)
                if (isFreeUser && projects && projects.length >= 1) {
                  setShowUpgradeModal(true);
                  return;
                }
                setShowCreateForm(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Card
              key={project._id}
              className="hover:shadow-lg transition-all overflow-hidden group cursor-pointer"
              onClick={() => setPreviewProject(project)}
            >
              {/* Project Image Section */}
              <div className="relative w-full h-48 bg-[#f4f4f4] border-b border-[#eaeaea]">
                {project.image_url ? (
                  <Image
                    src={project.image_url}
                    alt={project.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <ImageIcon className="h-16 w-16 text-gray-300" />
                    <p className="text-xs text-[#888] mt-2">
                      No image uploaded yet
                    </p>
                  </div>
                )}

                {/* Project Type Badge */}
                <div className="absolute bottom-2 right-2">
                  <Badge
                    variant={
                      project.type === "professional" ? "default" : "secondary"
                    }
                    className="bg-white/90 backdrop-blur-sm shadow-sm"
                  >
                    {project.type
                      ? project.type.charAt(0).toUpperCase() +
                        project.type.slice(1)
                      : "Personal"}
                  </Badge>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-1 absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-white/90 shadow-sm backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(project);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-red-500 hover:text-red-600 bg-white/90 shadow-sm backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(project._id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Project Content Section */}
              <div className="p-5">
                <h2 className="text-xl font-semibold mb-2 line-clamp-1">
                  {project.title}
                </h2>

                {(project.start_date || project.end_date) && (
                  <div className="text-sm text-neutral-500 mb-3">
                    {formatDate(project.start_date)} -{" "}
                    {project.end_date
                      ? formatDate(project.end_date)
                      : "Present"}
                  </div>
                )}

                {project.role && (
                  <p className="text-sm text-muted-foreground mb-1">
                    {project.role}
                  </p>
                )}
                {project.company && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {project.company}
                  </p>
                )}

                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {project.description}
                  </p>
                )}

                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.technologies.slice(0, 3).map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        +{project.technologies.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  {project.url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {project.github_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-3 w-3 mr-1" />
                        Code
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upgrade Modal for Free User Limits */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="project"
      />
    </div>
  );
}
