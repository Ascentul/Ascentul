'use client'

import React, { useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { Plus, ExternalLink, Github, Pencil, Trash2, Upload, Image as ImageIcon } from 'lucide-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from 'convex/_generated/api'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Project {
  _id: string
  title: string
  description?: string
  technologies: string[]
  url?: string
  github_url?: string
  image_url?: string
  role?: string
  start_date?: number
  end_date?: number
  company?: string
}

export default function ProjectsPage() {
  const { user: clerkUser } = useUser()
  const { toast } = useToast()

  const projects = useQuery(api.projects.getUserProjects, clerkUser?.id ? { clerkId: clerkUser.id } : 'skip') as Project[] | undefined
  const createProjectMutation = useMutation(api.projects.createProject)
  const updateProjectMutation = useMutation(api.projects.updateProject)
  const deleteProjectMutation = useMutation(api.projects.deleteProject)

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    technologies: '',
    github_url: '',
    url: '',
    role: '',
    company: '',
    start_date: '',
    end_date: '',
    image_url: ''
  })

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      technologies: '',
      github_url: '',
      url: '',
      role: '',
      company: '',
      start_date: '',
      end_date: '',
      image_url: ''
    })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id) return

    try {
      await createProjectMutation({
        clerkId: clerkUser.id,
        title: formData.title,
        description: formData.description || undefined,
        technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
        type: 'personal',
        url: formData.url || undefined,
        github_url: formData.github_url || undefined,
        role: formData.role || undefined,
        company: formData.company || undefined,
        image_url: formData.image_url || undefined,
        start_date: formData.start_date ? new Date(formData.start_date).getTime() : undefined,
        end_date: formData.end_date ? new Date(formData.end_date).getTime() : undefined,
      })

      toast({
        title: 'Project created',
        description: 'Your project has been added successfully.',
        variant: 'success'
      })
      setShowCreateForm(false)
      resetForm()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create project. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const startEdit = (project: Project) => {
    setEditingProject(project)
    setFormData({
      title: project.title,
      description: project.description || '',
      technologies: project.technologies.join(', '),
      github_url: project.github_url || '',
      url: project.url || '',
      role: project.role || '',
      company: project.company || '',
      start_date: project.start_date ? new Date(project.start_date).toISOString().split('T')[0] : '',
      end_date: project.end_date ? new Date(project.end_date).toISOString().split('T')[0] : '',
      image_url: project.image_url || ''
    })
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkUser?.id || !editingProject) return

    try {
      await updateProjectMutation({
        clerkId: clerkUser.id,
        projectId: editingProject._id as any,
        updates: {
          title: formData.title,
          description: formData.description || undefined,
          technologies: formData.technologies.split(',').map(t => t.trim()).filter(Boolean),
          url: formData.url || undefined,
          github_url: formData.github_url || undefined,
          role: formData.role || undefined,
          company: formData.company || undefined,
          image_url: formData.image_url || undefined,
          start_date: formData.start_date ? new Date(formData.start_date).getTime() : undefined,
          end_date: formData.end_date ? new Date(formData.end_date).getTime() : undefined,
        }
      })

      toast({
        title: 'Project updated',
        description: 'Your project has been updated successfully.',
        variant: 'success'
      })
      setEditingProject(null)
      resetForm()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update project. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (!clerkUser?.id || !deleteId) return

    try {
      await deleteProjectMutation({
        clerkId: clerkUser.id,
        projectId: deleteId as any
      })

      toast({
        title: 'Project deleted',
        description: 'Your project has been deleted successfully.',
        variant: 'success'
      })
      setDeleteId(null)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete project. Please try again.',
        variant: 'destructive'
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, projectId?: string) => {
    const file = e.target.files?.[0]
    if (!file || !clerkUser?.id) return

    // For now, we'll use a placeholder. In production, you'd upload to a service like Cloudinary or S3
    const reader = new FileReader()
    reader.onloadend = async () => {
      const imageUrl = reader.result as string

      if (projectId) {
        // Update existing project
        setUploadingImage(projectId)
        try {
          await updateProjectMutation({
            clerkId: clerkUser.id,
            projectId: projectId as any,
            updates: {
              image_url: imageUrl
            }
          })
          toast({ title: 'Image uploaded', variant: 'success' })
        } catch (error) {
          toast({ title: 'Error', description: 'Failed to upload image.', variant: 'destructive' })
        } finally {
          setUploadingImage(null)
        }
      } else {
        // For create/edit form
        setFormData({ ...formData, image_url: imageUrl })
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0C29AB]">Projects</h1>
          <p className="text-muted-foreground">Showcase your projects and technical work</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Project
        </Button>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateForm || !!editingProject} onOpenChange={(open) => {
        if (!open) {
          setShowCreateForm(false)
          setEditingProject(null)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProject ? 'Edit Project' : 'Add New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={editingProject ? handleEdit : handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="My Awesome Project"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  <div className="w-16 h-16 rounded border overflow-hidden flex-shrink-0">
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="role">Your Role</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="Full Stack Developer"
                />
              </div>
              <div>
                <Label htmlFor="company">Company/Organization</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Personal Project"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="technologies">Technologies (comma-separated)</Label>
              <Input
                id="technologies"
                value={formData.technologies}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                  placeholder="https://github.com/username/project"
                />
              </div>
              <div>
                <Label htmlFor="url">Live Demo URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit">{editingProject ? 'Save Changes' : 'Create Project'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <p className="text-sm mb-4">Start building your portfolio by adding your first project.</p>
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: Project) => (
            <Card key={project._id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {project.image_url && (
                <div className="w-full h-48 bg-muted relative">
                  <img src={project.image_url} alt={project.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    {project.role && (
                      <p className="text-sm text-muted-foreground mt-1">{project.role}</p>
                    )}
                    {project.company && (
                      <p className="text-sm text-muted-foreground">{project.company}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => startEdit(project)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleteId(project._id)}>
                      <Trash2 className="h-3 w-3 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description}
                  </p>
                )}

                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {project.technologies.map((tech, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  {project.url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Demo
                      </a>
                    </Button>
                  )}
                  {project.github_url && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={project.github_url} target="_blank" rel="noopener noreferrer">
                        <Github className="h-3 w-3 mr-1" />
                        Code
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
